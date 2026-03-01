// src/services/inventoryService.js
// Schema ref:
// inventory_items: id, name NN, category NN, department, unit NN, current_stock(0),
//   reorder_level(0), unit_cost(0), supplier_id, barcode, notes, is_active(true), created_at, updated_at
// stock_movements: id, item_id, type, quantity NN, unit_cost, reference, notes, created_by, created_at
//   NOTE: trg_update_stock auto-updates current_stock on INSERT
// suppliers: id, name NN, contact_name, phone, email, address, category, notes, is_active(true), created_at
// purchase_orders: id, po_number(auto), supplier_id, status('draft'), items jsonb([]) NN,
//   subtotal(0), tax_amount(0), total(0), raised_by, approved_by, expected_date, received_at, notes, created_at, updated_at

import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Suppliers ────────────────────────────────────────────

export const getAllSuppliers = async (filters = {}) => {
  let query = supabase
    .from('suppliers')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (filters.category) query = query.eq('category', filters.category);

  const { data, error } = await query;
  if (error) throw new AppError(`Failed to fetch suppliers: ${error.message}`, 500);
  return data;
};

export const getSupplierById = async (id) => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) throw new AppError('Supplier not found.', 404);
  return data;
};

export const createSupplier = async (payload) => {
  const { data, error } = await supabase
    .from('suppliers')
    .insert(payload)
    .select()
    .single();

  if (error) throw new AppError(`Failed to create supplier: ${error.message}`, 500);
  return data;
};

export const updateSupplier = async (id, payload) => {
  await getSupplierById(id);

  const { data, error } = await supabase
    .from('suppliers')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError(`Failed to update supplier: ${error.message}`, 500);
  return data;
};

export const deleteSupplier = async (id) => {
  await getSupplierById(id);

  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw new AppError(`Failed to delete supplier: ${error.message}`, 500);
  return { message: 'Supplier deactivated successfully.' };
};

// ─── Inventory Items ──────────────────────────────────────

export const getAllItems = async (filters = {}, page = 1, limit = 20) => {
  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  let query = supabase
    .from('inventory_items')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('name');

  if (filters.category)   query = query.eq('category', filters.category);
  if (filters.department) query = query.eq('department', filters.department);

  // Low stock filter
  if (filters.low_stock) {
    query = query.filter('current_stock', 'lte', 'reorder_level');
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw new AppError(`Failed to fetch inventory items: ${error.message}`, 500);
  return { data, total: count };
};

export const getItemById = async (id) => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) throw new AppError('Inventory item not found.', 404);
  return data;
};

export const createItem = async (payload) => {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert(payload)
    .select()
    .single();

  if (error) throw new AppError(`Failed to create inventory item: ${error.message}`, 500);
  return data;
};

export const updateItem = async (id, payload) => {
  await getItemById(id);

  const { data, error } = await supabase
    .from('inventory_items')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError(`Failed to update inventory item: ${error.message}`, 500);
  return data;
};

export const deleteItem = async (id) => {
  await getItemById(id);

  const { error } = await supabase
    .from('inventory_items')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw new AppError(`Failed to delete inventory item: ${error.message}`, 500);
  return { message: 'Inventory item deactivated successfully.' };
};

export const getLowStockItems = async () => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, name, category, department, unit, current_stock, reorder_level, unit_cost, supplier_id')
    .eq('is_active', true)
    .filter('current_stock', 'lte', 'reorder_level')
    .order('name');

  if (error) throw new AppError(`Failed to fetch low stock items: ${error.message}`, 500);
  return data;
};

// ─── Stock Movements ──────────────────────────────────────
// NOTE: trg_update_stock trigger auto-updates inventory_items.current_stock on INSERT
// So we only insert into stock_movements and the DB handles the rest

export const getItemMovements = async (itemId, page = 1, limit = 20) => {
  await getItemById(itemId);

  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  const { data, error, count } = await supabase
    .from('stock_movements')
    .select('*', { count: 'exact' })
    .eq('item_id', itemId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new AppError(`Failed to fetch movements: ${error.message}`, 500);
  return { data, total: count };
};

export const recordMovement = async (itemId, payload, createdBy) => {
  await getItemById(itemId);

  const { type, quantity, unit_cost, reference, notes } = payload;

  const { data, error } = await supabase
    .from('stock_movements')
    .insert({
      item_id:    itemId,
      type,
      quantity,
      unit_cost:  unit_cost  || null,
      reference:  reference  || null,
      notes:      notes      || null,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) throw new AppError(`Failed to record movement: ${error.message}`, 500);
  return data;
};

// ─── Purchase Orders ──────────────────────────────────────
// NOTE: po_number auto-generated by trg_po_number trigger

export const getAllPurchaseOrders = async (filters = {}, page = 1, limit = 20) => {
  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  let query = supabase
    .from('purchase_orders')
    .select(`
      id, po_number, status, items, subtotal, tax_amount, total,
      expected_date, received_at, notes, created_at,
      suppliers ( id, name, phone, email )
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters.status)      query = query.eq('status', filters.status);
  if (filters.supplier_id) query = query.eq('supplier_id', filters.supplier_id);

  const { data, error, count } = await query.range(from, to);
  if (error) throw new AppError(`Failed to fetch purchase orders: ${error.message}`, 500);
  return { data, total: count };
};

export const getPurchaseOrderById = async (id) => {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      id, po_number, status, items, subtotal, tax_amount, total,
      expected_date, received_at, notes, created_at, updated_at,
      suppliers ( id, name, phone, email, address )
    `)
    .eq('id', id)
    .single();

  if (error || !data) throw new AppError('Purchase order not found.', 404);
  return data;
};

export const createPurchaseOrder = async (payload, raisedBy) => {
  const { supplier_id, items, expected_date, notes, tax_rate = 0 } = payload;

  // Validate supplier
  await getSupplierById(supplier_id);

  // Calculate totals
  const subtotal   = items.reduce((sum, i) => sum + (i.quantity * i.unit_cost), 0);
  const tax_amount = Math.round(subtotal * (tax_rate / 100));
  const total      = subtotal + tax_amount;

  const { data, error } = await supabase
    .from('purchase_orders')
    .insert({
      supplier_id,
      status:        'draft',
      items,
      subtotal,
      tax_amount,
      total,
      raised_by:     raisedBy,
      expected_date: expected_date || null,
      notes:         notes || null,
    })
    .select()
    .single();

  if (error) throw new AppError(`Failed to create purchase order: ${error.message}`, 500);
  return data;
};

export const approvePurchaseOrder = async (id, approvedBy) => {
  const po = await getPurchaseOrderById(id);

  if (po.status !== 'draft') {
    throw new AppError(`Cannot approve a purchase order with status: ${po.status}.`, 409);
  }

  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ status: 'approved', approved_by: approvedBy })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError(`Failed to approve purchase order: ${error.message}`, 500);
  return data;
};

export const receivePurchaseOrder = async (id, receivedBy) => {
  const po = await getPurchaseOrderById(id);

  if (po.status !== 'approved') {
    throw new AppError('Only approved purchase orders can be marked as received.', 409);
  }

  // Record stock movement for each item in the PO
  for (const item of po.items) {
    if (item.item_id) {
      await supabase
        .from('stock_movements')
        .insert({
          item_id:    item.item_id,
          type:       'purchase',
          quantity:   item.quantity,
          unit_cost:  item.unit_cost,
          reference:  po.po_number,
          notes:      `Received from PO ${po.po_number}`,
          created_by: receivedBy,
        });
    }
  }

  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ status: 'received', received_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError(`Failed to mark purchase order as received: ${error.message}`, 500);
  return data;
};

export const cancelPurchaseOrder = async (id) => {
  const po = await getPurchaseOrderById(id);

  if (['received', 'cancelled'].includes(po.status)) {
    throw new AppError(`Cannot cancel a purchase order with status: ${po.status}.`, 409);
  }

  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError(`Failed to cancel purchase order: ${error.message}`, 500);
  return data;
};
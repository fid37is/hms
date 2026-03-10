// src/services/inventoryService.js

import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Suppliers ────────────────────────────────────────────

export const getAllSuppliers = async (orgId, filters = {}) => {
  let q = supabase.from('suppliers').select('*').eq('org_id', orgId).eq('is_active', true).order('name');
  if (filters.category) q = q.eq('category', filters.category);

  const { data, error } = await q;
  if (error) throw new AppError(`Failed to fetch suppliers: ${error.message}`, 500);
  return data;
};

export const getSupplierById = async (orgId, id) => {
  const { data, error } = await supabase
    .from('suppliers').select('*').eq('org_id', orgId).eq('id', id).single();

  if (error || !data) throw new AppError('Supplier not found.', 404);
  return data;
};

export const createSupplier = async (orgId, payload) => {
  const { data, error } = await supabase
    .from('suppliers').insert({ ...payload, org_id: orgId }).select();

  if (error) {
    console.error('[createSupplier] Supabase error:', JSON.stringify(error));
    throw new AppError(`Failed to create supplier: ${error.message}`, 500);
  }
  if (!data || data.length === 0) {
    throw new AppError(
      'Supplier table is missing columns — run migration 020_fix_inventory_schema.sql in Supabase.', 500
    );
  }
  return data[0];
};

export const updateSupplier = async (orgId, id, payload) => {
  await getSupplierById(orgId, id);
  const { data, error } = await supabase
    .from('suppliers').update(payload).eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to update supplier: ${error.message}`, 500);
  return data;
};

export const deleteSupplier = async (orgId, id) => {
  await getSupplierById(orgId, id);
  const { error } = await supabase
    .from('suppliers').update({ is_active: false }).eq('org_id', orgId).eq('id', id);

  if (error) throw new AppError(`Failed to delete supplier: ${error.message}`, 500);
  return { message: 'Supplier deactivated.' };
};

// ─── Inventory Items ──────────────────────────────────────

export const getAllItems = async (orgId, filters = {}, page = 1, limit = 20) => {
  const from = (page - 1) * limit;

  let q = supabase.from('inventory_items').select('*', { count: 'exact' })
    .eq('org_id', orgId).eq('is_active', true).order('name');

  if (filters.category)   q = q.eq('category', filters.category);
  if (filters.department) q = q.eq('department', filters.department);
  if (filters.low_stock)  q = q.filter('current_stock', 'lte', 'reorder_level');

  const { data, error, count } = await q.range(from, from + limit - 1);
  if (error) throw new AppError(`Failed to fetch inventory: ${error.message}`, 500);
  return { data, total: count };
};

export const getItemById = async (orgId, id) => {
  const { data, error } = await supabase
    .from('inventory_items').select('*').eq('org_id', orgId).eq('id', id).single();

  if (error || !data) throw new AppError('Inventory item not found.', 404);
  return data;
};

export const createItem = async (orgId, payload) => {
  const { data, error } = await supabase
    .from('inventory_items').insert({ ...payload, org_id: orgId }).select();

  if (error) {
    console.error('[createItem] Supabase error:', JSON.stringify(error));
    throw new AppError(`Failed to create item: ${error.message}`, 500);
  }
  if (!data || data.length === 0) {
    throw new AppError(
      'Inventory items table has schema issues — run migration 020_fix_inventory_schema.sql in Supabase.', 500
    );
  }
  return data[0];
};

export const updateItem = async (orgId, id, payload) => {
  await getItemById(orgId, id);
  const { data, error } = await supabase
    .from('inventory_items').update(payload).eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to update item: ${error.message}`, 500);
  return data;
};

export const deleteItem = async (orgId, id) => {
  await getItemById(orgId, id);
  const { error } = await supabase
    .from('inventory_items').update({ is_active: false }).eq('org_id', orgId).eq('id', id);

  if (error) throw new AppError(`Failed to delete item: ${error.message}`, 500);
  return { message: 'Item deactivated.' };
};

export const getLowStockItems = async (orgId) => {
  // .filter() can't compare two columns — fetch all active items and filter in JS
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, name, category, department, unit, current_stock, reorder_level, unit_cost, supplier_id')
    .eq('org_id', orgId).eq('is_active', true)
    .order('name');

  if (error) throw new AppError(`Failed to fetch low stock: ${error.message}`, 500);
  return (data || []).filter(i => parseFloat(i.current_stock) <= parseFloat(i.reorder_level));
};

// ─── Stock Movements ──────────────────────────────────────

export const getItemMovements = async (orgId, itemId, page = 1, limit = 20) => {
  await getItemById(orgId, itemId);
  const from = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('stock_movements').select('*', { count: 'exact' })
    .eq('org_id', orgId).eq('item_id', itemId)
    .order('created_at', { ascending: false }).range(from, from + limit - 1);

  if (error) throw new AppError(`Failed to fetch movements: ${error.message}`, 500);
  return { data, total: count };
};

export const recordMovement = async (orgId, itemId, payload, createdBy) => {
  await getItemById(orgId, itemId);
  const { type, quantity, unit_cost, reference, notes } = payload;

  const { data, error } = await supabase
    .from('stock_movements')
    .insert({ org_id: orgId, item_id: itemId, type, quantity,
              unit_cost: unit_cost || null, reference: reference || null,
              notes: notes || null, created_by: createdBy })
    .select().single();

  if (error) throw new AppError(`Failed to record movement: ${error.message}`, 500);
  return data;
};

// ─── Purchase Orders ──────────────────────────────────────

export const getAllPurchaseOrders = async (orgId, filters = {}, page = 1, limit = 20) => {
  const from = (page - 1) * limit;

  // DB column is `total` (not `total_amount`)
  let q = supabase.from('purchase_orders')
    .select(`id, po_no, status, items, subtotal, tax_amount, total,
      expected_date, received_at, notes, created_at,
      suppliers ( id, name, phone, email )`, { count: 'exact' })
    .eq('org_id', orgId).order('created_at', { ascending: false });

  if (filters.status)      q = q.eq('status', filters.status);
  if (filters.supplier_id) q = q.eq('supplier_id', filters.supplier_id);

  const { data, error, count } = await q.range(from, from + limit - 1);
  if (error) throw new AppError(`Failed to fetch purchase orders: ${error.message}`, 500);
  return { data, total: count };
};

export const getPurchaseOrderById = async (orgId, id) => {
  // DB column is `total` (not `total_amount`)
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`id, po_no, status, items, subtotal, tax_amount, total,
      expected_date, received_at, notes, created_at, updated_at,
      suppliers ( id, name, phone, email, address )`)
    .eq('org_id', orgId).eq('id', id).single();

  if (error || !data) throw new AppError('Purchase order not found.', 404);
  return data;
};

export const createPurchaseOrder = async (orgId, payload, raisedBy) => {
  const { supplier_id, items, expected_date, notes, tax_rate = 0 } = payload;
  await getSupplierById(orgId, supplier_id);

  const subtotal   = items.reduce((sum, i) => sum + (i.quantity * i.unit_cost), 0);
  const tax_amount = Math.round(subtotal * (tax_rate / 100));
  const total      = subtotal + tax_amount;

  // Insert uses `total` to match the DB column name
  const { data, error } = await supabase
    .from('purchase_orders')
    .insert({ org_id: orgId, supplier_id, status: 'draft', items, subtotal,
              tax_amount, total, raised_by: raisedBy,
              expected_date: expected_date || null, notes: notes || null })
    .select().single();

  if (error) throw new AppError(`Failed to create PO: ${error.message}`, 500);
  return data;
};

export const approvePurchaseOrder = async (orgId, id, approvedBy) => {
  const po = await getPurchaseOrderById(orgId, id);
  if (po.status !== 'draft') throw new AppError(`Cannot approve PO with status: ${po.status}.`, 409);

  const { data, error } = await supabase
    .from('purchase_orders').update({ status: 'approved', approved_by: approvedBy })
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to approve PO: ${error.message}`, 500);
  return data;
};

export const receivePurchaseOrder = async (orgId, id, receivedBy) => {
  const po = await getPurchaseOrderById(orgId, id);
  if (po.status !== 'approved') throw new AppError('Only approved POs can be received.', 409);

  for (const item of po.items) {
    if (item.item_id) {
      await supabase.from('stock_movements').insert({
        org_id: orgId, item_id: item.item_id, type: 'purchase',
        quantity: item.quantity, unit_cost: item.unit_cost,
        reference: po.po_no, notes: `Received from PO ${po.po_no}`, created_by: receivedBy,
      });
    }
  }

  const { data, error } = await supabase
    .from('purchase_orders').update({ status: 'received', received_at: new Date().toISOString() })
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to receive PO: ${error.message}`, 500);
  return data;
};

export const cancelPurchaseOrder = async (orgId, id) => {
  const po = await getPurchaseOrderById(orgId, id);
  if (['received', 'cancelled'].includes(po.status))
    throw new AppError(`Cannot cancel PO with status: ${po.status}.`, 409);

  const { data, error } = await supabase
    .from('purchase_orders').update({ status: 'cancelled' })
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to cancel PO: ${error.message}`, 500);
  return data;
};
// src/services/fnbService.js
import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Outlets ──────────────────────────────────────────────

export const getAllOutlets = async (orgId) => {
  const { data, error } = await supabase
    .from('fnb_outlets').select('*').eq('org_id', orgId).eq('is_active', true).order('name');
  if (error) throw new AppError(`Failed to fetch outlets: ${error.message}`, 500);
  return data;
};

export const createOutlet = async (orgId, payload) => {
  const { data, error } = await supabase
    .from('fnb_outlets').insert({ ...payload, org_id: orgId }).select();
  if (error) throw new AppError(`Failed to create outlet: ${error.message}`, 500);
  return data[0];
};

export const updateOutlet = async (orgId, id, payload) => {
  const { data, error } = await supabase
    .from('fnb_outlets').update(payload).eq('org_id', orgId).eq('id', id).select().single();
  if (error) throw new AppError(`Failed to update outlet: ${error.message}`, 500);
  return data;
};

// ─── Menu ─────────────────────────────────────────────────

export const getMenu = async (orgId, outletId) => {
  let q = supabase.from('fnb_menu_items')
    .select('*, fnb_categories!category_id(id, name, sort_order)')
    .eq('org_id', orgId).eq('is_active', true).order('name');
  if (outletId) q = q.eq('outlet_id', outletId);
  const { data, error } = await q;
  if (error) throw new AppError(`Failed to fetch menu: ${error.message}`, 500);
  return data;
};

export const createMenuItem = async (orgId, payload) => {
  const { data, error } = await supabase
    .from('fnb_menu_items').insert({ ...payload, org_id: orgId }).select();
  if (error) throw new AppError(`Failed to create menu item: ${error.message}`, 500);
  return data[0];
};

export const updateMenuItem = async (orgId, id, payload) => {
  const { data, error } = await supabase
    .from('fnb_menu_items').update(payload).eq('org_id', orgId).eq('id', id).select().single();
  if (error) throw new AppError(`Failed to update menu item: ${error.message}`, 500);
  return data;
};

export const deleteMenuItem = async (orgId, id) => {
  const { error } = await supabase
    .from('fnb_menu_items').update({ is_active: false }).eq('org_id', orgId).eq('id', id);
  if (error) throw new AppError(`Failed to delete menu item: ${error.message}`, 500);
  return { message: 'Item removed from menu.' };
};

// ─── Categories ───────────────────────────────────────────

export const getCategories = async (orgId, outletId) => {
  let q = supabase.from('fnb_categories')
    .select('*').eq('org_id', orgId).eq('is_active', true).order('sort_order');
  if (outletId) q = q.eq('outlet_id', outletId);
  const { data, error } = await q;
  if (error) throw new AppError(`Failed to fetch categories: ${error.message}`, 500);
  return data;
};

export const createCategory = async (orgId, payload) => {
  const { data, error } = await supabase
    .from('fnb_categories').insert({ ...payload, org_id: orgId }).select();
  if (error) throw new AppError(`Failed to create category: ${error.message}`, 500);
  return data[0];
};

// ─── Tables ───────────────────────────────────────────────

export const getTables = async (orgId, outletId) => {
  let q = supabase.from('fnb_tables').select('*').eq('org_id', orgId).order('number');
  if (outletId) q = q.eq('outlet_id', outletId);
  const { data, error } = await q;
  if (error) throw new AppError(`Failed to fetch tables: ${error.message}`, 500);
  return data;
};

export const createTable = async (orgId, payload) => {
  const { data, error } = await supabase
    .from('fnb_tables').insert({ ...payload, org_id: orgId }).select();
  if (error) throw new AppError(`Failed to create table: ${error.message}`, 500);
  return data[0];
};

export const updateTableStatus = async (orgId, id, status) => {
  const { data, error } = await supabase
    .from('fnb_tables').update({ status }).eq('org_id', orgId).eq('id', id).select().single();
  if (error) throw new AppError(`Failed to update table: ${error.message}`, 500);
  return data;
};

// ─── Orders ───────────────────────────────────────────────

export const getAllOrders = async (orgId, filters = {}, page = 1, limit = 30) => {
  const from = (page - 1) * limit;
  let q = supabase.from('fnb_orders')
    .select(`*, fnb_tables!table_id(id, number), fnb_outlets!outlet_id(id, name),
      opener:opened_by(id, full_name)`, { count: 'exact' })
    .eq('org_id', orgId).order('created_at', { ascending: false });
  if (filters.status)    q = q.eq('status', filters.status);
  if (filters.outlet_id) q = q.eq('outlet_id', filters.outlet_id);
  const { data, error, count } = await q.range(from, from + limit - 1);
  if (error) throw new AppError(`Failed to fetch orders: ${error.message}`, 500);
  return { data, total: count };
};

export const getOrderById = async (orgId, id) => {
  const { data, error } = await supabase
    .from('fnb_orders')
    .select(`*, fnb_tables!table_id(id, number), fnb_outlets!outlet_id(id, name),
      fnb_order_items!order_id(*)`)
    .eq('org_id', orgId).eq('id', id).single();
  if (error || !data) throw new AppError('Order not found.', 404);
  return data;
};

export const createOrder = async (orgId, payload, openedBy) => {
  const { outlet_id, table_id, reservation_id, notes } = payload;
  const { data, error } = await supabase
    .from('fnb_orders')
    .insert({ org_id: orgId, outlet_id: outlet_id || null, table_id: table_id || null,
              reservation_id: reservation_id || null, notes: notes || null,
              status: 'open', opened_by: openedBy })
    .select();
  if (error) throw new AppError(`Failed to create order: ${error.message}`, 500);

  // Mark table occupied
  if (table_id) await updateTableStatus(orgId, table_id, 'occupied');

  return data[0];
};

export const addOrderItems = async (orgId, orderId, items) => {
  const order = await getOrderById(orgId, orderId);
  if (['billed','cancelled'].includes(order.status))
    throw new AppError('Cannot add items to a billed or cancelled order.', 409);

  const rows = items.map(i => ({
    org_id: orgId, order_id: orderId,
    menu_item_id: i.menu_item_id || null,
    name: i.name, price: i.price,
    quantity: i.quantity || 1,
    subtotal: i.price * (i.quantity || 1),
    notes: i.notes || null,
    status: 'pending',
  }));

  const { error } = await supabase.from('fnb_order_items').insert(rows);
  if (error) throw new AppError(`Failed to add items: ${error.message}`, 500);

  await recalcOrderTotals(orgId, orderId);
  return getOrderById(orgId, orderId);
};

export const updateOrderStatus = async (orgId, id, status) => {
  const { data, error } = await supabase
    .from('fnb_orders').update({ status, updated_at: new Date().toISOString() })
    .eq('org_id', orgId).eq('id', id).select().single();
  if (error) throw new AppError(`Failed to update order: ${error.message}`, 500);
  return data;
};

export const billOrder = async (orgId, id, billedBy) => {
  const order = await getOrderById(orgId, id);
  if (order.status === 'billed') throw new AppError('Order already billed.', 409);
  if (order.status === 'cancelled') throw new AppError('Cannot bill a cancelled order.', 409);

  const { data, error } = await supabase
    .from('fnb_orders')
    .update({ status: 'billed', billed_by: billedBy, billed_at: new Date().toISOString() })
    .eq('org_id', orgId).eq('id', id).select().single();
  if (error) throw new AppError(`Failed to bill order: ${error.message}`, 500);

  // Free up the table
  if (order.table_id) await updateTableStatus(orgId, order.table_id, 'available');

  return data;
};

export const cancelOrder = async (orgId, id) => {
  const order = await getOrderById(orgId, id);
  if (['billed','cancelled'].includes(order.status))
    throw new AppError(`Cannot cancel order with status: ${order.status}.`, 409);

  const { data, error } = await supabase
    .from('fnb_orders').update({ status: 'cancelled' })
    .eq('org_id', orgId).eq('id', id).select().single();
  if (error) throw new AppError(`Failed to cancel order: ${error.message}`, 500);

  if (order.table_id) await updateTableStatus(orgId, order.table_id, 'available');
  return data;
};

// Recalculate order subtotal + total from line items
const recalcOrderTotals = async (orgId, orderId) => {
  const { data: items } = await supabase
    .from('fnb_order_items').select('subtotal').eq('order_id', orderId)
    .neq('status', 'cancelled');
  const subtotal = (items || []).reduce((s, i) => s + i.subtotal, 0);
  const tax = Math.round(subtotal * 0.075); // 7.5% VAT default
  await supabase.from('fnb_orders')
    .update({ subtotal, tax_amount: tax, total: subtotal + tax })
    .eq('org_id', orgId).eq('id', orderId);
};
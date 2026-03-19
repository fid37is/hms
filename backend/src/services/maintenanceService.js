// src/services/maintenanceService.js

import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Work Orders ──────────────────────────────────────────

export const getAllWorkOrders = async (orgId, filters = {}, page = 1, limit = 20) => {
  const from = (page - 1) * limit;

  let q = supabase.from('maintenance_orders')
    .select(`id, wo_number, room_id, asset_id, location, category, description, priority, status,
      resolution, cost, started_at, resolved_at, created_at,
      rooms!room_id ( id, number, floor ),
      assets!asset_id ( id, name, serial_number ),
      reporter:reported_by ( id, full_name ),
      assignee:assigned_to ( id, full_name )`, { count: 'exact' })
    .eq('org_id', orgId).order('created_at', { ascending: false });

  if (filters.status)      q = q.eq('status', filters.status);
  if (filters.priority)    q = q.eq('priority', filters.priority);
  if (filters.category)    q = q.eq('category', filters.category);
  if (filters.room_id)     q = q.eq('room_id', filters.room_id);
  if (filters.assigned_to) q = q.eq('assigned_to', filters.assigned_to);

  const { data, error, count } = await q.range(from, from + limit - 1);
  if (error) throw new AppError(`Failed to fetch work orders: ${error.message}`, 500);
  return { data, total: count };
};

export const getWorkOrderById = async (orgId, id) => {
  const { data, error } = await supabase
    .from('maintenance_orders')
    .select(`id, wo_number, room_id, location, category, description, priority, status,
      resolution, cost, started_at, resolved_at, created_at, updated_at,
      rooms!room_id ( id, number, floor ),
      reporter:reported_by ( id, full_name ),
      assignee:assigned_to ( id, full_name )`)
    .eq('org_id', orgId).eq('id', id).single();

  if (error || !data) throw new AppError('Work order not found.', 404);
  return data;
};

export const createWorkOrder = async (orgId, payload, reportedBy) => {
  const { title, location, room_id, asset_id, category, description, priority, assigned_to, cost } = payload;

  if (room_id) {
    const { data: room } = await supabase
      .from('rooms').select('id').eq('org_id', orgId).eq('id', room_id).single();
    if (!room) throw new AppError('Room not found.', 404);
  }

  const { data, error } = await supabase
    .from('maintenance_orders')
    .insert({ org_id: orgId, location: location || null, room_id: room_id || null,
              asset_id: asset_id || null, category: category || null, description: description || title,
              priority: priority || 'normal', status: 'open',
              reported_by: reportedBy, assigned_to: assigned_to || null, cost: cost || 0 })
    .select().single();

  if (error) throw new AppError(`Failed to create work order: ${error.message}`, 500);
  return data;
};

export const updateWorkOrder = async (orgId, id, payload) => {
  await getWorkOrderById(orgId, id);
  const { data, error } = await supabase
    .from('maintenance_orders').update(payload).eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to update work order: ${error.message}`, 500);
  return data;
};

export const assignWorkOrder = async (orgId, id, assignedTo) => {
  await getWorkOrderById(orgId, id);

  const { data: staffMember } = await supabase
    .from('staff').select('id').eq('org_id', orgId).eq('id', assignedTo).single();
  if (!staffMember) throw new AppError('Staff member not found.', 404);

  const { data, error } = await supabase
    .from('maintenance_orders').update({ assigned_to: assignedTo })
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to assign work order: ${error.message}`, 500);
  return data;
};

export const startWorkOrder = async (orgId, id) => {
  const wo = await getWorkOrderById(orgId, id);
  if (wo.status !== 'open') throw new AppError(`Cannot start WO with status: ${wo.status}.`, 409);

  const { data, error } = await supabase
    .from('maintenance_orders').update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to start work order: ${error.message}`, 500);
  return data;
};

export const resolveWorkOrder = async (orgId, id, resolution, cost, roomStatusAfter) => {
  const wo = await getWorkOrderById(orgId, id);
  if (!['open', 'in_progress'].includes(wo.status))
    throw new AppError(`Cannot resolve WO with status: ${wo.status}.`, 409);

  const { data, error } = await supabase
    .from('maintenance_orders')
    .update({ status: 'resolved', resolution, cost: cost || wo.cost, resolved_at: new Date().toISOString() })
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to resolve work order: ${error.message}`, 500);

  // Update room status if this WO was linked to a room
  const targetRoomId = wo.room_id;
  if (targetRoomId) {
    const newStatus = ['dirty', 'available', 'out_of_order'].includes(roomStatusAfter)
      ? roomStatusAfter
      : 'dirty'; // default to dirty so housekeeping is triggered
    await supabase
      .from('rooms').update({ status: newStatus })
      .eq('org_id', orgId).eq('id', targetRoomId);
  }

  return data;
};

export const reopenWorkOrder = async (orgId, id, reason) => {
  const wo = await getWorkOrderById(orgId, id);
  if (!['resolved', 'closed'].includes(wo.status))
    throw new AppError(`Cannot reopen WO with status: ${wo.status}.`, 409);

  const { data, error } = await supabase
    .from('maintenance_orders')
    .update({
      status:      'open',
      resolved_at: null,
      resolution:  null,
      // Append reopen reason to description so history is preserved
      description: [wo.description, `[Reopened] ${reason || 'No reason given'}`].filter(Boolean).join('\n\n'),
    })
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to reopen work order: ${error.message}`, 500);
  return data;
};

export const closeWorkOrder = async (orgId, id) => {
  const wo = await getWorkOrderById(orgId, id);
  if (wo.status !== 'resolved') throw new AppError('Only resolved work orders can be closed.', 409);

  const { data, error } = await supabase
    .from('maintenance_orders').update({ status: 'closed' })
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to close work order: ${error.message}`, 500);
  return data;
};

// ─── Assets ───────────────────────────────────────────────

export const getAllAssets = async (orgId, filters = {}, page = 1, limit = 20) => {
  const from = (page - 1) * limit;

  let q = supabase.from('assets').select('*', { count: 'exact' })
    .eq('org_id', orgId).order('name');

  if (filters.status)   q = q.eq('status', filters.status);
  if (filters.category) q = q.eq('category', filters.category);
  if (filters.location) q = q.ilike('location', `%${filters.location}%`);

  const { data, error, count } = await q.range(from, from + limit - 1);
  if (error) throw new AppError(`Failed to fetch assets: ${error.message}`, 500);
  return { data, total: count };
};

export const getAssetById = async (orgId, id) => {
  const { data, error } = await supabase
    .from('assets').select('*').eq('org_id', orgId).eq('id', id).single();

  if (error || !data) throw new AppError('Asset not found.', 404);
  return data;
};

export const createAsset = async (orgId, payload) => {
  const { data, error } = await supabase
    .from('assets').insert({ ...payload, org_id: orgId }).select().single();

  if (error) throw new AppError(`Failed to create asset: ${error.message}`, 500);
  return data;
};

export const updateAsset = async (orgId, id, payload) => {
  await getAssetById(orgId, id);
  const { data, error } = await supabase
    .from('assets').update(payload).eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to update asset: ${error.message}`, 500);
  return data;
};

export const deleteAsset = async (orgId, id) => {
  await getAssetById(orgId, id);
  const { error } = await supabase.from('assets').delete().eq('org_id', orgId).eq('id', id);

  if (error) throw new AppError(`Failed to delete asset: ${error.message}`, 500);
  return { message: 'Asset deleted.' };
};

export const getAssetsDueForService = async (orgId) => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('assets')
    .select('id, name, category, location, last_serviced, next_service_date, status')
    .eq('org_id', orgId).lte('next_service_date', today).eq('status', 'operational')
    .order('next_service_date');

  if (error) throw new AppError(`Failed to fetch assets due for service: ${error.message}`, 500);
  return data;
};
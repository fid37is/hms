// src/services/housekeepingService.js

import { supabase }    from '../config/supabase.js';
import { AppError }    from '../middleware/errorHandler.js';
import { ROOM_STATUS } from '../config/constants.js';

export const getAllTasks = async (orgId, filters = {}, page = 1, limit = 20) => {
  const from = (page - 1) * limit;

  let q = supabase
    .from('housekeeping_tasks')
    .select(`id, room_id, task_type, priority, status, notes, started_at, completed_at,
      rooms ( id, number, floor, room_types ( name ) ),
      assigned:assigned_to ( id, full_name ),
      assigner:assigned_by ( id, full_name )`, { count: 'exact' })
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (filters.status)      q = q.eq('status', filters.status);
  if (filters.room_id)     q = q.eq('room_id', filters.room_id);
  if (filters.assigned_to) q = q.eq('assigned_to', filters.assigned_to);
  if (filters.task_type)   q = q.eq('task_type', filters.task_type);
  if (filters.priority)    q = q.eq('priority', filters.priority);

  const { data, error, count } = await q.range(from, from + limit - 1);
  if (error) throw new AppError(`Failed to fetch tasks: ${error.message}`, 500);
  return { data, total: count };
};

export const getTaskById = async (orgId, id) => {
  const { data, error } = await supabase
    .from('housekeeping_tasks')
    .select(`id, room_id, task_type, priority, status, notes, started_at, completed_at,
      rooms ( id, number, floor, room_types ( name ) ),
      assigned:assigned_to ( id, full_name ),
      assigner:assigned_by ( id, full_name )`)
    .eq('org_id', orgId).eq('id', id).single();

  if (error || !data) throw new AppError('Task not found.', 404);
  return data;
};

export const createTask = async (orgId, payload, createdBy) => {
  const { room_id, task_type, priority, assigned_to, notes } = payload;

  const { data: room } = await supabase
    .from('rooms').select('id, number, status')
    .eq('org_id', orgId).eq('id', room_id).eq('is_deleted', false).single();

  if (!room) throw new AppError('Room not found.', 404);

  const { data, error } = await supabase
    .from('housekeeping_tasks')
    .insert({ org_id: orgId, room_id, task_type: task_type || 'cleaning',
              priority: priority || 'normal', status: 'pending',
              assigned_to: assigned_to || null, assigned_by: null,
              notes: notes || null })
    .select().single();

  if (error) throw new AppError(`Failed to create task: ${error.message}`, 500);
  return { ...data, room_number: room.number };
};

export const updateTask = async (orgId, id, payload) => {
  await getTaskById(orgId, id);

  const { data, error } = await supabase
    .from('housekeeping_tasks').update(payload)
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to update task: ${error.message}`, 500);
  return data;
};

export const startTask = async (orgId, id) => {
  const task = await getTaskById(orgId, id);
  if (task.status !== 'pending') throw new AppError(`Cannot start task with status: ${task.status}.`, 409);

  const { data, error } = await supabase
    .from('housekeeping_tasks')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to start task: ${error.message}`, 500);
  return data;
};

export const completeTask = async (orgId, id, notes) => {
  const task = await getTaskById(orgId, id);
  if (task.status !== 'in_progress') throw new AppError(`Cannot complete task with status: ${task.status}.`, 409);

  const { data, error } = await supabase
    .from('housekeeping_tasks')
    .update({ status: 'done', completed_at: new Date().toISOString(), notes: notes || task.notes })
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to complete task: ${error.message}`, 500);

  // Room stays as-is until a supervisor inspects — inspectTask sets it to available

  return data;
};

export const inspectTask = async (orgId, id, inspectedBy, notes) => {
  const task = await getTaskById(orgId, id);
  if (task.status !== 'done')
    throw new AppError(`Cannot inspect a task with status: ${task.status}.`, 409);

  const { data, error } = await supabase
    .from('housekeeping_tasks')
    .update({ status: 'inspected', notes: notes || task.notes })
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to inspect task: ${error.message}`, 500);

  // Supervisor confirmed room is clean — mark as available
  if (task.rooms?.id)
    await supabase.from('rooms').update({ status: ROOM_STATUS.AVAILABLE })
      .eq('org_id', orgId).eq('id', task.rooms.id);

  return data;
};

export const assignTask = async (orgId, id, assignedTo, assignedBy) => {
  const task = await getTaskById(orgId, id);

  const { data: staffMember } = await supabase
    .from('staff').select('id').eq('org_id', orgId).eq('id', assignedTo).single();
  if (!staffMember) throw new AppError('Staff member not found.', 404);

  // assigned_by: resolve the requesting user's staff record (assignedBy is users.id)
  const { data: assignerStaff } = await supabase
    .from('staff').select('id').eq('org_id', orgId).eq('user_id', assignedBy).single();

  const { data, error } = await supabase
    .from('housekeeping_tasks')
    .update({ assigned_to: assignedTo, assigned_by: assignerStaff?.id || null })
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to assign task: ${error.message}`, 500);
  return { ...data, room_number: task.rooms?.number, task_type: task.task_type };
};

export const deleteTask = async (orgId, id) => {
  const task = await getTaskById(orgId, id);
  if (task.status === 'in_progress') throw new AppError('Cannot delete a task in progress.', 409);

  const { error } = await supabase
    .from('housekeeping_tasks').delete().eq('org_id', orgId).eq('id', id);

  if (error) throw new AppError(`Failed to delete task: ${error.message}`, 500);
  return { message: 'Task deleted.' };
};

export const getPendingByRoom = async (orgId, roomId) => {
  const { data, error } = await supabase
    .from('housekeeping_tasks')
    .select('id, task_type, priority, status, notes, assigned_to')
    .eq('org_id', orgId).eq('room_id', roomId).in('status', ['pending', 'in_progress']).order('priority');

  if (error) throw new AppError(`Failed to fetch room tasks: ${error.message}`, 500);
  return data;
};

// ─── Lost & Found ─────────────────────────────────────────

export const getAllLostAndFound = async (orgId, filters = {}, page = 1, limit = 20) => {
  const from = (page - 1) * limit;

  let q = supabase
    .from('lost_and_found').select('*', { count: 'exact' })
    .eq('org_id', orgId).order('created_at', { ascending: false });

  if (filters.status) q = q.eq('status', filters.status);

  const { data, error, count } = await q.range(from, from + limit - 1);
  if (error) throw new AppError(`Failed to fetch lost and found: ${error.message}`, 500);
  return { data, total: count };
};

export const getLostAndFoundById = async (orgId, id) => {
  const { data, error } = await supabase
    .from('lost_and_found').select('*').eq('org_id', orgId).eq('id', id).single();

  if (error || !data) throw new AppError('Item not found.', 404);
  return data;
};

export const createLostAndFoundItem = async (orgId, payload, foundBy) => {
  const { item_name, description, found_location, found_date, guest_id, notes } = payload;

  const { data, error } = await supabase
    .from('lost_and_found')
    .insert({ org_id: orgId, item_name, description: description || null,
              found_location: found_location || null, found_by: foundBy,
              found_date: found_date || new Date().toISOString().split('T')[0],
              guest_id: guest_id || null, status: 'in_custody', notes: notes || null })
    .select().single();

  if (error) throw new AppError(`Failed to log item: ${error.message}`, 500);
  return data;
};

export const updateLostAndFoundItem = async (orgId, id, payload) => {
  await getLostAndFoundById(orgId, id);

  const { data, error } = await supabase
    .from('lost_and_found').update(payload).eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to update item: ${error.message}`, 500);
  return data;
};

export const markReturned = async (orgId, id, guestId, notes) => {
  await getLostAndFoundById(orgId, id);

  const { data, error } = await supabase
    .from('lost_and_found')
    .update({ status: 'returned', guest_id: guestId || null, notes: notes || null })
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to mark returned: ${error.message}`, 500);
  return data;
};
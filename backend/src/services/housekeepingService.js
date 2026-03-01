// src/services/housekeepingService.js
// Schema ref:
// housekeeping_tasks: id, room_id, task_type, priority, status, assigned_to, assigned_by, notes, started_at, completed_at
// lost_and_found: id, item_name, description, found_location, found_by, found_date, guest_id, status, notes, created_at, updated_at

import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { ROOM_STATUS } from '../config/constants.js';

// ─── Housekeeping Tasks ───────────────────────────────────

export const getAllTasks = async (filters = {}, page = 1, limit = 20) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('housekeeping_tasks')
        .select(`
      id, task_type, priority, status, notes, started_at, completed_at,
      rooms ( id, number, floor, room_types ( name ) ),
      assigned:assigned_to ( id, full_name ),
      assigner:assigned_by ( id, full_name )
    `, { count: 'exact' })
        .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.room_id) query = query.eq('room_id', filters.room_id);
    if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
    if (filters.task_type) query = query.eq('task_type', filters.task_type);
    if (filters.priority) query = query.eq('priority', filters.priority);

    const { data, error, count } = await query.range(from, to);
    if (error) throw new AppError(`Failed to fetch tasks: ${error.message}`, 500);
    return { data, total: count };
};

export const getTaskById = async (id) => {
    const { data, error } = await supabase
        .from('housekeeping_tasks')
        .select(`
      id, task_type, priority, status, notes, started_at, completed_at,
      rooms ( id, number, floor, room_types ( name ) ),
      assigned:assigned_to ( id, full_name ),
      assigner:assigned_by ( id, full_name )
    `)
        .eq('id', id)
        .single();

    if (error || !data) throw new AppError('Task not found.', 404);
    return data;
};

export const createTask = async (payload, createdBy) => {
    const { room_id, task_type, priority, assigned_to, notes } = payload;

    const { data: room } = await supabase
        .from('rooms')
        .select('id, number, status')
        .eq('id', room_id)
        .eq('is_deleted', false)
        .single();

    if (!room) throw new AppError('Room not found.', 404);

    const { data, error } = await supabase
        .from('housekeeping_tasks')
        .insert({
            room_id,
            task_type: task_type || 'cleaning',
            priority: priority || 'normal',
            status: 'pending',
            assigned_to: assigned_to || null,
            assigned_by: createdBy,
            notes: notes || null,
        })
        .select()
        .single();

    if (error) throw new AppError(`Failed to create task: ${error.message}`, 500);
    return data;
};

export const updateTask = async (id, payload) => {
    await getTaskById(id);

    const { data, error } = await supabase
        .from('housekeeping_tasks')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new AppError(`Failed to update task: ${error.message}`, 500);
    return data;
};

export const startTask = async (id, userId) => {
    const task = await getTaskById(id);

    if (task.status !== 'pending') {
        throw new AppError(`Cannot start a task with status: ${task.status}.`, 409);
    }

    const { data, error } = await supabase
        .from('housekeeping_tasks')
        .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new AppError(`Failed to start task: ${error.message}`, 500);
    return data;
};

export const completeTask = async (id, userId, notes) => {
    const task = await getTaskById(id);

    if (task.status !== 'in_progress') {
        throw new AppError(`Cannot complete a task with status: ${task.status}.`, 409);
    }

    const { data, error } = await supabase
        .from('housekeeping_tasks')
        .update({
            status: 'done',
            completed_at: new Date().toISOString(),
            notes: notes || task.notes,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new AppError(`Failed to complete task: ${error.message}`, 500);
    return data;
};

export const inspectTask = async (id, userId, notes) => {
    const task = await getTaskById(id);

    if (task.status !== 'done') {
        throw new AppError(`Cannot inspect a task with status: ${task.status}.`, 409);
    }

    const { data, error } = await supabase
        .from('housekeeping_tasks')
        .update({
            status: 'inspected',
            notes: notes || task.notes,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new AppError(`Failed to inspect task: ${error.message}`, 500);

    if (task.rooms?.id) {
        await supabase
            .from('rooms')
            .update({ status: ROOM_STATUS.CLEAN })
            .eq('id', task.rooms.id);
    }

    return data;
};

export const assignTask = async (id, assignedTo, assignedBy) => {
    await getTaskById(id);

    const { data: user } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', assignedTo)
        .single();

    if (!user) throw new AppError('Assigned user not found.', 404);

    const { data, error } = await supabase
        .from('housekeeping_tasks')
        .update({
            assigned_to: assignedTo,
            assigned_by: assignedBy,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new AppError(`Failed to assign task: ${error.message}`, 500);
    return data;
};

export const deleteTask = async (id) => {
    const task = await getTaskById(id);

    if (task.status === 'in_progress') {
        throw new AppError('Cannot delete a task that is in progress.', 409);
    }

    const { error } = await supabase
        .from('housekeeping_tasks')
        .delete()
        .eq('id', id);

    if (error) throw new AppError(`Failed to delete task: ${error.message}`, 500);
    return { message: 'Task deleted successfully.' };
};

export const getPendingByRoom = async (roomId) => {
    const { data, error } = await supabase
        .from('housekeeping_tasks')
        .select('id, task_type, priority, status, notes, assigned_to')
        .eq('room_id', roomId)
        .in('status', ['pending', 'in_progress'])
        .order('priority');

    if (error) throw new AppError(`Failed to fetch room tasks: ${error.message}`, 500);
    return data;
};

// ─── Lost & Found ─────────────────────────────────────────

export const getAllLostAndFound = async (filters = {}, page = 1, limit = 20) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('lost_and_found')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);

    const { data, error, count } = await query.range(from, to);
    if (error) throw new AppError(`Failed to fetch lost and found items: ${error.message}`, 500);
    return { data, total: count };
};

export const getLostAndFoundById = async (id) => {
    const { data, error } = await supabase
        .from('lost_and_found')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) throw new AppError('Item not found.', 404);
    return data;
};

export const createLostAndFoundItem = async (payload, foundBy) => {
    const { item_name, description, found_location, found_date, room_id, guest_id, notes } = payload;

    let resolvedGuestId = guest_id || null;

    // If a room is specified, find the last checked-out guest for that room
    if (room_id && !guest_id) {
        const { data: lastReservation } = await supabase
            .from('reservations')
            .select('guest_id')
            .eq('room_id', room_id)
            .eq('status', 'checked_out')
            .order('actual_check_out', { ascending: false })
            .limit(1)
            .single();

        if (lastReservation?.guest_id) {
            resolvedGuestId = lastReservation.guest_id;
        }
    }

    const { data, error } = await supabase
        .from('lost_and_found')
        .insert({
            item_name,
            description: description || null,
            found_location: found_location || null,
            found_by: foundBy,
            found_date: found_date || new Date().toISOString().split('T')[0],
            guest_id: resolvedGuestId,
            status: 'in_custody',
            notes: notes || null,
        })
        .select()
        .single();

    if (error) throw new AppError(`Failed to log item: ${error.message}`, 500);
    return data;
};

export const updateLostAndFoundItem = async (id, payload) => {
    await getLostAndFoundById(id);

    const { data, error } = await supabase
        .from('lost_and_found')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new AppError(`Failed to update item: ${error.message}`, 500);
    return data;
};

export const markReturned = async (id, guestId, notes) => {
    await getLostAndFoundById(id);

    const { data, error } = await supabase
        .from('lost_and_found')
        .update({
            status: 'returned',
            guest_id: guestId || null,
            notes: notes || null,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new AppError(`Failed to mark item as returned: ${error.message}`, 500);
    return data;
};
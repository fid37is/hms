// src/services/staffService.js

import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Departments ──────────────────────────────────────────

export const getAllDepartments = async (orgId) => {
  const { data, error } = await supabase
    .from('departments').select('id, name, manager_id').eq('org_id', orgId).order('name');

  if (error) throw new AppError(`Failed to fetch departments: ${error.message}`, 500);
  return data;
};

export const createDepartment = async (orgId, payload) => {
  const { data, error } = await supabase
    .from('departments').insert({ ...payload, org_id: orgId }).select().single();

  if (error) throw new AppError(`Failed to create department: ${error.message}`, 500);
  return data;
};

export const updateDepartment = async (orgId, id, payload) => {
  const { data, error } = await supabase
    .from('departments').update(payload).eq('org_id', orgId).eq('id', id).select().single();

  if (error || !data) throw new AppError(`Failed to update department: ${error?.message}`, 500);
  return data;
};

// ─── Staff ────────────────────────────────────────────────

export const getAllStaff = async (orgId, filters = {}, page = 1, limit = 20) => {
  const from = (page - 1) * limit;

  let q = supabase.from('staff')
    .select(`id, full_name, email, phone, job_title, employment_type,
      employment_date, status, created_at,
      departments ( id, name )`, { count: 'exact' })
    .eq('org_id', orgId).eq('is_deleted', false).order('full_name');

  if (filters.status)        q = q.eq('status', filters.status);
  if (filters.department_id) q = q.eq('department_id', filters.department_id);

  const { data, error, count } = await q.range(from, from + limit - 1);
  if (error) throw new AppError(`Failed to fetch staff: ${error.message}`, 500);
  return { data, total: count };
};

export const getStaffById = async (orgId, id) => {
  const { data, error } = await supabase
    .from('staff')
    .select(`id, user_id, full_name, email, phone, job_title, employment_type,
      employment_date, salary, bank_name, bank_account_no,
      emergency_contact, status, notes, created_at, updated_at,
      departments ( id, name )`)
    .eq('org_id', orgId).eq('id', id).eq('is_deleted', false).single();

  if (error || !data) throw new AppError('Staff member not found.', 404);
  return data;
};

export const createStaff = async (orgId, payload) => {
  const { data, error } = await supabase
    .from('staff').insert({ ...payload, org_id: orgId }).select().single();

  if (error) throw new AppError(`Failed to create staff: ${error.message}`, 500);
  return data;
};

export const updateStaff = async (orgId, id, payload) => {
  await getStaffById(orgId, id);
  const { data, error } = await supabase
    .from('staff').update(payload).eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to update staff: ${error.message}`, 500);
  return data;
};

export const deleteStaff = async (orgId, id) => {
  await getStaffById(orgId, id);
  const { error } = await supabase
    .from('staff').update({ is_deleted: true, status: 'terminated' })
    .eq('org_id', orgId).eq('id', id);

  if (error) throw new AppError(`Failed to delete staff: ${error.message}`, 500);
  return { message: 'Staff record deleted.' };
};

// ─── Shifts ───────────────────────────────────────────────

export const getStaffShifts = async (orgId, staffId, filters = {}) => {
  let q = supabase.from('shifts').select('*')
    .eq('org_id', orgId).eq('staff_id', staffId)
    .order('shift_date', { ascending: false });

  if (filters.date_from) q = q.gte('shift_date', filters.date_from);
  if (filters.date_to)   q = q.lte('shift_date', filters.date_to);
  if (filters.status)    q = q.eq('status', filters.status);

  const { data, error } = await q;
  if (error) throw new AppError(`Failed to fetch shifts: ${error.message}`, 500);
  return data;
};

export const createShift = async (orgId, payload) => {
  await getStaffById(orgId, payload.staff_id);
  const { data, error } = await supabase
    .from('shifts').insert({ ...payload, org_id: orgId }).select().single();

  if (error) throw new AppError(`Failed to create shift: ${error.message}`, 500);
  return data;
};

export const updateShift = async (orgId, id, payload) => {
  const { data: existing } = await supabase
    .from('shifts').select('id').eq('org_id', orgId).eq('id', id).single();
  if (!existing) throw new AppError('Shift not found.', 404);

  const { data, error } = await supabase
    .from('shifts').update(payload).eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to update shift: ${error.message}`, 500);
  return data;
};

export const clockIn = async (orgId, shiftId, staffId) => {
  const { data: shift } = await supabase
    .from('shifts').select('id, status, staff_id').eq('org_id', orgId).eq('id', shiftId).single();

  if (!shift) throw new AppError('Shift not found.', 404);
  if (shift.staff_id !== staffId) throw new AppError('This shift does not belong to you.', 403);
  if (shift.status !== 'scheduled') throw new AppError(`Cannot clock in on status: ${shift.status}.`, 409);

  const { data, error } = await supabase
    .from('shifts').update({ status: 'active', actual_start: new Date().toISOString() })
    .eq('org_id', orgId).eq('id', shiftId).select().single();

  if (error) throw new AppError(`Failed to clock in: ${error.message}`, 500);
  return data;
};

export const clockOut = async (orgId, shiftId, staffId) => {
  const { data: shift } = await supabase
    .from('shifts').select('id, status, staff_id, actual_start')
    .eq('org_id', orgId).eq('id', shiftId).single();

  if (!shift) throw new AppError('Shift not found.', 404);
  if (shift.staff_id !== staffId) throw new AppError('This shift does not belong to you.', 403);
  if (shift.status !== 'active') throw new AppError(`Cannot clock out on status: ${shift.status}.`, 409);

  const end          = new Date();
  const hoursWorked  = parseFloat(((end - new Date(shift.actual_start)) / 3600000).toFixed(2));

  const { data, error } = await supabase
    .from('shifts').update({ status: 'completed', actual_end: end.toISOString(), hours_worked: hoursWorked })
    .eq('org_id', orgId).eq('id', shiftId).select().single();

  if (error) throw new AppError(`Failed to clock out: ${error.message}`, 500);
  return data;
};

// ─── Leave Requests ───────────────────────────────────────

export const getLeaveRequests = async (orgId, filters = {}, page = 1, limit = 20) => {
  const from = (page - 1) * limit;

  let q = supabase.from('leave_requests')
    .select(`id, leave_type, start_date, end_date, reason, status,
      reviewed_at, review_notes, created_at,
      staff ( id, full_name, job_title )`, { count: 'exact' })
    .eq('org_id', orgId).order('created_at', { ascending: false });

  if (filters.status)   q = q.eq('status', filters.status);
  if (filters.staff_id) q = q.eq('staff_id', filters.staff_id);

  const { data, error, count } = await q.range(from, from + limit - 1);
  if (error) throw new AppError(`Failed to fetch leave requests: ${error.message}`, 500);
  return { data, total: count };
};

export const createLeaveRequest = async (orgId, payload, staffId) => {
  const { leave_type, start_date, end_date, reason } = payload;

  const { data, error } = await supabase
    .from('leave_requests')
    .insert({ org_id: orgId, staff_id: staffId, leave_type, start_date, end_date,
              reason: reason || null, status: 'pending' })
    .select().single();

  if (error) throw new AppError(`Failed to submit leave request: ${error.message}`, 500);
  return data;
};

export const reviewLeaveRequest = async (orgId, id, status, reviewNotes, reviewedBy) => {
  const { data: existing } = await supabase
    .from('leave_requests').select('id, status').eq('org_id', orgId).eq('id', id).single();

  if (!existing) throw new AppError('Leave request not found.', 404);
  if (existing.status !== 'pending') throw new AppError('Already reviewed.', 409);

  const { data, error } = await supabase
    .from('leave_requests')
    .update({ status, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString(),
              review_notes: reviewNotes || null })
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(`Failed to review leave request: ${error.message}`, 500);
  return data;
};

export const deleteDepartment = async (orgId, id) => {
  const { error } = await supabase
    .from('departments').delete().eq('org_id', orgId).eq('id', id);
  if (error) throw new AppError(`Failed to delete department: ${error.message}`, 500);
};
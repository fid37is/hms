// src/services/staffService.js
// Schema ref:
// staff: id, org_id, user_id, full_name NN, email, phone NN, department_id, job_title,
//   employment_type('full_time'), employment_date(CURRENT_DATE), salary(0),
//   bank_name, bank_account_no, emergency_contact jsonb({}), status('active'),
//   notes, is_deleted(false), created_at, updated_at
// shifts: id, org_id, staff_id, shift_date NN, scheduled_start time, scheduled_end time,
//   actual_start tstz, actual_end tstz, hours_worked numeric, status('scheduled'),
//   notes, created_at
// leave_requests: id, org_id, staff_id, leave_type, start_date NN, end_date NN, reason,
//   status('pending'), reviewed_by, reviewed_at, review_notes, created_at
// departments: id, org_id, name NN, manager_id, created_at

import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Departments ──────────────────────────────────────────

export const getAllDepartments = async (orgId) => {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, manager_id')
    .eq('org_id', orgId)
    .order('name');

  if (error) throw new AppError(`Failed to fetch departments: ${error.message}`, 500);
  return data;
};

export const createDepartment = async (orgId, payload) => {
  const { data, error } = await supabase
    .from('departments')
    .insert({ ...payload, org_id: orgId })
    .select()
    .single();

  if (error) throw new AppError(`Failed to create department: ${error.message}`, 500);
  return data;
};

export const updateDepartment = async (orgId, id, payload) => {
  const { data, error } = await supabase
    .from('departments')
    .update(payload)
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error || !data) throw new AppError(`Failed to update department: ${error?.message}`, 500);
  return data;
};

// ─── Staff ────────────────────────────────────────────────

export const getAllStaff = async (orgId, filters = {}, page = 1, limit = 20) => {
  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  let query = supabase
    .from('staff')
    .select(`
      id, full_name, email, phone, job_title, employment_type,
      employment_date, status, created_at,
      departments ( id, name )
    `, { count: 'exact' })
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .order('full_name');

  if (filters.status)        query = query.eq('status', filters.status);
  if (filters.department_id) query = query.eq('department_id', filters.department_id);

  const { data, error, count } = await query.range(from, to);
  if (error) throw new AppError(`Failed to fetch staff: ${error.message}`, 500);
  return { data, total: count };
};

export const getStaffById = async (orgId, id) => {
  const { data, error } = await supabase
    .from('staff')
    .select(`
      id, user_id, full_name, email, phone, job_title, employment_type,
      employment_date, salary, bank_name, bank_account_no,
      emergency_contact, status, notes, created_at, updated_at,
      departments ( id, name )
    `)
    .eq('id', id)
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .single();

  if (error || !data) throw new AppError('Staff member not found.', 404);
  return data;
};

export const createStaff = async (orgId, payload) => {
  const { data, error } = await supabase
    .from('staff')
    .insert({ ...payload, org_id: orgId })
    .select()
    .single();

  if (error) throw new AppError(`Failed to create staff record: ${error.message}`, 500);
  return data;
};

export const updateStaff = async (orgId, id, payload) => {
  await getStaffById(orgId, id);

  const { data, error } = await supabase
    .from('staff')
    .update(payload)
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw new AppError(`Failed to update staff record: ${error.message}`, 500);
  return data;
};

export const deleteStaff = async (orgId, id) => {
  await getStaffById(orgId, id);

  const { error } = await supabase
    .from('staff')
    .update({ is_deleted: true, status: 'terminated' })
    .eq('id', id)
    .eq('org_id', orgId);

  if (error) throw new AppError(`Failed to delete staff record: ${error.message}`, 500);
  return { message: 'Staff record deleted successfully.' };
};

// ─── Shifts ───────────────────────────────────────────────

export const getStaffShifts = async (orgId, staffId, filters = {}) => {
  let query = supabase
    .from('shifts')
    .select('*')
    .eq('staff_id', staffId)
    .eq('org_id', orgId)
    .order('shift_date', { ascending: false });

  if (filters.date_from) query = query.gte('shift_date', filters.date_from);
  if (filters.date_to)   query = query.lte('shift_date', filters.date_to);
  if (filters.status)    query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw new AppError(`Failed to fetch shifts: ${error.message}`, 500);
  return data;
};

export const createShift = async (orgId, payload) => {
  await getStaffById(orgId, payload.staff_id);

  const { data, error } = await supabase
    .from('shifts')
    .insert({ ...payload, org_id: orgId })
    .select()
    .single();

  if (error) throw new AppError(`Failed to create shift: ${error.message}`, 500);
  return data;
};

export const updateShift = async (orgId, id, payload) => {
  const { data: existing } = await supabase
    .from('shifts')
    .select('id')
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (!existing) throw new AppError('Shift not found.', 404);

  const { data, error } = await supabase
    .from('shifts')
    .update(payload)
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw new AppError(`Failed to update shift: ${error.message}`, 500);
  return data;
};

export const clockIn = async (orgId, shiftId, staffId) => {
  const { data: shift } = await supabase
    .from('shifts')
    .select('id, status, staff_id')
    .eq('id', shiftId)
    .eq('org_id', orgId)
    .single();

  if (!shift) throw new AppError('Shift not found.', 404);
  if (shift.staff_id !== staffId) throw new AppError('This shift does not belong to you.', 403);
  if (shift.status !== 'scheduled') throw new AppError(`Cannot clock in on a shift with status: ${shift.status}.`, 409);

  const { data, error } = await supabase
    .from('shifts')
    .update({ status: 'active', actual_start: new Date().toISOString() })
    .eq('id', shiftId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw new AppError(`Failed to clock in: ${error.message}`, 500);
  return data;
};

export const clockOut = async (orgId, shiftId, staffId) => {
  const { data: shift } = await supabase
    .from('shifts')
    .select('id, status, staff_id, actual_start')
    .eq('id', shiftId)
    .eq('org_id', orgId)
    .single();

  if (!shift) throw new AppError('Shift not found.', 404);
  if (shift.staff_id !== staffId) throw new AppError('This shift does not belong to you.', 403);
  if (shift.status !== 'active') throw new AppError(`Cannot clock out on a shift with status: ${shift.status}.`, 409);

  const actualEnd   = new Date();
  const actualStart = new Date(shift.actual_start);
  const hoursWorked = parseFloat(((actualEnd - actualStart) / (1000 * 60 * 60)).toFixed(2));

  const { data, error } = await supabase
    .from('shifts')
    .update({
      status:       'completed',
      actual_end:   actualEnd.toISOString(),
      hours_worked: hoursWorked,
    })
    .eq('id', shiftId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw new AppError(`Failed to clock out: ${error.message}`, 500);
  return data;
};

// ─── Leave Requests ───────────────────────────────────────

export const getLeaveRequests = async (orgId, filters = {}, page = 1, limit = 20) => {
  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  let query = supabase
    .from('leave_requests')
    .select(`
      id, leave_type, start_date, end_date, reason, status,
      reviewed_at, review_notes, created_at,
      staff ( id, full_name, job_title )
    `, { count: 'exact' })
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (filters.status)   query = query.eq('status', filters.status);
  if (filters.staff_id) query = query.eq('staff_id', filters.staff_id);

  const { data, error, count } = await query.range(from, to);
  if (error) throw new AppError(`Failed to fetch leave requests: ${error.message}`, 500);
  return { data, total: count };
};

export const createLeaveRequest = async (orgId, payload, staffId) => {
  const { leave_type, start_date, end_date, reason } = payload;

  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      org_id: orgId,
      staff_id: staffId,
      leave_type,
      start_date,
      end_date,
      reason: reason || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new AppError(`Failed to submit leave request: ${error.message}`, 500);
  return data;
};

export const reviewLeaveRequest = async (orgId, id, status, reviewNotes, reviewedBy) => {
  const { data: existing } = await supabase
    .from('leave_requests')
    .select('id, status')
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (!existing) throw new AppError('Leave request not found.', 404);
  if (existing.status !== 'pending') throw new AppError('This leave request has already been reviewed.', 409);

  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status,
      reviewed_by:  reviewedBy,
      reviewed_at:  new Date().toISOString(),
      review_notes: reviewNotes || null,
    })
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw new AppError(`Failed to review leave request: ${error.message}`, 500);
  return data;
};
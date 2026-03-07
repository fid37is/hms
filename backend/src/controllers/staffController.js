// src/controllers/staffController.js

import * as staffService from '../services/staffService.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response.js';

// ─── Departments ──────────────────────────────────────────

export const getAllDepartments = async (req, res, next) => {
  try {
    const data = await staffService.getAllDepartments(req.orgId);
    return sendSuccess(res, data, 'Departments retrieved.');
  } catch (err) { next(err); }
};

export const createDepartment = async (req, res, next) => {
  try {
    const data = await staffService.createDepartment(req.orgId, req.body);
    return sendCreated(res, data, 'Department created.');
  } catch (err) { next(err); }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const data = await staffService.updateDepartment(req.orgId, req.params.id, req.body);
    return sendSuccess(res, data, 'Department updated.');
  } catch (err) { next(err); }
};

// ─── Staff ────────────────────────────────────────────────

export const getAllStaff = async (req, res, next) => {
  try {
    const { status, department_id, page = 1, limit = 20 } = req.query;
    const { data, total } = await staffService.getAllStaff(
      req.orgId, { status, department_id }, Number(page), Number(limit)
    );
    return sendPaginated(res, data, total, page, limit, 'Staff retrieved.');
  } catch (err) { next(err); }
};

export const getStaffById = async (req, res, next) => {
  try {
    const data = await staffService.getStaffById(req.orgId, req.params.id);
    return sendSuccess(res, data, 'Staff member retrieved.');
  } catch (err) { next(err); }
};

export const createStaff = async (req, res, next) => {
  try {
    const data = await staffService.createStaff(req.orgId, req.body);
    return sendCreated(res, data, 'Staff record created.');
  } catch (err) { next(err); }
};

export const updateStaff = async (req, res, next) => {
  try {
    const data = await staffService.updateStaff(req.orgId, req.params.id, req.body);
    return sendSuccess(res, data, 'Staff record updated.');
  } catch (err) { next(err); }
};

export const deleteStaff = async (req, res, next) => {
  try {
    const data = await staffService.deleteStaff(req.orgId, req.params.id);
    return sendSuccess(res, data, 'Staff record deleted.');
  } catch (err) { next(err); }
};

// ─── Shifts ───────────────────────────────────────────────

export const getStaffShifts = async (req, res, next) => {
  try {
    const { date_from, date_to, status } = req.query;
    const data = await staffService.getStaffShifts(req.orgId, req.params.id, { date_from, date_to, status });
    return sendSuccess(res, data, 'Shifts retrieved.');
  } catch (err) { next(err); }
};

export const createShift = async (req, res, next) => {
  try {
    const data = await staffService.createShift(req.orgId, req.body);
    return sendCreated(res, data, 'Shift created.');
  } catch (err) { next(err); }
};

export const updateShift = async (req, res, next) => {
  try {
    const data = await staffService.updateShift(req.orgId, req.params.id, req.body);
    return sendSuccess(res, data, 'Shift updated.');
  } catch (err) { next(err); }
};

export const clockIn = async (req, res, next) => {
  try {
    const data = await staffService.clockIn(req.orgId, req.params.id, req.user.sub);
    return sendSuccess(res, data, 'Clocked in successfully.');
  } catch (err) { next(err); }
};

export const clockOut = async (req, res, next) => {
  try {
    const data = await staffService.clockOut(req.orgId, req.params.id, req.user.sub);
    return sendSuccess(res, data, 'Clocked out successfully.');
  } catch (err) { next(err); }
};

// ─── Leave Requests ───────────────────────────────────────

export const getLeaveRequests = async (req, res, next) => {
  try {
    const { status, staff_id, page = 1, limit = 20 } = req.query;
    const { data, total } = await staffService.getLeaveRequests(
      req.orgId, { status, staff_id }, Number(page), Number(limit)
    );
    return sendPaginated(res, data, total, page, limit, 'Leave requests retrieved.');
  } catch (err) { next(err); }
};

export const createLeaveRequest = async (req, res, next) => {
  try {
    const data = await staffService.createLeaveRequest(req.orgId, req.body, req.user.sub);
    return sendCreated(res, data, 'Leave request submitted.');
  } catch (err) { next(err); }
};

export const reviewLeaveRequest = async (req, res, next) => {
  try {
    const { status, review_notes } = req.body;
    const data = await staffService.reviewLeaveRequest(
      req.orgId, req.params.id, status, review_notes, req.user.sub
    );
    return sendSuccess(res, data, `Leave request ${status}.`);
  } catch (err) { next(err); }
};
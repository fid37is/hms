// src/routes/staffRoutes.js

import { Router }            from 'express';
import { authenticate }      from '../middleware/auth.js';
import { validate }          from '../middleware/validate.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS }       from '../config/constants.js';
import {
  createDepartmentSchema, updateDepartmentSchema,
  createStaffSchema, updateStaffSchema,
  createShiftSchema, updateShiftSchema,
  createLeaveRequestSchema, reviewLeaveSchema,
} from '../validators/staffValidator.js';
import {
  getAllDepartments, createDepartment, updateDepartment,
  getAllStaff, getStaffById, createStaff, updateStaff, deleteStaff,
  getStaffShifts, createShift, updateShift, clockIn, clockOut,
  getLeaveRequests, createLeaveRequest, reviewLeaveRequest,
} from '../controllers/staffController.js';

const router = Router();
router.use(authenticate);

// ─── Departments ──────────────────────────────────────────
router.get('/departments',
  requirePermission(PERMISSIONS.STAFF.READ), getAllDepartments);
router.post('/departments',
  requirePermission(PERMISSIONS.STAFF.UPDATE), validate(createDepartmentSchema), createDepartment);
router.patch('/departments/:id',
  requirePermission(PERMISSIONS.STAFF.UPDATE), validate(updateDepartmentSchema), updateDepartment);

// ─── Staff ────────────────────────────────────────────────
router.get('/',
  requirePermission(PERMISSIONS.STAFF.READ), getAllStaff);
router.get('/:id',
  requirePermission(PERMISSIONS.STAFF.READ), getStaffById);
router.post('/',
  requirePermission(PERMISSIONS.STAFF.UPDATE), validate(createStaffSchema), createStaff);
router.patch('/:id',
  requirePermission(PERMISSIONS.STAFF.UPDATE), validate(updateStaffSchema), updateStaff);
router.delete('/:id',
  requirePermission(PERMISSIONS.STAFF.UPDATE), deleteStaff);

// ─── Shifts ───────────────────────────────────────────────
router.get('/:id/shifts',
  requirePermission(PERMISSIONS.STAFF.READ), getStaffShifts);
router.post('/shifts',
  requirePermission(PERMISSIONS.STAFF.UPDATE), validate(createShiftSchema), createShift);
router.patch('/shifts/:id',
  requirePermission(PERMISSIONS.STAFF.UPDATE), validate(updateShiftSchema), updateShift);
router.patch('/shifts/:id/clock-in',
  requirePermission(PERMISSIONS.STAFF.READ), clockIn);
router.patch('/shifts/:id/clock-out',
  requirePermission(PERMISSIONS.STAFF.READ), clockOut);

// ─── Leave Requests ───────────────────────────────────────
router.get('/leave',
  requirePermission(PERMISSIONS.STAFF.READ), getLeaveRequests);
router.post('/leave',
  requirePermission(PERMISSIONS.STAFF.READ), validate(createLeaveRequestSchema), createLeaveRequest);
router.patch('/leave/:id/review',
  requirePermission(PERMISSIONS.STAFF.UPDATE), validate(reviewLeaveSchema), reviewLeaveRequest);

export default router;
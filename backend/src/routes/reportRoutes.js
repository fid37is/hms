// src/routes/reportRoutes.js

import { Router }            from 'express';
import { authenticate }      from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS }       from '../config/constants.js';
import {
  getDashboardStats,
  getGroupSummaryStats,
  getOccupancyReport,
  getRevenueReport,
  getNightAudit,
  getGuestReport,
  getAuditLog,
} from '../controllers/reportController.js';

const router = Router();
router.use(authenticate);

// GET /api/v1/reports/dashboard
router.get('/dashboard',
  requirePermission(PERMISSIONS.REPORTS.READ), getDashboardStats);

// GET /api/v1/reports/group-summary?org_ids=id1,id2
router.get('/group-summary', authenticate, getGroupSummaryStats);

// GET /api/v1/reports/occupancy?date_from=&date_to=
router.get('/occupancy',
  requirePermission(PERMISSIONS.REPORTS.READ), getOccupancyReport);

// GET /api/v1/reports/revenue?date_from=&date_to=
router.get('/revenue',
  requirePermission(PERMISSIONS.REPORTS.READ), getRevenueReport);

// GET /api/v1/reports/night-audit?date=
router.get('/night-audit',
  requirePermission(PERMISSIONS.REPORTS.READ), getNightAudit);

// GET /api/v1/reports/guests?date_from=&date_to=
router.get('/guests',
  requirePermission(PERMISSIONS.REPORTS.READ), getGuestReport);

// GET /api/v1/reports/audit-log?user_id=&table_name=&action=&date_from=&date_to=
router.get('/audit-log',
  requirePermission(PERMISSIONS.REPORTS.AUDIT), getAuditLog);

export default router;
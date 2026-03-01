// src/routes/maintenanceRoutes.js

import { Router }            from 'express';
import { authenticate }      from '../middleware/auth.js';
import { validate }          from '../middleware/validate.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS }       from '../config/constants.js';
import {
  createWorkOrderSchema, updateWorkOrderSchema,
  assignWorkOrderSchema, resolveWorkOrderSchema,
  createAssetSchema, updateAssetSchema,
} from '../validators/maintenanceValidator.js';
import {
  getAllWorkOrders, getWorkOrderById, createWorkOrder,
  updateWorkOrder, assignWorkOrder, startWorkOrder,
  resolveWorkOrder, closeWorkOrder,
  getAllAssets, getAssetById, createAsset,
  updateAsset, deleteAsset, getAssetsDueForService,
} from '../controllers/maintenanceController.js';

const router = Router();
router.use(authenticate);

// ─── Work Orders ──────────────────────────────────────────
router.get('/work-orders',
  requirePermission(PERMISSIONS.MAINTENANCE.READ), getAllWorkOrders);

router.get('/work-orders/:id',
  requirePermission(PERMISSIONS.MAINTENANCE.READ), getWorkOrderById);

router.post('/work-orders',
  requirePermission(PERMISSIONS.MAINTENANCE.UPDATE),
  validate(createWorkOrderSchema), createWorkOrder);

router.patch('/work-orders/:id',
  requirePermission(PERMISSIONS.MAINTENANCE.UPDATE),
  validate(updateWorkOrderSchema), updateWorkOrder);

router.patch('/work-orders/:id/assign',
  requirePermission(PERMISSIONS.MAINTENANCE.UPDATE),
  validate(assignWorkOrderSchema), assignWorkOrder);

router.patch('/work-orders/:id/start',
  requirePermission(PERMISSIONS.MAINTENANCE.UPDATE), startWorkOrder);

router.patch('/work-orders/:id/resolve',
  requirePermission(PERMISSIONS.MAINTENANCE.UPDATE),
  validate(resolveWorkOrderSchema), resolveWorkOrder);

router.patch('/work-orders/:id/close',
  requirePermission(PERMISSIONS.MAINTENANCE.UPDATE), closeWorkOrder);

// ─── Assets ───────────────────────────────────────────────
router.get('/assets/due-for-service',
  requirePermission(PERMISSIONS.MAINTENANCE.READ), getAssetsDueForService);

router.get('/assets',
  requirePermission(PERMISSIONS.MAINTENANCE.READ), getAllAssets);

router.get('/assets/:id',
  requirePermission(PERMISSIONS.MAINTENANCE.READ), getAssetById);

router.post('/assets',
  requirePermission(PERMISSIONS.MAINTENANCE.UPDATE),
  validate(createAssetSchema), createAsset);

router.patch('/assets/:id',
  requirePermission(PERMISSIONS.MAINTENANCE.UPDATE),
  validate(updateAssetSchema), updateAsset);

router.delete('/assets/:id',
  requirePermission(PERMISSIONS.MAINTENANCE.UPDATE), deleteAsset);

export default router;
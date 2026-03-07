// src/routes/userRoutes.js

import { Router }            from 'express';
import { authenticate }      from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS }       from '../config/constants.js';
import * as ctrl             from '../controllers/userController.js';

const router = Router();
router.use(authenticate);

const { CONFIG: SETTINGS } = PERMISSIONS;

// ─── Roles (MUST be before /:id to avoid wildcard capture) ──
router.get('/roles',           requirePermission(SETTINGS.READ),   ctrl.getRoles);
router.post('/roles',          requirePermission(SETTINGS.UPDATE), ctrl.createRole);
router.patch('/roles/:id',     requirePermission(SETTINGS.UPDATE), ctrl.updateRoleCtrl);
router.delete('/roles/:id',    requirePermission(SETTINGS.UPDATE), ctrl.deleteRole);

// ─── Staff access ────────────────────────────────────────────
router.post('/staff/:staffId/grant',    requirePermission(SETTINGS.UPDATE), ctrl.grantAccess);
router.delete('/staff/:staffId/revoke', requirePermission(SETTINGS.UPDATE), ctrl.revokeAccess);

// ─── Users ───────────────────────────────────────────────────
router.get('/',             requirePermission(SETTINGS.READ),   ctrl.getUsers);
router.post('/',            requirePermission(SETTINGS.UPDATE), ctrl.createUser);
router.get('/:id',          requirePermission(SETTINGS.READ),   ctrl.getUserById);
router.patch('/:id',        requirePermission(SETTINGS.UPDATE), ctrl.updateUser);
router.patch('/:id/toggle', requirePermission(SETTINGS.UPDATE), ctrl.toggleUser);
router.delete('/:id',       requirePermission(SETTINGS.UPDATE), ctrl.deleteUser);
router.patch('/:id/reset-password', requirePermission(SETTINGS.UPDATE), ctrl.adminResetPassword);

export default router;
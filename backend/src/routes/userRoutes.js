// src/routes/userRoutes.js

import { Router }            from 'express';
import { authenticate }      from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS }       from '../config/constants.js';
import * as ctrl             from '../controllers/userController.js';

const router = Router();
router.use(authenticate);

const SETTINGS = PERMISSIONS.CONFIG;

// ─── Users ────────────────────────────────────────────────
// GET    /api/v1/users              — list all users
// GET    /api/v1/users/:id          — get user
// POST   /api/v1/users              — create standalone user
// PATCH  /api/v1/users/:id          — update user profile
// PATCH  /api/v1/users/:id/toggle   — activate / deactivate

router.get('/',                requirePermission(SETTINGS.READ),   ctrl.getUsers);
router.get('/:id',             requirePermission(SETTINGS.READ),   ctrl.getUserById);
router.post('/',               requirePermission(SETTINGS.UPDATE), ctrl.createUser);
router.patch('/:id',           requirePermission(SETTINGS.UPDATE), ctrl.updateUser);
router.patch('/:id/toggle',    requirePermission(SETTINGS.UPDATE), ctrl.toggleUser);

// ─── Staff access (grant / revoke) ────────────────────────
// POST   /api/v1/users/staff/:staffId/grant    — create user account + link to staff
// DELETE /api/v1/users/staff/:staffId/revoke   — deactivate + unlink

router.post('/staff/:staffId/grant',    requirePermission(SETTINGS.UPDATE), ctrl.grantAccess);
router.delete('/staff/:staffId/revoke', requirePermission(SETTINGS.UPDATE), ctrl.revokeAccess);

// ─── Roles ────────────────────────────────────────────────
// GET    /api/v1/users/roles         — list roles with permissions
// POST   /api/v1/users/roles         — create role

router.get('/roles',           requirePermission(SETTINGS.READ),   ctrl.getRoles);
router.post('/roles',          requirePermission(SETTINGS.UPDATE), ctrl.createRole);

export default router;

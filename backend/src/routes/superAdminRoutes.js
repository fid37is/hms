// src/routes/superAdminRoutes.js

import { Router }                from 'express';
import { requireSuperAdmin }     from '../middleware/superAdmin.js';
import { superAdminLoginLimiter } from '../middleware/rateLimiter.js';
import * as ctrl                 from '../controllers/superAdminController.js';

const router = Router();

// ─── Public (login only) — 5 attempts per IP per 15 min ───
router.post('/auth/login', superAdminLoginLimiter, ctrl.login);

// ─── All routes below require super-admin JWT ──────────────
router.use(requireSuperAdmin);

router.get('/auth/me',                ctrl.getMe);
router.get('/stats',                  ctrl.getPlatformStats);
router.get('/organizations',          ctrl.listOrganizations);
router.get('/organizations/:orgId',   ctrl.getOrganization);
router.patch('/organizations/:orgId', ctrl.updateOrganization);
router.get('/activity',               ctrl.getPlatformActivity);
router.get('/health',                 ctrl.getSystemHealth);
router.get('/financials',              ctrl.getPlatformFinancials);

export default router;
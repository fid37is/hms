// src/routes/authRoutes.js

import { Router }       from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate }     from '../middleware/validate.js';
import {
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  registerOrgSchema,
} from '../validators/authValidator.js';
import {
  loginController,
  refreshTokenController,
  getProfileController,
  changePasswordController,
  logoutController,
  forgotPasswordController,
  registerOrgController,
  generateApiKeyController,
  listApiKeysController,
  revokeApiKeyController,
  getOrgController,
  updateOrgController,
} from '../controllers/authController.js';

const router = Router();

// ─── Public ───────────────────────────────────────────────
router.post('/login',           validate(loginSchema),         loginController);
router.post('/refresh',         validate(refreshTokenSchema),  refreshTokenController);
router.post('/forgot-password',                                forgotPasswordController);

// SaaS signup — public, no auth required
router.post('/register-org',    validate(registerOrgSchema),   registerOrgController);

// ─── Authenticated ────────────────────────────────────────
router.post('/logout',          authenticate, logoutController);
router.get('/me',               authenticate, getProfileController);
router.patch('/change-password', authenticate, validate(changePasswordSchema), changePasswordController);

// ─── API Keys (requires JWT auth) ─────────────────────────
router.get('/api-keys',         authenticate, listApiKeysController);
router.post('/api-keys',        authenticate, generateApiKeyController);
router.delete('/api-keys/:id',  authenticate, revokeApiKeyController);

// ─── Organisation profile (slug, custom domain) ───────────
router.get('/org',              authenticate, getOrgController);
router.patch('/org',            authenticate, updateOrgController);

export default router;
// src/routes/authRoutes.js

import { Router }       from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate }     from '../middleware/validate.js';
import {
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from '../validators/authValidator.js';
import {
  loginController,
  refreshTokenController,
  getProfileController,
  changePasswordController,
  logoutController,
  forgotPasswordController,
} from '../controllers/authController.js';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), loginController);

// POST /api/v1/auth/refresh
router.post('/refresh', validate(refreshTokenSchema), refreshTokenController);

// POST /api/v1/auth/logout
router.post('/logout', authenticate, logoutController);

// GET  /api/v1/auth/me
router.get('/me', authenticate, getProfileController);

// PATCH /api/v1/auth/change-password
router.patch('/change-password', authenticate, validate(changePasswordSchema), changePasswordController);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', forgotPasswordController);

export default router;
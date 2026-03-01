// src/routes/configRoutes.js

import { Router }            from 'express';
import { authenticate }      from '../middleware/auth.js';
import { validate }          from '../middleware/validate.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS }       from '../config/constants.js';
import { initConfigSchema, updateConfigSchema } from '../validators/configValidator.js';
import { getConfig, initConfig, updateConfig }  from '../controllers/configController.js';

const router = Router();
router.use(authenticate);

// GET   /api/v1/config        — any authenticated user can read config
// POST  /api/v1/config        — initial setup only (one-time)
// PATCH /api/v1/config        — admin only

router.get('/', getConfig);

router.post('/',
  requirePermission(PERMISSIONS.CONFIG.UPDATE),
  validate(initConfigSchema),
  initConfig
);

router.patch('/',
  requirePermission(PERMISSIONS.CONFIG.UPDATE),
  validate(updateConfigSchema),
  updateConfig
);

export default router;
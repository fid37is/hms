// src/routes/nightAuditRoutes.js

import { Router }       from 'express';
import { authenticate } from '../middleware/auth.js';
import * as ctrl        from '../controllers/nightAuditController.js';

const router = Router();
router.use(authenticate);

router.get ('/preview', ctrl.getPreview);
router.get ('/history', ctrl.getHistory);
router.get ('/status',  ctrl.getStatus);
router.post('/run',     ctrl.runAudit);

export default router;
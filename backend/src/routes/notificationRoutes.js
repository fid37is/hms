// src/routes/notificationRoutes.js

import { Router }          from 'express';
import { authenticate }    from '../middleware/auth.js';
import * as ctrl           from '../controllers/notificationController.js';

const router = Router();

router.use(authenticate);

router.get ('/',            ctrl.getNotifications);
router.get ('/unread-count',ctrl.getUnreadCount);
router.patch('/:id/read',   ctrl.markRead);
router.patch('/read-all',   ctrl.markAllRead);

export default router;
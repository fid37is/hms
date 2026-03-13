// src/routes/index.js

import { Router }             from 'express';
import authRoutes             from './authRoutes.js';
import roomRoutes             from './roomRoutes.js';
import guestRoutes            from './guestRoutes.js';
import reservationRoutes      from './reservationRoutes.js';
import folioRoutes            from './folioRoutes.js';
import housekeepingRoutes     from './housekeepingRoutes.js';
import maintenanceRoutes      from './maintenanceRoutes.js';
import inventoryRoutes        from './inventoryRoutes.js';
import staffRoutes            from './staffRoutes.js';
import reportRoutes           from './reportRoutes.js';
import configRoutes           from './configRoutes.js';
import userRoutes             from './userRoutes.js';
import chatDepartmentRoutes   from './chatDepartmentRoutes.js';
import conversationRoutes     from './conversationRoutes.js';
import publicRoutes           from './publicRoutes.js';
import fnbRoutes              from './fnbRoutes.js';
import notificationRoutes     from './notificationRoutes.js';
import nightAuditRoutes       from './nightAuditRoutes.js';
import eventRoutes            from './eventRoutes.js';

const router = Router();

// ─── Public (no JWT — resolved via API key / subdomain / dev fallback) ────────
router.use('/public',           publicRoutes);

// ─── Authenticated (JWT required) ─────────────────────────────────────────────
router.use('/auth',             authRoutes);
router.use('/chat-departments', chatDepartmentRoutes);
router.use('/conversations',    conversationRoutes);
router.use('/rooms',            roomRoutes);
router.use('/guests',           guestRoutes);
router.use('/reservations',     reservationRoutes);
router.use('/folio',            folioRoutes);
router.use('/housekeeping',     housekeepingRoutes);
router.use('/maintenance',      maintenanceRoutes);
router.use('/inventory',        inventoryRoutes);
router.use('/staff',            staffRoutes);
router.use('/reports',          reportRoutes);
router.use('/config',           configRoutes);
router.use('/users',            userRoutes);
router.use('/fnb',              fnbRoutes);
router.use('/notifications',    notificationRoutes);
router.use('/night-audit',      nightAuditRoutes);
router.use('/events',           eventRoutes);

export default router;
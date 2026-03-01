// src/routes/index.js

import { Router }         from 'express';
import authRoutes         from './authRoutes.js';
import roomRoutes         from './roomRoutes.js';
import guestRoutes        from './guestRoutes.js';
import reservationRoutes  from './reservationRoutes.js';
import folioRoutes        from './folioRoutes.js';
import housekeepingRoutes from './housekeepingRoutes.js';
import maintenanceRoutes  from './maintenanceRoutes.js';
import inventoryRoutes    from './inventoryRoutes.js';
import staffRoutes        from './staffRoutes.js';
import reportRoutes       from './reportRoutes.js';
import configRoutes       from './configRoutes.js';
import userRoutes         from './userRoutes.js';

const router = Router();

router.use('/auth',         authRoutes);
router.use('/rooms',        roomRoutes);
router.use('/guests',       guestRoutes);
router.use('/reservations', reservationRoutes);
router.use('/folio',        folioRoutes);
router.use('/housekeeping', housekeepingRoutes);
router.use('/maintenance',  maintenanceRoutes);
router.use('/inventory',    inventoryRoutes);
router.use('/staff',        staffRoutes);
router.use('/reports',      reportRoutes);
router.use('/config',       configRoutes);
router.use('/users',        userRoutes);

export default router;

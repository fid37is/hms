// src/routes/fnbRoutes.js
import { Router } from 'express';
import { authenticate }      from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS as P }  from '../config/constants.js';
import * as ctrl from '../controllers/fnbController.js';

const router = Router();
const R = P.FNB;

router.use(authenticate);

// Outlets
router.get   ('/outlets',        requirePermission(R.READ),   ctrl.getOutlets);
router.post  ('/outlets',        requirePermission(R.MENU),   ctrl.createOutlet);
router.patch ('/outlets/:id',    requirePermission(R.MENU),   ctrl.updateOutlet);

// Categories
router.get   ('/categories',     requirePermission(R.READ),   ctrl.getCategories);
router.post  ('/categories',     requirePermission(R.MENU),   ctrl.createCategory);

// Menu
router.get   ('/menu',           requirePermission(R.READ),   ctrl.getMenu);
router.post  ('/menu',           requirePermission(R.MENU),   ctrl.createMenuItem);
router.patch ('/menu/:id',       requirePermission(R.MENU),   ctrl.updateMenuItem);
router.delete('/menu/:id',       requirePermission(R.DELETE), ctrl.deleteMenuItem);

// Tables
router.get   ('/tables',         requirePermission(R.READ),   ctrl.getTables);
router.post  ('/tables',         requirePermission(R.MENU),   ctrl.createTable);
router.patch ('/tables/:id/status', requirePermission(R.UPDATE), ctrl.updateTableStatus);

// Orders
router.get   ('/orders',         requirePermission(R.READ),   ctrl.getOrders);
router.get   ('/orders/:id',     requirePermission(R.READ),   ctrl.getOrderById);
router.post  ('/orders',         requirePermission(R.CREATE), ctrl.createOrder);
router.post  ('/orders/:id/items',   requirePermission(R.CREATE), ctrl.addItems);
router.patch ('/orders/:id/status',  requirePermission(R.UPDATE), ctrl.updateStatus);
router.patch ('/orders/:id/bill',    requirePermission(R.BILLING),ctrl.billOrder);
router.patch ('/orders/:id/cancel',  requirePermission(R.UPDATE), ctrl.cancelOrder);

export default router;
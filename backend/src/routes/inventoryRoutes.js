// src/routes/inventoryRoutes.js

import { Router }            from 'express';
import { authenticate }      from '../middleware/auth.js';
import { validate }          from '../middleware/validate.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS }       from '../config/constants.js';
import {
  createSupplierSchema, updateSupplierSchema,
  createItemSchema, updateItemSchema,
  recordMovementSchema, createPurchaseOrderSchema,
} from '../validators/inventoryValidator.js';
import {
  getAllSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier,
  getAllItems, getItemById, createItem, updateItem, deleteItem, getLowStockItems,
  getItemMovements, recordMovement,
  getAllPurchaseOrders, getPurchaseOrderById, createPurchaseOrder,
  approvePurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder,
} from '../controllers/inventoryController.js';

const router = Router();
router.use(authenticate);

// ─── Suppliers ────────────────────────────────────────────
router.get('/suppliers',
  requirePermission(PERMISSIONS.INVENTORY.READ), getAllSuppliers);
router.get('/suppliers/:id',
  requirePermission(PERMISSIONS.INVENTORY.READ), getSupplierById);
router.post('/suppliers',
  requirePermission(PERMISSIONS.INVENTORY.UPDATE), validate(createSupplierSchema), createSupplier);
router.patch('/suppliers/:id',
  requirePermission(PERMISSIONS.INVENTORY.UPDATE), validate(updateSupplierSchema), updateSupplier);
router.delete('/suppliers/:id',
  requirePermission(PERMISSIONS.INVENTORY.UPDATE), deleteSupplier);

// ─── Inventory Items ──────────────────────────────────────
router.get('/items/low-stock',
  requirePermission(PERMISSIONS.INVENTORY.READ), getLowStockItems);
router.get('/items',
  requirePermission(PERMISSIONS.INVENTORY.READ), getAllItems);
router.get('/items/:id',
  requirePermission(PERMISSIONS.INVENTORY.READ), getItemById);
router.post('/items',
  requirePermission(PERMISSIONS.INVENTORY.UPDATE), validate(createItemSchema), createItem);
router.patch('/items/:id',
  requirePermission(PERMISSIONS.INVENTORY.UPDATE), validate(updateItemSchema), updateItem);
router.delete('/items/:id',
  requirePermission(PERMISSIONS.INVENTORY.UPDATE), deleteItem);

// ─── Stock Movements ──────────────────────────────────────
router.get('/items/:id/movements',
  requirePermission(PERMISSIONS.INVENTORY.READ), getItemMovements);
router.post('/items/:id/movements',
  requirePermission(PERMISSIONS.INVENTORY.UPDATE), validate(recordMovementSchema), recordMovement);

// ─── Purchase Orders ──────────────────────────────────────
router.get('/purchase-orders',
  requirePermission(PERMISSIONS.INVENTORY.READ), getAllPurchaseOrders);
router.get('/purchase-orders/:id',
  requirePermission(PERMISSIONS.INVENTORY.READ), getPurchaseOrderById);
router.post('/purchase-orders',
  requirePermission(PERMISSIONS.INVENTORY.UPDATE), validate(createPurchaseOrderSchema), createPurchaseOrder);
router.patch('/purchase-orders/:id/approve',
  requirePermission(PERMISSIONS.INVENTORY.APPROVE), approvePurchaseOrder);
router.patch('/purchase-orders/:id/receive',
  requirePermission(PERMISSIONS.INVENTORY.UPDATE), receivePurchaseOrder);
router.patch('/purchase-orders/:id/cancel',
  requirePermission(PERMISSIONS.INVENTORY.UPDATE), cancelPurchaseOrder);

export default router;
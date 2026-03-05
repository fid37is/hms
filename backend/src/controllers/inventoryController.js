// src/controllers/inventoryController.js

import * as inventoryService from '../services/inventoryService.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response.js';

// ─── Suppliers ────────────────────────────────────────────

export const getAllSuppliers = async (req, res, next) => {
  try {
    const data = await inventoryService.getAllSuppliers(req.orgId, req.query);
    return sendSuccess(res, data, 'Suppliers retrieved.');
  } catch (err) { next(err); }
};

export const getSupplierById = async (req, res, next) => {
  try {
    const data = await inventoryService.getSupplierById(req.orgId, req.params.id);
    return sendSuccess(res, data, 'Supplier retrieved.');
  } catch (err) { next(err); }
};

export const createSupplier = async (req, res, next) => {
  try {
    const data = await inventoryService.createSupplier(req.orgId, req.body);
    return sendCreated(res, data, 'Supplier created.');
  } catch (err) { next(err); }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const data = await inventoryService.updateSupplier(req.orgId, req.params.id, req.body);
    return sendSuccess(res, data, 'Supplier updated.');
  } catch (err) { next(err); }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const data = await inventoryService.deleteSupplier(req.orgId, req.params.id);
    return sendSuccess(res, data, 'Supplier deleted.');
  } catch (err) { next(err); }
};

// ─── Inventory Items ──────────────────────────────────────

export const getAllItems = async (req, res, next) => {
  try {
    const { category, department, low_stock, page = 1, limit = 20 } = req.query;
    const { data, total } = await inventoryService.getAllItems(
      req.orgId, { category, department, low_stock },
      Number(page), Number(limit)
    );
    return sendPaginated(res, data, total, page, limit, 'Inventory items retrieved.');
  } catch (err) { next(err); }
};

export const getItemById = async (req, res, next) => {
  try {
    const data = await inventoryService.getItemById(req.orgId, req.params.id);
    return sendSuccess(res, data, 'Item retrieved.');
  } catch (err) { next(err); }
};

export const createItem = async (req, res, next) => {
  try {
    const data = await inventoryService.createItem(req.orgId, req.body);
    return sendCreated(res, data, 'Inventory item created.');
  } catch (err) { next(err); }
};

export const updateItem = async (req, res, next) => {
  try {
    const data = await inventoryService.updateItem(req.orgId, req.params.id, req.body);
    return sendSuccess(res, data, 'Inventory item updated.');
  } catch (err) { next(err); }
};

export const deleteItem = async (req, res, next) => {
  try {
    const data = await inventoryService.deleteItem(req.orgId, req.params.id);
    return sendSuccess(res, data, 'Inventory item deactivated.');
  } catch (err) { next(err); }
};

export const getLowStockItems = async (req, res, next) => {
  try {
    const data = await inventoryService.getLowStockItems(req.orgId);
    return sendSuccess(res, data, 'Low stock items retrieved.');
  } catch (err) { next(err); }
};

// ─── Stock Movements ──────────────────────────────────────

export const getItemMovements = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { data, total } = await inventoryService.getItemMovements(
      req.orgId, req.params.id, Number(page), Number(limit)
    );
    return sendPaginated(res, data, total, page, limit, 'Stock movements retrieved.');
  } catch (err) { next(err); }
};

export const recordMovement = async (req, res, next) => {
  try {
    const data = await inventoryService.recordMovement(req.orgId, req.params.id, req.body, req.user.sub);
    return sendCreated(res, data, 'Stock movement recorded.');
  } catch (err) { next(err); }
};

// ─── Purchase Orders ──────────────────────────────────────

export const getAllPurchaseOrders = async (req, res, next) => {
  try {
    const { status, supplier_id, page = 1, limit = 20 } = req.query;
    const { data, total } = await inventoryService.getAllPurchaseOrders(
      req.orgId, { status, supplier_id }, Number(page), Number(limit)
    );
    return sendPaginated(res, data, total, page, limit, 'Purchase orders retrieved.');
  } catch (err) { next(err); }
};

export const getPurchaseOrderById = async (req, res, next) => {
  try {
    const data = await inventoryService.getPurchaseOrderById(req.orgId, req.params.id);
    return sendSuccess(res, data, 'Purchase order retrieved.');
  } catch (err) { next(err); }
};

export const createPurchaseOrder = async (req, res, next) => {
  try {
    const data = await inventoryService.createPurchaseOrder(req.orgId, req.body, req.user.sub);
    return sendCreated(res, data, 'Purchase order created.');
  } catch (err) { next(err); }
};

export const approvePurchaseOrder = async (req, res, next) => {
  try {
    const data = await inventoryService.approvePurchaseOrder(req.orgId, req.params.id, req.user.sub);
    return sendSuccess(res, data, 'Purchase order approved.');
  } catch (err) { next(err); }
};

export const receivePurchaseOrder = async (req, res, next) => {
  try {
    const data = await inventoryService.receivePurchaseOrder(req.orgId, req.params.id, req.user.sub);
    return sendSuccess(res, data, 'Purchase order marked as received. Stock updated.');
  } catch (err) { next(err); }
};

export const cancelPurchaseOrder = async (req, res, next) => {
  try {
    const data = await inventoryService.cancelPurchaseOrder(req.orgId, req.params.id);
    return sendSuccess(res, data, 'Purchase order cancelled.');
  } catch (err) { next(err); }
};
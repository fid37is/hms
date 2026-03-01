// src/controllers/maintenanceController.js

import * as maintenanceService from '../services/maintenanceService.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response.js';

export const getAllWorkOrders = async (req, res, next) => {
  try {
    const { status, priority, category, room_id, assigned_to, page = 1, limit = 20 } = req.query;
    const { data, total } = await maintenanceService.getAllWorkOrders(
      { status, priority, category, room_id, assigned_to },
      Number(page), Number(limit)
    );
    return sendPaginated(res, data, total, page, limit, 'Work orders retrieved.');
  } catch (err) { next(err); }
};

export const getWorkOrderById = async (req, res, next) => {
  try {
    const data = await maintenanceService.getWorkOrderById(req.params.id);
    return sendSuccess(res, data, 'Work order retrieved.');
  } catch (err) { next(err); }
};

export const createWorkOrder = async (req, res, next) => {
  try {
    const data = await maintenanceService.createWorkOrder(req.body, req.user.sub);
    return sendCreated(res, data, 'Work order created.');
  } catch (err) { next(err); }
};

export const updateWorkOrder = async (req, res, next) => {
  try {
    const data = await maintenanceService.updateWorkOrder(req.params.id, req.body);
    return sendSuccess(res, data, 'Work order updated.');
  } catch (err) { next(err); }
};

export const assignWorkOrder = async (req, res, next) => {
  try {
    const data = await maintenanceService.assignWorkOrder(req.params.id, req.body.assigned_to, req.user.sub);
    return sendSuccess(res, data, 'Work order assigned.');
  } catch (err) { next(err); }
};

export const startWorkOrder = async (req, res, next) => {
  try {
    const data = await maintenanceService.startWorkOrder(req.params.id);
    return sendSuccess(res, data, 'Work order started.');
  } catch (err) { next(err); }
};

export const resolveWorkOrder = async (req, res, next) => {
  try {
    const data = await maintenanceService.resolveWorkOrder(req.params.id, req.body.resolution, req.body.cost);
    return sendSuccess(res, data, 'Work order resolved.');
  } catch (err) { next(err); }
};

export const closeWorkOrder = async (req, res, next) => {
  try {
    const data = await maintenanceService.closeWorkOrder(req.params.id);
    return sendSuccess(res, data, 'Work order closed.');
  } catch (err) { next(err); }
};

export const getAllAssets = async (req, res, next) => {
  try {
    const { status, category, location, page = 1, limit = 20 } = req.query;
    const { data, total } = await maintenanceService.getAllAssets(
      { status, category, location },
      Number(page), Number(limit)
    );
    return sendPaginated(res, data, total, page, limit, 'Assets retrieved.');
  } catch (err) { next(err); }
};

export const getAssetById = async (req, res, next) => {
  try {
    const data = await maintenanceService.getAssetById(req.params.id);
    return sendSuccess(res, data, 'Asset retrieved.');
  } catch (err) { next(err); }
};

export const createAsset = async (req, res, next) => {
  try {
    const data = await maintenanceService.createAsset(req.body);
    return sendCreated(res, data, 'Asset created.');
  } catch (err) { next(err); }
};

export const updateAsset = async (req, res, next) => {
  try {
    const data = await maintenanceService.updateAsset(req.params.id, req.body);
    return sendSuccess(res, data, 'Asset updated.');
  } catch (err) { next(err); }
};

export const deleteAsset = async (req, res, next) => {
  try {
    const data = await maintenanceService.deleteAsset(req.params.id);
    return sendSuccess(res, data, 'Asset deleted.');
  } catch (err) { next(err); }
};

export const getAssetsDueForService = async (req, res, next) => {
  try {
    const data = await maintenanceService.getAssetsDueForService();
    return sendSuccess(res, data, 'Assets due for service retrieved.');
  } catch (err) { next(err); }
};
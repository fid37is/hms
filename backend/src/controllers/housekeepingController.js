// src/controllers/housekeepingController.js

import * as housekeepingService from '../services/housekeepingService.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response.js';

// ─── Tasks ────────────────────────────────────────────────

export const getAllTasks = async (req, res, next) => {
  try {
    const { status, room_id, assigned_to, task_type, priority, page = 1, limit = 20 } = req.query;
    const { data, total } = await housekeepingService.getAllTasks(
      { status, room_id, assigned_to, task_type, priority },
      Number(page), Number(limit)
    );
    return sendPaginated(res, data, total, page, limit, 'Tasks retrieved.');
  } catch (err) { next(err); }
};

export const getTaskById = async (req, res, next) => {
  try {
    const data = await housekeepingService.getTaskById(req.params.id);
    return sendSuccess(res, data, 'Task retrieved.');
  } catch (err) { next(err); }
};

export const createTask = async (req, res, next) => {
  try {
    const data = await housekeepingService.createTask(req.body, req.user.sub);
    return sendCreated(res, data, 'Task created.');
  } catch (err) { next(err); }
};

export const updateTask = async (req, res, next) => {
  try {
    const data = await housekeepingService.updateTask(req.params.id, req.body);
    return sendSuccess(res, data, 'Task updated.');
  } catch (err) { next(err); }
};

export const startTask = async (req, res, next) => {
  try {
    const data = await housekeepingService.startTask(req.params.id, req.user.sub);
    return sendSuccess(res, data, 'Task started.');
  } catch (err) { next(err); }
};

export const completeTask = async (req, res, next) => {
  try {
    const data = await housekeepingService.completeTask(req.params.id, req.user.sub, req.body.notes);
    return sendSuccess(res, data, 'Task marked as done. Pending inspection.');
  } catch (err) { next(err); }
};

export const inspectTask = async (req, res, next) => {
  try {
    const data = await housekeepingService.inspectTask(req.params.id, req.user.sub, req.body.notes);
    return sendSuccess(res, data, 'Task inspected. Room marked as clean.');
  } catch (err) { next(err); }
};

export const assignTask = async (req, res, next) => {
  try {
    const data = await housekeepingService.assignTask(req.params.id, req.body.assigned_to, req.user.sub);
    return sendSuccess(res, data, 'Task assigned.');
  } catch (err) { next(err); }
};

export const deleteTask = async (req, res, next) => {
  try {
    const data = await housekeepingService.deleteTask(req.params.id);
    return sendSuccess(res, data, 'Task deleted.');
  } catch (err) { next(err); }
};

export const getPendingByRoom = async (req, res, next) => {
  try {
    const data = await housekeepingService.getPendingByRoom(req.params.roomId);
    return sendSuccess(res, data, 'Room tasks retrieved.');
  } catch (err) { next(err); }
};

// ─── Lost & Found ─────────────────────────────────────────

export const getAllLostAndFound = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const { data, total } = await housekeepingService.getAllLostAndFound(
      { status }, Number(page), Number(limit)
    );
    return sendPaginated(res, data, total, page, limit, 'Lost and found items retrieved.');
  } catch (err) { next(err); }
};

export const getLostAndFoundById = async (req, res, next) => {
  try {
    const data = await housekeepingService.getLostAndFoundById(req.params.id);
    return sendSuccess(res, data, 'Item retrieved.');
  } catch (err) { next(err); }
};

export const createLostAndFoundItem = async (req, res, next) => {
  try {
    const data = await housekeepingService.createLostAndFoundItem(req.body, req.user.sub);
    return sendCreated(res, data, 'Item logged.');
  } catch (err) { next(err); }
};

export const updateLostAndFoundItem = async (req, res, next) => {
  try {
    const data = await housekeepingService.updateLostAndFoundItem(req.params.id, req.body);
    return sendSuccess(res, data, 'Item updated.');
  } catch (err) { next(err); }
};

export const markReturned = async (req, res, next) => {
  try {
    const data = await housekeepingService.markReturned(req.params.id, req.body.guest_id, req.body.notes);
    return sendSuccess(res, data, 'Item marked as returned.');
  } catch (err) { next(err); }
};
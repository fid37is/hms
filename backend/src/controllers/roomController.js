// src/controllers/roomController.js

import * as roomService from '../services/roomService.js';
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
} from '../utils/response.js';

// ─── Room Types ───────────────────────────────────────────

export const getAllRoomTypes = async (req, res, next) => {
  try {
    const data = await roomService.getAllRoomTypes();
    return sendSuccess(res, data, 'Room types retrieved.');
  } catch (err) { next(err); }
};

export const getRoomTypeById = async (req, res, next) => {
  try {
    const data = await roomService.getRoomTypeById(req.params.id);
    return sendSuccess(res, data, 'Room type retrieved.');
  } catch (err) { next(err); }
};

export const createRoomType = async (req, res, next) => {
  try {
    const data = await roomService.createRoomType(req.body);
    return sendCreated(res, data, 'Room type created.');
  } catch (err) { next(err); }
};

export const updateRoomType = async (req, res, next) => {
  try {
    const data = await roomService.updateRoomType(req.params.id, req.body);
    return sendSuccess(res, data, 'Room type updated.');
  } catch (err) { next(err); }
};

export const deleteRoomType = async (req, res, next) => {
  try {
    const data = await roomService.deleteRoomType(req.params.id);
    return sendSuccess(res, data, 'Room type deleted.');
  } catch (err) { next(err); }
};

// ─── Rate Plans ───────────────────────────────────────────

export const getRatePlans = async (req, res, next) => {
  try {
    const data = await roomService.getRatePlans(req.params.roomTypeId);
    return sendSuccess(res, data, 'Rate plans retrieved.');
  } catch (err) { next(err); }
};

export const createRatePlan = async (req, res, next) => {
  try {
    const data = await roomService.createRatePlan(req.body);
    return sendCreated(res, data, 'Rate plan created.');
  } catch (err) { next(err); }
};

export const updateRatePlan = async (req, res, next) => {
  try {
    const data = await roomService.updateRatePlan(req.params.id, req.body);
    return sendSuccess(res, data, 'Rate plan updated.');
  } catch (err) { next(err); }
};

export const deleteRatePlan = async (req, res, next) => {
  try {
    const data = await roomService.deleteRatePlan(req.params.id);
    return sendSuccess(res, data, 'Rate plan deleted.');
  } catch (err) { next(err); }
};

// ─── Rooms ────────────────────────────────────────────────

export const getAllRooms = async (req, res, next) => {
  try {
    const { status, type_id, floor } = req.query;
    const data = await roomService.getAllRooms({ status, type_id, floor });
    return sendSuccess(res, data, 'Rooms retrieved.');
  } catch (err) { next(err); }
};

export const getRoomById = async (req, res, next) => {
  try {
    const data = await roomService.getRoomById(req.params.id);
    return sendSuccess(res, data, 'Room retrieved.');
  } catch (err) { next(err); }
};

export const createRoom = async (req, res, next) => {
  try {
    const data = await roomService.createRoom(req.body);
    return sendCreated(res, data, 'Room created.');
  } catch (err) { next(err); }
};

export const updateRoom = async (req, res, next) => {
  try {
    const data = await roomService.updateRoom(req.params.id, req.body);
    return sendSuccess(res, data, 'Room updated.');
  } catch (err) { next(err); }
};

export const updateRoomStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const data = await roomService.updateRoomStatus(req.params.id, status, notes);
    return sendSuccess(res, data, 'Room status updated.');
  } catch (err) { next(err); }
};

export const blockRoom = async (req, res, next) => {
  try {
    const data = await roomService.blockRoom(req.params.id, req.body.reason);
    return sendSuccess(res, data, 'Room blocked.');
  } catch (err) { next(err); }
};

export const unblockRoom = async (req, res, next) => {
  try {
    const data = await roomService.unblockRoom(req.params.id);
    return sendSuccess(res, data, 'Room unblocked.');
  } catch (err) { next(err); }
};

export const deleteRoom = async (req, res, next) => {
  try {
    const data = await roomService.deleteRoom(req.params.id);
    return sendSuccess(res, data, 'Room deleted.');
  } catch (err) { next(err); }
};

export const getAvailableRooms = async (req, res, next) => {
  try {
    const { check_in, check_out, type_id } = req.query;
    const data = await roomService.getAvailableRooms(check_in, check_out, type_id);
    return sendSuccess(res, data, 'Available rooms retrieved.');
  } catch (err) { next(err); }
};
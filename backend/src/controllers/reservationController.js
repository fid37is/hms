// src/controllers/reservationController.js

import * as reservationService from '../services/reservationService.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response.js';

export const getAllReservations = async (req, res, next) => {
  try {
    const {
      status, guest_id, room_id, date_from, date_to,
      arrivals_today, departures_today,
      page = 1, limit = 20,
    } = req.query;

    const { data, total } = await reservationService.getAllReservations(
      req.orgId,
      { status, guest_id, room_id, date_from, date_to, arrivals_today, departures_today },
      Number(page), Number(limit)
    );
    return sendPaginated(res, data, total, page, limit, 'Reservations retrieved.');
  } catch (err) { next(err); }
};

export const getReservationById = async (req, res, next) => {
  try {
    const data = await reservationService.getReservationById(req.orgId, req.params.id);
    return sendSuccess(res, data, 'Reservation retrieved.');
  } catch (err) { next(err); }
};

export const createReservation = async (req, res, next) => {
  try {
    const data = await reservationService.createReservation(req.orgId, req.body, req.user.sub);
    return sendCreated(res, data, 'Reservation created.');
  } catch (err) { next(err); }
};

export const updateReservation = async (req, res, next) => {
  try {
    const data = await reservationService.updateReservation(req.orgId, req.params.id, req.body);
    return sendSuccess(res, data, 'Reservation updated.');
  } catch (err) { next(err); }
};

export const checkIn = async (req, res, next) => {
  try {
    const data = await reservationService.checkIn(req.orgId, req.params.id, req.user.sub);
    return sendSuccess(res, data, 'Guest checked in successfully.');
  } catch (err) { next(err); }
};

export const checkOut = async (req, res, next) => {
  try {
    const data = await reservationService.checkOut(req.orgId, req.params.id, req.user.sub);
    return sendSuccess(res, data, 'Guest checked out successfully.');
  } catch (err) { next(err); }
};

export const cancelReservation = async (req, res, next) => {
  try {
    const data = await reservationService.cancelReservation(
      req.orgId, req.params.id, req.body.reason
    );
    return sendSuccess(res, data, 'Reservation cancelled.');
  } catch (err) { next(err); }
};

export const assignRoom = async (req, res, next) => {
  try {
    const data = await reservationService.assignRoom(req.orgId, req.params.id, req.body.room_id);
    return sendSuccess(res, data, 'Room assigned successfully.');
  } catch (err) { next(err); }
};

export const getTodayArrivals = async (req, res, next) => {
  try {
    const data = await reservationService.getTodayArrivals(req.orgId);
    return sendSuccess(res, data, 'Today arrivals retrieved.');
  } catch (err) { next(err); }
};

export const getTodayDepartures = async (req, res, next) => {
  try {
    const data = await reservationService.getTodayDepartures(req.orgId);
    return sendSuccess(res, data, 'Today departures retrieved.');
  } catch (err) { next(err); }
};
// src/controllers/guestAccountController.js

import * as guestAccountService from '../services/guestAccountService.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const register = async (req, res, next) => {
  try {
    const data = await guestAccountService.register(req.body);
    return sendCreated(res, data, 'Account created successfully.');
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const data = await guestAccountService.login(req.body);
    return sendSuccess(res, data, 'Login successful.');
  } catch (err) { next(err); }
};

export const getMyReservations = async (req, res, next) => {
  try {
    const data = await guestAccountService.getMyReservations(req.guest.sub);
    return sendSuccess(res, data, 'Reservations retrieved.');
  } catch (err) { next(err); }
};

export const getMyReservationById = async (req, res, next) => {
  try {
    const data = await guestAccountService.getMyReservationById(req.guest.sub, req.params.id);
    return sendSuccess(res, data, 'Reservation retrieved.');
  } catch (err) { next(err); }
};

export const refreshToken = async (req, res, next) => {
  try {
    const data = await guestAccountService.refreshGuestToken(req.body.refresh_token);
    return sendSuccess(res, data, 'Token refreshed.');
  } catch (err) { next(err); }
};

export const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, {
      id:        req.guest.sub,
      email:     req.guest.email,
      full_name: req.guest.full_name,
    }, 'Profile retrieved.');
  } catch (err) { next(err); }
};
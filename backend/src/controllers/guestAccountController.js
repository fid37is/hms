// src/controllers/guestAccountController.js

import * as guestAccountService from '../services/guestAccountService.js';
import { supabase }             from '../config/supabase.js';
import { AppError }             from '../middleware/errorHandler.js';
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

export const refreshToken = async (req, res, next) => {
  try {
    const data = await guestAccountService.refreshGuestToken(req.body.refresh_token);
    return sendSuccess(res, data, 'Token refreshed.');
  } catch (err) { next(err); }
};

// Guests are NOT org-scoped — they exist globally and may have stayed at
// multiple hotels. Query by id only, no org_id filter.
export const getMe = async (req, res, next) => {
  try {
    const { data: guest, error } = await supabase
      .from('guests')
      .select('id, full_name, email, phone, address, nationality, id_type, id_number, date_of_birth, preferences, category, loyalty_points')
      .eq('id', req.guest.sub)
      .eq('is_deleted', false)
      .single();

    if (error || !guest) throw new AppError('Guest not found.', 404);

    return sendSuccess(res, guest, 'Profile retrieved.');
  } catch (err) { next(err); }
};

// PATCH /api/v1/public/auth/me — update own profile
export const updateMe = async (req, res, next) => {
  try {
    console.log('getMe sub:', req.guest.sub);
    const {
      full_name, phone, address,
      nationality, id_type, id_number,
      date_of_birth, preferences,
    } = req.body;

    const updates = {};
    if (full_name     !== undefined) updates.full_name     = full_name;
    if (phone         !== undefined) updates.phone         = phone;
    if (address       !== undefined) updates.address       = address;
    if (nationality   !== undefined) updates.nationality   = nationality;
    if (id_type       !== undefined) updates.id_type       = id_type;
    if (id_number     !== undefined) updates.id_number     = id_number;
    if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth;
    if (preferences   !== undefined) updates.preferences   = preferences;

    if (Object.keys(updates).length === 0)
      throw new AppError('No valid fields to update.', 400);

    const { data, error } = await supabase
      .from('guests')
      .update(updates)
      .eq('id', req.guest.sub)
      .select('id, full_name, email, phone, address, nationality, id_type, id_number, date_of_birth, preferences, category, loyalty_points')
      .single();

    if (error || !data) throw new AppError('Failed to update profile.', 500);

    return sendSuccess(res, data, 'Profile updated.');
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

export const forgotPassword = async (req, res, next) => {
  try {
    const data = await guestAccountService.forgotPassword(req.body.email);
    return sendSuccess(res, data, data.message);
  } catch (err) { next(err); }
};

export const resetPassword = async (req, res, next) => {
  try {
    const data = await guestAccountService.resetPassword(req.body);
    return sendSuccess(res, data, data.message);
  } catch (err) { next(err); }
};
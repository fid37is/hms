// src/controllers/publicReservationController.js
//
// Handles guest-facing reservation actions from the public website.
// Key difference from staff controller: guest may or may not have an account.
// We create/find a guest record first, then create the reservation.

import { supabase }           from '../config/supabase.js';
import * as reservationService from '../services/reservationService.js';
import { AppError }           from '../middleware/errorHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

// ─── Helper: find or create guest record ─────────────────────────────────────
// For logged-in guests  → use their existing guest_id from JWT
// For unregistered guests → create a minimal guest record from form data
const resolveGuestId = async (req) => {
  // 1. Logged-in guest account
  if (req.guest?.sub) return req.guest.sub;

  // 2. Unregistered — create a guest record on the fly
  const { first_name, last_name, email, phone } = req.body.guest || {};
  if (!email) throw new AppError('Guest email is required.', 422);

  // Check if a guest with this email already exists (returning guest, not web account)
  const { data: existing } = await supabase
    .from('guests')
    .select('id, is_deleted')
    .eq('email', email)
    .eq('is_deleted', false)
    .limit(1)
    .single();

  if (existing) return existing.id;

  // Create new guest record
  const { data: newGuest, error } = await supabase
    .from('guests')
    .insert({
      full_name:      `${first_name || ''} ${last_name || ''}`.trim(),
      email,
      phone:          phone || null,
      category:       'regular',
      is_web_account: false,
    })
    .select('id')
    .single();

  if (error) throw new AppError('Failed to process guest details.', 500);
  return newGuest.id;
};

// ─── POST /api/v1/public/reservations ────────────────────────────────────────
export const publicCreateReservation = async (req, res, next) => {
  try {
    const guest_id = await resolveGuestId(req);

    const {
      check_in, check_out,
      check_in_date, check_out_date,
      room_type_id, rate_plan_id,
      adults, children,
      special_requests,
      rate_per_night,
    } = req.body;

    // Support both date field naming conventions
    const checkIn  = check_in_date  || check_in;
    const checkOut = check_out_date || check_out;

    if (!checkIn || !checkOut) {
      throw new AppError('Check-in and check-out dates are required.', 422);
    }

    // Get rate per night from rate plan if not provided directly
    let nightRate = rate_per_night;
    if (!nightRate && rate_plan_id) {
      const { data: ratePlan } = await supabase
        .from('rate_plans')
        .select('base_rate')
        .eq('id', rate_plan_id)
        .single();
      if (ratePlan) nightRate = ratePlan.base_rate;
    }

    // Fall back to room type base_rate
    if (!nightRate && room_type_id) {
      const { data: roomType } = await supabase
        .from('room_types')
        .select('base_rate')
        .eq('id', room_type_id)
        .single();
      if (roomType) nightRate = roomType.base_rate;
    }

    if (!nightRate) throw new AppError('Could not determine room rate.', 422);

    const data = await reservationService.createReservation({
      guest_id,
      room_id:         null,          // room assigned at check-in by staff
      room_type_id,
      check_in_date:   checkIn,
      check_out_date:  checkOut,
      adults:          adults  || 1,
      children:        children || 0,
      booking_source:  'online',
      rate_per_night:  nightRate,
      deposit_amount:  0,
      special_requests: special_requests || null,
    }, null);

    return sendCreated(res, {
      reservation: data,
      guest_id,
    }, 'Your booking is confirmed!');
  } catch (err) { next(err); }
};

// ─── PATCH /api/v1/public/reservations/:id/cancel ────────────────────────────
export const publicCancelReservation = async (req, res, next) => {
  try {
    const data = await reservationService.cancelReservation(
      req.params.id,
      req.body.reason || 'Cancelled by guest via website.',
      null
    );
    return sendSuccess(res, data, 'Your reservation has been cancelled.');
  } catch (err) { next(err); }
};
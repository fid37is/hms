// src/controllers/publicReservationController.js
//
// Handles guest-facing reservation actions from the public website.
// Wraps your existing reservationService — zero service logic duplicated.
// Kept separate from reservationController.js so internal HMS is untouched.

import * as reservationService from '../services/reservationService.js';
import { issueGuestToken }     from '../middleware/guestAuth.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

// ─── POST /api/v1/public/reservations ────────────────────────────────────────
// Guest books a room. No HMS account needed.
// Returns the reservation + a guest JWT for subsequent manage-booking calls.
export const publicCreateReservation = async (req, res, next) => {
  try {
    // Pass null as the staff user ID — your service should accept this for
    // web bookings. If it requires a user ID, see note below.
    const data = await reservationService.createReservation(req.body, null);

    // Issue a guest token so they can manage this booking (cancel, pay, view)
    const guestToken = issueGuestToken({
      reservation_id: data.id,
      guest_email:    req.body.guest?.email || req.body.email,
      guest_name:     req.body.guest?.first_name || req.body.full_name,
    });

    return sendCreated(res, {
      reservation: data,
      guest_token: guestToken,          // website stores this in memory/sessionStorage
      message:     'Your booking is confirmed. Save your reference number: ' + data.confirmation_number,
    }, 'Reservation created.');
  } catch (err) { next(err); }
};

// ─── PATCH /api/v1/public/reservations/:id/cancel ────────────────────────────
// Guest cancels their own reservation. Guest token + ownership already verified
// by verifyGuestToken + authorizeGuestReservation middleware in publicRoutes.js
export const publicCancelReservation = async (req, res, next) => {
  try {
    // Pass null for staff user ID — cancellation was guest-initiated
    const data = await reservationService.cancelReservation(
      req.params.id,
      req.body.reason || 'Cancelled by guest via website.',
      null
    );
    return sendSuccess(res, data, 'Your reservation has been cancelled.');
  } catch (err) { next(err); }
};
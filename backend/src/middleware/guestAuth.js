// src/middleware/guestAuth.js

import jwt                  from 'jsonwebtoken';
import { env }              from '../config/env.js';
import { sendUnauthorized } from '../utils/response.js';

// ─── Issue a guest token (call this from reservationController after booking) ──
export const issueGuestToken = (payload) => {
  return jwt.sign(
    { ...payload, type: 'guest' },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ─── Middleware: verify guest token ───────────────────────────────────────────
export const verifyGuestToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendUnauthorized(res, 'No guest token provided.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (decoded.type !== 'guest') {
      return sendUnauthorized(res, 'Invalid token type.');
    }

    req.guest = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Guest session expired. Please retrieve your booking confirmation.');
    }
    return sendUnauthorized(res, 'Invalid guest token.');
  }
};

// ─── Middleware: ensure guest can only access their own reservation ────────────
// Two token types reach here:
//
// 1. BOOKING TOKEN — issued at booking confirmation (no account required)
//    payload: { reservation_id, guest_email, guest_name, type: 'guest' }
//    → check req.guest.reservation_id === reservationId
//
// 2. ACCOUNT TOKEN — issued at login for registered guests
//    payload: { sub: guest_id, email, type: 'guest' }
//    → no reservation_id in token; ownership is verified in the controller
//      via guest_id, so let it pass here
//
export const authorizeGuestReservation = (req, res, next) => {
  const reservationId = req.params.id || req.params.reservationId;

  // Logged-in guest account — has sub (guest_id), no reservation_id
  // Controller handles ownership check, so pass through
  if (req.guest.sub) return next();

  // One-time booking token — must match the specific reservation
  if (req.guest.reservation_id !== reservationId) {
    return sendUnauthorized(res, 'You are not authorized to access this reservation.');
  }

  next();
};
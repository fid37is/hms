// src/middleware/guestAuth.js
//
// Mirrors the pattern in auth.js but for public-facing guest tokens.
// Guest tokens are issued on booking confirmation and allow guests to
// manage their own reservation (cancel, view, pay) without an HMS account.

import jwt                  from 'jsonwebtoken';
import { env }              from '../config/env.js';
import { sendUnauthorized } from '../utils/response.js';

// ─── Issue a guest token (call this from reservationController after booking) ──
// Usage:  const token = issueGuestToken({ reservation_id, guest_email, guest_name });
export const issueGuestToken = (payload) => {
  return jwt.sign(
    { ...payload, type: 'guest' },
    env.JWT_SECRET,
    { expiresIn: '7d' }   // guest tokens live for 7 days — adjust to your policy
  );
};

// ─── Middleware: verify guest token ───────────────────────────────────────────
// Attach decoded guest payload to req.guest (not req.user — keeps guest/staff separate)
export const verifyGuestToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendUnauthorized(res, 'No guest token provided.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Reject staff tokens hitting guest routes
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
// Use this on any route with :id or :reservationId param
export const authorizeGuestReservation = (req, res, next) => {
  const reservationId = req.params.id || req.params.reservationId;

  if (req.guest.reservation_id !== reservationId) {
    return sendUnauthorized(res, 'You are not authorized to access this reservation.');
  }

  next();
};
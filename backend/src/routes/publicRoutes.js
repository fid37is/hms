// src/routes/publicRoutes.js
//
// Public-facing API for the hotel website.
// Mount in app.js with:  app.use('/api/v1/public', publicRoutes);

import { Router } from 'express';
import { validate } from '../middleware/validate.js';

// ─── Guest auth ───────────────────────────────────────────────────────────────
import {
  verifyGuestToken,
  authorizeGuestReservation,
} from '../middleware/guestAuth.js';

// ─── Rate limiters ────────────────────────────────────────────────────────────
import {
  rateLimiter,
  bookingLimiter,
  availabilityLimiter,
} from '../middleware/rateLimiter.js';

// ─── Config controller ────────────────────────────────────────────────────────
import { getPublicConfig } from '../controllers/configController.js';

// ─── Existing room controllers (no changes needed) ────────────────────────────
import {
  getAllRoomTypes,
  getRoomTypeById,
  getRatePlans,
  getAvailableRooms,
} from '../controllers/roomController.js';

// ─── Existing reservation controller (read-only use) ─────────────────────────
import {
  getReservationById,
} from '../controllers/reservationController.js';

// ─── New public controller (handles guest write actions) ─────────────────────
import {
  publicCreateReservation,
  publicCancelReservation,
} from '../controllers/publicReservationController.js';

// ─── Existing folio controller ────────────────────────────────────────────────
import {
  getFolioByReservation,
  getFolioSummary,
  addPayment,
} from '../controllers/folioController.js';

// ─── Guest account controllers ───────────────────────────────────────────────
import {
  register,
  login,
  getMyReservations,
  getMyReservationById,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
} from '../controllers/guestAccountController.js';

import {
  guestRegisterSchema,
  guestLoginSchema,
  guestRefreshSchema,
} from '../validators/guestAccountValidator.js';

// ─── Public validators ────────────────────────────────────────────────────────
import {
  publicAvailabilitySchema,
  publicCreateReservationSchema,
  publicCancelReservationSchema,
  publicAddPaymentSchema,
} from '../validators/publicValidator.js';

const router = Router();

// =============================================================================
// OPEN ROUTES — no authentication required
// =============================================================================

// GET /api/v1/public/config — hotel branding & contact info for the website
router.get('/config',
  rateLimiter,
  getPublicConfig
);

// GET /api/v1/public/rooms/types
router.get('/rooms/types',
  rateLimiter,
  getAllRoomTypes
);

// GET /api/v1/public/rooms/types/:roomTypeId/rates  ← must be BEFORE /:id
router.get('/rooms/types/:roomTypeId/rates',
  rateLimiter,
  getRatePlans
);

// GET /api/v1/public/rooms/types/:id
router.get('/rooms/types/:id',
  rateLimiter,
  getRoomTypeById
);

// GET /api/v1/public/rooms/availability?check_in=&check_out=&guests=&type_id=
router.get('/rooms/availability',
  availabilityLimiter,
  validate(publicAvailabilitySchema, 'query'),
  getAvailableRooms
);

// POST /api/v1/public/reservations
router.post('/reservations',
  bookingLimiter,
  validate(publicCreateReservationSchema),
  publicCreateReservation
);

// =============================================================================
// GUEST-AUTHENTICATED ROUTES — requires JWT from booking confirmation
// =============================================================================

// GET /api/v1/public/reservations/:id
router.get('/reservations/:id',
  rateLimiter,
  verifyGuestToken,
  authorizeGuestReservation,
  getReservationById
);

// PATCH /api/v1/public/reservations/:id/cancel
router.patch('/reservations/:id/cancel',
  rateLimiter,
  verifyGuestToken,
  authorizeGuestReservation,
  validate(publicCancelReservationSchema),
  publicCancelReservation
);

// GET /api/v1/public/folio/reservation/:reservationId
router.get('/folio/reservation/:reservationId',
  rateLimiter,
  verifyGuestToken,
  authorizeGuestReservation,
  getFolioByReservation
);

// GET /api/v1/public/folio/:id/summary
router.get('/folio/:id/summary',
  rateLimiter,
  verifyGuestToken,
  getFolioSummary
);

// POST /api/v1/public/folio/:id/payments
router.post('/folio/:id/payments',
  rateLimiter,
  verifyGuestToken,
  validate(publicAddPaymentSchema),
  addPayment
);

// =============================================================================
// GUEST ACCOUNT ROUTES
// =============================================================================

// POST /api/v1/public/auth/register
router.post('/auth/register',
  rateLimiter,
  validate(guestRegisterSchema),
  register
);

// POST /api/v1/public/auth/login
router.post('/auth/login',
  rateLimiter,
  validate(guestLoginSchema),
  login
);

// POST /api/v1/public/auth/refresh
router.post('/auth/refresh',
  rateLimiter,
  validate(guestRefreshSchema),
  refreshToken
);

// POST /api/v1/public/auth/forgot-password
router.post('/auth/forgot-password',
  rateLimiter,
  forgotPassword
);

// POST /api/v1/public/auth/reset-password
router.post('/auth/reset-password',
  rateLimiter,
  resetPassword
);

// GET /api/v1/public/auth/me
router.get('/auth/me',
  rateLimiter,
  verifyGuestToken,
  getMe
);

// GET /api/v1/public/auth/my-reservations
router.get('/auth/my-reservations',
  rateLimiter,
  verifyGuestToken,
  getMyReservations
);

// GET /api/v1/public/auth/my-reservations/:id
router.get('/auth/my-reservations/:id',
  rateLimiter,
  verifyGuestToken,
  getMyReservationById
);

export default router;
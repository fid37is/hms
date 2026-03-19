// src/routes/publicRoutes.js
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { resolveOrg } from '../middleware/resolveOrg.js';

import { verifyGuestToken, authorizeGuestReservation } from '../middleware/guestAuth.js';
import { rateLimiter, bookingLimiter, availabilityLimiter } from '../middleware/rateLimiter.js';

// ─── Config ───────────────────────────────────────────────────────────────────
import { getPublicConfig } from '../controllers/configController.js';

// ─── Rooms ────────────────────────────────────────────────────────────────────
import {
  getAllRoomTypes,
  getRoomTypeById,
  getRatePlans,
  getAvailableRooms,
  getAllRooms,
  getRoomById,
} from '../controllers/roomController.js';

// ─── Reservations ─────────────────────────────────────────────────────────────
import { getReservationById } from '../controllers/reservationController.js';
import {
  publicCreateReservation,
  publicCancelReservation,
  lookupReservation,
} from '../controllers/publicReservationController.js';

// ─── Folio ────────────────────────────────────────────────────────────────────
import { getFolioByReservation, getFolioSummary, addPayment } from '../controllers/folioController.js';

// ─── Guest accounts ───────────────────────────────────────────────────────────
import {
  register, login, getMyReservations, getMyReservationById,
  refreshToken, getMe, updateMe, forgotPassword, resetPassword,
} from '../controllers/guestAccountController.js';
import { guestRegisterSchema, guestLoginSchema, guestRefreshSchema } from '../validators/guestAccountValidator.js';

// ─── Chat ─────────────────────────────────────────────────────────────────────
import { getActiveDepartments } from '../controllers/departmentController.js';
import {
  startConversation,
  getMyConversations,
  getMessages,
  sendMessage,
} from '../controllers/conversationController.js';

// ─── Events ───────────────────────────────────────────────────────────────────
import { publicEnquiry } from '../controllers/eventController.js';

// ─── Validators ───────────────────────────────────────────────────────────────
import {
  publicAvailabilitySchema,
  publicCreateReservationSchema,
  publicCancelReservationSchema,
  publicAddPaymentSchema,
} from '../validators/publicValidator.js';

const router = Router();

// resolveOrg on all public routes — sets req.orgId via subdomain / API key / DEV_ORG_ID
router.use(resolveOrg);

// =============================================================================
// OPEN ROUTES — no authentication required
// =============================================================================

router.get('/config',                        rateLimiter, getPublicConfig);
router.get('/rooms',                         rateLimiter, getAllRooms);
router.get('/rooms/types',                   rateLimiter, getAllRoomTypes);
router.get('/rooms/types/:roomTypeId/rates', rateLimiter, getRatePlans);
router.get('/rooms/types/:id',               rateLimiter, getRoomTypeById);
router.get('/rooms/availability',            availabilityLimiter, validate(publicAvailabilitySchema, 'query'), getAvailableRooms);
router.get('/rooms/:id',                     rateLimiter, getRoomById);
router.post('/reservations',                 bookingLimiter, validate(publicCreateReservationSchema), publicCreateReservation);
router.post('/reservations/lookup',          rateLimiter, lookupReservation);
router.get('/chat-departments',              rateLimiter, getActiveDepartments);

// =============================================================================
// GUEST-AUTHENTICATED ROUTES — requires guest JWT
// =============================================================================

router.get('/reservations/:id',                 rateLimiter, verifyGuestToken, authorizeGuestReservation, getReservationById);
router.patch('/reservations/:id/cancel',        rateLimiter, verifyGuestToken, authorizeGuestReservation, validate(publicCancelReservationSchema), publicCancelReservation);

router.get('/folio/reservation/:reservationId', rateLimiter, verifyGuestToken, authorizeGuestReservation, getFolioByReservation);
router.get('/folio/:id/summary',                rateLimiter, verifyGuestToken, getFolioSummary);
router.post('/folio/:id/payments',              rateLimiter, verifyGuestToken, validate(publicAddPaymentSchema), addPayment);

router.post('/conversations',                   rateLimiter, verifyGuestToken, startConversation);
router.get('/conversations',                    rateLimiter, verifyGuestToken, getMyConversations);
router.get('/conversations/:id/messages',       rateLimiter, verifyGuestToken, getMessages);
router.post('/conversations/:id/messages',      rateLimiter, verifyGuestToken, sendMessage);

// =============================================================================
// GUEST ACCOUNT ROUTES
// =============================================================================

router.post('/auth/register',           rateLimiter, validate(guestRegisterSchema), register);
router.post('/auth/login',              rateLimiter, validate(guestLoginSchema), login);
router.post('/auth/refresh',            rateLimiter, validate(guestRefreshSchema), refreshToken);
router.post('/auth/forgot-password',    rateLimiter, forgotPassword);
router.post('/auth/reset-password',     rateLimiter, resetPassword);
router.get('/auth/me',                  rateLimiter, verifyGuestToken, getMe);
router.patch('/auth/me',                rateLimiter, verifyGuestToken, updateMe);
router.get('/auth/my-reservations',     rateLimiter, verifyGuestToken, getMyReservations);
router.get('/auth/my-reservations/:id', rateLimiter, verifyGuestToken, getMyReservationById);

// =============================================================================
// PUBLIC EVENT ENQUIRY
// =============================================================================
router.post('/events/enquiry', rateLimiter, publicEnquiry);

export default router;
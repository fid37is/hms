// src/routes/reservationRoutes.js

import { Router }            from 'express';
import { authenticate }      from '../middleware/auth.js';
import { validate }          from '../middleware/validate.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS }       from '../config/constants.js';
import {
  createReservationSchema,
  updateReservationSchema,
  cancelReservationSchema,
  assignRoomSchema,
} from '../validators/reservationValidator.js';
import {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  checkIn,
  checkOut,
  cancelReservation,
  assignRoom,
  getTodayArrivals,
  getTodayDepartures,
  extendStay,
  markPaymentReceived,
} from '../controllers/reservationController.js';

const router = Router();

router.use(authenticate);

// GET  /api/v1/reservations
router.get('/',
  requirePermission(PERMISSIONS.RESERVATIONS.READ),
  getAllReservations
);

// GET  /api/v1/reservations/arrivals/today
router.get('/arrivals/today',
  requirePermission(PERMISSIONS.RESERVATIONS.READ),
  getTodayArrivals
);

// GET  /api/v1/reservations/departures/today
router.get('/departures/today',
  requirePermission(PERMISSIONS.RESERVATIONS.READ),
  getTodayDepartures
);

// GET  /api/v1/reservations/:id
router.get('/:id',
  requirePermission(PERMISSIONS.RESERVATIONS.READ),
  getReservationById
);

// POST /api/v1/reservations
router.post('/',
  requirePermission(PERMISSIONS.RESERVATIONS.CREATE),
  validate(createReservationSchema),
  createReservation
);

// PATCH /api/v1/reservations/:id
router.patch('/:id',
  requirePermission(PERMISSIONS.RESERVATIONS.UPDATE),
  validate(updateReservationSchema),
  updateReservation
);

// PATCH /api/v1/reservations/:id/assign-room
router.patch('/:id/assign-room',
  requirePermission(PERMISSIONS.RESERVATIONS.UPDATE),
  validate(assignRoomSchema),
  assignRoom
);

// PATCH /api/v1/reservations/:id/check-in
router.patch('/:id/check-in',
  requirePermission(PERMISSIONS.RESERVATIONS.CHECKIN),
  checkIn
);

// PATCH /api/v1/reservations/:id/check-out
router.patch('/:id/check-out',
  requirePermission(PERMISSIONS.RESERVATIONS.CHECKOUT),
  checkOut
);

// PATCH /api/v1/reservations/:id/extend
router.patch('/:id/extend',
  requirePermission(PERMISSIONS.RESERVATIONS.UPDATE),
  extendStay
);

// PATCH /api/v1/reservations/:id/mark-paid
router.patch('/:id/mark-paid',
  requirePermission(PERMISSIONS.RESERVATIONS.UPDATE),
  markPaymentReceived
);

// PATCH /api/v1/reservations/:id/cancel
router.patch('/:id/cancel',
  requirePermission(PERMISSIONS.RESERVATIONS.UPDATE),
  validate(cancelReservationSchema),
  cancelReservation
);

export default router;
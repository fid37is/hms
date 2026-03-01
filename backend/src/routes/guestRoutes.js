// src/routes/guestRoutes.js

import { Router }            from 'express';
import { authenticate }      from '../middleware/auth.js';
import { validate }          from '../middleware/validate.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS }       from '../config/constants.js';
import {
  createGuestSchema,
  updateGuestSchema,
  flagGuestSchema,
  loyaltyPointsSchema,
} from '../validators/guestValidator.js';
import {
  getAllGuests,
  getGuestById,
  searchGuests,
  createGuest,
  updateGuest,
  deleteGuest,
  getGuestStayHistory,
  updateLoyaltyPoints,
  flagGuest,
} from '../controllers/guestController.js';

const router = Router();

router.use(authenticate);

// GET  /api/v1/guests?search=&category=&page=&limit=
router.get('/',        requirePermission(PERMISSIONS.GUESTS.READ),   getAllGuests);

// GET  /api/v1/guests/search?q=
router.get('/search',  requirePermission(PERMISSIONS.GUESTS.READ),   searchGuests);

// GET  /api/v1/guests/:id
router.get('/:id',     requirePermission(PERMISSIONS.GUESTS.READ),   getGuestById);

// GET  /api/v1/guests/:id/history
router.get('/:id/history', requirePermission(PERMISSIONS.GUESTS.READ), getGuestStayHistory);

// POST /api/v1/guests
router.post('/',       requirePermission(PERMISSIONS.GUESTS.CREATE), validate(createGuestSchema), createGuest);

// PATCH /api/v1/guests/:id
router.patch('/:id',   requirePermission(PERMISSIONS.GUESTS.UPDATE), validate(updateGuestSchema), updateGuest);

// PATCH /api/v1/guests/:id/flag
router.patch('/:id/flag', requirePermission(PERMISSIONS.GUESTS.UPDATE), validate(flagGuestSchema), flagGuest);

// PATCH /api/v1/guests/:id/loyalty
router.patch('/:id/loyalty', requirePermission(PERMISSIONS.GUESTS.UPDATE), validate(loyaltyPointsSchema), updateLoyaltyPoints);

// DELETE /api/v1/guests/:id
router.delete('/:id',  requirePermission(PERMISSIONS.GUESTS.UPDATE), deleteGuest);

export default router;
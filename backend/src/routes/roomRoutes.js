// src/routes/roomRoutes.js

import { Router }        from 'express';
import { authenticate }  from '../middleware/auth.js';
import { validate }      from '../middleware/validate.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS }   from '../config/constants.js';
import {
  createRoomTypeSchema,
  updateRoomTypeSchema,
  createRatePlanSchema,
  updateRatePlanSchema,
  createRoomSchema,
  updateRoomSchema,
  updateRoomStatusSchema,
  blockRoomSchema,
  availabilitySchema,
} from '../validators/roomValidator.js';
import multer from 'multer';
import {
  getAllRoomTypes,
  getRoomTypeById,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  getRatePlans,
  createRatePlan,
  updateRatePlan,
  deleteRatePlan,
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  updateRoomStatus,
  blockRoom,
  unblockRoom,
  deleteRoom,
  getAvailableRooms,
  uploadMedia,
  deleteMedia,
  uploadTypeMedia,
  deleteTypeMedia,
} from '../controllers/roomController.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB hard limit
});

// All room routes require authentication
router.use(authenticate);

// ─── Room Types ───────────────────────────────────────────
// GET    /api/v1/rooms/types
// GET    /api/v1/rooms/types/:id
// POST   /api/v1/rooms/types
// PATCH  /api/v1/rooms/types/:id
// DELETE /api/v1/rooms/types/:id

router.get('/types',     requirePermission(PERMISSIONS.ROOMS.READ),   getAllRoomTypes);
router.get('/types/:id', requirePermission(PERMISSIONS.ROOMS.READ),   getRoomTypeById);
router.post('/types',    requirePermission(PERMISSIONS.ROOMS.UPDATE),  validate(createRoomTypeSchema), createRoomType);
router.patch('/types/:id', requirePermission(PERMISSIONS.ROOMS.UPDATE), validate(updateRoomTypeSchema), updateRoomType);
router.delete('/types/:id', requirePermission(PERMISSIONS.ROOMS.UPDATE), deleteRoomType);
router.post('/types/:id/media',   requirePermission(PERMISSIONS.ROOMS.UPDATE), upload.single('file'), uploadTypeMedia);
router.delete('/types/:id/media', requirePermission(PERMISSIONS.ROOMS.UPDATE), deleteTypeMedia);

// ─── Rate Plans ───────────────────────────────────────────
// GET    /api/v1/rooms/types/:roomTypeId/rates
// POST   /api/v1/rooms/rates
// PATCH  /api/v1/rooms/rates/:id
// DELETE /api/v1/rooms/rates/:id

router.get('/types/:roomTypeId/rates', requirePermission(PERMISSIONS.ROOMS.READ),   getRatePlans);
router.post('/rates',                  requirePermission(PERMISSIONS.ROOMS.UPDATE),  validate(createRatePlanSchema), createRatePlan);
router.patch('/rates/:id',             requirePermission(PERMISSIONS.ROOMS.UPDATE),  validate(updateRatePlanSchema), updateRatePlan);
router.delete('/rates/:id',            requirePermission(PERMISSIONS.ROOMS.UPDATE),  deleteRatePlan);

// ─── Availability ─────────────────────────────────────────
// GET /api/v1/rooms/availability?check_in=&check_out=&type_id=

router.get('/availability', requirePermission(PERMISSIONS.ROOMS.READ), getAvailableRooms);

// ─── Rooms ────────────────────────────────────────────────
// GET    /api/v1/rooms
// GET    /api/v1/rooms/:id
// POST   /api/v1/rooms
// PATCH  /api/v1/rooms/:id
// PATCH  /api/v1/rooms/:id/status
// PATCH  /api/v1/rooms/:id/block
// PATCH  /api/v1/rooms/:id/unblock
// DELETE /api/v1/rooms/:id

router.get('/',    requirePermission(PERMISSIONS.ROOMS.READ),   getAllRooms);
router.get('/:id', requirePermission(PERMISSIONS.ROOMS.READ),   getRoomById);
router.post('/',   requirePermission(PERMISSIONS.ROOMS.UPDATE),  validate(createRoomSchema), createRoom);
router.patch('/:id',          requirePermission(PERMISSIONS.ROOMS.UPDATE),  validate(updateRoomSchema),       updateRoom);
router.patch('/:id/status',   requirePermission(PERMISSIONS.ROOMS.STATUS),  validate(updateRoomStatusSchema), updateRoomStatus);
router.patch('/:id/block',    requirePermission(PERMISSIONS.ROOMS.UPDATE),  validate(blockRoomSchema),        blockRoom);
router.patch('/:id/unblock',  requirePermission(PERMISSIONS.ROOMS.UPDATE),  unblockRoom);
router.delete('/:id',         requirePermission(PERMISSIONS.ROOMS.UPDATE),  deleteRoom);
router.post('/:id/media',     requirePermission(PERMISSIONS.ROOMS.UPDATE),  upload.single('file'), uploadMedia);
router.delete('/:id/media',   requirePermission(PERMISSIONS.ROOMS.UPDATE),  deleteMedia);

export default router;  
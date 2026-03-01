// src/routes/housekeepingRoutes.js

import { Router }            from 'express';
import { authenticate }      from '../middleware/auth.js';
import { validate }          from '../middleware/validate.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS }       from '../config/constants.js';
import {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  completeTaskSchema,
  createLostAndFoundSchema,
  updateLostAndFoundSchema,
  markReturnedSchema,
} from '../validators/housekeepingValidator.js';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  startTask,
  completeTask,
  inspectTask,
  assignTask,
  deleteTask,
  getPendingByRoom,
  getAllLostAndFound,
  getLostAndFoundById,
  createLostAndFoundItem,
  updateLostAndFoundItem,
  markReturned,
} from '../controllers/housekeepingController.js';

const router = Router();
router.use(authenticate);

// ─── Housekeeping Tasks ───────────────────────────────────
// GET    /api/v1/housekeeping/tasks
// GET    /api/v1/housekeeping/tasks/:id
// GET    /api/v1/housekeeping/tasks/room/:roomId
// POST   /api/v1/housekeeping/tasks
// PATCH  /api/v1/housekeeping/tasks/:id
// PATCH  /api/v1/housekeeping/tasks/:id/assign
// PATCH  /api/v1/housekeeping/tasks/:id/start
// PATCH  /api/v1/housekeeping/tasks/:id/complete
// PATCH  /api/v1/housekeeping/tasks/:id/inspect
// DELETE /api/v1/housekeeping/tasks/:id

router.get('/tasks',
  requirePermission(PERMISSIONS.HOUSEKEEPING.READ), getAllTasks);

router.get('/tasks/room/:roomId',
  requirePermission(PERMISSIONS.HOUSEKEEPING.READ), getPendingByRoom);

router.get('/tasks/:id',
  requirePermission(PERMISSIONS.HOUSEKEEPING.READ), getTaskById);

router.post('/tasks',
  requirePermission(PERMISSIONS.HOUSEKEEPING.UPDATE),
  validate(createTaskSchema), createTask);

router.patch('/tasks/:id',
  requirePermission(PERMISSIONS.HOUSEKEEPING.UPDATE),
  validate(updateTaskSchema), updateTask);

router.patch('/tasks/:id/assign',
  requirePermission(PERMISSIONS.HOUSEKEEPING.UPDATE),
  validate(assignTaskSchema), assignTask);

router.patch('/tasks/:id/start',
  requirePermission(PERMISSIONS.HOUSEKEEPING.UPDATE), startTask);

router.patch('/tasks/:id/complete',
  requirePermission(PERMISSIONS.HOUSEKEEPING.UPDATE),
  validate(completeTaskSchema), completeTask);

router.patch('/tasks/:id/inspect',
  requirePermission(PERMISSIONS.HOUSEKEEPING.UPDATE),
  validate(completeTaskSchema), inspectTask);

router.delete('/tasks/:id',
  requirePermission(PERMISSIONS.HOUSEKEEPING.UPDATE), deleteTask);

// ─── Lost & Found ─────────────────────────────────────────
// GET    /api/v1/housekeeping/lost-and-found
// GET    /api/v1/housekeeping/lost-and-found/:id
// POST   /api/v1/housekeeping/lost-and-found
// PATCH  /api/v1/housekeeping/lost-and-found/:id
// PATCH  /api/v1/housekeeping/lost-and-found/:id/returned

router.get('/lost-and-found',
  requirePermission(PERMISSIONS.HOUSEKEEPING.READ), getAllLostAndFound);

router.get('/lost-and-found/:id',
  requirePermission(PERMISSIONS.HOUSEKEEPING.READ), getLostAndFoundById);

router.post('/lost-and-found',
  requirePermission(PERMISSIONS.HOUSEKEEPING.UPDATE),
  validate(createLostAndFoundSchema), createLostAndFoundItem);

router.patch('/lost-and-found/:id',
  requirePermission(PERMISSIONS.HOUSEKEEPING.UPDATE),
  validate(updateLostAndFoundSchema), updateLostAndFoundItem);

router.patch('/lost-and-found/:id/returned',
  requirePermission(PERMISSIONS.HOUSEKEEPING.UPDATE),
  validate(markReturnedSchema), markReturned);

export default router;
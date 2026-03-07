// src/routes/departmentRoutes.js
// HMS staff routes — manage departments
import { Router } from 'express';
import { authenticate }      from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS }       from '../config/constants.js';
import {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';

const router = Router();
router.use(authenticate);

router.get('/',         getAllDepartments);
router.post('/',        requirePermission(PERMISSIONS.CONFIG.UPDATE), createDepartment);
router.patch('/:id',    requirePermission(PERMISSIONS.CONFIG.UPDATE), updateDepartment);
router.delete('/:id',   requirePermission(PERMISSIONS.CONFIG.UPDATE), deleteDepartment);

export default router;
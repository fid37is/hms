// src/routes/chatDepartmentRoutes.js
// Chat departments — readable by all authenticated staff, managed by admin/staff:update

import { Router }            from 'express';
import { authenticate }      from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS }       from '../config/constants.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import * as departmentService from '../services/departmentService.js';

const router = Router();
router.use(authenticate);

// Any authenticated staff can list departments (needed for chat routing)
router.get('/', async (req, res, next) => {
  try {
    const data = await departmentService.getAllDepartments(false);
    return sendSuccess(res, data, 'Departments retrieved.');
  } catch (err) { next(err); }
});

router.post('/',
  requirePermission(PERMISSIONS.STAFF.UPDATE),
  async (req, res, next) => {
    try {
      const data = await departmentService.createDepartment(req.body);
      return sendCreated(res, data, 'Department created.');
    } catch (err) { next(err); }
  }
);

router.patch('/:id',
  requirePermission(PERMISSIONS.STAFF.UPDATE),
  async (req, res, next) => {
    try {
      const data = await departmentService.updateDepartment(req.params.id, req.body);
      return sendSuccess(res, data, 'Department updated.');
    } catch (err) { next(err); }
  }
);

router.delete('/:id',
  requirePermission(PERMISSIONS.STAFF.UPDATE),
  async (req, res, next) => {
    try {
      await departmentService.deleteDepartment(req.params.id);
      return sendSuccess(res, null, 'Department deleted.');
    } catch (err) { next(err); }
  }
);

export default router;
// src/routes/folioRoutes.js

import { Router }            from 'express';
import { authenticate }      from '../middleware/auth.js';
import { validate }          from '../middleware/validate.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS }       from '../config/constants.js';
import {
  addChargeSchema,
  voidChargeSchema,
  addPaymentSchema,
  refundPaymentSchema,
  openShiftSchema,
  closeShiftSchema,
} from '../validators/paymentValidator.js';
import {
  getFolioByReservation,
  getFolioById,
  getFolioSummary,
  addCharge,
  voidCharge,
  addPayment,
  refundPayment,
  openShift,
  closeShift,
} from '../controllers/folioController.js';

const router = Router();

router.use(authenticate);

// GET  /api/v1/folio/reservation/:reservationId
router.get('/reservation/:reservationId',
  requirePermission(PERMISSIONS.BILLING.READ),
  getFolioByReservation
);

// GET  /api/v1/folio/:id
router.get('/:id',
  requirePermission(PERMISSIONS.BILLING.READ),
  getFolioById
);

// GET  /api/v1/folio/:id/summary
router.get('/:id/summary',
  requirePermission(PERMISSIONS.BILLING.READ),
  getFolioSummary
);

// POST /api/v1/folio/:id/charges
router.post('/:id/charges',
  requirePermission(PERMISSIONS.BILLING.CHARGE),
  validate(addChargeSchema),
  addCharge
);

// PATCH /api/v1/folio/:id/charges/:itemId/void
router.patch('/:id/charges/:itemId/void',
  requirePermission(PERMISSIONS.BILLING.VOID),
  validate(voidChargeSchema),
  voidCharge
);

// POST /api/v1/folio/:id/payments
router.post('/:id/payments',
  requirePermission(PERMISSIONS.BILLING.PAYMENT),
  validate(addPaymentSchema),
  addPayment
);

// PATCH /api/v1/folio/:id/payments/:paymentId/refund
router.patch('/:id/payments/:paymentId/refund',
  requirePermission(PERMISSIONS.BILLING.VOID),
  validate(refundPaymentSchema),
  refundPayment
);

// POST /api/v1/folio/shift/open
router.post('/shift/open',
  requirePermission(PERMISSIONS.BILLING.PAYMENT),
  validate(openShiftSchema),
  openShift
);

// POST /api/v1/folio/shift/close
router.post('/shift/close',
  requirePermission(PERMISSIONS.BILLING.PAYMENT),
  validate(closeShiftSchema),
  closeShift
);

export default router;
// src/routes/subscriptionRoutes.js

import { Router }       from 'express';
import express          from 'express';
import { authenticate } from '../middleware/auth.js';
import * as ctrl        from '../controllers/subscriptionController.js';

const router = Router();

// Dodo webhook — raw body required for signature verification
// Must be mounted BEFORE express.json() middleware in app.js
router.post(
  '/webhook/dodo',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.rawBody = req.body.toString('utf8');
    next();
  },
  ctrl.dodoWebhook
);

// Authenticated tenant routes
router.use(authenticate);

router.get('/plan',          ctrl.getPlan);
router.get('/plans',         ctrl.getAllPlans);
router.get('/my',            ctrl.getMySubscription);
router.post('/initialize',   ctrl.initializePayment);
router.get('/verify',        ctrl.verifyPayment);
router.post('/cancel',       ctrl.cancelSubscription);
router.get('/portal',        ctrl.getCustomerPortal);
router.get('/payments',      ctrl.getPaymentHistory);

export default router;
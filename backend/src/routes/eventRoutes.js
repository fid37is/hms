// src/routes/eventRoutes.js

import { Router }       from 'express';
import { authenticate } from '../middleware/auth.js';
import * as ctrl        from '../controllers/eventController.js';

const router = Router();
router.use(authenticate);

// Venues
router.get   ('/venues',                      ctrl.getAllVenues);
router.post  ('/venues',                      ctrl.createVenue);
router.get   ('/venues/:id',                  ctrl.getVenueById);
router.patch ('/venues/:id',                  ctrl.updateVenue);
router.delete('/venues/:id',                  ctrl.deleteVenue);
router.get   ('/venues/:id/availability',     ctrl.checkVenueAvailability);

// Events
router.get   ('/',                            ctrl.getAllEvents);
router.post  ('/',                            ctrl.createEvent);
router.get   ('/upcoming',                    ctrl.getUpcomingEvents);
router.get   ('/:id',                         ctrl.getEventById);
router.patch ('/:id',                         ctrl.updateEvent);
router.post  ('/:id/cancel',                  ctrl.cancelEvent);

// Services
router.post  ('/:id/services',                ctrl.addService);
router.patch ('/:id/services/:serviceId',     ctrl.updateService);
router.delete('/:id/services/:serviceId',     ctrl.voidService);

// Payments
router.post  ('/:id/payments',                ctrl.addPayment);

// Staff
router.post  ('/:id/staff',                   ctrl.assignStaff);
router.delete('/:id/staff/:assignmentId',     ctrl.removeStaff);

export default router;
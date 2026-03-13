// src/controllers/eventController.js

import * as eventService from '../services/eventService.js';
import * as hsService    from '../services/housekeepingService.js';
import { notify }        from '../services/notificationService.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response.js';

const today = () => new Date().toISOString().split('T')[0];

// ── Venues ────────────────────────────────────────────────────────────────────

export const getAllVenues = async (req, res, next) => {
  try {
    const data = await eventService.getAllVenues(req.orgId);
    return sendSuccess(res, data);
  } catch (e) { next(e); }
};

export const getVenueById = async (req, res, next) => {
  try {
    const data = await eventService.getVenueById(req.orgId, req.params.id);
    return sendSuccess(res, data);
  } catch (e) { next(e); }
};

export const createVenue = async (req, res, next) => {
  try {
    const data = await eventService.createVenue(req.orgId, req.body);
    return sendCreated(res, data, 'Venue created.');
  } catch (e) { next(e); }
};

export const updateVenue = async (req, res, next) => {
  try {
    const data = await eventService.updateVenue(req.orgId, req.params.id, req.body);
    return sendSuccess(res, data, 'Venue updated.');
  } catch (e) { next(e); }
};

export const deleteVenue = async (req, res, next) => {
  try {
    await eventService.deleteVenue(req.orgId, req.params.id);
    return sendSuccess(res, null, 'Venue deleted.');
  } catch (e) { next(e); }
};

export const checkVenueAvailability = async (req, res, next) => {
  try {
    const { date, start_time, end_time, exclude } = req.query;
    const result = await eventService.checkVenueAvailability(
      req.orgId, req.params.id, date, start_time, end_time, exclude
    );
    return sendSuccess(res, result);
  } catch (e) { next(e); }
};

// ── Events ────────────────────────────────────────────────────────────────────

export const getAllEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, ...filters } = req.query;
    const { data, total } = await eventService.getAllEvents(req.orgId, filters, +page, +limit);
    return sendPaginated(res, data, total, page, limit);
  } catch (e) { next(e); }
};

export const getEventById = async (req, res, next) => {
  try {
    const data = await eventService.getEventById(req.orgId, req.params.id);
    return sendSuccess(res, data);
  } catch (e) { next(e); }
};

export const createEvent = async (req, res, next) => {
  try {
    const data = await eventService.createEvent(req.orgId, req.body, req.user.sub);

    notify(req.app, {
      orgId:  req.orgId,
      type:   'reservation',
      title:  'New Event Enquiry',
      body:   `${data.title} — ${data.client_name} · ${data.event_date}`,
      link:   `/events/${data.id}`,
    });

    return sendCreated(res, data, 'Event created.');
  } catch (e) { next(e); }
};

export const updateEvent = async (req, res, next) => {
  try {
    const data = await eventService.updateEvent(req.orgId, req.params.id, req.body);

    // When confirmed → create a venue setup housekeeping task
    if (req.body.status === 'confirmed') {
      notify(req.app, {
        orgId:  req.orgId,
        type:   'reservation',
        title:  'Event Confirmed',
        body:   `${data.title} confirmed for ${data.event_date}`,
        link:   `/events/${data.id}`,
      });
    }

    return sendSuccess(res, data, 'Event updated.');
  } catch (e) { next(e); }
};

export const cancelEvent = async (req, res, next) => {
  try {
    const data = await eventService.cancelEvent(req.orgId, req.params.id, req.body.reason);

    notify(req.app, {
      orgId:  req.orgId,
      type:   'reservation',
      title:  'Event Cancelled',
      body:   `${data.title} (${data.event_date}) has been cancelled`,
      link:   `/events`,
    });

    return sendSuccess(res, data, 'Event cancelled.');
  } catch (e) { next(e); }
};

export const getUpcomingEvents = async (req, res, next) => {
  try {
    const data = await eventService.getUpcomingEvents(req.orgId, +(req.query.days || 30));
    return sendSuccess(res, data);
  } catch (e) { next(e); }
};

// ── Services ──────────────────────────────────────────────────────────────────

export const addService = async (req, res, next) => {
  try {
    const data = await eventService.addService(req.orgId, req.params.id, req.body, req.user.sub);
    return sendCreated(res, data, 'Service added.');
  } catch (e) { next(e); }
};

export const updateService = async (req, res, next) => {
  try {
    const data = await eventService.updateService(req.orgId, req.params.id, req.params.serviceId, req.body);
    return sendSuccess(res, data, 'Service updated.');
  } catch (e) { next(e); }
};

export const voidService = async (req, res, next) => {
  try {
    await eventService.voidService(req.orgId, req.params.id, req.params.serviceId);
    return sendSuccess(res, null, 'Service voided.');
  } catch (e) { next(e); }
};

// ── Payments ──────────────────────────────────────────────────────────────────

export const addPayment = async (req, res, next) => {
  try {
    const data = await eventService.addPayment(req.orgId, req.params.id, req.body, req.user.sub);
    return sendCreated(res, data, 'Payment recorded.');
  } catch (e) { next(e); }
};

// ── Staff ─────────────────────────────────────────────────────────────────────

export const assignStaff = async (req, res, next) => {
  try {
    const { staff_id, role, notes } = req.body;
    const data = await eventService.assignStaff(req.orgId, req.params.id, staff_id, role, notes, req.user.sub);
    return sendCreated(res, data, 'Staff assigned.');
  } catch (e) { next(e); }
};

export const removeStaff = async (req, res, next) => {
  try {
    await eventService.removeStaff(req.orgId, req.params.id, req.params.assignmentId);
    return sendSuccess(res, null, 'Staff removed.');
  } catch (e) { next(e); }
};

// ── Public enquiry ────────────────────────────────────────────────────────────

export const publicEnquiry = async (req, res, next) => {
  try {
    const data = await eventService.createPublicEnquiry(req.orgId, req.body);
    return sendCreated(res, data, 'Your enquiry has been submitted. We will contact you shortly.');
  } catch (e) { next(e); }
};
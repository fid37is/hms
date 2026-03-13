// src/services/eventService.js

import { supabase }  from '../config/supabase.js';
import { AppError }  from '../middleware/errorHandler.js';

const BASE_SELECT = `
  *,
  event_venues!venue_id(id, name, floor),
  guests!guest_id(id, full_name, email, phone),
  users!coordinator_id(id, full_name),
  users!created_by(id, full_name),
  event_services(id, category, description, quantity, unit_price, amount, is_voided, notes),
  event_payments(id, payment_no, amount, method, is_deposit, reference, received_at),
  event_staff(id, role, notes, staff(id, full_name, job_title))
`;

// ── Recalculate event totals ─────────────────────────────────────────────────
const recalcTotals = async (orgId, eventId) => {
  const { data: services } = await supabase
    .from('event_services')
    .select('amount')
    .eq('org_id', orgId)
    .eq('event_id', eventId)
    .eq('is_voided', false);

  const { data: payments } = await supabase
    .from('event_payments')
    .select('amount, is_deposit')
    .eq('org_id', orgId)
    .eq('event_id', eventId);

  const { data: event } = await supabase
    .from('events').select('discount, tax_amount').eq('id', eventId).single();

  const subtotal     = (services || []).reduce((s, i) => s + (i.amount || 0), 0);
  const discount     = event?.discount || 0;
  const taxAmount    = event?.tax_amount || 0;
  const total        = Math.max(0, subtotal - discount + taxAmount);
  const depositPaid  = (payments || []).filter(p => p.is_deposit).reduce((s, p) => s + (p.amount || 0), 0);
  const totalPaid    = (payments || []).reduce((s, p) => s + (p.amount || 0), 0);
  const balance      = Math.max(0, total - totalPaid);

  await supabase.from('events').update({
    subtotal,
    total_amount: total,
    deposit_paid: depositPaid,
    balance_due:  balance,
    updated_at:   new Date().toISOString(),
  }).eq('id', eventId);
};

// ── Venues ───────────────────────────────────────────────────────────────────

export const getAllVenues = async (orgId) => {
  const { data, error } = await supabase
    .from('event_venues')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .order('name');
  if (error) throw new AppError(error.message, 500);
  return data || [];
};

export const getVenueById = async (orgId, id) => {
  const { data, error } = await supabase
    .from('event_venues').select('*')
    .eq('org_id', orgId).eq('id', id).eq('is_deleted', false).single();
  if (error || !data) throw new AppError('Venue not found.', 404);
  return data;
};

export const createVenue = async (orgId, payload) => {
  const { data, error } = await supabase
    .from('event_venues').insert({ org_id: orgId, ...payload }).select().single();
  if (error) throw new AppError(`Failed to create venue: ${error.message}`, 500);
  return data;
};

export const updateVenue = async (orgId, id, payload) => {
  await getVenueById(orgId, id);
  const { data, error } = await supabase
    .from('event_venues').update(payload).eq('org_id', orgId).eq('id', id).select().single();
  if (error) throw new AppError(`Failed to update venue: ${error.message}`, 500);
  return data;
};

export const deleteVenue = async (orgId, id) => {
  await getVenueById(orgId, id);
  await supabase.from('event_venues').update({ is_deleted: true }).eq('org_id', orgId).eq('id', id);
};

// Check venue availability for a given date/time
export const checkVenueAvailability = async (orgId, venueId, date, startTime, endTime, excludeEventId = null) => {
  let query = supabase
    .from('events')
    .select('id, event_no, title, start_time, end_time, status')
    .eq('org_id', orgId)
    .eq('venue_id', venueId)
    .eq('event_date', date)
    .not('status', 'in', '("cancelled")');

  if (excludeEventId) query = query.neq('id', excludeEventId);
  const { data } = await query;

  const conflicts = (data || []).filter(e => {
    const eStart = e.start_time;
    const eEnd   = e.end_time;
    return !(endTime <= eStart || startTime >= eEnd);
  });

  return { available: conflicts.length === 0, conflicts };
};

// ── Events ───────────────────────────────────────────────────────────────────

export const getAllEvents = async (orgId, filters = {}, page = 1, limit = 20) => {
  const { status, event_type, venue_id, date_from, date_to, search } = filters;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('events')
    .select(`*, event_venues!venue_id(id, name), users!coordinator_id(id, full_name)`, { count: 'exact' })
    .eq('org_id', orgId)
    .order('event_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status)     query = query.eq('status', status);
  if (event_type) query = query.eq('event_type', event_type);
  if (venue_id)   query = query.eq('venue_id', venue_id);
  if (date_from)  query = query.gte('event_date', date_from);
  if (date_to)    query = query.lte('event_date', date_to);
  if (search)     query = query.or(`title.ilike.%${search}%,client_name.ilike.%${search}%,event_no.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) throw new AppError(error.message, 500);
  return { data: data || [], total: count || 0 };
};

export const getEventById = async (orgId, id) => {
  const { data, error } = await supabase
    .from('events').select(BASE_SELECT)
    .eq('org_id', orgId).eq('id', id).single();
  if (error || !data) throw new AppError('Event not found.', 404);
  return data;
};

export const createEvent = async (orgId, payload, createdBy) => {
  const {
    client_name, client_email, client_phone, guest_id,
    title, event_type, venue_id, event_date, start_time, end_time, guest_count, layout,
    source, special_requests, internal_notes, catering_notes, setup_notes,
    coordinator_id, deposit_due, discount,
  } = payload;

  // Check venue availability
  if (venue_id) {
    const avail = await checkVenueAvailability(orgId, venue_id, event_date, start_time, end_time);
    if (!avail.available) {
      throw new AppError(`Venue is already booked during that time: ${avail.conflicts.map(c => c.title).join(', ')}`, 409);
    }
  }

  const { data, error } = await supabase
    .from('events').insert({
      org_id: orgId,
      client_name, client_email, client_phone, guest_id: guest_id || null,
      title, event_type: event_type || 'other', venue_id: venue_id || null,
      event_date, start_time, end_time,
      guest_count: guest_count || 0, layout: layout || 'banquet',
      status: 'enquiry', source: source || 'direct',
      special_requests, internal_notes, catering_notes, setup_notes,
      coordinator_id: coordinator_id || null,
      deposit_due: deposit_due || 0, discount: discount || 0,
      created_by: createdBy,
    }).select().single();

  if (error) throw new AppError(`Failed to create event: ${error.message}`, 500);
  return data;
};

export const updateEvent = async (orgId, id, payload) => {
  const existing = await getEventById(orgId, id);
  if (['completed', 'cancelled'].includes(existing.status) && payload.status !== existing.status) {
    // Allow only status change on completed/cancelled
  }

  // If changing venue/date/time, re-check availability
  if (payload.venue_id || payload.event_date || payload.start_time || payload.end_time) {
    const venueId   = payload.venue_id   || existing.venue_id;
    const date      = payload.event_date || existing.event_date;
    const startTime = payload.start_time || existing.start_time;
    const endTime   = payload.end_time   || existing.end_time;
    if (venueId) {
      const avail = await checkVenueAvailability(orgId, venueId, date, startTime, endTime, id);
      if (!avail.available) {
        throw new AppError(`Venue conflict: ${avail.conflicts.map(c => c.title).join(', ')}`, 409);
      }
    }
  }

  // Handle status transitions
  const updates = { ...payload };
  if (payload.status === 'confirmed' && existing.status === 'enquiry') {
    updates.confirmed_at = new Date().toISOString();
  }
  if (payload.status === 'cancelled') {
    updates.cancelled_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('events').update(updates).eq('org_id', orgId).eq('id', id).select().single();
  if (error) throw new AppError(`Failed to update event: ${error.message}`, 500);

  if (payload.discount !== undefined || payload.tax_amount !== undefined) {
    await recalcTotals(orgId, id);
  }

  return data;
};

export const cancelEvent = async (orgId, id, reason) => {
  const event = await getEventById(orgId, id);
  if (event.status === 'cancelled') throw new AppError('Event already cancelled.', 409);
  if (event.status === 'completed') throw new AppError('Cannot cancel a completed event.', 409);

  const { data, error } = await supabase
    .from('events').update({
      status: 'cancelled', cancel_reason: reason,
      cancelled_at: new Date().toISOString(),
    }).eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError(error.message, 500);
  return data;
};

// ── Event Services ────────────────────────────────────────────────────────────

export const addService = async (orgId, eventId, payload, addedBy) => {
  const event = await getEventById(orgId, eventId);
  if (event.status === 'cancelled') throw new AppError('Cannot add services to a cancelled event.', 409);

  const { category, description, quantity, unit_price, notes } = payload;
  const amount = (quantity || 1) * (unit_price || 0);

  const { data, error } = await supabase
    .from('event_services').insert({
      org_id: orgId, event_id: eventId,
      category: category || 'other', description,
      quantity: quantity || 1, unit_price: unit_price || 0, amount,
      notes, added_by: addedBy,
    }).select().single();

  if (error) throw new AppError(`Failed to add service: ${error.message}`, 500);
  await recalcTotals(orgId, eventId);
  return data;
};

export const updateService = async (orgId, eventId, serviceId, payload) => {
  const { data, error } = await supabase
    .from('event_services').update({
      ...payload,
      amount: (payload.quantity || 1) * (payload.unit_price || 0),
    }).eq('org_id', orgId).eq('id', serviceId).select().single();
  if (error) throw new AppError(error.message, 500);
  await recalcTotals(orgId, eventId);
  return data;
};

export const voidService = async (orgId, eventId, serviceId) => {
  const { error } = await supabase
    .from('event_services').update({ is_voided: true })
    .eq('org_id', orgId).eq('id', serviceId);
  if (error) throw new AppError(error.message, 500);
  await recalcTotals(orgId, eventId);
};

// ── Event Payments ────────────────────────────────────────────────────────────

export const addPayment = async (orgId, eventId, payload, receivedBy) => {
  const event = await getEventById(orgId, eventId);
  if (event.status === 'cancelled') throw new AppError('Cannot add payment to a cancelled event.', 409);

  const { amount, method, is_deposit, reference, notes } = payload;

  const { data, error } = await supabase
    .from('event_payments').insert({
      org_id: orgId, event_id: eventId,
      amount, method: method || 'cash',
      is_deposit: is_deposit || false,
      reference, notes, received_by: receivedBy,
    }).select().single();

  if (error) throw new AppError(`Failed to record payment: ${error.message}`, 500);

  // Auto-advance status if deposit paid
  if (is_deposit && event.status === 'confirmed') {
    await supabase.from('events').update({ status: 'deposit_paid' }).eq('id', eventId);
  }

  await recalcTotals(orgId, eventId);
  return data;
};

// ── Event Staff ───────────────────────────────────────────────────────────────

export const assignStaff = async (orgId, eventId, staffId, role, notes, assignedBy) => {
  const { data, error } = await supabase
    .from('event_staff').insert({
      org_id: orgId, event_id: eventId, staff_id: staffId,
      role, notes, assigned_by: assignedBy,
    }).select().single();
  if (error) throw new AppError(`Failed to assign staff: ${error.message}`, 500);
  return data;
};

export const removeStaff = async (orgId, eventId, assignmentId) => {
  const { error } = await supabase
    .from('event_staff').delete()
    .eq('org_id', orgId).eq('id', assignmentId).eq('event_id', eventId);
  if (error) throw new AppError(error.message, 500);
};

// ── Public enquiry (no auth) ──────────────────────────────────────────────────

export const createPublicEnquiry = async (orgId, payload) => {
  const {
    client_name, client_email, client_phone,
    title, event_type, event_date, start_time, end_time,
    guest_count, special_requests,
  } = payload;

  if (!client_name || !event_date || !start_time || !end_time) {
    throw new AppError('Missing required fields.', 422);
  }

  const { data, error } = await supabase
    .from('events').insert({
      org_id: orgId,
      client_name, client_email, client_phone,
      title: title || `${event_type || 'Event'} Enquiry`,
      event_type: event_type || 'other',
      event_date, start_time, end_time,
      guest_count: guest_count || 0,
      special_requests,
      status: 'enquiry', source: 'website',
    }).select().single();

  if (error) throw new AppError(`Failed to submit enquiry: ${error.message}`, 500);
  return data;
};

// ── Calendar / upcoming ───────────────────────────────────────────────────────

export const getUpcomingEvents = async (orgId, days = 30) => {
  const from = new Date().toISOString().split('T')[0];
  const to   = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('events')
    .select('id, event_no, title, event_type, event_date, start_time, end_time, status, client_name, guest_count, event_venues!venue_id(name)')
    .eq('org_id', orgId)
    .gte('event_date', from)
    .lte('event_date', to)
    .not('status', 'eq', 'cancelled')
    .order('event_date');

  if (error) throw new AppError(error.message, 500);
  return data || [];
};
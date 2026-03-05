// src/services/reservationService.js

import { supabase }             from '../config/supabase.js';
import { AppError }             from '../middleware/errorHandler.js';
import { RESERVATION_STATUS, ROOM_STATUS } from '../config/constants.js';

const getNightCount = (checkIn, checkOut) =>
  Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));

const checkRoomAvailability = async (orgId, roomId, checkIn, checkOut, excludeId = null) => {
  let q = supabase
    .from('reservations')
    .select('id')
    .eq('org_id', orgId)
    .eq('room_id', roomId)
    .in('status', [RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.CHECKED_IN])
    .lt('check_in_date', checkOut)
    .gt('check_out_date', checkIn);

  if (excludeId) q = q.neq('id', excludeId);
  const { data } = await q;
  return !data || data.length === 0;
};

export const getAllReservations = async (orgId, filters = {}, page = 1, limit = 20) => {
  const from = (page - 1) * limit;

  let q = supabase
    .from('reservations')
    .select(`id, reservation_no, check_in_date, check_out_date, actual_check_in, actual_check_out,
      status, booking_source, rate_per_night, total_amount, deposit_amount, deposit_paid,
      adults, children, special_requests, created_at,
      guests!guest_id ( id, full_name, email, phone, category ),
      rooms!room_id ( id, number, floor, room_types ( id, name ) )`,
      { count: 'exact' })
    .eq('org_id', orgId)
    .order('check_in_date', { ascending: false });

  if (filters.status)           q = q.eq('status', filters.status);
  if (filters.guest_id)         q = q.eq('guest_id', filters.guest_id);
  if (filters.room_id)          q = q.eq('room_id', filters.room_id);
  if (filters.date_from)        q = q.gte('check_in_date', filters.date_from);
  if (filters.date_to)          q = q.lte('check_in_date', filters.date_to);

  if (filters.arrivals_today) {
    const today = new Date().toISOString().split('T')[0];
    q = q.eq('check_in_date', today).eq('status', RESERVATION_STATUS.CONFIRMED);
  }
  if (filters.departures_today) {
    const today = new Date().toISOString().split('T')[0];
    q = q.eq('check_out_date', today).eq('status', RESERVATION_STATUS.CHECKED_IN);
  }

  const { data, error, count } = await q.range(from, from + limit - 1);
  if (error) throw new AppError(`Failed to fetch reservations: ${error.message}`, 500);
  return { data, total: count };
};

export const getReservationById = async (orgId, id) => {
  const { data, error } = await supabase
    .from('reservations')
    .select(`id, reservation_no, check_in_date, check_out_date, actual_check_in, actual_check_out,
      status, booking_source, rate_per_night, total_amount, deposit_amount, deposit_paid,
      adults, children, special_requests, notes, cancel_reason, cancelled_at, created_at, updated_at,
      guests!guest_id ( id, full_name, email, phone, nationality, id_type, id_number, category, loyalty_points ),
      rooms!room_id ( id, number, floor, room_types ( id, name, base_rate, amenities ) )`)
    .eq('org_id', orgId)
    .eq('id', id)
    .single();

  if (error || !data) throw new AppError('Reservation not found.', 404);
  return data;
};

export const createReservation = async (orgId, payload, createdBy) => {
  const { guest_id, room_id, check_in_date, check_out_date,
          adults, children, booking_source, rate_per_night, deposit_amount,
          special_requests, notes } = payload;

  const { data: guest } = await supabase
    .from('guests').select('id, category').eq('org_id', orgId).eq('id', guest_id).single();

  if (!guest) throw new AppError('Guest not found.', 404);
  if (guest.category === 'blacklisted') throw new AppError('Guest is blacklisted.', 403);

  if (room_id) {
    const { data: dup } = await supabase
      .from('reservations')
      .select('id, reservation_no')
      .eq('org_id', orgId)
      .eq('guest_id', guest_id)
      .eq('room_id', room_id)
      .in('status', ['confirmed', 'checked_in'])
      .lt('check_in_date', check_out_date)
      .gt('check_out_date', check_in_date)
      .limit(1);

    if (dup?.length > 0) throw new AppError(`Reservation already exists: ${dup[0].reservation_no}`, 409);
  }

  let resolvedRoomTypeId = payload.room_type_id || null;

  if (room_id) {
    const { data: room } = await supabase
      .from('rooms').select('id, type_id, is_blocked')
      .eq('org_id', orgId).eq('id', room_id).single();

    if (!room) throw new AppError('Room not found.', 404);
    if (room.is_blocked) throw new AppError('Room is blocked.', 409);
    resolvedRoomTypeId = room.type_id;

    const available = await checkRoomAvailability(orgId, room_id, check_in_date, check_out_date);
    if (!available) throw new AppError('Room not available for selected dates.', 409);
  }

  const nights = getNightCount(check_in_date, check_out_date);

  const { data, error } = await supabase
    .from('reservations')
    .insert({
      org_id:          orgId,
      guest_id,
      room_id:         room_id || null,
      room_type_id:    resolvedRoomTypeId,
      check_in_date,
      check_out_date,
      adults:          adults   || 1,
      children:        children || 0,
      status:          RESERVATION_STATUS.CONFIRMED,
      booking_source:  booking_source || 'walk_in',
      rate_per_night,
      total_amount:    rate_per_night * nights,
      deposit_amount:  deposit_amount || 0,
      deposit_paid:    (deposit_amount || 0) > 0,
      special_requests: special_requests || null,
      notes:           notes   || null,
      created_by:      createdBy,
    })
    .select().single();

  if (error) {
    if (error.code === '23505') throw new AppError('Duplicate reservation.', 409);
    throw new AppError('Failed to create reservation.', 500);
  }
  return data;
};

export const updateReservation = async (orgId, id, payload) => {
  const reservation = await getReservationById(orgId, id);

  if ([RESERVATION_STATUS.CHECKED_OUT, RESERVATION_STATUS.CANCELLED].includes(reservation.status)) {
    throw new AppError('Cannot modify a completed or cancelled reservation.', 409);
  }

  if (payload.room_id || payload.check_in_date || payload.check_out_date) {
    const roomId   = payload.room_id       || reservation.rooms?.id;
    const checkIn  = payload.check_in_date  || reservation.check_in_date;
    const checkOut = payload.check_out_date || reservation.check_out_date;

    if (roomId) {
      const available = await checkRoomAvailability(orgId, roomId, checkIn, checkOut, id);
      if (!available) throw new AppError('Room not available for selected dates.', 409);
    }

    if (payload.check_in_date || payload.check_out_date) {
      const nights = getNightCount(checkIn, checkOut);
      payload.total_amount = (payload.rate_per_night || reservation.rate_per_night) * nights;
    }
  }

  const { data, error } = await supabase
    .from('reservations').update(payload).eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError('Failed to update reservation.', 500);
  return data;
};

export const checkIn = async (orgId, id, checkedInBy) => {
  const reservation = await getReservationById(orgId, id);

  if (reservation.status !== RESERVATION_STATUS.CONFIRMED)
    throw new AppError(`Cannot check in reservation with status: ${reservation.status}.`, 409);
  if (!reservation.rooms?.id)
    throw new AppError('No room assigned. Assign a room before check-in.', 409);

  const { data, error } = await supabase
    .from('reservations')
    .update({ status: RESERVATION_STATUS.CHECKED_IN, actual_check_in: new Date().toISOString() })
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError('Failed to process check-in.', 500);

  await supabase.from('rooms').update({ status: ROOM_STATUS.OCCUPIED })
    .eq('org_id', orgId).eq('id', reservation.rooms.id);

  const { data: folio, error: folioErr } = await supabase
    .from('folios')
    .insert({ org_id: orgId, reservation_id: id, guest_id: reservation.guests.id, status: 'open' })
    .select().single();

  if (folioErr) throw new AppError('Check-in succeeded but failed to create folio.', 500);

  const nights     = getNightCount(reservation.check_in_date, reservation.check_out_date);
  const roomAmount = reservation.rate_per_night * nights;

  await supabase.from('folio_items').insert({
    org_id:      orgId,
    folio_id:    folio.id,
    department:  'room',
    description: `Room charge - ${reservation.rooms.number} (${nights} night${nights > 1 ? 's' : ''})`,
    quantity:    nights,
    unit_price:  reservation.rate_per_night,
    amount:      roomAmount,
    tax_amount:  0,
    is_voided:   false,
    posted_by:   checkedInBy,
    posted_at:   new Date().toISOString(),
    reference_id: id,
  });

  return data;
};

export const checkOut = async (orgId, id, checkedOutBy) => {
  const reservation = await getReservationById(orgId, id);

  if (reservation.status !== RESERVATION_STATUS.CHECKED_IN)
    throw new AppError(`Cannot check out reservation with status: ${reservation.status}.`, 409);

  const { data: folio } = await supabase
    .from('folios').select('id, balance, status')
    .eq('org_id', orgId).eq('reservation_id', id).eq('status', 'open').single();

  if (folio?.balance > 0)
    throw new AppError(`Outstanding balance must be settled before check-out.`, 409);

  const { data, error } = await supabase
    .from('reservations')
    .update({ status: RESERVATION_STATUS.CHECKED_OUT, actual_check_out: new Date().toISOString() })
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError('Failed to process check-out.', 500);

  if (reservation.rooms?.id)
    await supabase.from('rooms').update({ status: ROOM_STATUS.DIRTY })
      .eq('org_id', orgId).eq('id', reservation.rooms.id);

  if (folio)
    await supabase.from('folios')
      .update({ status: 'closed', closed_at: new Date().toISOString(), closed_by: checkedOutBy })
      .eq('org_id', orgId).eq('id', folio.id);

  return data;
};

export const cancelReservation = async (orgId, id, reason) => {
  const reservation = await getReservationById(orgId, id);

  if ([RESERVATION_STATUS.CHECKED_OUT, RESERVATION_STATUS.CANCELLED].includes(reservation.status))
    throw new AppError('Reservation already completed or cancelled.', 409);
  if (reservation.status === RESERVATION_STATUS.CHECKED_IN)
    throw new AppError('Cannot cancel a checked-in reservation. Process check-out instead.', 409);

  const { data, error } = await supabase
    .from('reservations')
    .update({ status: RESERVATION_STATUS.CANCELLED, cancel_reason: reason, cancelled_at: new Date().toISOString() })
    .eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError('Failed to cancel reservation.', 500);
  return data;
};

export const assignRoom = async (orgId, reservationId, roomId) => {
  const reservation = await getReservationById(orgId, reservationId);

  if (![RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.CHECKED_IN].includes(reservation.status))
    throw new AppError('Cannot assign room to this reservation.', 409);

  const available = await checkRoomAvailability(
    orgId, roomId, reservation.check_in_date, reservation.check_out_date, reservationId);
  if (!available) throw new AppError('Room not available for reservation dates.', 409);

  const { data, error } = await supabase
    .from('reservations').update({ room_id: roomId })
    .eq('org_id', orgId).eq('id', reservationId).select().single();

  if (error) throw new AppError('Failed to assign room.', 500);
  return data;
};

export const getTodayArrivals = async (orgId) => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('reservations')
    .select(`id, reservation_no, check_in_date, check_out_date, adults, children, special_requests,
      guests!guest_id ( id, full_name, phone, category ),
      rooms!room_id ( id, number, room_types ( name ) )`)
    .eq('org_id', orgId)
    .eq('check_in_date', today)
    .eq('status', RESERVATION_STATUS.CONFIRMED)
    .order('reservation_no');

  if (error) throw new AppError('Failed to fetch arrivals.', 500);
  return data;
};

export const getTodayDepartures = async (orgId) => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('reservations')
    .select(`id, reservation_no, check_in_date, check_out_date, actual_check_in,
      guests!guest_id ( id, full_name, phone ),
      rooms!room_id ( id, number, room_types ( name ) ),
      folios ( id, balance, status )`)
    .eq('org_id', orgId)
    .eq('check_out_date', today)
    .eq('status', RESERVATION_STATUS.CHECKED_IN)
    .order('reservation_no');

  if (error) throw new AppError('Failed to fetch departures.', 500);
  return data;
};
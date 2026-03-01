// src/services/reservationService.js

import { supabase }             from '../config/supabase.js';
import { AppError }             from '../middleware/errorHandler.js';
import { RESERVATION_STATUS, ROOM_STATUS } from '../config/constants.js';

// ─── Helpers ──────────────────────────────────────────────

const getNightCount = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end   = new Date(checkOut);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

const checkRoomAvailability = async (roomId, checkIn, checkOut, excludeReservationId = null) => {
  let query = supabase
    .from('reservations')
    .select('id')
    .eq('room_id', roomId)
    .in('status', [RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.CHECKED_IN])
    .lt('check_in_date', checkOut)
    .gt('check_out_date', checkIn);

  if (excludeReservationId) {
    query = query.neq('id', excludeReservationId);
  }

  const { data } = await query;
  return !data || data.length === 0;
};

// ─── Reservations ─────────────────────────────────────────

export const getAllReservations = async (filters = {}, page = 1, limit = 20) => {
  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  let query = supabase
    .from('reservations')
    .select(`
      id,
      reservation_no,
      check_in_date,
      check_out_date,
      actual_check_in,
      actual_check_out,
      status,
      booking_source,
      rate_per_night,
      total_amount,
      deposit_amount,
      deposit_paid,
      adults,
      children,
      special_requests,
      created_at,
      guests (
        id,
        full_name,
        email,
        phone,
        category
      ),
      rooms (
        id,
        number,
        floor,
        room_types ( id, name )
      )
    `, { count: 'exact' })
    .order('check_in_date', { ascending: false });

  if (filters.status)      query = query.eq('status', filters.status);
  if (filters.guest_id)    query = query.eq('guest_id', filters.guest_id);
  if (filters.room_id)     query = query.eq('room_id', filters.room_id);
  if (filters.date_from)   query = query.gte('check_in_date', filters.date_from);
  if (filters.date_to)     query = query.lte('check_in_date', filters.date_to);

  // Today's arrivals
  if (filters.arrivals_today) {
    const today = new Date().toISOString().split('T')[0];
    query = query
      .eq('check_in_date', today)
      .eq('status', RESERVATION_STATUS.CONFIRMED);
  }

  // Today's departures
  if (filters.departures_today) {
    const today = new Date().toISOString().split('T')[0];
    query = query
      .eq('check_out_date', today)
      .eq('status', RESERVATION_STATUS.CHECKED_IN);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw new AppError('Failed to fetch reservations.', 500);
  return { data, total: count };
};

export const getReservationById = async (id) => {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id,
      reservation_no,
      check_in_date,
      check_out_date,
      actual_check_in,
      actual_check_out,
      status,
      booking_source,
      rate_per_night,
      total_amount,
      deposit_amount,
      deposit_paid,
      adults,
      children,
      special_requests,
      notes,
      cancel_reason,
      cancelled_at,
      created_at,
      updated_at,
      guests (
        id,
        full_name,
        email,
        phone,
        nationality,
        id_type,
        id_number,
        category,
        loyalty_points
      ),
      rooms (
        id,
        number,
        floor,
        room_types ( id, name, base_rate, amenities )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) throw new AppError('Reservation not found.', 404);
  return data;
};

export const createReservation = async (payload, createdBy) => {
  const {
    guest_id,
    room_id,
    room_type_id,
    check_in_date,
    check_out_date,
    adults,
    children,
    booking_source,
    rate_per_night,
    deposit_amount,
    special_requests,
    notes,
  } = payload;

  // 1. Verify guest exists
  const { data: guest } = await supabase
    .from('guests')
    .select('id, category')
    .eq('id', guest_id)
    .single();

  if (!guest) throw new AppError('Guest not found.', 404);

  if (guest.category === 'blacklisted') {
    throw new AppError('This guest is blacklisted and cannot make reservations.', 403);
  }

  // 1b. Check for duplicate — same guest, same room, overlapping dates
  if (room_id) {
    const { data: duplicate } = await supabase
      .from('reservations')
      .select('id, reservation_no')
      .eq('guest_id', guest_id)
      .eq('room_id', room_id)
      .in('status', ['confirmed', 'checked_in'])
      .lt('check_in_date', check_out_date)
      .gt('check_out_date', check_in_date)
      .limit(1);

    if (duplicate && duplicate.length > 0) {
      throw new AppError(
        `A reservation already exists for this guest in this room for the selected dates. Reservation: ${duplicate[0].reservation_no}`,
        409
      );
    }
  }

  // 2. Verify room and auto-resolve room_type_id from the room
  let resolvedRoomTypeId = room_type_id || null;

  if (room_id) {
    const { data: room } = await supabase
      .from('rooms')
      .select('id, type_id, is_blocked')
      .eq('id', room_id)
      .eq('is_deleted', false)
      .single();

    if (!room) throw new AppError('Room not found.', 404);
    if (room.is_blocked) throw new AppError('This room is blocked and cannot be reserved.', 409);

    // Always derive room_type_id from the room
    resolvedRoomTypeId = room.type_id;

    // 3. Check availability
    const isAvailable = await checkRoomAvailability(room_id, check_in_date, check_out_date);
    if (!isAvailable) {
      throw new AppError('This room is not available for the selected dates.', 409);
    }
  }

  // 4. Calculate total
  const nights      = getNightCount(check_in_date, check_out_date);
  const nightRate   = rate_per_night;
  const totalAmount = nightRate * nights;

  // 5. Create reservation
  const { data, error } = await supabase
    .from('reservations')
    .insert({
      guest_id,
      room_id:         room_id || null,
      room_type_id:    resolvedRoomTypeId,
      check_in_date,
      check_out_date,
      adults:          adults || 1,
      children:        children || 0,
      status:          RESERVATION_STATUS.CONFIRMED,
      booking_source:  booking_source || 'walk_in',
      rate_per_night:  nightRate,
      total_amount:    totalAmount,
      deposit_amount:  deposit_amount || 0,
      deposit_paid:    deposit_amount > 0,
      special_requests: special_requests || null,
      notes:           notes || null,
      created_by:      createdBy,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError('A reservation already exists for this guest in this room for the selected dates.', 409);
    }
    throw new AppError('Failed to create reservation.', 500);
  }
  return data;
};

export const updateReservation = async (id, payload) => {
  const reservation = await getReservationById(id);

  if ([RESERVATION_STATUS.CHECKED_OUT, RESERVATION_STATUS.CANCELLED].includes(reservation.status)) {
    throw new AppError('Cannot modify a completed or cancelled reservation.', 409);
  }

  // If dates or room changed, re-check availability
  if (payload.room_id || payload.check_in_date || payload.check_out_date) {
    const roomId   = payload.room_id     || reservation.rooms?.id;
    const checkIn  = payload.check_in_date  || reservation.check_in_date;
    const checkOut = payload.check_out_date || reservation.check_out_date;

    if (roomId) {
      const isAvailable = await checkRoomAvailability(roomId, checkIn, checkOut, id);
      if (!isAvailable) {
        throw new AppError('Room is not available for the selected dates.', 409);
      }
    }

    // Recalculate total if dates changed
    if (payload.check_in_date || payload.check_out_date) {
      const nights = getNightCount(checkIn, checkOut);
      payload.total_amount = (payload.rate_per_night || reservation.rate_per_night) * nights;
    }
  }

  const { data, error } = await supabase
    .from('reservations')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update reservation.', 500);
  return data;
};

export const checkIn = async (id, checkedInBy) => {
  const reservation = await getReservationById(id);

  if (reservation.status !== RESERVATION_STATUS.CONFIRMED) {
    throw new AppError(`Cannot check in a reservation with status: ${reservation.status}.`, 409);
  }

  if (!reservation.rooms?.id) {
    throw new AppError('No room assigned to this reservation. Assign a room before check-in.', 409);
  }

  // Update reservation
  const { data, error } = await supabase
    .from('reservations')
    .update({
      status:          RESERVATION_STATUS.CHECKED_IN,
      actual_check_in: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to process check-in.', 500);

  // Update room status to occupied
  await supabase
    .from('rooms')
    .update({ status: ROOM_STATUS.OCCUPIED })
    .eq('id', reservation.rooms.id);

  // Create folio for this reservation
  const { data: folio, error: folioError } = await supabase
    .from('folios')
    .insert({
      reservation_id: id,
      guest_id:       reservation.guests.id,
      status:         'open',
    })
    .select()
    .single();

  if (folioError) throw new AppError('Check-in succeeded but failed to create folio.', 500);

  // Post the room charge to the folio automatically
  const nights     = Math.ceil(
    (new Date(reservation.check_out_date) - new Date(reservation.check_in_date))
    / (1000 * 60 * 60 * 24)
  );
  const roomAmount = reservation.rate_per_night * nights;

  await supabase
    .from('folio_items')
    .insert({
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

export const checkOut = async (id, checkedOutBy) => {
  const reservation = await getReservationById(id);

  if (reservation.status !== RESERVATION_STATUS.CHECKED_IN) {
    throw new AppError(`Cannot check out a reservation with status: ${reservation.status}.`, 409);
  }

  // Verify folio balance is zero
  const { data: folio } = await supabase
    .from('folios')
    .select('id, balance, status')
    .eq('reservation_id', id)
    .eq('status', 'open')
    .single();

  if (folio && folio.balance > 0) {
    throw new AppError(
      `Outstanding balance of ${folio.balance} kobo must be settled before check-out.`,
      409
    );
  }

  // Update reservation
  const { data, error } = await supabase
    .from('reservations')
    .update({
      status:           RESERVATION_STATUS.CHECKED_OUT,
      actual_check_out: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to process check-out.', 500);

  // Update room status to dirty
  if (reservation.rooms?.id) {
    await supabase
      .from('rooms')
      .update({ status: ROOM_STATUS.DIRTY })
      .eq('id', reservation.rooms.id);
  }

  // Close folio
  if (folio) {
    await supabase
      .from('folios')
      .update({
        status:    'closed',
        closed_at: new Date().toISOString(),
        closed_by: checkedOutBy,
      })
      .eq('id', folio.id);
  }

  return data;
};

export const cancelReservation = async (id, reason, cancelledBy) => {
  const reservation = await getReservationById(id);

  if ([RESERVATION_STATUS.CHECKED_OUT, RESERVATION_STATUS.CANCELLED].includes(reservation.status)) {
    throw new AppError('This reservation is already completed or cancelled.', 409);
  }

  if (reservation.status === RESERVATION_STATUS.CHECKED_IN) {
    throw new AppError('Cannot cancel a reservation that is currently checked in. Process check-out instead.', 409);
  }

  const { data, error } = await supabase
    .from('reservations')
    .update({
      status:       RESERVATION_STATUS.CANCELLED,
      cancel_reason: reason,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to cancel reservation.', 500);
  return data;
};

export const assignRoom = async (reservationId, roomId) => {
  const reservation = await getReservationById(reservationId);

  if (![RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.CHECKED_IN].includes(reservation.status)) {
    throw new AppError('Cannot assign room to this reservation.', 409);
  }

  // Check room availability
  const isAvailable = await checkRoomAvailability(
    roomId,
    reservation.check_in_date,
    reservation.check_out_date,
    reservationId
  );

  if (!isAvailable) {
    throw new AppError('This room is not available for the reservation dates.', 409);
  }

  const { data, error } = await supabase
    .from('reservations')
    .update({ room_id: roomId })
    .eq('id', reservationId)
    .select()
    .single();

  if (error) throw new AppError('Failed to assign room.', 500);
  return data;
};

export const getTodayArrivals = async () => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id,
      reservation_no,
      check_in_date,
      check_out_date,
      adults,
      children,
      special_requests,
      guests ( id, full_name, phone, category ),
      rooms ( id, number, room_types ( name ) )
    `)
    .eq('check_in_date', today)
    .eq('status', RESERVATION_STATUS.CONFIRMED)
    .order('reservation_no');

  if (error) throw new AppError('Failed to fetch arrivals.', 500);
  return data;
};

export const getTodayDepartures = async () => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id,
      reservation_no,
      check_in_date,
      check_out_date,
      actual_check_in,
      guests ( id, full_name, phone ),
      rooms ( id, number, room_types ( name ) ),
      folios ( id, balance, status )
    `)
    .eq('check_out_date', today)
    .eq('status', RESERVATION_STATUS.CHECKED_IN)
    .order('reservation_no');

  if (error) throw new AppError('Failed to fetch departures.', 500);
  return data;
};
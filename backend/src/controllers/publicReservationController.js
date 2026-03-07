// src/controllers/publicReservationController.js
//
// Handles guest-facing reservation actions from the public website.
// Key difference from staff controller: guest may or may not have an account.
// We create/find a guest record first, then create the reservation.

import { supabase }           from '../config/supabase.js';
import * as reservationService from '../services/reservationService.js';
import { AppError }           from '../middleware/errorHandler.js';
import { sendCreated, sendSuccess }  from '../utils/response.js';
import * as emailService             from '../services/emailService.js';

// ─── Helper: find or create guest record ─────────────────────────────────────
// For logged-in guests  → use their existing guest_id from JWT
// For unregistered guests → create a minimal guest record from form data
const resolveGuestId = async (req) => {
  // req.orgId set by resolveOrg middleware
  // 1. Logged-in guest account
  if (req.guest?.sub) return req.guest.sub;

  // 2. Unregistered — create a guest record on the fly
  const { first_name, last_name, email, phone } = req.body.guest || {};
  if (!email) throw new AppError('Guest email is required.', 422);

  const orgId = req.orgId;

  // Guests are org-scoped — same email can exist across different hotels
  const { data: existing } = await supabase
    .from('guests')
    .select('id, is_deleted')
    .eq('org_id', orgId)
    .eq('email', email)
    .eq('is_deleted', false)
    .limit(1)
    .single();

  if (existing) return existing.id;

  // Create new guest scoped to this org
  const { data: newGuest, error } = await supabase
    .from('guests')
    .insert({
      org_id:         orgId,
      full_name:      `${first_name || ''} ${last_name || ''}`.trim(),
      email,
      phone:          phone || null,
      category:       'regular',
      is_web_account: true,
    })
    .select('id')
    .single();

  if (error) throw new AppError('Failed to process guest details.', 500);
  return newGuest.id;
};

// ─── POST /api/v1/public/reservations ────────────────────────────────────────
export const publicCreateReservation = async (req, res, next) => {
  try {
    const guest_id = await resolveGuestId(req);

    const {
      check_in, check_out,
      check_in_date, check_out_date,
      room_type_id, rate_plan_id,
      adults, children,
      special_requests,
      rate_per_night,
    } = req.body;

    // Support both date field naming conventions
    const checkIn  = check_in_date  || check_in;
    const checkOut = check_out_date || check_out;

    if (!checkIn || !checkOut) {
      throw new AppError('Check-in and check-out dates are required.', 422);
    }

    // ── Re-validate availability at submission time (prevent double-booking) ──
    if (room_type_id) {
      // Count bookable rooms of this type
      // Dirty/ready rooms are bookable — they will be cleaned before check-in
      // Only hard-exclude: out_of_order, maintenance, blocked
      const { data: bookableRooms } = await supabase
        .from('rooms')
        .select('id')
        .eq('org_id', req.orgId)
        .eq('type_id', room_type_id)
        .eq('is_blocked', false)
        .not('status', 'in', '("out_of_order","maintenance")');

      const totalCount = bookableRooms?.length || 0;

      // Count rooms of this type with CONFIRMED reservations overlapping these dates
      // checked_in reservations hold a specific room_id — we check by room not type
      // to allow same-day turnover (checkout date = new checkin date is valid)
      const { data: confirmedOverlap } = await supabase
        .from('reservations')
        .select('id')
        .eq('org_id', req.orgId)
        .eq('room_type_id', room_type_id)
        .eq('status', 'confirmed')
        .lt('check_in_date', checkOut)
        .gt('check_out_date', checkIn);

      // Count checked-in rooms of this type overlapping (these hold room_id)
      const { data: checkedInOverlap } = await supabase
        .from('reservations')
        .select('room_id')
        .eq('org_id', req.orgId)
        .eq('status', 'checked_in')
        .lt('check_in_date', checkOut)
        .gt('check_out_date', checkIn)
        .not('room_id', 'is', null);

      // Cross-reference checked-in room_ids against rooms of this type
      const checkedInRoomIds = (checkedInOverlap || []).map(r => r.room_id);
      let checkedInCount = 0;
      if (checkedInRoomIds.length > 0 && bookableRooms?.length > 0) {
        const bookableIds = new Set(bookableRooms.map(r => r.id));
        checkedInCount = checkedInRoomIds.filter(id => bookableIds.has(id)).length;
      }

      const bookedCount = (confirmedOverlap?.length || 0) + checkedInCount;

      if (bookedCount >= totalCount) {
        throw new AppError(
          'Sorry, no rooms of this type are available for your selected dates. Please try different dates or contact us directly.',
          409
        );
      }
    }

    // ── Validate guest count against room type capacity ──
    if (room_type_id && adults) {
      const { data: roomType } = await supabase
        .from('room_types')
        .select('max_occupancy')
        .eq('id', room_type_id)
        .single();

      if (roomType?.max_occupancy && (adults + (children || 0)) > roomType.max_occupancy) {
        throw new AppError(
          `This room type accommodates a maximum of ${roomType.max_occupancy} guests.`, 422
        );
      }
    }

    // Get rate per night from rate plan if not provided directly
    let nightRate = rate_per_night;
    if (!nightRate && rate_plan_id) {
      const { data: ratePlan } = await supabase
        .from('rate_plans')
        .select('base_rate')
        .eq('id', rate_plan_id)
        .single();
      if (ratePlan) nightRate = ratePlan.base_rate;
    }

    // Fall back to room type base_rate
    if (!nightRate && room_type_id) {
      const { data: roomType } = await supabase
        .from('room_types')
        .select('base_rate')
        .eq('id', room_type_id)
        .single();
      if (roomType) nightRate = roomType.base_rate;
    }

    if (!nightRate) throw new AppError('Could not determine room rate.', 422);

    const data = await reservationService.createReservation(req.orgId, {
      guest_id,
      room_id:         null,          // room assigned at check-in by staff
      room_type_id,
      check_in_date:   checkIn,
      check_out_date:  checkOut,
      adults:          adults  || 1,
      children:        children || 0,
      booking_source:  'online',
      rate_per_night:  nightRate,
      deposit_amount:  0,
      special_requests: special_requests || null,
    }, null);

    // Send confirmation email (non-blocking — don't fail booking if email fails)
    try {
      const { data: guestData } = await supabase
        .from('guests')
        .select('full_name, email')
        .eq('id', guest_id)
        .single();

      const { data: roomTypeData } = room_type_id ? await supabase
        .from('room_types').select('name').eq('id', room_type_id).single()
        : { data: null };

      const { data: ratePlanData } = rate_plan_id ? await supabase
        .from('rate_plans').select('name').eq('id', rate_plan_id).single()
        : { data: null };

      if (guestData?.email) {
        emailService.sendBookingConfirmation({
          reservation: data,
          guest:        guestData,
          roomTypeName: roomTypeData?.name,
          ratePlanName: ratePlanData?.name,
        }).catch(e => console.error('[email] booking confirmation failed:', e));
      }
    } catch (e) {
      console.error('[email] pre-send lookup failed:', e);
    }

    return sendCreated(res, {
      reservation: data,
      guest_id,
    }, 'Your booking is confirmed!');
  } catch (err) { next(err); }
};

// ─── PATCH /api/v1/public/reservations/:id/cancel ────────────────────────────
export const publicCancelReservation = async (req, res, next) => {
  try {
    // Verify the reservation belongs to this guest
    const { data: reservation } = await supabase
      .from('reservations')
      .select('id, guest_id')
      .eq('id', req.params.id)
      .single();

    if (!reservation) throw new AppError('Reservation not found.', 404);
    if (reservation.guest_id !== req.guest.sub)
      throw new AppError('You are not authorised to cancel this reservation.', 403);

    const data = await reservationService.cancelReservation(
      req.orgId,
      req.params.id,
      req.body.reason || 'Cancelled by guest via website.'
    );
    return sendSuccess(res, data, 'Your reservation has been cancelled.');
  } catch (err) { next(err); }
};
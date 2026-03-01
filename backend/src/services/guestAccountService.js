// src/services/guestAccountService.js
//
// Handles web guest authentication against the guests table.
// Guests register/login on the public website — completely separate from HMS staff auth.

import bcrypt       from 'bcrypt';
import jwt          from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { env }      from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

const SALT_ROUNDS = 12;

// ─── Token helpers ────────────────────────────────────────────────────────────
const generateGuestAccessToken = (payload) =>
  jwt.sign({ ...payload, type: 'guest' }, env.JWT_SECRET, { expiresIn: '7d' });

const generateGuestRefreshToken = (guestId) =>
  jwt.sign({ sub: guestId, type: 'guest_refresh' }, env.JWT_SECRET, { expiresIn: '30d' });

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = async ({ full_name, email, phone, password }) => {
  // 1. Check email not already used as a web account
  const { data: existing } = await supabase
    .from('guests')
    .select('id, is_web_account')
    .eq('email', email)
    .eq('is_web_account', true)
    .single();

  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  // 2. Check if guest already exists in HMS (walk-in, OTA, etc.) — link rather than duplicate
  const { data: existingGuest } = await supabase
    .from('guests')
    .select('id')
    .eq('email', email)
    .eq('is_web_account', false)
    .single();

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  let guest;

  if (existingGuest) {
    // Upgrade existing guest profile to web account
    const { data, error } = await supabase
      .from('guests')
      .update({
        password_hash,
        is_web_account:  true,
        email_verified:  false,
        full_name:       full_name,
        phone:           phone || null,
      })
      .eq('id', existingGuest.id)
      .select()
      .single();

    if (error) throw new AppError('Registration failed.', 500);
    guest = data;
  } else {
    // Create new guest profile
    const { data, error } = await supabase
      .from('guests')
      .insert({
        full_name,
        email,
        phone:          phone || null,
        password_hash,
        is_web_account: true,
        email_verified: false,
        category:       'regular',
      })
      .select()
      .single();

    if (error) throw new AppError('Registration failed.', 500);
    guest = data;
  }

  const tokenPayload = { sub: guest.id, email: guest.email, full_name: guest.full_name };

  return {
    access_token:  generateGuestAccessToken(tokenPayload),
    refresh_token: generateGuestRefreshToken(guest.id),
    guest: {
      id:        guest.id,
      full_name: guest.full_name,
      email:     guest.email,
      phone:     guest.phone,
    },
  };
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async ({ email, password }) => {
  const { data: guest, error } = await supabase
    .from('guests')
    .select('*')
    .eq('email', email)
    .eq('is_web_account', true)
    .eq('is_deleted', false)
    .single();

  if (error || !guest) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!guest.password_hash) {
    throw new AppError('Invalid email or password.', 401);
  }

  const valid = await bcrypt.compare(password, guest.password_hash);
  if (!valid) {
    throw new AppError('Invalid email or password.', 401);
  }

  const tokenPayload = { sub: guest.id, email: guest.email, full_name: guest.full_name };

  return {
    access_token:  generateGuestAccessToken(tokenPayload),
    refresh_token: generateGuestRefreshToken(guest.id),
    guest: {
      id:        guest.id,
      full_name: guest.full_name,
      email:     guest.email,
      phone:     guest.phone,
    },
  };
};

// ─── Get my reservations ──────────────────────────────────────────────────────
export const getMyReservations = async (guestId) => {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id,
      reservation_no,
      check_in_date,
      check_out_date,
      adults,
      children,
      status,
      rate_per_night,
      total_amount,
      deposit_amount,
      deposit_paid,
      special_requests,
      cancel_reason,
      cancelled_at,
      created_at,
      room_type:room_type_id (
        id,
        name,
        description
      ),
      room:room_id (
        id,
        room_number
      )
    `)
    .eq('guest_id', guestId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) throw new AppError('Failed to retrieve reservations.', 500);
  return data || [];
};

// ─── Get single reservation (must belong to guest) ───────────────────────────
export const getMyReservationById = async (guestId, reservationId) => {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      room_type:room_type_id ( id, name, description, amenities ),
      room:room_id ( id, room_number, floor )
    `)
    .eq('id', reservationId)
    .eq('guest_id', guestId)
    .single();

  if (error || !data) throw new AppError('Reservation not found.', 404);
  return data;
};

// ─── Refresh token ────────────────────────────────────────────────────────────
export const refreshGuestToken = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  if (decoded.type !== 'guest_refresh') {
    throw new AppError('Invalid token type.', 401);
  }

  const { data: guest, error } = await supabase
    .from('guests')
    .select('id, email, full_name, is_deleted')
    .eq('id', decoded.sub)
    .single();

  if (error || !guest || guest.is_deleted) {
    throw new AppError('Account not found.', 404);
  }

  const tokenPayload = { sub: guest.id, email: guest.email, full_name: guest.full_name };

  return {
    access_token: generateGuestAccessToken(tokenPayload),
  };
};
// src/services/guestAccountService.js
//
// Handles web guest authentication against the guests table.
// Guests register/login on the public website — completely separate from HMS staff auth.

import bcrypt       from 'bcrypt';
import crypto       from 'crypto';
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
export const register = async ({ full_name, email, phone, address, password }) => {
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
        phone:           phone    || null,
        address:         address  || null,
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
        phone:          phone   || null,
        address:        address || null,
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
      address:   guest.address || null,
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
      address:   guest.address || null,
    },
  };
};

// ─── Get my reservations ──────────────────────────────────────────────────────
export const getMyReservations = async (guestId) => {
  // Step 1: fetch reservations flat (no joins to avoid FK naming issues)
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('id, reservation_no, room_type_id, check_in_date, check_out_date, adults, children, status, rate_per_night, total_amount, deposit_amount, deposit_paid, special_requests, cancel_reason, cancelled_at, created_at')
    .eq('guest_id', guestId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getMyReservations]', error.message, error.details);
    throw new AppError('Failed to retrieve reservations.', 500);
  }

  if (!reservations || reservations.length === 0) return [];

  // Step 2: batch-fetch room type names
  const typeIds = [...new Set(reservations.map(r => r.room_type_id).filter(Boolean))];
  let typeMap = {};
  if (typeIds.length > 0) {
    const { data: types } = await supabase
      .from('room_types').select('id, name').in('id', typeIds);
    (types || []).forEach(t => { typeMap[t.id] = t.name; });
  }

  return reservations.map(r => ({
    ...r,
    room_types: r.room_type_id ? { name: typeMap[r.room_type_id] || null } : null,
  }));
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

// ─── Forgot password ──────────────────────────────────────────────────────────
export const forgotPassword = async (email) => {
  const { data: guest } = await supabase
    .from('guests')
    .select('id, email, full_name')
    .eq('email', email)
    .eq('is_web_account', true)
    .eq('is_deleted', false)
    .single();

  // Always resolve — never reveal if email exists
  if (!guest) return { message: 'If this email is registered, a reset link has been sent.' };

  // Generate a short-lived reset token
  const resetToken = jwt.sign(
    { sub: guest.id, type: 'password_reset' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Store token hash in DB so it can be invalidated after use
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  await supabase
    .from('guests')
    .update({ reset_token_hash: tokenHash, reset_token_expires: new Date(Date.now() + 3600000).toISOString() })
    .eq('id', guest.id);

  // TODO: Send email with reset link
  // The reset link should be: https://yourhotel.com/reset-password?token=<resetToken>
  // Integrate with your email provider (Nodemailer, Resend, SendGrid, etc.)
  // Example with Nodemailer:
  //   await sendEmail({
  //     to: guest.email,
  //     subject: 'Reset your password',
  //     html: `<p>Click <a href="${env.WEBSITE_URL}/reset-password?token=${resetToken}">here</a> to reset your password. Link expires in 1 hour.</p>`
  //   });

  console.log(`[DEV] Password reset link: ${env.WEBSITE_URL || 'http://localhost:5174'}/reset-password?token=${resetToken}`);

  return { message: 'If this email is registered, a reset link has been sent.' };
};

// ─── Reset password ───────────────────────────────────────────────────────────
export const resetPassword = async ({ token, password }) => {
  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new AppError('This reset link is invalid or has expired.', 400);
  }

  if (decoded.type !== 'password_reset') {
    throw new AppError('Invalid reset token.', 400);
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const { data: guest } = await supabase
    .from('guests')
    .select('id, reset_token_hash, reset_token_expires')
    .eq('id', decoded.sub)
    .single();

  if (!guest || guest.reset_token_hash !== tokenHash) {
    throw new AppError('This reset link has already been used or is invalid.', 400);
  }

  if (new Date(guest.reset_token_expires) < new Date()) {
    throw new AppError('This reset link has expired. Please request a new one.', 400);
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  await supabase
    .from('guests')
    .update({
      password_hash,
      reset_token_hash:    null,
      reset_token_expires: null,
    })
    .eq('id', guest.id);

  return { message: 'Password updated successfully.' };
};
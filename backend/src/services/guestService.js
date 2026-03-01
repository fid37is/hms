// src/services/guestService.js

import { supabase }      from '../config/supabase.js';
import { AppError }      from '../middleware/errorHandler.js';
import { GUEST_CATEGORY } from '../config/constants.js';

export const getAllGuests = async (filters = {}, page = 1, limit = 20) => {
  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  let query = supabase
    .from('guests')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)
    .order('full_name');

  if (filters.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
    );
  }

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw new AppError('Failed to fetch guests.', 500);
  return { data, total: count };
};

export const getGuestById = async (id) => {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error || !data) throw new AppError('Guest not found.', 404);
  return data;
};

export const searchGuests = async (query) => {
  const { data, error } = await supabase
    .from('guests')
    .select('id, full_name, email, phone, category, loyalty_points')
    .eq('is_deleted', false)
    .or(
      `full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`
    )
    .limit(10);

  if (error) throw new AppError('Failed to search guests.', 500);
  return data;
};

export const createGuest = async (payload) => {
  // Check for duplicate email if provided
  if (payload.email) {
    const { data: existing } = await supabase
      .from('guests')
      .select('id')
      .eq('email', payload.email)
      .eq('is_deleted', false)
      .single();

    if (existing) {
      throw new AppError('A guest with this email already exists.', 409);
    }
  }

  const { data, error } = await supabase
    .from('guests')
    .insert(payload)
    .select()
    .single();

  if (error) throw new AppError('Failed to create guest.', 500);
  return data;
};

export const updateGuest = async (id, payload) => {
  await getGuestById(id);

  if (payload.email) {
    const { data: existing } = await supabase
      .from('guests')
      .select('id')
      .eq('email', payload.email)
      .neq('id', id)
      .eq('is_deleted', false)
      .single();

    if (existing) {
      throw new AppError('A guest with this email already exists.', 409);
    }
  }

  const { data, error } = await supabase
    .from('guests')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update guest.', 500);
  return data;
};

export const deleteGuest = async (id) => {
  await getGuestById(id);

  // Check if guest has active reservations
  const { data: active } = await supabase
    .from('reservations')
    .select('id')
    .eq('guest_id', id)
    .in('status', ['confirmed', 'checked_in'])
    .limit(1);

  if (active && active.length > 0) {
    throw new AppError('Cannot delete a guest with active reservations.', 409);
  }

  const { error } = await supabase
    .from('guests')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) throw new AppError('Failed to delete guest.', 500);
  return { message: 'Guest deleted successfully.' };
};

export const getGuestStayHistory = async (guestId, page = 1, limit = 10) => {
  await getGuestById(guestId);

  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  const { data, error, count } = await supabase
    .from('reservations')
    .select(`
      id,
      reservation_no,
      check_in_date,
      check_out_date,
      actual_check_in,
      actual_check_out,
      status,
      rate_per_night,
      total_amount,
      booking_source,
      rooms (
        id,
        number,
        room_types ( name )
      )
    `, { count: 'exact' })
    .eq('guest_id', guestId)
    .order('check_in_date', { ascending: false })
    .range(from, to);

  if (error) throw new AppError('Failed to fetch stay history.', 500);
  return { data, total: count };
};

export const updateLoyaltyPoints = async (guestId, points, operation = 'add') => {
  const guest = await getGuestById(guestId);

  const newPoints = operation === 'add'
    ? guest.loyalty_points + points
    : Math.max(0, guest.loyalty_points - points);

  const { data, error } = await supabase
    .from('guests')
    .update({ loyalty_points: newPoints })
    .eq('id', guestId)
    .select()
    .single();

  if (error) throw new AppError('Failed to update loyalty points.', 500);
  return data;
};

export const flagGuest = async (guestId, category, notes = null) => {
  await getGuestById(guestId);

  const payload = { category };
  if (notes) payload.notes = notes;

  const { data, error } = await supabase
    .from('guests')
    .update(payload)
    .eq('id', guestId)
    .select()
    .single();

  if (error) throw new AppError('Failed to update guest category.', 500);
  return data;
};
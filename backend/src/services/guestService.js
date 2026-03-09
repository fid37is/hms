// src/services/guestService.js

import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAllGuests = async (orgId, filters = {}, page = 1, limit = 20) => {
  const from = (page - 1) * limit;

  const sortField = filters.sort || 'full_name';
  const sortAsc   = filters.order !== 'desc';

  let q = supabase
    .from('guests').select('*', { count: 'exact' })
    .eq('org_id', orgId).eq('is_deleted', false)
    .order(sortField, { ascending: sortAsc });

  if (filters.search)
    q = q.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
  if (filters.category) q = q.eq('category', filters.category);

  const { data, error, count } = await q.range(from, from + limit - 1);
  if (error) throw new AppError('Failed to fetch guests.', 500);
  return { data, total: count };
};

export const getGuestById = async (orgId, id) => {
  const { data, error } = await supabase
    .from('guests').select('*')
    .eq('org_id', orgId).eq('id', id).eq('is_deleted', false).single();

  if (error || !data) throw new AppError('Guest not found.', 404);
  return data;
};

export const searchGuests = async (orgId, query) => {
  const { data, error } = await supabase
    .from('guests')
    .select('id, full_name, email, phone, category, loyalty_points')
    .eq('org_id', orgId).eq('is_deleted', false)
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(10);

  if (error) throw new AppError('Failed to search guests.', 500);
  return data;
};

export const createGuest = async (orgId, payload) => {
  if (payload.email) {
    const { data: existing } = await supabase
      .from('guests').select('id')
      .eq('org_id', orgId).eq('email', payload.email).eq('is_deleted', false).single();
    if (existing) throw new AppError('A guest with this email already exists.', 409);
  }

  const { data, error } = await supabase
    .from('guests').insert({ ...payload, org_id: orgId }).select().single();

  if (error) throw new AppError('Failed to create guest.', 500);
  return data;
};

export const updateGuest = async (orgId, id, payload) => {
  await getGuestById(orgId, id);

  if (payload.email) {
    const { data: existing } = await supabase
      .from('guests').select('id')
      .eq('org_id', orgId).eq('email', payload.email).neq('id', id).eq('is_deleted', false).single();
    if (existing) throw new AppError('A guest with this email already exists.', 409);
  }

  const { data, error } = await supabase
    .from('guests').update(payload).eq('org_id', orgId).eq('id', id).select().single();

  if (error) throw new AppError('Failed to update guest.', 500);
  return data;
};

export const deleteGuest = async (orgId, id) => {
  await getGuestById(orgId, id);

  const { data: active } = await supabase
    .from('reservations').select('id')
    .eq('org_id', orgId).eq('guest_id', id).in('status', ['confirmed', 'checked_in']).limit(1);

  if (active?.length > 0) throw new AppError('Cannot delete a guest with active reservations.', 409);

  const { error } = await supabase
    .from('guests').update({ is_deleted: true }).eq('org_id', orgId).eq('id', id);

  if (error) throw new AppError('Failed to delete guest.', 500);
  return { message: 'Guest deleted.' };
};

export const getGuestStayHistory = async (orgId, guestId, page = 1, limit = 10) => {
  await getGuestById(orgId, guestId);
  const from = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('reservations')
    .select(`id, reservation_no, check_in_date, check_out_date, actual_check_in, actual_check_out,
      status, rate_per_night, total_amount, booking_source, special_requests, adults, children,
      rooms ( id, number, room_types ( name ) ),
      room_types ( name )`, { count: 'exact' })
    .eq('org_id', orgId).eq('guest_id', guestId)
    .order('check_in_date', { ascending: false })
    .range(from, from + limit - 1);

  if (error) throw new AppError('Failed to fetch stay history.', 500);
  return { data, total: count };
};

export const updateLoyaltyPoints = async (orgId, guestId, points, operation = 'add') => {
  const guest = await getGuestById(orgId, guestId);
  const newPoints = operation === 'add'
    ? guest.loyalty_points + points
    : Math.max(0, guest.loyalty_points - points);

  const { data, error } = await supabase
    .from('guests').update({ loyalty_points: newPoints })
    .eq('org_id', orgId).eq('id', guestId).select().single();

  if (error) throw new AppError('Failed to update loyalty points.', 500);
  return data;
};

export const flagGuest = async (orgId, guestId, category, notes = null) => {
  await getGuestById(orgId, guestId);
  const payload = { category };
  if (notes) payload.notes = notes;

  const { data, error } = await supabase
    .from('guests').update(payload).eq('org_id', orgId).eq('id', guestId).select().single();

  if (error) throw new AppError('Failed to update guest category.', 500);
  return data;
};
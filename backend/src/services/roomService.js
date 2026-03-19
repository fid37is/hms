// src/services/roomService.js

import { supabase }    from '../config/supabase.js';
import { AppError }    from '../middleware/errorHandler.js';
import { ROOM_STATUS } from '../config/constants.js';

// ─── Room Types ───────────────────────────────────────────

export const getAllRoomTypes = async (orgId) => {
  const { data: types, error } = await supabase
    .from('room_types')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('name');

  if (error) throw new AppError('Failed to fetch room types.', 500);

  return types.map(t => ({
    ...t,
    photos: (t.media || [])
      .filter(m => m.type === 'image' || m.type === 'gif')
      .map(m => ({ url: m.url, path: m.path })),
  }));
};

export const getRoomTypeById = async (orgId, id) => {
  const { data, error } = await supabase
    .from('room_types')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', id)
    .single();

  if (error || !data) throw new AppError('Room type not found.', 404);

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, number, floor, status, notes, media')
    .eq('org_id', orgId)
    .eq('type_id', id)
    .eq('is_blocked', false)
    .order('number');

  const photos = (data.media || [])
    .filter(m => m.type === 'image' || m.type === 'gif')
    .map(m => ({ url: m.url, path: m.path }));

  return {
    ...data,
    photos,
    rooms: rooms || [],
  };
};

export const createRoomType = async (orgId, payload) => {
  const { data, error } = await supabase
    .from('room_types')
    .insert({ ...payload, org_id: orgId })
    .select()
    .single();

  if (error) throw new AppError('Failed to create room type.', 500);
  return data;
};

export const updateRoomType = async (orgId, id, payload) => {
  await getRoomTypeById(orgId, id);

  const { data, error } = await supabase
    .from('room_types')
    .update(payload)
    .eq('org_id', orgId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update room type.', 500);
  return data;
};

export const deleteRoomType = async (orgId, id) => {
  const { data: rooms } = await supabase
    .from('rooms')
    .select('id')
    .eq('org_id', orgId)
    .eq('type_id', id)
    .limit(1);

  if (rooms?.length > 0) throw new AppError('Cannot delete a room type that has rooms assigned.', 409);

  const { error } = await supabase
    .from('room_types')
    .update({ is_active: false })
    .eq('org_id', orgId)
    .eq('id', id);

  if (error) throw new AppError('Failed to delete room type.', 500);
  return { message: 'Room type deleted.' };
};

// ─── Rate Plans ───────────────────────────────────────────

const sanitiseRatePlan = (payload) => {
  const d = { ...payload };
  if (d.is_refundable === false) {
    d.cancellation_hours  = 0;
    d.prepayment_required = true;
  }
  if (d.prepayment_required && !d.prepayment_percent) {
    d.prepayment_percent = 100;
  }
  return d;
};

export const getRatePlans = async (orgId, roomTypeId) => {
  const { data, error } = await supabase
    .from('rate_plans')
    .select('*')
    .eq('org_id', orgId)
    .eq('room_type_id', roomTypeId)
    .eq('is_active', true)
    .order('name');

  if (error) throw new AppError('Failed to fetch rate plans.', 500);
  return (data || []).map(p => ({ ...p, rate_per_night: p.base_rate }));
};

export const createRatePlan = async (orgId, payload) => {
  const { data, error } = await supabase
    .from('rate_plans')
    .insert({ ...sanitiseRatePlan(payload), org_id: orgId })
    .select()
    .single();

  if (error) throw new AppError('Failed to create rate plan.', 500);
  return data;
};

export const updateRatePlan = async (orgId, id, payload) => {
  const { data, error } = await supabase
    .from('rate_plans')
    .update(sanitiseRatePlan(payload))
    .eq('org_id', orgId)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) throw new AppError('Failed to update rate plan.', 500);
  return data;
};

export const deleteRatePlan = async (orgId, id) => {
  const { error } = await supabase
    .from('rate_plans')
    .update({ is_active: false })
    .eq('org_id', orgId)
    .eq('id', id);

  if (error) throw new AppError('Failed to delete rate plan.', 500);
  return { message: 'Rate plan deleted.' };
};

// ─── Rooms ────────────────────────────────────────────────

export const getAllRooms = async (orgId, filters = {}) => {
  let query = supabase
    .from('rooms')
    .select(`id, number, floor, status, is_blocked, block_reason, notes, type_id, media,
      room_types ( id, name, base_rate, max_occupancy, amenities, media )`)
    .eq('org_id', orgId)
    .order('number');

  if (filters.status) {
    const statuses = String(filters.status).split(',').map(s => s.trim()).filter(Boolean);
    query = statuses.length === 1 ? query.eq('status', statuses[0]) : query.in('status', statuses);
  }
  if (filters.type_id) query = query.eq('type_id', filters.type_id);
  if (filters.floor)   query = query.eq('floor', filters.floor);

  const { data, error } = await query;
  if (error) throw new AppError('Failed to fetch rooms.', 500);
  return data;
};

export const getRoomById = async (orgId, id) => {
  const { data, error } = await supabase
    .from('rooms')
    .select(`id, number, floor, status, is_blocked, block_reason, notes, type_id, media,
      room_types ( id, name, base_rate, max_occupancy, amenities )`)
    .eq('org_id', orgId)
    .eq('id', id)
    .single();

  if (error || !data) throw new AppError('Room not found.', 404);
  return data;
};

export const createRoom = async (orgId, payload) => {
  const { data: existing } = await supabase
    .from('rooms')
    .select('id')
    .eq('org_id', orgId)
    .eq('number', payload.number)
    .single();

  if (existing) throw new AppError(`Room number ${payload.number} already exists.`, 409);

  const { data, error } = await supabase
    .from('rooms')
    .insert({ ...payload, org_id: orgId })
    .select()
    .single();

  if (error) throw new AppError(`Failed to create room: ${error.message}`, 500);
  return data;
};

export const updateRoom = async (orgId, id, payload) => {
  await getRoomById(orgId, id);

  if (payload.number) {
    const { data: existing } = await supabase
      .from('rooms')
      .select('id')
      .eq('org_id', orgId)
      .eq('number', payload.number)
      .neq('id', id)
      .single();

    if (existing) throw new AppError(`Room number ${payload.number} already exists.`, 409);
  }

  const { data, error } = await supabase
    .from('rooms')
    .update(payload)
    .eq('org_id', orgId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update room.', 500);
  return data;
};

export const updateRoomStatus = async (orgId, id, status, notes = null) => {
  await getRoomById(orgId, id);
  const payload = { status };
  if (notes) payload.notes = notes;

  const { data, error } = await supabase
    .from('rooms')
    .update(payload)
    .eq('org_id', orgId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update room status.', 500);
  return data;
};

export const blockRoom = async (orgId, id, reason) => {
  await getRoomById(orgId, id);

  const { data, error } = await supabase
    .from('rooms')
    .update({ is_blocked: true, block_reason: reason, status: ROOM_STATUS.OUT_OF_ORDER })
    .eq('org_id', orgId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to block room.', 500);
  return data;
};

export const unblockRoom = async (orgId, id) => {
  await getRoomById(orgId, id);

  const { data, error } = await supabase
    .from('rooms')
    .update({ is_blocked: false, block_reason: null, status: ROOM_STATUS.AVAILABLE })
    .eq('org_id', orgId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to unblock room.', 500);
  return data;
};

export const deleteRoom = async (orgId, id) => {
  const room = await getRoomById(orgId, id);

  if (room.status === ROOM_STATUS.OCCUPIED) {
    throw new AppError('Cannot delete an occupied room.', 409);
  }

  const { error } = await supabase
    .from('rooms')
    .update({ status: 'out_of_order' })
    .eq('org_id', orgId)
    .eq('id', id);

  if (error) throw new AppError('Failed to delete room.', 500);
  return { message: 'Room deleted.' };
};

// ─── Availability ─────────────────────────────────────────
//
// Bookable = everything except out_of_order and maintenance.
// dirty / ready / clean / available are all fine — cleaned before check-in.
// Occupied rooms are excluded via reservation conflict query, not by status flag.
//
// Overlap uses half-open intervals [checkIn, checkOut) so same-day turnover works.
//
// Two sources of unavailability:
//   1. Room-level: a specific room_id is tied to a confirmed/checked-in reservation
//   2. Type-level: all physical rooms of a type are accounted for by confirmed
//      reservations that have no room_id yet (online bookings pending room assignment)

const UNBOOKABLE = '("out_of_order","maintenance")';

export const getAvailableRooms = async (orgId, checkIn, checkOut, typeId = null, withMedia = false) => {
  // ── Step 1: rooms tied up by checked-in reservations (have room_id) ──────
  const { data: roomLevelConflicts } = await supabase
    .from('reservations')
    .select('room_id')
    .eq('org_id', orgId)
    .in('status', ['confirmed', 'checked_in'])
    .lt('check_in_date', checkOut)
    .gt('check_out_date', checkIn)
    .not('room_id', 'is', null);

  const conflictingRoomIds = (roomLevelConflicts || [])
    .map(r => r.room_id)
    .filter(Boolean);

  // ── Step 2: all bookable physical rooms ───────────────────────────────────
  let roomQuery = supabase
    .from('rooms')
    .select(`id, number, floor, status, type_id,
      ${withMedia ? 'media,' : ''}
      room_types ( id, name, base_rate, max_occupancy, amenities )`)
    .eq('org_id', orgId)
    .eq('is_blocked', false)
    .not('status', 'in', UNBOOKABLE)
    .order('number');

  if (conflictingRoomIds.length > 0) {
    roomQuery = roomQuery.not('id', 'in', `(${conflictingRoomIds.join(',')})`);
  }
  if (typeId) roomQuery = roomQuery.eq('type_id', typeId);

  const { data: bookableRooms, error } = await roomQuery;
  if (error) throw new AppError('Failed to fetch available rooms.', 500);

  if (!bookableRooms || bookableRooms.length === 0) return [];

  // ── Step 3: type-level capacity check for unassigned confirmed bookings ───
  // Online bookings are created with room_id = null (room assigned at check-in).
  // We must count how many such bookings exist per type and subtract from
  // available physical rooms — otherwise all rooms show as available even
  // when the type is fully booked online.
  const { data: unassignedBookings } = await supabase
    .from('reservations')
    .select('room_type_id')
    .eq('org_id', orgId)
    .eq('status', 'confirmed')
    .is('room_id', null)
    .lt('check_in_date', checkOut)
    .gt('check_out_date', checkIn);

  // Count unassigned bookings per type
  const unassignedByType = {};
  for (const r of (unassignedBookings || [])) {
    if (r.room_type_id) {
      unassignedByType[r.room_type_id] = (unassignedByType[r.room_type_id] || 0) + 1;
    }
  }

  // Group bookable rooms by type
  const roomsByType = {};
  for (const room of bookableRooms) {
    if (!roomsByType[room.type_id]) roomsByType[room.type_id] = [];
    roomsByType[room.type_id].push(room);
  }

  // For each type, remove rooms from the available list equal to the number
  // of unassigned confirmed bookings — this "virtually" reserves those rooms
  const availableRooms = [];
  for (const [tId, rooms] of Object.entries(roomsByType)) {
    const reserved = unassignedByType[tId] || 0;
    // Rooms still available = total bookable rooms minus unassigned bookings
    // If reserved >= rooms.length the type is fully booked — include none
    const available = rooms.slice(reserved);
    availableRooms.push(...available);
  }

  return availableRooms;
};

// ─── Room Media ───────────────────────────────────────────

export const uploadRoomMedia = async (orgId, roomId, file) => {
  const ALLOWED = ['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'];
  if (!ALLOWED.includes(file.mimetype)) throw new AppError('Invalid file type.', 400);

  const isVideo = file.mimetype.startsWith('video/');
  const limit   = isVideo ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
  if (file.size > limit) throw new AppError('File too large.', 400);

  const room = await getRoomById(orgId, roomId);
  const currentMedia = room.media || [];
  if (currentMedia.length >= 5) throw new AppError('Maximum 5 media files per room.', 400);

  const ext      = file.originalname.split('.').pop().toLowerCase();
  const filename = `rooms/${roomId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const type     = file.mimetype === 'image/gif' ? 'gif' : isVideo ? 'video' : 'image';

  const { error: uploadError } = await supabase.storage
    .from('room-media')
    .upload(filename, file.buffer, { contentType: file.mimetype, cacheControl: '3600', upsert: false });

  if (uploadError) throw new AppError(`Upload failed: ${uploadError.message}`, 500);

  const { data: { publicUrl } } = supabase.storage.from('room-media').getPublicUrl(filename);

  const updatedMedia = [...currentMedia, {
    url: publicUrl, path: filename, type,
    name: file.originalname, size: file.size, added_at: new Date().toISOString(),
  }];

  const { data, error } = await supabase
    .from('rooms')
    .update({ media: updatedMedia })
    .eq('org_id', orgId)
    .eq('id', roomId)
    .select()
    .single();

  if (error) throw new AppError(`Failed to save media: ${error.message}`, 500);
  return data;
};

export const deleteRoomMedia = async (orgId, roomId, mediaPath) => {
  const room = await getRoomById(orgId, roomId);
  await supabase.storage.from('room-media').remove([mediaPath]);

  const updatedMedia = (room.media || []).filter(m => m.path !== mediaPath);

  const { data, error } = await supabase
    .from('rooms')
    .update({ media: updatedMedia })
    .eq('org_id', orgId)
    .eq('id', roomId)
    .select()
    .single();

  if (error) throw new AppError(`Failed to update media: ${error.message}`, 500);
  return data;
};

// ─── Room Type Media ──────────────────────────────────────

export const uploadRoomTypeMedia = async (orgId, typeId, file) => {
  const ALLOWED = ['image/jpeg','image/png','image/webp','image/gif'];
  if (!ALLOWED.includes(file.mimetype)) throw new AppError('Invalid file type. Images only.', 400);
  if (file.size > 2 * 1024 * 1024) throw new AppError('File too large. Max 2MB.', 400);

  const { data: type, error: typeErr } = await supabase
    .from('room_types').select('id, media').eq('org_id', orgId).eq('id', typeId).single();
  if (typeErr || !type) throw new AppError('Room type not found.', 404);

  const currentMedia = type.media || [];

  if (currentMedia.length > 0) {
    const oldPaths = currentMedia.map(m => m.path).filter(Boolean);
    if (oldPaths.length > 0) await supabase.storage.from('room-media').remove(oldPaths);
  }

  const ext       = file.originalname.split('.').pop().toLowerCase();
  const filename  = `room-types/${typeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const mediaType = file.mimetype === 'image/gif' ? 'gif' : 'image';

  const { error: uploadError } = await supabase.storage
    .from('room-media')
    .upload(filename, file.buffer, { contentType: file.mimetype, cacheControl: '3600', upsert: false });

  if (uploadError) throw new AppError(`Upload failed: ${uploadError.message}`, 500);

  const { data: { publicUrl } } = supabase.storage.from('room-media').getPublicUrl(filename);

  const updatedMedia = [{
    url: publicUrl, path: filename, type: mediaType,
    name: file.originalname, size: file.size, added_at: new Date().toISOString(),
  }];

  const { data, error } = await supabase
    .from('room_types')
    .update({ media: updatedMedia })
    .eq('org_id', orgId).eq('id', typeId)
    .select().single();

  if (error) throw new AppError(`Failed to save media: ${error.message}`, 500);
  return data;
};

export const deleteRoomTypeMedia = async (orgId, typeId, mediaPath) => {
  const { data: type, error: typeErr } = await supabase
    .from('room_types').select('id, media').eq('org_id', orgId).eq('id', typeId).single();
  if (typeErr || !type) throw new AppError('Room type not found.', 404);

  await supabase.storage.from('room-media').remove([mediaPath]);

  const updatedMedia = (type.media || []).filter(m => m.path !== mediaPath);

  const { data, error } = await supabase
    .from('room_types')
    .update({ media: updatedMedia })
    .eq('org_id', orgId).eq('id', typeId)
    .select().single();

  if (error) throw new AppError(`Failed to update media: ${error.message}`, 500);
  return data;
};
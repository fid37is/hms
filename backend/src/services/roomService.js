// src/services/roomService.js

import { supabase }    from '../config/supabase.js';
import { AppError }    from '../middleware/errorHandler.js';
import { ROOM_STATUS } from '../config/constants.js';

// ─── Room Types ───────────────────────────────────────────

export const getAllRoomTypes = async () => {
  const { data, error } = await supabase
    .from('room_types')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw new AppError('Failed to fetch room types.', 500);
  return data;
};

export const getRoomTypeById = async (id) => {
  const { data, error } = await supabase
    .from('room_types')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) throw new AppError('Room type not found.', 404);
  return data;
};

export const createRoomType = async (payload) => {
  const { data, error } = await supabase
    .from('room_types')
    .insert(payload)
    .select()
    .single();

  if (error) throw new AppError('Failed to create room type.', 500);
  return data;
};

export const updateRoomType = async (id, payload) => {
  const existing = await getRoomTypeById(id);
  if (!existing) throw new AppError('Room type not found.', 404);

  const { data, error } = await supabase
    .from('room_types')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update room type.', 500);
  return data;
};

export const deleteRoomType = async (id) => {
  const { data: rooms } = await supabase
    .from('rooms')
    .select('id')
    .eq('type_id', id)
    .eq('is_deleted', false)
    .limit(1);

  if (rooms && rooms.length > 0) {
    throw new AppError('Cannot delete a room type that has rooms assigned to it.', 409);
  }

  const { error } = await supabase
    .from('room_types')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw new AppError('Failed to delete room type.', 500);
  return { message: 'Room type deleted successfully.' };
};

// ─── Rate Plans ───────────────────────────────────────────

export const getRatePlans = async (roomTypeId) => {
  const { data, error } = await supabase
    .from('rate_plans')
    .select('*')
    .eq('room_type_id', roomTypeId)
    .eq('is_active', true)
    .order('name');

  if (error) throw new AppError('Failed to fetch rate plans.', 500);
  return data;
};

export const createRatePlan = async (payload) => {
  const { data, error } = await supabase
    .from('rate_plans')
    .insert(payload)
    .select()
    .single();

  if (error) throw new AppError('Failed to create rate plan.', 500);
  return data;
};

export const updateRatePlan = async (id, payload) => {
  const { data, error } = await supabase
    .from('rate_plans')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) throw new AppError('Failed to update rate plan.', 500);
  return data;
};

export const deleteRatePlan = async (id) => {
  const { error } = await supabase
    .from('rate_plans')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw new AppError('Failed to delete rate plan.', 500);
  return { message: 'Rate plan deleted successfully.' };
};

// ─── Rooms ────────────────────────────────────────────────

export const getAllRooms = async (filters = {}) => {
  let query = supabase
    .from('rooms')
    .select(`
      id,
      number,
      floor,
      status,
      is_blocked,
      block_reason,
      notes,
      type_id,
      room_types (
        id,
        name,
        base_rate,
        max_occupancy,
        amenities
      )
    `)
    .eq('is_deleted', false)
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

export const getRoomById = async (id) => {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      id,
      number,
      floor,
      status,
      is_blocked,
      block_reason,
      notes,
      type_id,
      room_types (
        id,
        name,
        base_rate,
        max_occupancy,
        amenities
      )
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error || !data) throw new AppError('Room not found.', 404);
  return data;
};

export const createRoom = async (payload) => {
  const { data: existing } = await supabase
    .from('rooms')
    .select('id')
    .eq('number', payload.number)
    .eq('is_deleted', false)
    .single();

  if (existing) {
    throw new AppError(`Room number ${payload.number} already exists.`, 409);
  }

  const { data, error } = await supabase
    .from('rooms')
    .insert(payload)
    .select()
    .single();

  if (error) throw new AppError('Failed to create room.', 500);
  return data;
};

export const updateRoom = async (id, payload) => {
  await getRoomById(id);

  if (payload.number) {
    const { data: existing } = await supabase
      .from('rooms')
      .select('id')
      .eq('number', payload.number)
      .neq('id', id)
      .eq('is_deleted', false)
      .single();

    if (existing) {
      throw new AppError(`Room number ${payload.number} already exists.`, 409);
    }
  }

  const { data, error } = await supabase
    .from('rooms')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update room.', 500);
  return data;
};

export const updateRoomStatus = async (id, status, notes = null) => {
  await getRoomById(id);

  const updatePayload = { status };
  if (notes) updatePayload.notes = notes;

  const { data, error } = await supabase
    .from('rooms')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update room status.', 500);
  return data;
};

export const blockRoom = async (id, reason) => {
  await getRoomById(id);

  const { data, error } = await supabase
    .from('rooms')
    .update({
      is_blocked:   true,
      block_reason: reason,
      status:       ROOM_STATUS.OUT_OF_ORDER,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to block room.', 500);
  return data;
};

export const unblockRoom = async (id) => {
  await getRoomById(id);

  const { data, error } = await supabase
    .from('rooms')
    .update({
      is_blocked:   false,
      block_reason: null,
      status:       ROOM_STATUS.AVAILABLE,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to unblock room.', 500);
  return data;
};

export const deleteRoom = async (id) => {
  const room = await getRoomById(id);

  if (room.status === ROOM_STATUS.OCCUPIED) {
    throw new AppError('Cannot delete a room that is currently occupied.', 409);
  }

  const { error } = await supabase
    .from('rooms')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) throw new AppError('Failed to delete room.', 500);
  return { message: 'Room deleted successfully.' };
};

export const getAvailableRooms = async (checkIn, checkOut, typeId = null) => {
  // Get all room IDs that have overlapping reservations
  const { data: occupied } = await supabase
    .from('reservations')
    .select('room_id')
    .in('status', ['confirmed', 'checked_in'])
    .lt('check_in_date', checkOut)
    .gt('check_out_date', checkIn);

  const occupiedIds = (occupied || []).map((r) => r.room_id).filter(Boolean);

  let query = supabase
    .from('rooms')
    .select(`
      id,
      number,
      floor,
      status,
      type_id,
      room_types (
        id,
        name,
        base_rate,
        max_occupancy,
        amenities
      )
    `)
    .eq('is_deleted', false)
    .eq('is_blocked', false)
    .in('status', [ROOM_STATUS.AVAILABLE, ROOM_STATUS.CLEAN])
    .order('number');

  if (occupiedIds.length > 0) {
    query = query.not('id', 'in', `(${occupiedIds.join(',')})`);
  }

  if (typeId) {
    query = query.eq('type_id', typeId);
  }

  const { data, error } = await query;
  if (error) throw new AppError('Failed to fetch available rooms.', 500);
  return data;
};

// ─── Media ────────────────────────────────────────────────

export const uploadRoomMedia = async (roomId, file) => {
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024;  // 2MB
  const MAX_VIDEO_SIZE = 5 * 1024 * 1024;  // 5MB
  const ALLOWED_TYPES  = ['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'];

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new AppError('Invalid file type. Allowed: JPG, PNG, WebP, GIF, MP4, WebM.', 400);
  }

  const isVideo = file.mimetype.startsWith('video/');
  const limit   = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > limit) {
    throw new AppError(`File too large. Max ${isVideo ? '5MB for video' : '2MB for images/GIFs'}.`, 400);
  }

  // Check current media count
  const room = await getRoomById(roomId);
  const currentMedia = room.media || [];
  if (currentMedia.length >= 5) {
    throw new AppError('Maximum 5 media files per room.', 400);
  }

  const ext      = file.originalname.split('.').pop().toLowerCase();
  const filename = `rooms/${roomId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const type     = file.mimetype === 'image/gif' ? 'gif' : isVideo ? 'video' : 'image';

  const { error: uploadError } = await supabase.storage
    .from('room-media')
    .upload(filename, file.buffer, {
      contentType:  file.mimetype,
      cacheControl: '3600',
      upsert:       false,
    });

  if (uploadError) throw new AppError(`Upload failed: ${uploadError.message}`, 500);

  const { data: { publicUrl } } = supabase.storage
    .from('room-media')
    .getPublicUrl(filename);

  const mediaItem = {
    url:      publicUrl,
    path:     filename,
    type,
    name:     file.originalname,
    size:     file.size,
    added_at: new Date().toISOString(),
  };

  const updatedMedia = [...currentMedia, mediaItem];

  const { data, error } = await supabase
    .from('rooms')
    .update({ media: updatedMedia })
    .eq('id', roomId)
    .select()
    .single();

  if (error) throw new AppError(`Failed to save media: ${error.message}`, 500);
  return data;
};

export const deleteRoomMedia = async (roomId, mediaPath) => {
  const room = await getRoomById(roomId);
  const currentMedia = room.media || [];

  // Remove from storage
  await supabase.storage.from('room-media').remove([mediaPath]);

  // Remove from room record
  const updatedMedia = currentMedia.filter(m => m.path !== mediaPath);

  const { data, error } = await supabase
    .from('rooms')
    .update({ media: updatedMedia })
    .eq('id', roomId)
    .select()
    .single();

  if (error) throw new AppError(`Failed to update media: ${error.message}`, 500);
  return data;
};
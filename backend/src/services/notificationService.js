// src/services/notificationService.js
//
// Creates notifications in DB and emits them to connected staff via socket.io
//
// Usage from any controller:
//   import { notify } from '../services/notificationService.js';
//   notify(req.app, {
//     orgId,
//     type:   'checkin',
//     title:  'Guest Checked In',
//     body:   'John Doe checked into Room 204',
//     link:   '/reservations',
//     userId: null,  // null = broadcast to all staff in org
//   });

import { supabase } from '../config/supabase.js';

// ── Create + emit ────────────────────────────────────────────────────────────
export const notify = async (app, { orgId, userId = null, type, title, body, link = null }) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ org_id: orgId, user_id: userId, type, title, body, link })
      .select()
      .single();

    if (error) { console.error('[notify] DB insert error:', error.message); return null; }

    const io = app.get('io');
    if (io) {
      const payload = { notification: data };
      if (userId) {
        // Targeted — emit only to that user's socket room
        io.to(`user:${userId}`).emit('notification', payload);
      } else {
        // Broadcast to all staff in this org
        io.to(`org:${orgId}`).emit('notification', payload);
      }
    }

    return data;
  } catch (err) {
    console.error('[notify] error:', err.message);
    return null;
  }
};

// ── Fetch for a user ─────────────────────────────────────────────────────────
export const getNotifications = async (orgId, userId, { limit = 30, unreadOnly = false } = {}) => {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('org_id', orgId)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.eq('read', false);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

// ── Mark one as read ─────────────────────────────────────────────────────────
export const markRead = async (orgId, userId, notificationId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('org_id', orgId)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ── Mark all as read ─────────────────────────────────────────────────────────
export const markAllRead = async (orgId, userId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('org_id', orgId)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq('read', false);

  if (error) throw error;
};

// ── Unread count ─────────────────────────────────────────────────────────────
export const getUnreadCount = async (orgId, userId) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq('read', false);

  if (error) throw error;
  return count || 0;
};
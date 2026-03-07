// src/services/conversationService.js
import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Guest-facing ─────────────────────────────────────────────────────────────

export const getOrCreateConversation = async (orgId, reservationId, guestId, departmentId) => {
  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, status, guest_id')
    .eq('id', reservationId)
    .eq('org_id', orgId)
    .eq('guest_id', guestId)
    .single();

  if (!reservation) throw new AppError('Reservation not found.', 404);
  if (reservation.status !== 'checked_in')
    throw new AppError('Chat is only available during your stay.', 403);

  // Return existing open conversation if one exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('*, chat_departments(id, name, icon)')
    .eq('org_id', orgId)
    .eq('reservation_id', reservationId)
    .eq('department_id', departmentId)
    .eq('guest_id', guestId)
    .eq('status', 'open')
    .maybeSingle();

  if (existing) return existing;

  // No open conversation — always insert a fresh one
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      org_id: orgId,
      reservation_id: reservationId,
      guest_id: guestId,
      department_id: departmentId,
      status: 'open',
    })
    .select('*, chat_departments(id, name, icon)')
    .single();

  if (error) throw new AppError(`Failed to start conversation: ${error.message}`, 500);
  return data;
};

export const getGuestConversations = async (orgId, reservationId, guestId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      chat_departments(id, name, icon),
      messages(id, content, sender_type, created_at, read_at)
    `)
    .eq('org_id', orgId)
    .eq('reservation_id', reservationId)
    .eq('guest_id', guestId)
    .order('last_message_at', { ascending: false });

  if (error) throw new AppError('Failed to fetch conversations.', 500);
  return data;
};

export const getConversationMessages = async (orgId, conversationId, requesterId, requesterType) => {
  const { data: convo } = await supabase
    .from('conversations')
    .select('id, guest_id, department_id')
    .eq('id', conversationId)
    .eq('org_id', orgId)
    .single();

  if (!convo) throw new AppError('Conversation not found.', 404);

  if (requesterType === 'guest' && convo.guest_id !== requesterId)
    throw new AppError('Access denied.', 403);

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw new AppError('Failed to fetch messages.', 500);

  // Mark messages from OTHER party as read
  const unread = data
    .filter(m => m.sender_type !== requesterType && !m.read_at)
    .map(m => m.id);

  if (unread.length > 0) {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', unread);
  }

  return data;
};

export const sendMessage = async ({ orgId, conversationId, senderType, senderId, senderName, content }) => {
  const { data: convo } = await supabase
    .from('conversations')
    .select('id, guest_id, department_id, status')
    .eq('id', conversationId)
    .eq('org_id', orgId)
    .single();

  if (!convo) throw new AppError('Conversation not found.', 404);
  if (convo.status === 'closed') throw new AppError('This conversation is closed.', 400);

  if (senderType === 'guest' && convo.guest_id !== senderId)
    throw new AppError('Access denied.', 403);

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_type: senderType, sender_id: senderId, sender_name: senderName, content })
    .select()
    .single();

  if (error) throw new AppError('Failed to send message.', 500);

  await supabase
    .from('conversations')
    .update({ last_message_at: message.created_at, status: 'open' })
    .eq('id', conversationId);

  return { message, departmentId: convo.department_id };
};

// ─── Staff-facing ─────────────────────────────────────────────────────────────

export const getDepartmentConversations = async (orgId, departmentId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      guests(id, full_name, email),
      reservations(id, reservation_no, check_in_date, check_out_date, room_id,
        rooms(number)
      ),
      messages(id, content, sender_type, created_at, read_at)
    `)
    .eq('org_id', orgId)
    .eq('department_id', departmentId)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw new AppError('Failed to fetch conversations.', 500);
  return data;
};

export const getAllConversations = async (orgId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      chat_departments(id, name, icon),
      guests(id, full_name, email),
      reservations(id, reservation_no, rooms(number)),
      messages(id, content, sender_type, created_at, read_at)
    `)
    .eq('org_id', orgId)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw new AppError(`Failed to fetch conversations: ${error.message}`, 500);
  return data;
};

export const closeConversation = async (orgId, conversationId) => {
  const { data, error } = await supabase
    .from('conversations')
    .update({ status: 'closed' })
    .eq('id', conversationId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw new AppError('Failed to close conversation.', 500);
  return data;
};

export const getUnreadCountByDepartment = async (orgId, departmentId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversations!inner(department_id, org_id)')
    .eq('conversations.org_id', orgId)
    .eq('conversations.department_id', departmentId)
    .eq('sender_type', 'guest')
    .is('read_at', null);

  if (error) return 0;
  return data?.length ?? 0;
};
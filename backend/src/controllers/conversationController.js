// src/controllers/conversationController.js
import * as conversationService from '../services/conversationService.js';
import { notify }               from '../services/notificationService.js';
import { notifyGuest }          from '../services/guestNotificationService.js';
import { supabase }             from '../config/supabase.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

// ─── Guest-facing ─────────────────────────────────────────────────────────────

export const startConversation = async (req, res, next) => {
  try {
    const { reservation_id, department_id } = req.body;
    const orgId   = req.orgId;
    const guestId = req.guest.sub;
    const data = await conversationService.getOrCreateConversation(orgId, reservation_id, guestId, department_id);
    return sendCreated(res, data, 'Conversation started.');
  } catch (err) { next(err); }
};

export const getMyConversations = async (req, res, next) => {
  try {
    const { reservation_id } = req.query;
    const orgId   = req.orgId;
    const guestId = req.guest.sub;
    const data = await conversationService.getGuestConversations(orgId, reservation_id, guestId);
    return sendSuccess(res, data, 'Conversations retrieved.');
  } catch (err) { next(err); }
};

export const getMessages = async (req, res, next) => {
  try {
    const orgId         = req.orgId || req.guest?.org_id;
    const isGuest       = !!req.guest;
    const requesterId   = isGuest ? req.guest.sub  : req.user.sub;
    const requesterType = isGuest ? 'guest'         : 'staff';
    const data = await conversationService.getConversationMessages(orgId, req.params.id, requesterId, requesterType);
    return sendSuccess(res, data, 'Messages retrieved.');
  } catch (err) { next(err); }
};

export const sendMessage = async (req, res, next) => {
  try {
    const orgId      = req.orgId || req.guest?.org_id;
    const { content } = req.body;
    const isGuest    = !!req.guest;
    const senderId   = isGuest ? req.guest.sub              : req.user.sub;
    const senderName = isGuest ? req.guest.full_name        : req.user.full_name || 'Staff';
    const senderType = isGuest ? 'guest'                    : 'staff';

    const { message, departmentId } = await conversationService.sendMessage({
      orgId, conversationId: req.params.id, senderType, senderId, senderName, content,
    });

    // Fetch conversation meta for notification targeting
    const { data: conv } = await supabase
      .from('conversations')
      .select('guest_id, reservation_id, chat_departments(name)')
      .eq('id', req.params.id)
      .maybeSingle();

    const io = req.app.get('io');
    if (io) {
      io.to(`conv:${req.params.id}`).emit('new_message', { conversationId: req.params.id, message });
      io.to(`dept:${departmentId}`).except(`conv:${req.params.id}`).emit('new_message', { conversationId: req.params.id, message });
    }

    if (isGuest) {
      // Guest sent a message — notify HMS staff via bell
      const deptName = conv?.chat_departments?.name || '';
      notify(req.app, {
        orgId,
        type:  'reservation',
        title: 'New Guest Message',
        body:  `${senderName || 'Guest'}${deptName ? ` → ${deptName}` : ''}: ${content.slice(0, 80)}${content.length > 80 ? '…' : ''}`,
        link:  '/chat',
      });
    } else {
      // Staff sent a message — notify the guest via socket
      if (conv) {
        notifyGuest(req.app, {
          guestId:       conv.guest_id       || null,
          reservationId: conv.reservation_id || null,
          type:          'new_chat_message',
          conversationId: req.params.id,
          senderName:    senderName || 'Hotel Staff',
          deptName:      conv.chat_departments?.name || '',
          preview:       content.slice(0, 100),
        });
      }
    }

    return sendCreated(res, message, 'Message sent.');
  } catch (err) { next(err); }
};

// ─── Staff-facing ─────────────────────────────────────────────────────────────

export const getDepartmentConversations = async (req, res, next) => {
  try {
    const data = await conversationService.getDepartmentConversations(req.orgId, req.params.departmentId);
    return sendSuccess(res, data, 'Conversations retrieved.');
  } catch (err) { next(err); }
};

export const getAllConversations = async (req, res, next) => {
  try {
    const data = await conversationService.getAllConversations(req.orgId);
    return sendSuccess(res, data, 'Conversations retrieved.');
  } catch (err) { next(err); }
};

export const closeConversation = async (req, res, next) => {
  try {
    const data = await conversationService.closeConversation(req.orgId, req.params.id);
    const io = req.app.get('io');
    if (io) io.to(`conv:${req.params.id}`).emit('conversation_closed', { conversationId: req.params.id });
    return sendSuccess(res, data, 'Conversation closed.');
  } catch (err) { next(err); }
};

export const getUnreadCounts = async (req, res, next) => {
  try {
    const count = await conversationService.getUnreadCountByDepartment(req.orgId, req.params.departmentId);
    return sendSuccess(res, { count }, 'Unread count retrieved.');
  } catch (err) { next(err); }
};
// src/controllers/notificationController.js

import * as notifService from '../services/notificationService.js';
import { sendSuccess }   from '../utils/response.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { unread_only, limit } = req.query;
    const data = await notifService.getNotifications(
      req.orgId,
      req.user.sub,
      { unreadOnly: unread_only === 'true', limit: Number(limit || 30) }
    );
    return sendSuccess(res, data, 'Notifications retrieved.');
  } catch (err) { next(err); }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notifService.getUnreadCount(req.orgId, req.user.sub);
    return sendSuccess(res, { count }, 'Unread count retrieved.');
  } catch (err) { next(err); }
};

export const markRead = async (req, res, next) => {
  try {
    const data = await notifService.markRead(req.orgId, req.user.sub, req.params.id);
    return sendSuccess(res, data, 'Notification marked as read.');
  } catch (err) { next(err); }
};

export const markAllRead = async (req, res, next) => {
  try {
    await notifService.markAllRead(req.orgId, req.user.sub);
    return sendSuccess(res, null, 'All notifications marked as read.');
  } catch (err) { next(err); }
};
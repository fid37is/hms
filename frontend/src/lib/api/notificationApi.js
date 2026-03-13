// src/lib/api/notificationApi.js
import api from '../axios';

export const getNotifications = (params = {}) => api.get('/notifications', { params });
export const getUnreadCount   = ()             => api.get('/notifications/unread-count');
export const markRead         = (id)           => api.patch(`/notifications/${id}/read`);
export const markAllRead      = ()             => api.patch('/notifications/read-all');
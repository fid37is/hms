// src/hooks/useNotifications.js
//
// Single source of truth for all notification state.
// Listens on the shared socket (or creates one) for real-time pushes,
// and also loads historical notifications from REST on mount.

import { useState, useEffect, useRef, useCallback } from 'react';
import { io }               from 'socket.io-client';
import { useAuthStore }     from '../store/authStore';
import * as notifApi        from '../lib/api/notificationApi';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

export function useNotifications() {
  const { token } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const socketRef = useRef(null);

  // ── Load from REST on mount ──────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    try {
      const res = await notifApi.getNotifications({ limit: 40 });
      setNotifications(res.data.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // ── Socket — listen for real-time pushes ────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const s = io(SOCKET_URL, {
      auth:       { token },
      transports: ['websocket'],
      reconnectionDelay: 1000,
    });

    s.on('notification', ({ notification }) => {
      setNotifications(prev => {
        // Deduplicate
        if (prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
    });

    socketRef.current = s;
    return () => { s.disconnect(); socketRef.current = null; };
  }, [token]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const markRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try { await notifApi.markRead(id); } catch (_) {}
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await notifApi.markAllRead(); } catch (_) {}
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, loading, unreadCount, markRead, markAllRead };
}
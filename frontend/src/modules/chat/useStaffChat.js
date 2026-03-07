// HMS/frontend/src/modules/chat/useStaffChat.js
//
// Socket.io + API state for the staff chat inbox.
// Filters conversations to the logged-in staff member's department.
// Admins and staff with no department assigned see everything.

import { useState, useEffect, useRef, useCallback } from 'react';
import { io }            from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import toast             from 'react-hot-toast';
import * as conversationApi from '../../lib/api/conversationApi';
import * as departmentApi   from '../../lib/api/departmentApi';
import { useAuthStore }     from '../../store/authStore';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

export function useStaffChat() {
  const { user, token }   = useAuthStore();
  const queryClient       = useQueryClient();

  const isAdmin           = user?.role?.toLowerCase() === 'admin';
  const staffDeptName     = user?.department || null;

  const [socket,          setSocket]          = useState(null);
  const [connected,       setConnected]       = useState(false);
  const [departments,     setDepartments]     = useState([]);
  const [conversations,   setConversations]   = useState([]);
  const [activeDeptId,    setActiveDeptId]    = useState(null);
  const [activeConv,      setActiveConv]      = useState(null);
  const [messages,        setMessages]        = useState({});
  const [isLoading,       setIsLoading]       = useState(true);
  const [isTyping,        setIsTyping]        = useState({});
  const typingTimers      = useRef({});

  // ── Load departments ─────────────────────────────────────────────────────
  useEffect(() => {
    departmentApi.getAllDepartments()
      .then(res => {
        const all = res.data.data || [];
        if (staffDeptName && !isAdmin) {
          const matched = all.filter(d =>
            d.name.toLowerCase() === staffDeptName.toLowerCase()
          );
          setDepartments(matched);
          if (matched.length === 1) setActiveDeptId(matched[0].id);
        } else {
          setDepartments(all);
        }
      })
      .catch(() => {});
  }, [staffDeptName, isAdmin]);

  // ── Load conversations ───────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = activeDeptId
        ? await conversationApi.getDepartmentConversations(activeDeptId)
        : await conversationApi.getAllConversations();
      setConversations(res.data.data || []);
    } catch {}
    finally { setIsLoading(false); }
  }, [activeDeptId]);

  useEffect(() => { loadConversations(); }, [activeDeptId]);

  // ── Load messages for a conversation ────────────────────────────────────
  const loadMessages = useCallback(async (convId) => {
    try {
      const res = await conversationApi.getMessages(convId);
      setMessages(prev => ({ ...prev, [convId]: res.data.data || [] }));
    } catch {}
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (convId, content) => {
    const res = await conversationApi.sendMessage(convId, content);
    const msg = res.data.data;
    setMessages(prev => ({ ...prev, [convId]: [...(prev[convId] || []), msg] }));
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, last_message_at: msg.created_at } : c
    ));
    return msg;
  }, []);

  // ── Close conversation ───────────────────────────────────────────────────
  const closeConversation = useCallback(async (convId) => {
    await conversationApi.closeConversation(convId);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, status: 'closed' } : c));
    if (activeConv?.id === convId) setActiveConv(prev => ({ ...prev, status: 'closed' }));
  }, [activeConv]);

  // ── Socket connection ────────────────────────────────────────────────────
  // NOTE: do NOT join rooms inside s.on('connect') — departments is still []
  // at that point due to the async fetch. Room joining is handled separately below.
  useEffect(() => {
    if (!token) return;

    const s = io(SOCKET_URL, {
      auth:       { token },
      transports: ['websocket'],
      reconnectionDelay: 1000,
    });

    s.on('connect',    () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    s.on('new_message', ({ conversationId, message }) => {
      setMessages(prev => {
        if (!prev[conversationId]) return prev;
        const exists = prev[conversationId].some(m => m.id === message.id);
        if (exists) return prev;
        return { ...prev, [conversationId]: [...prev[conversationId], message] };
      });
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, last_message_at: message.created_at } : c
      ));
      loadConversations();
      if (message.sender_type === 'guest') {
        toast('💬 New guest message', { duration: 3000, id: `msg-${message.id}` });
      }
    });

    s.on('typing', ({ conversationId }) => {
      setIsTyping(prev => ({ ...prev, [conversationId]: true }));
      clearTimeout(typingTimers.current[conversationId]);
      typingTimers.current[conversationId] = setTimeout(() => {
        setIsTyping(prev => ({ ...prev, [conversationId]: false }));
      }, 3000);
    });

    s.on('stop_typing', ({ conversationId }) => {
      setIsTyping(prev => ({ ...prev, [conversationId]: false }));
    });

    s.on('conversation_closed', ({ conversationId }) => {
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, status: 'closed' } : c
      ));
    });

    setSocket(s);
    return () => s.disconnect();
  }, [token]);

  // ── Join socket rooms ────────────────────────────────────────────────────
  // Runs whenever socket, connection state, activeDeptId, OR departments changes.
  // This fixes the race condition: when the socket first connects, departments is
  // still [] (the API call hasn't resolved yet). This effect fires again once
  // departments loads, ensuring staff always join their correct room(s).
  useEffect(() => {
    if (!socket || !connected) return;

    if (activeDeptId) {
      socket.emit('join_department', { departmentId: activeDeptId });
    } else {
      departments.forEach(d => socket.emit('join_department', { departmentId: d.id }));
    }
  }, [socket, connected, activeDeptId, departments]);

  const emitTyping     = (convId) => socket?.emit('typing',      { conversationId: convId });
  const emitStopTyping = (convId) => socket?.emit('stop_typing', { conversationId: convId });

  const unreadTotal = conversations.filter(c =>
    (c.messages || []).some(m => m.sender_type === 'guest' && !m.read_at)
  ).length;

  return {
    connected, socket,
    departments, conversations,
    activeDeptId, setActiveDeptId,
    activeConv,   setActiveConv,
    messages,     isTyping,
    isLoading,    unreadTotal,
    loadMessages, sendMessage, closeConversation,
    emitTyping,   emitStopTyping,
    isAdmin,      staffDeptName,
  };
}
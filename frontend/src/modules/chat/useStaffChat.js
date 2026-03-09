// HMS/frontend/src/modules/chat/useStaffChat.js
//
// Single source of truth for all chat state + socket.
// ThreadPanel receives everything as props — never calls this hook directly.

import { useState, useEffect, useRef, useCallback } from 'react';
import { io }               from 'socket.io-client';
import toast                from 'react-hot-toast';
import * as conversationApi from '../../lib/api/conversationApi';
import * as departmentApi   from '../../lib/api/departmentApi';
import { useAuthStore }     from '../../store/authStore';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

export function useStaffChat() {
  const { user, token } = useAuthStore();

  const isAdmin       = user?.role?.toLowerCase() === 'admin';
  const isFrontDesk   = user?.department?.toLowerCase() === 'front desk';
  const staffDeptName = user?.department || null;

  const [socket,        setSocket]        = useState(null);
  const [connected,     setConnected]     = useState(false);
  const [departments,   setDepartments]   = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeDeptId,  setActiveDeptId]  = useState(null);
  const [activeConv,    setActiveConv]    = useState(null);
  const [messages,      setMessages]      = useState({});
  const [isLoading,     setIsLoading]     = useState(true);
  const [isTyping,      setIsTyping]      = useState({});
  const typingTimers = useRef({});

  // ── Load departments ────────────────────────────────────────────────────
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

  // ── Load conversations — re-fetches whenever activeDeptId changes ───────
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

  // ── Load messages for active conversation ───────────────────────────────
  const loadMessages = useCallback(async (convId) => {
    try {
      const res = await conversationApi.getMessages(convId);
      setMessages(prev => ({ ...prev, [convId]: res.data.data || [] }));
    } catch {}
  }, []);

  // ── Send message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (convId, content) => {
    const res = await conversationApi.sendMessage(convId, content);
    const msg = res.data.data;
    setMessages(prev => ({ ...prev, [convId]: [...(prev[convId] || []), msg] }));
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, last_message_at: msg.created_at } : c
    ));
    return msg;
  }, []);

  // ── Close conversation ──────────────────────────────────────────────────
  const closeConversation = useCallback(async (convId) => {
    await conversationApi.closeConversation(convId);
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, status: 'closed' } : c
    ));
    setActiveConv(prev => prev?.id === convId ? { ...prev, status: 'closed' } : prev);
  }, []);

  // ── Socket — single instance, stable across React 18 Strict Mode ────────
  useEffect(() => {
    if (!token) return;

    // React 18 Strict Mode mounts → unmounts → remounts in dev.
    // We ignore the first cleanup so the socket isn't killed mid-handshake.
    let isMounted = true;

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionDelay: 1000,
    });

    s.on('connect',    () => { if (isMounted) setConnected(true); });
    s.on('disconnect', () => { if (isMounted) setConnected(false); });

    s.on('new_message', ({ conversationId, message }) => {
      if (!isMounted) return;
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
      if (!isMounted) return;
      setIsTyping(prev => ({ ...prev, [conversationId]: true }));
      clearTimeout(typingTimers.current[conversationId]);
      typingTimers.current[conversationId] = setTimeout(() =>
        setIsTyping(prev => ({ ...prev, [conversationId]: false })), 3000);
    });

    s.on('stop_typing', ({ conversationId }) => {
      if (isMounted) setIsTyping(prev => ({ ...prev, [conversationId]: false }));
    });

    s.on('conversation_closed', ({ conversationId }) => {
      if (!isMounted) return;
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, status: 'closed' } : c));
      setActiveConv(prev => prev?.id === conversationId ? { ...prev, status: 'closed' } : prev);
    });

    if (isMounted) setSocket(s);

    return () => {
      isMounted = false;
      s.disconnect();
    };
  }, [token]);

  // ── Join dept socket rooms — runs after departments load ────────────────
  useEffect(() => {
    if (!socket || !connected) return;
    if (activeDeptId) {
      socket.emit('join_department', { departmentId: activeDeptId });
    } else {
      departments.forEach(d => socket.emit('join_department', { departmentId: d.id }));
    }
  }, [socket, connected, activeDeptId, departments]);

  // Exposed so ThreadPanel can join/leave via props (not by calling the hook)
  const joinConversation  = useCallback((convId) => socket?.emit('join_conversation',  { conversationId: convId }), [socket]);
  const leaveConversation = useCallback((convId) => socket?.emit('leave_conversation', { conversationId: convId }), [socket]);
  const emitTyping        = useCallback((convId) => socket?.emit('typing',             { conversationId: convId }), [socket]);
  const emitStopTyping    = useCallback((convId) => socket?.emit('stop_typing',        { conversationId: convId }), [socket]);

  const unreadTotal = conversations.filter(c =>
    (c.messages || []).some(m => m.sender_type === 'guest' && !m.read_at)
  ).length;

  return {
    connected,
    departments, conversations,
    activeDeptId, setActiveDeptId,
    activeConv,   setActiveConv,
    messages,     isTyping,
    isLoading,    unreadTotal,
    loadMessages, sendMessage, closeConversation,
    emitTyping,   emitStopTyping,
    joinConversation, leaveConversation,
    isAdmin, isFrontDesk, staffDeptName,
  };
}
// HMS/frontend/src/modules/chat/useUnreadCount.js
//
// Lightweight hook used by Sidebar to show unread badge on the Chat nav item.
// Polls every 30s — once on the chat page itself the full socket connection takes over.

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import * as conversationApi from '../../lib/api/conversationApi';
import * as departmentApi   from '../../lib/api/departmentApi';

export function useUnreadCount() {
  const { user } = useAuthStore();
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    try {
      const isAdmin      = user?.role?.toLowerCase() === 'admin';
      const staffDeptName = user?.department || null;

      let conversations = [];

      if (isAdmin || !staffDeptName) {
        const res = await conversationApi.getAllConversations();
        conversations = res.data.data || [];
      } else {
        // Find the matching chat department first
        const deptRes = await departmentApi.getAllDepartments();
        const depts   = deptRes.data.data || [];
        const matched = depts.find(d => d.name.toLowerCase() === staffDeptName.toLowerCase());
        if (matched) {
          const res = await conversationApi.getDepartmentConversations(matched.id);
          conversations = res.data.data || [];
        }
      }

      const unread = conversations.filter(c =>
        (c.messages || []).some(m => m.sender_type === 'guest' && !m.read_at)
      ).length;

      setCount(unread);
    } catch {}
  };

  useEffect(() => {
    if (!user) return;
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  return count;
}
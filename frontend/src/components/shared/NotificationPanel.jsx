// src/components/shared/NotificationPanel.jsx

import { useRef, useEffect } from 'react';
import { useNavigate }       from 'react-router-dom';
import { Bell, Check, CheckCheck, Calendar, LogIn, LogOut, Wrench, Brush, X } from 'lucide-react';

const TYPE_META = {
  checkin:     { icon: LogIn,    color: 'var(--s-green-text)', bg: 'var(--s-green-bg)' },
  checkout:    { icon: LogOut,   color: 'var(--s-yellow-text)', bg: 'var(--s-yellow-bg)' },
  reservation: { icon: Calendar, color: 'var(--brand)',        bg: 'var(--brand-subtle)' },
  maintenance: { icon: Wrench,   color: 'var(--s-red-text)',   bg: 'var(--s-red-bg)' },
  housekeeping:{ icon: Brush,    color: 'var(--text-sub)',     bg: 'var(--bg-subtle)' },
  fnb:         { icon: Bell,     color: 'var(--accent)',       bg: 'var(--brand-subtle)' },
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationPanel({ notifications, onMarkRead, onMarkAllRead, onClose }) {
  const navigate  = useNavigate();
  const panelRef  = useRef(null);
  const unread    = notifications.filter(n => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleClick = (n) => {
    if (!n.read) onMarkRead(n.id);
    if (n.link)  navigate(n.link);
    onClose();
  };

  return (
    <div ref={panelRef}
      className="absolute right-0 top-full mt-2 z-50 rounded-xl shadow-xl overflow-hidden"
      style={{
        width: 360,
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-soft)',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-soft)' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Notifications</span>
          {unread > 0 && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--brand)', color: '#fff', lineHeight: 1.4 }}>
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button onClick={onMarkAllRead}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors"
              style={{ color: 'var(--brand)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-subtle)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Mark all as read">
              <CheckCheck size={13} /> All read
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-md"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Bell size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.reservation;
            const Icon = meta.icon;
            return (
              <button key={n.id}
                onClick={() => handleClick(n)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                style={{
                  backgroundColor: n.read ? 'transparent' : 'var(--brand-subtle)',
                  borderBottom: '1px solid var(--border-soft)',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = n.read ? 'var(--bg-subtle)' : 'var(--bg-muted)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = n.read ? 'transparent' : 'var(--brand-subtle)'}
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: meta.bg, color: meta.color }}>
                  <Icon size={14} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold leading-tight"
                      style={{ color: n.read ? 'var(--text-sub)' : 'var(--text-base)' }}>
                      {n.title}
                    </p>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}>
                    {n.body}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5"
                    style={{ backgroundColor: 'var(--brand)' }} />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
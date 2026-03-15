// src/components/shared/NotificationPanel.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Calendar, LogIn, LogOut, Wrench, Brush,
         X, ChevronDown, ChevronUp, ArrowRight, Trash2 } from 'lucide-react';

const TYPE_META = {
  checkin:      { icon: LogIn,    color: 'var(--s-green-text)',  bg: 'var(--s-green-bg)',   label: 'Check-in' },
  checkout:     { icon: LogOut,   color: 'var(--s-yellow-text)', bg: 'var(--s-yellow-bg)',  label: 'Check-out' },
  reservation:  { icon: Calendar, color: 'var(--brand)',         bg: 'var(--brand-subtle)', label: 'Reservation' },
  maintenance:  { icon: Wrench,   color: 'var(--s-red-text)',    bg: 'var(--s-red-bg)',     label: 'Maintenance' },
  housekeeping: { icon: Brush,    color: 'var(--text-sub)',      bg: 'var(--bg-subtle)',    label: 'Housekeeping' },
  fnb:          { icon: Bell,     color: 'var(--accent)',        bg: 'var(--brand-subtle)', label: 'F&B' },
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationPanel({ notifications, onMarkRead, onMarkAllRead, onDismiss, onClearRead, onClose }) {
  const navigate  = useNavigate();
  const panelRef  = useRef(null);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter]     = useState('all'); // 'all' | 'unread'

  const unread   = notifications.filter(n => !n.read).length;
  const hasRead  = notifications.some(n => n.read);
  const visible  = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  useEffect(() => {
    const h = e => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const handleExpand = (n) => {
    if (!n.read) onMarkRead(n.id);
    setExpanded(expanded === n.id ? null : n.id);
  };

  const handleNavigate = (n) => {
    if (n.link) navigate(n.link);
    onClose();
  };

  const handleDismiss = (e, id) => {
    e.stopPropagation();
    if (expanded === id) setExpanded(null);
    onDismiss(id);
  };

  return (
    <div ref={panelRef}
      className="absolute right-0 top-full mt-2 z-50 rounded-xl shadow-xl overflow-hidden"
      style={{ width: 380, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-soft)' }}>

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
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md"
              style={{ color: 'var(--brand)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-subtle)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={onClearRead}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md"
              style={{ color: 'var(--s-red-text)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--s-red-bg)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <Trash2 size={11} /> Clear all
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-md" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Filter tabs + clear read */}
      <div className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-subtle)' }}>
        <div className="flex items-center gap-1 p-0.5 rounded-lg"
          style={{ backgroundColor: 'var(--bg-muted)' }}>
          {['all','unread'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="text-xs px-2.5 py-1 rounded-md capitalize transition-all"
              style={{
                backgroundColor: filter === f ? 'var(--bg-surface)' : 'transparent',
                color:           filter === f ? 'var(--text-base)'  : 'var(--text-muted)',
                boxShadow:       filter === f ? 'var(--shadow-xs)'  : 'none',
              }}>
              {f === 'unread' ? `Unread${unread > 0 ? ` (${unread})` : ''}` : 'All'}
            </button>
          ))}
        </div>
        {hasRead && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {notifications.length - unread} read
          </span>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: 440, overflowY: 'auto' }}>
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Bell size={26} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          visible.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.reservation;
            const Icon = meta.icon;
            const isExp = expanded === n.id;

            return (
              <div key={n.id}
                style={{
                  borderBottom: '1px solid var(--border-soft)',
                  backgroundColor: n.read ? 'transparent' : 'var(--brand-subtle)',
                }}>

                {/* Row */}
                <div className="flex items-start gap-3 px-4 py-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: meta.bg, color: meta.color }}>
                    <Icon size={14} />
                  </div>

                  {/* Content — clickable to expand */}
                  <button className="flex-1 min-w-0 text-left" onClick={() => handleExpand(n)}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold leading-tight"
                        style={{ color: n.read ? 'var(--text-sub)' : 'var(--text-base)' }}>
                        {n.title}
                      </p>
                      <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    {!isExp && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                        {n.body}
                      </p>
                    )}
                  </button>

                  {/* Right: chevron + dismiss */}
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0 mt-0.5">
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand)' }} />
                    )}
                    <button onClick={() => handleExpand(n)}>
                      {isExp
                        ? <ChevronUp   size={12} style={{ color: 'var(--text-muted)' }} />
                        : <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />}
                    </button>
                    {/* Dismiss — only on read notifications */}
                    {n.read && (
                      <button onClick={e => handleDismiss(e, n.id)}
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--s-red-text)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                        <X size={11} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExp && (
                  <div className="px-4 pb-3 pt-2" style={{ borderTop: '1px solid var(--border-soft)' }}>
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mb-2"
                      style={{ backgroundColor: meta.bg, color: meta.color }}>
                      <Icon size={10} /> {meta.label}
                    </span>
                    <p className="text-xs leading-relaxed mb-1.5 whitespace-pre-wrap"
                      style={{ color: 'var(--text-base)' }}>
                      {n.body}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2">
                        <button onClick={e => handleDismiss(e, n.id)}
                          className="btn-ghost text-xs flex items-center gap-1 px-2 py-1 rounded-md"
                          style={{ color: 'var(--s-red-text)' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--s-red-bg)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <Trash2 size={11} /> Dismiss
                        </button>
                        {n.link && (
                          <button onClick={() => handleNavigate(n)}
                            className="btn-ghost flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
                            style={{ color: 'var(--brand)' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-subtle)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            View page <ArrowRight size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
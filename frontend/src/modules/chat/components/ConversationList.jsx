// HMS/frontend/src/modules/chat/components/ConversationList.jsx
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

export default function ConversationList({ conversations, activeConv, isLoading, onSelect }) {
  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  if (!conversations.length) return (
    <div className="flex-1 flex items-center justify-center p-6 text-center">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No conversations yet</p>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map(conv => {
        const lastMsg   = (conv.messages || []).slice(-1)[0];
        const hasUnread = (conv.messages || []).some(m => m.sender_type === 'guest' && !m.read_at);
        const isActive  = activeConv?.id === conv.id;
        const guest     = conv.guests;
        const room      = conv.reservations?.rooms?.room_number || conv.reservations?.rooms?.number;
        // Support both 'chat_departments' (from Supabase join) and 'departments' (legacy)
        const dept      = conv.chat_departments || conv.departments;
        const time      = lastMsg
          ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : null;

        return (
          <button key={conv.id} onClick={() => onSelect(conv)}
            className="w-full text-left px-4 py-3 border-b transition-colors"
            style={{
              borderColor:     'var(--border-base)',
              backgroundColor: isActive ? 'var(--sidebar-item-active)' : 'transparent',
            }}
            onMouseEnter={e => !isActive && (e.currentTarget.style.backgroundColor = 'var(--sidebar-item-hover)')}
            onMouseLeave={e => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {/* Row 1 — guest name + time */}
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                {hasUnread && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: 'var(--accent)' }} />
                )}
                <p className="text-sm font-medium truncate" style={{
                  color: 'var(--text-base)',
                  fontWeight: hasUnread ? 600 : 400,
                }}>
                  {guest?.full_name || 'Guest'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {conv.status === 'closed' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)' }}>
                    Closed
                  </span>
                )}
                {time && (
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{time}</span>
                )}
              </div>
            </div>

            {/* Row 2 — dept + room */}
            <div className="flex items-center gap-1 mb-0.5">
              {dept?.icon && <span className="text-xs">{dept.icon}</span>}
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {dept?.name || 'Unknown dept'}
                {room && <> · Room {room}</>}
              </p>
            </div>

            {/* Row 3 — last message preview */}
            {lastMsg && (
              <p className="text-xs truncate" style={{
                color: hasUnread ? 'var(--text-base)' : 'var(--text-muted)',
                fontWeight: hasUnread ? 500 : 400,
              }}>
                {lastMsg.sender_type === 'staff' ? 'You: ' : ''}{lastMsg.content}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
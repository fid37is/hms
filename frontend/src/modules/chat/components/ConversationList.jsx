// HMS/frontend/src/modules/chat/components/ConversationList.jsx
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

export default function ConversationList({ conversations, activeConv, isLoading, onSelect }) {
  if (isLoading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>;

  if (!conversations.length) return (
    <div className="flex-1 flex items-center justify-center p-6 text-center">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No conversations yet</p>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map(conv => {
        const lastMsg  = (conv.messages || []).slice(-1)[0];
        const hasUnread = (conv.messages || []).some(m => m.sender_type === 'guest' && !m.read_at);
        const isActive  = activeConv?.id === conv.id;
        const guest     = conv.guests;
        const room      = conv.reservations?.rooms?.room_number;
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
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                {hasUnread && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--accent)' }} />
                )}
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-base)' }}>
                  {guest?.full_name || 'Guest'}
                </p>
              </div>
              {time && <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{time}</span>}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {conv.departments?.icon} {conv.departments?.name}
                {room && <> · Room {room}</>}
              </p>
              {conv.status === 'closed' && (
                <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Closed</span>
              )}
            </div>
            {lastMsg && (
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                {lastMsg.sender_type === 'staff' ? 'You: ' : ''}{lastMsg.content}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
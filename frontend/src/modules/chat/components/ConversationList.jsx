// HMS/frontend/src/modules/chat/components/ConversationList.jsx

import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { getDeptIcon } from '../../../utils/departmentIcons';

export default function ConversationList({ conversations, activeConv, isLoading, isFrontDesk, onSelect }) {
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
        const dept      = conv.chat_departments || conv.departments;
        const DeptIcon  = getDeptIcon(dept?.name);
        const time      = lastMsg
          ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : null;

        const rowStyle = {
          borderColor:     'var(--border-base)',
          backgroundColor: isActive ? 'var(--brand-subtle)' : 'transparent',
          borderLeft:      isActive ? '2px solid var(--brand)' : '2px solid transparent',
        };

        // ── Front Desk view — room number prominent ──────────
        if (isFrontDesk) {
          return (
            <button key={conv.id} onClick={() => onSelect(conv)}
              className="w-full text-left px-4 py-3 border-b transition-colors"
              style={rowStyle}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div className="flex items-center gap-2 mb-1">
                {hasUnread && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: 'var(--brand)' }} />
                )}
                {room && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded flex-shrink-0"
                    style={{
                      backgroundColor: isActive ? 'var(--brand)' : 'var(--bg-page)',
                      color: isActive ? '#fff' : 'var(--text-base)',
                      border: '1px solid var(--border-base)',
                    }}>
                    Rm {room}
                  </span>
                )}
                <p className="text-sm font-medium truncate"
                  style={{ color: 'var(--text-base)', fontWeight: hasUnread ? 600 : 400 }}>
                  {guest?.full_name || 'Guest'}
                </p>
                {time && (
                  <span className="text-[10px] ml-auto flex-shrink-0"
                    style={{ color: 'var(--text-muted)' }}>{time}</span>
                )}
              </div>
              {lastMsg && (
                <p className="text-xs truncate pl-0.5"
                  style={{ color: hasUnread ? 'var(--text-base)' : 'var(--text-muted)', fontWeight: hasUnread ? 500 : 400 }}>
                  {lastMsg.sender_type === 'staff' ? 'You: ' : ''}{lastMsg.content}
                </p>
              )}
              {conv.status === 'closed' && (
                <span className="text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)' }}>
                  Closed
                </span>
              )}
            </button>
          );
        }

        // ── Standard view ────────────────────────────────────
        return (
          <button key={conv.id} onClick={() => onSelect(conv)}
            className="w-full text-left px-4 py-3 border-b transition-colors"
            style={rowStyle}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {/* Row 1 — guest name + time */}
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                {hasUnread && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: 'var(--brand)' }} />
                )}
                <p className="text-sm font-medium truncate"
                  style={{ color: 'var(--text-base)', fontWeight: hasUnread ? 600 : 400 }}>
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

            {/* Row 2 — dept icon + name + room */}
            <div className="flex items-center gap-1.5 mb-0.5" style={{ color: 'var(--text-muted)' }}>
              <DeptIcon size={11} className="flex-shrink-0" />
              <p className="text-xs truncate">
                {dept?.name || 'General'}
                {room && <> · Room {room}</>}
              </p>
            </div>

            {/* Row 3 — last message */}
            {lastMsg && (
              <p className="text-xs truncate"
                style={{ color: hasUnread ? 'var(--text-base)' : 'var(--text-muted)', fontWeight: hasUnread ? 500 : 400 }}>
                {lastMsg.sender_type === 'staff' ? 'You: ' : ''}{lastMsg.content}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
// HMS/frontend/src/modules/chat/ChatPage.jsx
//
// Staff chat inbox — available to all staff via sidebar.
// Department filtering:
//   - Admin / no department → sees ALL conversations, all dept tabs
//   - Staff with department (e.g. "Housekeeping") → sees only their dept's tab + conversations

import { MessageSquare } from 'lucide-react';
import { useStaffChat }  from './useStaffChat';
import ConversationList  from './components/ConversationList';
import ThreadPanel       from './components/ThreadPanel';

export default function ChatPage() {
  const {
    departments, conversations,
    activeDeptId, setActiveDeptId,
    activeConv,   setActiveConv,
    isLoading,    unreadTotal,
    isAdmin,      staffDeptName,
  } = useStaffChat();

  return (
    // Negative margin to bleed to page edges (matching other HMS module pages)
    <div className="flex -m-4 md:-m-6 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

      {/* ── Dept tabs — hidden if staff only has one dept ──────────── */}
      {(isAdmin || !staffDeptName || departments.length > 1) && (
        <div className="w-44 flex-shrink-0 flex flex-col border-r"
          style={{ borderColor: 'var(--border-base)', backgroundColor: 'var(--bg-surface)' }}>
          <div className="px-3 py-3 border-b" style={{ borderColor: 'var(--border-base)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Departments
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto py-1">
            {/* All tab — only for admin/no-dept staff */}
            {(isAdmin || !staffDeptName) && (
              <DeptTab
                label="All"
                icon="💬"
                isActive={activeDeptId === null}
                unread={unreadTotal}
                onClick={() => { setActiveDeptId(null); setActiveConv(null); }}
              />
            )}
            {departments.map(dept => {
              const deptUnread = conversations.filter(c =>
                c.department_id === dept.id &&
                (c.messages || []).some(m => m.sender_type === 'guest' && !m.read_at)
              ).length;
              return (
                <DeptTab
                  key={dept.id}
                  label={dept.name}
                  icon={dept.icon}
                  isActive={activeDeptId === dept.id}
                  unread={deptUnread}
                  onClick={() => { setActiveDeptId(dept.id); setActiveConv(null); }}
                />
              );
            })}
          </nav>
        </div>
      )}

      {/* ── Conversation list ──────────────────────────────────────── */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r"
        style={{ borderColor: 'var(--border-base)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-base)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {activeDeptId
              ? departments.find(d => d.id === activeDeptId)?.name
              : staffDeptName || 'All Conversations'}
          </p>
        </div>
        <ConversationList
          conversations={conversations}
          activeConv={activeConv}
          isLoading={isLoading}
          onSelect={setActiveConv}
        />
      </div>

      {/* ── Thread panel ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: 'var(--bg-page)' }}>
        {activeConv ? (
          <ThreadPanel
            conversation={activeConv}
            onClose={() => setActiveConv(null)}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function DeptTab({ label, icon, isActive, unread, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full text-left flex items-center gap-2 px-3 py-2 transition-colors"
      style={{
        backgroundColor: isActive ? 'var(--sidebar-item-active)' : 'transparent',
        color: isActive ? 'var(--sidebar-text-active)' : 'var(--text-muted)',
        fontWeight: isActive ? 500 : 400,
      }}
      onMouseEnter={e => !isActive && (e.currentTarget.style.backgroundColor = 'var(--sidebar-item-hover)')}
      onMouseLeave={e => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <span className="text-base w-5 text-center">{icon}</span>
      <span className="flex-1 truncate text-xs">{label}</span>
      {unread > 0 && (
        <span className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 text-white"
          style={{ backgroundColor: 'var(--accent)' }}>
          {unread}
        </span>
      )}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center"
      style={{ color: 'var(--text-muted)' }}>
      <MessageSquare size={40} strokeWidth={1} />
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>No conversation selected</p>
        <p className="text-xs mt-1">Pick a conversation from the list to start replying</p>
      </div>
    </div>
  );
}
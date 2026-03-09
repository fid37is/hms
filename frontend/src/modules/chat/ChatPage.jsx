// HMS/frontend/src/modules/chat/ChatPage.jsx

import { MessageSquare } from 'lucide-react';
import { useStaffChat }  from './useStaffChat';
import { getDeptIcon }   from '../../utils/departmentIcons';
import ConversationList  from './components/ConversationList';
import ThreadPanel       from './components/ThreadPanel';

export default function ChatPage() {
  const chat = useStaffChat();
  const {
    departments, conversations,
    activeDeptId, setActiveDeptId,
    activeConv,   setActiveConv,
    isLoading,    unreadTotal,
    isAdmin,      isFrontDesk, staffDeptName,
  } = chat;

  const showDeptTabs = isAdmin && departments.length > 0;

  return (
    <div className="flex -m-4 md:-m-6 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

      {/* ── Dept tabs — admin only ───────────────────────────── */}
      {showDeptTabs && (
        <div className="w-44 flex-shrink-0 flex flex-col border-r"
          style={{ borderColor: 'var(--border-base)', backgroundColor: 'var(--bg-surface)' }}>
          <div className="px-3 py-3 border-b" style={{ borderColor: 'var(--border-base)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}>
              Departments
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto py-1">
            <DeptTab
              label="All"
              Icon={MessageSquare}
              isActive={activeDeptId === null}
              unread={unreadTotal}
              onClick={() => { setActiveDeptId(null); setActiveConv(null); }}
            />
            {departments.map(dept => {
              const deptUnread = conversations.filter(c =>
                c.department_id === dept.id &&
                (c.messages || []).some(m => m.sender_type === 'guest' && !m.read_at)
              ).length;
              return (
                <DeptTab
                  key={dept.id}
                  label={dept.name}
                  Icon={getDeptIcon(dept.name)}
                  isActive={activeDeptId === dept.id}
                  unread={deptUnread}
                  onClick={() => { setActiveDeptId(dept.id); setActiveConv(null); }}
                />
              );
            })}
          </nav>
        </div>
      )}

      {/* ── Conversation list ────────────────────────────────── */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r"
        style={{ borderColor: 'var(--border-base)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-base)' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}>
              {isFrontDesk
                ? 'Guest Requests'
                : activeDeptId
                  ? departments.find(d => d.id === activeDeptId)?.name
                  : staffDeptName || 'All Conversations'}
            </p>
            {conversations.length > 0 && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)' }}>
                {conversations.length}
              </span>
            )}
          </div>
        </div>
        <ConversationList
          conversations={conversations}
          activeConv={activeConv}
          isLoading={isLoading}
          isFrontDesk={isFrontDesk}
          onSelect={setActiveConv}
        />
      </div>

      {/* ── Thread panel ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: 'var(--bg-page)' }}>
        {activeConv ? (
          <ThreadPanel
            conversation={activeConv}
            messages={chat.messages[activeConv.id] || []}
            isTyping={chat.isTyping[activeConv.id] || false}
            loadMessages={chat.loadMessages}
            sendMessage={chat.sendMessage}
            closeConversation={chat.closeConversation}
            emitTyping={chat.emitTyping}
            emitStopTyping={chat.emitStopTyping}
            joinConversation={chat.joinConversation}
            leaveConversation={chat.leaveConversation}
            onClose={() => setActiveConv(null)}
          />
        ) : (
          <EmptyState isFrontDesk={isFrontDesk} />
        )}
      </div>
    </div>
  );
}

function DeptTab({ label, Icon, isActive, unread, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-2 px-3 py-2.5 transition-all"
      style={{
        backgroundColor: isActive ? 'var(--brand-subtle)' : 'transparent',
        color:           isActive ? 'var(--brand)'        : 'var(--text-muted)',
        fontWeight:      isActive ? 600 : 400,
        borderLeft:      isActive ? '2px solid var(--brand)' : '2px solid transparent',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <span className="w-5 flex items-center justify-center flex-shrink-0">
        <Icon size={13} />
      </span>
      <span className="flex-1 truncate text-xs">{label}</span>
      {unread > 0 && (
        <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5 text-white flex-shrink-0"
          style={{ backgroundColor: 'var(--brand)' }}>
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}

function EmptyState({ isFrontDesk }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center"
      style={{ color: 'var(--text-muted)' }}>
      <MessageSquare size={40} strokeWidth={1} />
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>
          No conversation selected
        </p>
        <p className="text-xs mt-1">
          {isFrontDesk
            ? 'Select a guest request from the list'
            : 'Pick a conversation from the list to start replying'}
        </p>
      </div>
    </div>
  );
}
// HMS/frontend/src/modules/chat/components/ThreadPanel.jsx
//
// Receives ALL state and actions as props from ChatPage.
// Does NOT call useStaffChat() — that was causing a duplicate socket instance
// which made messages flash and disappear.

import { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';

export default function ThreadPanel({
  conversation,
  messages,
  isTyping,
  loadMessages,
  sendMessage,
  closeConversation,
  emitTyping,
  emitStopTyping,
  joinConversation,
  leaveConversation,
  onClose,
}) {
  const [input,   setInput]   = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef   = useRef(null);
  const typingTimer = useRef(null);

  const isClosed  = conversation.status === 'closed';
  const guest      = conversation.guests;
  const reservation = conversation.reservations;
  const dept       = conversation.chat_departments || conversation.departments;

  useEffect(() => {
    loadMessages(conversation.id);
    joinConversation(conversation.id);
    return () => leaveConversation(conversation.id);
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending || isClosed) return;
    setInput('');
    setSending(true);
    emitStopTyping(conversation.id);
    try { await sendMessage(conversation.id, content); }
    catch { setInput(content); }
    finally { setSending(false); }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    emitTyping(conversation.id);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitStopTyping(conversation.id), 2000);
  };

  const handleClose = async () => {
    if (!window.confirm('Close this conversation? The guest will be notified.')) return;
    await closeConversation(conversation.id);
  };

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border-base)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm" style={{ color: 'var(--text-base)' }}>
              {guest?.full_name || 'Guest'}
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: isClosed ? 'var(--bg-subtle)' : 'rgba(34,197,94,0.1)',
                color:           isClosed ? 'var(--text-muted)' : 'rgb(22,163,74)',
              }}>
              {isClosed ? 'Closed' : 'Active'}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {dept?.icon} {dept?.name}
            {reservation?.rooms?.room_number && <> · Room {reservation.rooms.room_number}</>}
            {reservation?.reservation_no    && <> · {reservation.reservation_no}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isClosed && (
            <button onClick={handleClose}
              className="text-xs px-3 py-1.5 rounded border transition-colors"
              style={{ borderColor: 'var(--border-base)', color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-base)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
              Close
            </button>
          )}
          <button onClick={onClose}
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-base)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No messages yet</p>
          </div>
        )}
        {messages.map(msg => {
          const isStaff = msg.sender_type === 'staff';
          const time    = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={msg.id} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] flex flex-col gap-1 ${isStaff ? 'items-end' : 'items-start'}`}>
                {!isStaff && (
                  <span className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
                    {msg.sender_name}
                  </span>
                )}
                <div className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                  style={isStaff
                    ? { backgroundColor: 'var(--brand)', color: '#fff', borderBottomRightRadius: 4 }
                    : { backgroundColor: 'var(--bg-subtle)', color: 'var(--text-base)', border: '1px solid var(--border-base)', borderBottomLeftRadius: 4 }
                  }>
                  {msg.content}
                </div>
                <span className="text-[10px] px-1" style={{ color: 'var(--text-muted)' }}>{time}</span>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-2xl rounded-bl-sm flex gap-1 items-center"
              style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-base)' }}>
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ backgroundColor: 'var(--text-muted)', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isClosed ? (
        <div className="px-4 py-3 border-t text-center text-xs flex-shrink-0"
          style={{ borderColor: 'var(--border-base)', color: 'var(--text-muted)' }}>
          This conversation is closed
        </div>
      ) : (
        <div className="px-3 py-3 border-t flex gap-2 items-end flex-shrink-0"
          style={{ borderColor: 'var(--border-base)', backgroundColor: 'var(--bg-surface)' }}>
          <textarea
            className="input flex-1 resize-none text-sm"
            rows={1}
            placeholder="Reply to guest…"
            value={input}
            onChange={handleInputChange}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            style={{ maxHeight: 120, overflowY: 'auto' }}
          />
          <button onClick={handleSend} disabled={!input.trim() || sending}
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-opacity disabled:opacity-40"
            style={{ backgroundColor: 'var(--brand)', color: '#fff' }}>
            <Send size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
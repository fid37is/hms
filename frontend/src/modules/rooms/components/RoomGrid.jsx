import { useState } from 'react';
import { MoreVertical, Wrench, CheckCircle, XCircle, Pencil } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';

const STATUS_META = {
  available:    { label: 'Available',    color: 'var(--s-green-text)',  bg: 'var(--s-green-bg)'  },
  occupied:     { label: 'Occupied',     color: 'var(--brand)',          bg: 'var(--brand-subtle)' },
  dirty:        { label: 'Dirty',        color: 'var(--s-yellow-text)', bg: 'var(--s-yellow-bg)' },
  clean:        { label: 'Ready',        color: 'var(--s-green-text)',  bg: 'var(--s-green-bg)'  },
  maintenance:  { label: 'Maintenance',  color: 'var(--s-red-text)',    bg: 'var(--s-red-bg)'    },
  out_of_order: { label: 'Out of Order', color: 'var(--s-gray-text)',   bg: 'var(--s-gray-bg)'   },
};

function RoomCard({ room, onStatusChange, onEdit }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = STATUS_META[room.status] || STATUS_META.available;

  const actions = [
    { label: 'Mark Clean',        icon: CheckCircle, status: 'clean',        show: ['dirty'] },
    { label: 'Mark Dirty',        icon: XCircle,     status: 'dirty',        show: ['clean', 'available'] },
    { label: 'Mark Available',    icon: CheckCircle, status: 'available',    show: ['clean'] },
    { label: 'Mark Maintenance',  icon: Wrench,      status: 'maintenance',  show: ['available', 'clean', 'dirty'] },
    { label: 'Mark Out of Order', icon: XCircle,     status: 'out_of_order', show: ['maintenance'] },
  ].filter(a => a.show.includes(room.status));

  return (
    <div
      className="card p-4 relative"
      style={{ borderTop: `3px solid ${meta.color}` }}
    >
      {/* Room number + type */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-base font-semibold" style={{ color: 'var(--text-base)' }}>
            {room.number}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {room.room_types?.name || '—'} · Floor {room.floor ?? '—'}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <MoreVertical size={14} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-8 z-20 w-44 rounded-lg py-1 border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor:     'var(--border-soft)',
                  boxShadow:       'var(--shadow-md)',
                }}
              >
                <button
                  onClick={() => { onEdit(room); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors"
                  style={{ color: 'var(--text-sub)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Pencil size={12} /> Edit Room
                </button>
                {actions.map(a => (
                  <button
                    key={a.status}
                    onClick={() => { onStatusChange(room.id, a.status); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors"
                    style={{ color: 'var(--text-sub)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <a.icon size={12} /> {a.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status badge */}
      <span
        className="badge text-xs"
        style={{ backgroundColor: meta.bg, color: meta.color }}
      >
        {meta.label}
      </span>

      {/* Rate */}
      {room.room_types?.base_rate && (
        <p className="text-xs mt-3 font-mono" style={{ color: 'var(--text-muted)' }}>
          {formatCurrency(room.room_types.base_rate)}<span style={{ color: 'var(--text-muted)' }}>/night</span>
        </p>
      )}

      {/* Blocked indicator */}
      {room.is_blocked && (
        <div
          className="mt-2 px-2 py-1 rounded text-xs"
          style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}
        >
          Blocked — {room.block_reason || 'No reason given'}
        </div>
      )}
    </div>
  );
}

export default function RoomGrid({ rooms, onStatusChange, onEdit }) {
  // Group by floor
  const floors = [...new Set(rooms.map(r => r.floor ?? 0))].sort((a, b) => a - b);

  if (!rooms.length) {
    return (
      <div
        className="card flex items-center justify-center py-16 text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        No rooms found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {floors.map(floor => (
        <div key={floor}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            {floor === 0 ? 'Ground Floor' : `Floor ${floor}`}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {rooms
              .filter(r => (r.floor ?? 0) === floor)
              .map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ImageOff, Pencil, Users, Layers, BedDouble, Ban } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';

const STATUS_META = {
  available:    { label: 'Available',    color: 'var(--s-green-text)',  bg: 'var(--s-green-bg)'  },
  occupied:     { label: 'Occupied',     color: 'var(--brand)',         bg: 'var(--brand-subtle)' },
  dirty:        { label: 'Dirty',        color: 'var(--s-yellow-text)', bg: 'var(--s-yellow-bg)' },
  clean:        { label: 'Ready',        color: 'var(--s-green-text)',  bg: 'var(--s-green-bg)'  },
  maintenance:  { label: 'Maintenance',  color: 'var(--s-red-text)',    bg: 'var(--s-red-bg)'    },
  out_of_order: { label: 'Out of Order', color: 'var(--s-gray-text)',   bg: 'var(--s-gray-bg)'   },
};

export default function RoomDetailModal({ room, onClose, onEdit }) {
  const [photoIdx, setPhotoIdx] = useState(0);

  const meta    = STATUS_META[room.status] || STATUS_META.available;
  const photos  = (room.media || []).filter(m => m.type === 'image' || m.type === 'gif');

  const prev = (e) => { e.stopPropagation(); setPhotoIdx(i => (i - 1 + photos.length) % photos.length); };
  const next = (e) => { e.stopPropagation(); setPhotoIdx(i => (i + 1) % photos.length); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      <div
        className="relative w-full flex rounded-2xl overflow-hidden"
        style={{
          maxWidth: 820,
          maxHeight: '88vh',
          backgroundColor: 'var(--bg-surface)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        }}
      >
        {/* ── LEFT — image column ──────────────────────────── */}
        <div className="relative flex-shrink-0" style={{ width: '55%', backgroundColor: 'var(--bg-muted)' }}>
          {photos.length > 0 ? (
            <>
              <img
                src={photos[photoIdx].url}
                alt={`Room ${room.number}`}
                className="w-full h-full object-cover"
                style={{ display: 'block' }}
              />
              {/* Bottom gradient */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 45%)'
              }} />

              {/* Room label bottom-left */}
              <div className="absolute bottom-4 left-4">
                <p className="text-white font-bold text-lg leading-tight" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
                  Room {room.number}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {room.room_types?.name}
                </p>
              </div>

              {/* Prev / Next */}
              {photos.length > 1 && (
                <>
                  <button onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                    <ChevronLeft size={14} color="white" />
                  </button>
                  <button onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                    <ChevronRight size={14} color="white" />
                  </button>
                </>
              )}

              {/* Dot indicators */}
              {photos.length > 1 && (
                <div className="absolute bottom-4 right-4 flex gap-1">
                  {photos.map((_, i) => (
                    <button key={i} onClick={() => setPhotoIdx(i)}
                      className="rounded-full transition-all"
                      style={{
                        width:  i === photoIdx ? 16 : 6,
                        height: 6,
                        backgroundColor: i === photoIdx ? 'white' : 'rgba(255,255,255,0.4)',
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--border-soft)' }}>
                <ImageOff size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No photos yet</p>
            </div>
          )}

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 flex gap-1.5 overflow-x-auto px-3 pb-14 pt-2">
              {photos.map((p, i) => (
                <button key={i} onClick={() => setPhotoIdx(i)}
                  className="flex-shrink-0 rounded overflow-hidden transition-all"
                  style={{
                    width: 38, height: 28,
                    outline: i === photoIdx ? '2px solid white' : '2px solid transparent',
                    opacity: i === photoIdx ? 1 : 0.55,
                  }}>
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT — details column ───────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0" style={{ maxHeight: '88vh' }}>

          {/* Top bar */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: meta.bg, color: meta.color }}>
                {meta.label}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onEdit(room); onClose(); }}
                title="Edit room"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-base)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-base)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

            {/* Room identity */}
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-base)' }}>
                Room {room.number}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {room.room_types?.name || '—'}
                {room.floor != null ? ` · Floor ${room.floor}` : ''}
              </p>
            </div>

            {/* Rate */}
            {room.room_types?.base_rate > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                  Base Rate
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--brand)' }}>
                  {formatCurrency(room.room_types.base_rate)}
                  <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>/night</span>
                </p>
              </div>
            )}

            {/* Key details */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: BedDouble, label: 'Room Type',  value: room.room_types?.name || '—' },
                { icon: Layers,    label: 'Floor',      value: room.floor != null ? `Floor ${room.floor}` : '—' },
                { icon: Users,     label: 'Max Guests', value: room.room_types?.max_occupancy ? `${room.room_types.max_occupancy} guests` : '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl px-3 py-3"
                  style={{ backgroundColor: 'var(--bg-subtle)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={12} style={{ color: 'var(--text-muted)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  </div>
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-base)' }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Amenities */}
            {room.room_types?.amenities?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Amenities
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {room.room_types.amenities.map(a => (
                    <span key={a} className="text-xs px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-sub)', border: '1px solid var(--border-soft)' }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {room.notes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Notes
                </p>
                <p className="text-sm" style={{ color: 'var(--text-sub)', lineHeight: 1.6 }}>{room.notes}</p>
              </div>
            )}

            {/* Blocked */}
            {room.is_blocked && (
              <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl"
                style={{ backgroundColor: 'var(--s-red-bg)' }}>
                <Ban size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--s-red-text)' }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--s-red-text)' }}>Room Blocked</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--s-red-text)' }}>
                    {room.block_reason || 'No reason given'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
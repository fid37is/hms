import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, Pencil, Users, Layers, BedDouble, Ban } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import SlidePanel from '../../../components/shared/SlidePanel';

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

  const meta   = STATUS_META[room?.status] || STATUS_META.available;
  const photos = (room?.media || []).filter(m => m.type === 'image' || m.type === 'gif');

  const prev = (e) => { e.stopPropagation(); setPhotoIdx(i => (i - 1 + photos.length) % photos.length); };
  const next = (e) => { e.stopPropagation(); setPhotoIdx(i => (i + 1) % photos.length); };

  if (!room) return null;

  return (
    <SlidePanel open={!!room} onClose={onClose} title={`Room ${room.number}`}>
      <div className="space-y-5 p-1">

        {/* Status + Edit */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: meta.bg, color: meta.color }}>
            {meta.label}
          </span>
          <button onClick={() => { onEdit(room); onClose(); }}
            className="btn-secondary text-xs flex items-center gap-1.5">
            <Pencil size={12} /> Edit Room
          </button>
        </div>

        {/* Photo gallery */}
        {photos.length > 0 ? (
          <div className="relative rounded-xl overflow-hidden" style={{ height: 220 }}>
            <img src={photos[photoIdx].url} alt={`Room ${room.number}`}
              className="w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)' }} />
            {photos.length > 1 && (
              <>
                <button onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                  <ChevronLeft size={14} color="white" />
                </button>
                <button onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                  <ChevronRight size={14} color="white" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {photos.map((_, i) => (
                    <button key={i} onClick={() => setPhotoIdx(i)}
                      className="rounded-full transition-all"
                      style={{ width: i === photoIdx ? 16 : 6, height: 6,
                        backgroundColor: i === photoIdx ? 'white' : 'rgba(255,255,255,0.4)' }} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-xl flex flex-col items-center justify-center gap-2"
            style={{ height: 140, backgroundColor: 'var(--bg-subtle)' }}>
            <ImageOff size={20} style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No photos yet</p>
          </div>
        )}

        {/* Rate */}
        {room.room_types?.base_rate > 0 && (
          <div>
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
            <div key={label} className="rounded-xl px-3 py-3" style={{ backgroundColor: 'var(--bg-subtle)' }}>
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
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Amenities</p>
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
            <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Notes</p>
            <p className="text-sm" style={{ color: 'var(--text-sub)', lineHeight: 1.6 }}>{room.notes}</p>
          </div>
        )}

        {/* Blocked */}
        {room.is_blocked && (
          <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl" style={{ backgroundColor: 'var(--s-red-bg)' }}>
            <Ban size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--s-red-text)' }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--s-red-text)' }}>Room Blocked</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--s-red-text)' }}>{room.block_reason || 'No reason given'}</p>
            </div>
          </div>
        )}
      </div>
    </SlidePanel>
  );
}
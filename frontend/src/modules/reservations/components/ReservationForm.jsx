import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { BedDouble, CheckCircle } from 'lucide-react';
import * as resApi  from '../../../lib/api/reservationApi';
import * as roomApi from '../../../lib/api/roomApi';
import GuestSearch  from './GuestSearch';
import { formatCurrency } from '../../../utils/format';
import toast from 'react-hot-toast';

const SOURCES = ['walk_in','phone','online','ota_booking_com','ota_expedia','corporate','referral'];

export default function ReservationForm({ onSuccess }) {
  const [form, setForm] = useState(() => ({
    guest_id: '', room_id: '', check_in_date: '', check_out_date: '',
    adults: '1', children: '0', booking_source: 'walk_in', special_requests: '',
  }));
  const [selectedGuest,   setSelectedGuest]   = useState(null);
  const [selectedTypeId,  setSelectedTypeId]  = useState('');   // Step 2 state

  // Step 1 — fetch all available rooms once dates are chosen
  const { data: availableRooms = [], isFetching: loadingRooms } = useQuery({
    queryKey: ['rooms-available', form.check_in_date, form.check_out_date],
    queryFn:  () => roomApi.checkAvailability({
      check_in_date:  form.check_in_date,
      check_out_date: form.check_out_date,
    }).then(r => r.data.data),
    enabled: !!(form.check_in_date && form.check_out_date),
  });

  // Step 2 — derive unique room types from available rooms only
  const availableTypes = useMemo(() => {
    const map = {};
    availableRooms.forEach(room => {
      const t = room.room_types;
      if (!t) return;
      if (!map[t.id]) {
        map[t.id] = { ...t, count: 0, rooms: [] };
      }
      map[t.id].count++;
      map[t.id].rooms.push(room);
    });
    return Object.values(map).sort((a, b) => a.base_rate - b.base_rate);
  }, [availableRooms]);

  // Step 3 — rooms filtered to the chosen type
  const roomsOfType = useMemo(() =>
    availableRooms.filter(r => r.room_types?.id === selectedTypeId),
    [availableRooms, selectedTypeId]
  );

  const create = useMutation({
    mutationFn: (d) => resApi.createReservation(d),
    onSuccess: () => { toast.success('Reservation created'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to create reservation'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // When dates change, reset type + room selection
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setSelectedTypeId('');
    setForm(prev => ({ ...prev, [name]: value, room_id: '' }));
  };

  // When type is selected, reset room selection
  const handleTypeSelect = (typeId) => {
    setSelectedTypeId(typeId);
    setForm(prev => ({ ...prev, room_id: '' }));
  };

  const nights = form.check_in_date && form.check_out_date
    ? Math.ceil((new Date(form.check_out_date) - new Date(form.check_in_date)) / 86400000)
    : 0;

  const selectedRoom     = availableRooms.find(r => r.id === form.room_id);
  const selectedType     = availableTypes.find(t => t.id === selectedTypeId);
  const totalAmount      = selectedRoom ? selectedRoom.room_types?.base_rate * nights : 0;
  const datesSelected    = !!(form.check_in_date && form.check_out_date && nights > 0);

  return (
    <form onSubmit={e => {
      e.preventDefault();
      const rate = selectedRoom?.room_types?.base_rate || 0;
      create.mutate({
        ...form,
        adults:         Number(form.adults),
        children:       Number(form.children),
        rate_per_night: rate,
      });
    }} className="space-y-4">

      {/* Guest */}
      <div>
        <label className="label">Guest *</label>
        <GuestSearch
          selected={selectedGuest}
          onSelect={g => { setSelectedGuest(g); setForm(prev => ({ ...prev, guest_id: g?.id ?? '' })); }}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label" htmlFor="rf-cin">Check-in Date *</label>
          <input id="rf-cin" name="check_in_date" type="date" className="input" required
            min={new Date().toISOString().split('T')[0]}
            value={form.check_in_date} onChange={handleDateChange} />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="rf-cout">Check-out Date *</label>
          <input id="rf-cout" name="check_out_date" type="date" className="input" required
            min={form.check_in_date || new Date().toISOString().split('T')[0]}
            value={form.check_out_date} onChange={handleDateChange} />
        </div>
      </div>

      {/* Step 2 — Room Type picker (only when dates chosen) */}
      {datesSelected && (
        <div>
          <label className="label">
            Room Type * {loadingRooms && <span style={{ color: 'var(--text-muted)' }}>— checking availability…</span>}
          </label>

          {!loadingRooms && availableTypes.length === 0 && (
            <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}>
              No rooms available for these dates.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {availableTypes.map(type => {
              const isSelected = selectedTypeId === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleTypeSelect(type.id)}
                  className="text-left p-3 rounded-lg border transition-all"
                  style={{
                    backgroundColor: isSelected ? 'var(--brand-subtle)' : 'var(--bg-surface)',
                    borderColor:     isSelected ? 'var(--brand)'        : 'var(--border-base)',
                    borderWidth:     isSelected ? '2px'                 : '1px',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: isSelected ? 'var(--brand)' : 'var(--text-base)' }}>
                        {type.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {type.count} room{type.count !== 1 ? 's' : ''} available · up to {type.max_occupancy} guests
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold" style={{ color: isSelected ? 'var(--brand)' : 'var(--text-base)' }}>
                        {formatCurrency(type.base_rate)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>/night</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-1 mt-2 text-xs font-medium" style={{ color: 'var(--brand)' }}>
                      <CheckCircle size={12} /> Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3 — Specific room picker (only when type chosen) */}
      {selectedTypeId && (
        <div className="form-group">
          <label className="label" htmlFor="rf-room">
            Select Room * — {nights} night{nights !== 1 ? 's' : ''} · {selectedType?.name}
          </label>
          <select
            id="rf-room"
            name="room_id"
            className="input"
            value={form.room_id}
            onChange={handleChange}
            required
          >
            <option value="">Choose a specific room…</option>
            {roomsOfType.map(r => (
              <option key={r.id} value={r.id}>
                Room {r.number}{r.floor ? ` — Floor ${r.floor}` : ''}{r.status === 'clean' ? ' ✓ Ready' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Guests */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label" htmlFor="rf-adults">Adults</label>
          <input id="rf-adults" name="adults" type="number" min="1"
            max={selectedType?.max_occupancy || 10}
            className="input" value={form.adults} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="rf-children">Children</label>
          <input id="rf-children" name="children" type="number" min="0" className="input"
            value={form.children} onChange={handleChange} />
        </div>
      </div>

      {/* Booking source */}
      <div className="form-group">
        <label className="label" htmlFor="rf-source">Booking Source</label>
        <select id="rf-source" name="booking_source" className="input"
          value={form.booking_source} onChange={handleChange}>
          {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Special requests */}
      <div className="form-group">
        <label className="label" htmlFor="rf-requests">Special Requests</label>
        <textarea id="rf-requests" name="special_requests" rows={2} className="input"
          value={form.special_requests} onChange={handleChange} />
      </div>

      {/* Total estimate */}
      {totalAmount > 0 && (
        <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'var(--brand-subtle)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--brand)' }}>
                {selectedType?.name} · Room {selectedRoom?.number}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-sub)' }}>
                {nights} night{nights !== 1 ? 's' : ''} × {formatCurrency(selectedRoom?.room_types?.base_rate)}
              </p>
            </div>
            <p className="text-lg font-bold" style={{ color: 'var(--brand)' }}>
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={create.isPending || !form.guest_id || !form.room_id || !form.check_in_date || !form.check_out_date}
        className="btn-primary ml-auto block"
      >
        {create.isPending ? 'Creating…' : 'Create Reservation'}
      </button>
    </form>
  );
}
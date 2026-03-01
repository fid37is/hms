import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as resApi  from '../../../lib/api/reservationApi';
import * as roomApi from '../../../lib/api/roomApi';
import GuestSearch  from './GuestSearch';
import { formatCurrency } from '../../../utils/format';
import toast from 'react-hot-toast';

const SOURCES = ['walk_in','phone','online','ota_booking_com','ota_expedia','corporate','referral'];

export default function ReservationForm({ onSuccess }) {
  const [form, setForm] = useState({
    guest_id: '', room_id: '', check_in_date: '', check_out_date: '',
    adults: 1, children: 0, booking_source: 'walk_in', special_requests: '',
  });
  const [selectedGuest, setSelectedGuest] = useState(null);

  const { data: roomsData } = useQuery({
    queryKey: ['rooms-available', form.check_in_date, form.check_out_date],
    queryFn:  () => roomApi.checkAvailability({
      check_in_date: form.check_in_date, check_out_date: form.check_out_date,
    }).then(r => r.data.data),
    enabled: !!(form.check_in_date && form.check_out_date),
  });

  const create = useMutation({
    mutationFn: (d) => resApi.createReservation(d),
    onSuccess: () => { toast.success('Reservation created'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to create reservation'),
  });

  const nights = form.check_in_date && form.check_out_date
    ? Math.ceil((new Date(form.check_out_date) - new Date(form.check_in_date)) / 86400000)
    : 0;

  const selectedRoom = (roomsData || []).find(r => r.id === form.room_id);
  const totalAmount  = selectedRoom ? selectedRoom.room_types?.base_rate * nights : 0;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const F = ({ label, children, half }) => (
    <div className={`form-group ${half ? '' : ''}`}>
      <label className="label">{label}</label>
      {children}
    </div>
  );

  return (
    <form onSubmit={e => { e.preventDefault();
      create.mutate({ ...form, adults: Number(form.adults), children: Number(form.children) });
    }} className="space-y-5">

      {/* Guest */}
      <div>
        <label className="label">Guest *</label>
        <GuestSearch
          selected={selectedGuest}
          onSelect={g => { setSelectedGuest(g); set('guest_id', g.id); }}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <F label="Check-in Date *">
          <input type="date" className="input" required value={form.check_in_date}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => set('check_in_date', e.target.value)} />
        </F>
        <F label="Check-out Date *">
          <input type="date" className="input" required value={form.check_out_date}
            min={form.check_in_date || new Date().toISOString().split('T')[0]}
            onChange={e => set('check_out_date', e.target.value)} />
        </F>
      </div>

      {/* Room */}
      {form.check_in_date && form.check_out_date && (
        <F label={`Available Rooms ${nights > 0 ? `(${nights} night${nights > 1 ? 's' : ''})` : ''}`}>
          <select className="input" value={form.room_id} onChange={e => set('room_id', e.target.value)}>
            <option value="">Select a room…</option>
            {(roomsData || []).map(r => (
              <option key={r.id} value={r.id}>
                Room {r.number} — {r.room_types?.name} ({formatCurrency(r.room_types?.base_rate)}/night)
              </option>
            ))}
          </select>
          {!roomsData?.length && (
            <p className="text-xs mt-1" style={{ color: 'var(--s-red-text)' }}>
              No rooms available for selected dates
            </p>
          )}
        </F>
      )}

      {/* Guests */}
      <div className="grid grid-cols-2 gap-4">
        <F label="Adults">
          <input type="number" className="input" min={1} value={form.adults}
            onChange={e => set('adults', e.target.value)} />
        </F>
        <F label="Children">
          <input type="number" className="input" min={0} value={form.children}
            onChange={e => set('children', e.target.value)} />
        </F>
      </div>

      {/* Source */}
      <F label="Booking Source">
        <select className="input" value={form.booking_source} onChange={e => set('booking_source', e.target.value)}>
          {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </F>

      <F label="Special Requests">
        <textarea className="input" rows={2} value={form.special_requests}
          onChange={e => set('special_requests', e.target.value)} />
      </F>

      {/* Summary */}
      {totalAmount > 0 && (
        <div
          className="rounded-lg px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: 'var(--brand-subtle)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text-sub)' }}>
            {nights} night{nights > 1 ? 's' : ''} estimated total
          </span>
          <span className="text-base font-semibold" style={{ color: 'var(--brand)' }}>
            {formatCurrency(totalAmount)}
          </span>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="submit"
          disabled={create.isPending || !form.guest_id || !form.room_id || !form.check_in_date || !form.check_out_date}
          className="btn-primary"
        >
          {create.isPending ? 'Creating…' : 'Create Reservation'}
        </button>
      </div>
    </form>
  );
}

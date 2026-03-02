import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  const [selectedGuest, setSelectedGuest] = useState(null);

  const { data: roomsData } = useQuery({
    queryKey: ['rooms-available', form.check_in_date, form.check_out_date],
    queryFn:  () => roomApi.checkAvailability({ check_in_date: form.check_in_date, check_out_date: form.check_out_date }).then(r => r.data.data),
    enabled: !!(form.check_in_date && form.check_out_date),
  });

  const create = useMutation({
    mutationFn: (d) => resApi.createReservation(d),
    onSuccess: () => { toast.success('Reservation created'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to create reservation'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const nights = form.check_in_date && form.check_out_date
    ? Math.ceil((new Date(form.check_out_date) - new Date(form.check_in_date)) / 86400000)
    : 0;

  const selectedRoom = (roomsData || []).find(r => r.id === form.room_id);
  const totalAmount  = selectedRoom ? selectedRoom.room_types?.base_rate * nights : 0;

  return (
    <form onSubmit={e => {
      e.preventDefault();
      create.mutate({ ...form, adults: Number(form.adults), children: Number(form.children) });
    }} className="space-y-4">

      <div>
        <label className="label">Guest *</label>
        <GuestSearch
          selected={selectedGuest}
          onSelect={g => { setSelectedGuest(g); setForm(prev => ({ ...prev, guest_id: g?.id ?? '' })); }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label" htmlFor="rf-cin">Check-in Date *</label>
          <input id="rf-cin" name="check_in_date" type="date" className="input" required
            min={new Date().toISOString().split('T')[0]}
            value={form.check_in_date} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="rf-cout">Check-out Date *</label>
          <input id="rf-cout" name="check_out_date" type="date" className="input" required
            min={form.check_in_date || new Date().toISOString().split('T')[0]}
            value={form.check_out_date} onChange={handleChange} />
        </div>
      </div>

      {form.check_in_date && form.check_out_date && (
        <div className="form-group">
          <label className="label" htmlFor="rf-room">
            Available Rooms {nights > 0 ? `(${nights} night${nights !== 1 ? 's' : ''})` : ''}
          </label>
          <select id="rf-room" name="room_id" className="input" value={form.room_id} onChange={handleChange}>
            <option value="">Select a room…</option>
            {(roomsData || []).map(r => (
              <option key={r.id} value={r.id}>
                Room {r.number} — {r.room_types?.name} ({formatCurrency(r.room_types?.base_rate)}/night)
              </option>
            ))}
          </select>
          {roomsData && !roomsData.length && (
            <p className="text-xs mt-1" style={{ color: 'var(--s-red-text)' }}>No rooms available for these dates</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label" htmlFor="rf-adults">Adults</label>
          <input id="rf-adults" name="adults" type="number" min="1" className="input"
            value={form.adults} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="rf-children">Children</label>
          <input id="rf-children" name="children" type="number" min="0" className="input"
            value={form.children} onChange={handleChange} />
        </div>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="rf-source">Booking Source</label>
        <select id="rf-source" name="booking_source" className="input"
          value={form.booking_source} onChange={handleChange}>
          {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="rf-requests">Special Requests</label>
        <textarea id="rf-requests" name="special_requests" rows={2} className="input"
          value={form.special_requests} onChange={handleChange} />
      </div>

      {totalAmount > 0 && (
        <div className="rounded-lg px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: 'var(--brand-subtle)' }}>
          <span className="text-sm" style={{ color: 'var(--text-sub)' }}>
            {nights} night{nights !== 1 ? 's' : ''} estimated total
          </span>
          <span className="text-base font-semibold" style={{ color: 'var(--brand)' }}>
            {formatCurrency(totalAmount)}
          </span>
        </div>
      )}

      <button type="submit"
        disabled={create.isPending || !form.guest_id || !form.room_id || !form.check_in_date || !form.check_out_date}
        className="btn-primary w-full justify-center py-2.5">
        {create.isPending ? 'Creating…' : 'Create Reservation'}
      </button>
    </form>
  );
}

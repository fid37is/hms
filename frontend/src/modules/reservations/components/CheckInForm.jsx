import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as resApi  from '../../../lib/api/reservationApi';
import * as roomApi from '../../../lib/api/roomApi';
import { formatDate, formatCurrency } from '../../../utils/format';
import toast from 'react-hot-toast';

export default function CheckInForm({ reservation: res, onSuccess }) {
  const [roomId, setRoomId] = useState(res.room_id || '');

  const { data: availableRooms } = useQuery({
    queryKey: ['rooms-available-checkin', res.check_in_date, res.check_out_date, res.room_type_id],
    queryFn:  () => roomApi.checkAvailability({
      check_in_date:  res.check_in_date,
      check_out_date: res.check_out_date,
      type_id:        res.room_type_id,
    }).then(r => r.data.data),
    enabled: !res.room_id,
  });
console.log('reservation:', res);
  const assignRoom = useMutation({
    mutationFn: (rid) => resApi.assignRoom(res.id, { room_id: rid }),
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to assign room'),
  });

  const checkIn = useMutation({
    mutationFn: () => resApi.checkIn(res.id),
    onSuccess: () => { toast.success('Guest checked in successfully'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Check-in failed'),
  });

  const handleCheckIn = async () => {
    if (!res.room_id && roomId) {
      await assignRoom.mutateAsync(roomId);
    }
    await checkIn.mutateAsync();
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        {[
          ['Guest',        res.guests?.full_name],
          ['Reservation',  res.reservation_no],
          ['Check-in',     formatDate(res.check_in_date)],
          ['Check-out',    formatDate(res.check_out_date)],
          ['Total Amount', formatCurrency(res.total_amount)],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span className="font-medium" style={{ color: 'var(--text-base)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Room assignment if not already assigned */}
      {!res.room_id && (
        <div className="form-group">
          <label className="label">Assign Room *</label>
          <select className="input" value={roomId} onChange={e => setRoomId(e.target.value)} required>
            <option value="">Select room…</option>
            {(availableRooms || []).map(r => (
              <option key={r.id} value={r.id}>
                Room {r.number} — {r.room_types?.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {res.room_id && (
        <div className="text-sm" style={{ color: 'var(--text-sub)' }}>
          Assigned to <strong style={{ color: 'var(--text-base)' }}>Room {res.rooms?.number}</strong>
        </div>
      )}

      <button
        onClick={handleCheckIn}
        disabled={checkIn.isPending || assignRoom.isPending || (!res.room_id && !roomId)}
        className="btn-primary w-full justify-center py-2.5"
      >
        {checkIn.isPending ? 'Checking in…' : 'Confirm Check-in'}
      </button>
    </div>
  );
}
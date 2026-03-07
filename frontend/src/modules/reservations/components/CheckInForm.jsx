import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import * as resApi  from '../../../lib/api/reservationApi';
import * as roomApi from '../../../lib/api/roomApi';
import { formatDate, formatCurrency } from '../../../utils/format';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'mobile_money'];
const today = () => new Date().toISOString().split('T')[0];

export default function CheckInForm({ reservation: res, onSuccess }) {
  const [roomId,        setRoomId]        = useState(res.rooms?.id || '');
  const [paymentMode,   setPaymentMode]   = useState('pay_later');
  const [paidAmount,    setPaidAmount]    = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes,  setPaymentNotes]  = useState('');

  // If check_out_date is in the past, default to today + original duration
  const originalNights = Math.ceil(
    (new Date(res.check_out_date) - new Date(res.check_in_date)) / 86400000
  );
  const checkOutIsPast = res.check_out_date < today();
  const defaultCheckOut = checkOutIsPast
    ? (() => {
        const d = new Date();
        d.setDate(d.getDate() + originalNights);
        return d.toISOString().split('T')[0];
      })()
    : res.check_out_date;

  const [checkOutDate, setCheckOutDate] = useState(defaultCheckOut);

  // Always calculate nights from check_in_date to the (possibly adjusted) checkout date
  const effectiveCheckIn = today() > res.check_in_date ? today() : res.check_in_date;
  const nights   = Math.max(1, Math.ceil((new Date(checkOutDate) - new Date(effectiveCheckIn)) / 86400000));
  const totalDue = res.rate_per_night * nights;
  const deposit    = res.deposit_paid ? (res.deposit_amount || 0) : 0;
  // User types in Naira — convert to kobo (* 100) for comparison against DB values
  const parsedPaid = paymentMode !== 'pay_later' ? (parseInt(paidAmount, 10) || 0) * 100 : 0;
  const balance    = totalDue - deposit - parsedPaid;

  const isDatesStale = res.check_in_date < today() || checkOutIsPast;

  const { data: availableRooms } = useQuery({
    queryKey: ['rooms-available-checkin', effectiveCheckIn, checkOutDate],
    queryFn:  () => roomApi.checkAvailability({
      check_in_date:  effectiveCheckIn,
      check_out_date: checkOutDate,
    }).then(r => r.data.data),
    enabled: !res.rooms?.id,
  });

  const assignRoom = useMutation({
    mutationFn: (rid) => resApi.assignRoom(res.id, { room_id: rid }),
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to assign room'),
  });

  // Update reservation dates if they've been adjusted, then check in
  const updateRes = useMutation({
    mutationFn: (d) => resApi.updateReservation(res.id, d),
  });

  const checkIn = useMutation({
    mutationFn: (payload) => resApi.checkIn(res.id, payload),
    onSuccess: () => { toast.success('Guest checked in'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Check-in failed'),
  });

  const handleCheckIn = async () => {
    // Assign room if not already done
    if (!res.rooms?.id && roomId) {
      await assignRoom.mutateAsync(roomId);
    }
    // If dates changed, update reservation first
    if (checkOutDate !== res.check_out_date || effectiveCheckIn !== res.check_in_date) {
      await updateRes.mutateAsync({
        check_in_date:  effectiveCheckIn,
        check_out_date: checkOutDate,
        total_amount:   totalDue,
      });
    }
    await checkIn.mutateAsync({
      payment_mode:   paymentMode,
      paid_amount:    paymentMode !== 'pay_later' ? parsedPaid : 0,
      payment_method: paymentMethod,
      payment_notes:  paymentNotes,
    });
  };

  const selectedRoom = res.rooms?.id
    ? res.rooms
    : (availableRooms || []).find(r => r.id === roomId) || null;

  const isBusy    = checkIn.isPending || assignRoom.isPending || updateRes.isPending;
  const canCheckIn = (res.rooms?.id || roomId) &&
    (paymentMode === 'pay_later' || parsedPaid > 0);

  return (
    <div className="space-y-4" style={{paddingTop: 12}}>

      {/* Stale dates warning */}
      {isDatesStale && (
        <div className="flex gap-2 rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: 'var(--s-yellow-bg)', color: 'var(--s-yellow-text)' }}>
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Reservation dates are in the past</p>
            <p className="text-xs mt-0.5">Dates have been adjusted to today. Review before confirming.</p>
          </div>
        </div>
      )}

      {/* Booking summary */}
      <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        {[
          ['Guest',       res.guests?.full_name],
          ['Reservation', res.reservation_no],
          ['Room',        selectedRoom ? `Room ${selectedRoom.number}${selectedRoom.room_types?.name ? ` — ${selectedRoom.room_types.name}` : ''}` : '—'],
          ['Check-in',    formatDate(effectiveCheckIn)],
          ['Check-out',   formatDate(checkOutDate)],
          ['Duration',    `${nights} night${nights > 1 ? 's' : ''} @ ${formatCurrency(res.rate_per_night)}/night`],
          ['Total',       formatCurrency(totalDue)],
          ...(deposit > 0 ? [['Deposit Paid', formatCurrency(deposit)]] : []),
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span className="font-medium" style={{ color: 'var(--text-base)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Adjust checkout if dates are stale */}
      {isDatesStale && (
        <div className="form-group">
          <label className="label">Adjust Check-out Date</label>
          <input type="date" className="input"
            value={checkOutDate}
            min={new Date(new Date(effectiveCheckIn).getTime() + 86400000).toISOString().split('T')[0]}
            onChange={e => {
              setCheckOutDate(e.target.value);
              if (paymentMode === 'full') {
                const newNights = Math.max(1, Math.ceil((new Date(e.target.value) - new Date(effectiveCheckIn)) / 86400000));
                setPaidAmount(String(Math.round((res.rate_per_night * newNights - deposit) / 100)));
              }
            }} />
        </div>
      )}

      {/* Room assignment */}
      {!res.rooms?.id && (
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

      {/* Payment collection */}
      <div className="space-y-3">
        <p className="label">Payment at Check-in</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'full',      label: 'Full Payment',    sub: formatCurrency(totalDue - deposit) },
            { value: 'partial',   label: 'Partial Payment', sub: 'Collect now, rest later' },
            { value: 'pay_later', label: 'Pay Later',       sub: 'Settle at check-out' },
          ].map(opt => (
            <button key={opt.value} type="button"
              onClick={() => {
                setPaymentMode(opt.value);
                if (opt.value === 'full')      setPaidAmount(String(Math.round((totalDue - deposit) / 100)));
                if (opt.value === 'pay_later') setPaidAmount('');
              }}
              className="rounded-lg p-3 text-left border transition-all"
              style={{
                borderColor:     paymentMode === opt.value ? 'var(--brand)' : 'var(--border-base)',
                backgroundColor: paymentMode === opt.value ? 'var(--brand-subtle)' : 'transparent',
              }}>
              <p className="text-xs font-semibold"
                style={{ color: paymentMode === opt.value ? 'var(--brand)' : 'var(--text-base)' }}>
                {opt.label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{opt.sub}</p>
            </button>
          ))}
        </div>

        {paymentMode !== 'pay_later' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="label">Amount (₦) *</label>
              <input
                type="text"
                inputMode="numeric"
                className="input"
                value={paidAmount}
                onChange={e => {
                  // Integers only — no kobo/decimal for Naira
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setPaidAmount(raw);
                }}
                placeholder="0"
                disabled={paymentMode === 'full'}
              />
            </div>
            <div className="form-group">
              <label className="label">Method</label>
              <select className="input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        {paymentMode !== 'pay_later' && (
          <div className="form-group">
            <label className="label">Notes</label>
            <input type="text" className="input" value={paymentNotes}
              onChange={e => setPaymentNotes(e.target.value)} placeholder="e.g. Receipt #123" />
          </div>
        )}
      </div>

      {/* Balance summary */}
      <div className="rounded-lg p-3 flex justify-between text-sm"
        style={{ backgroundColor: balance > 0 ? 'var(--s-yellow-bg)' : 'var(--s-green-bg)' }}>
        <span style={{ color: balance > 0 ? 'var(--s-yellow-text)' : 'var(--s-green-text)' }}>
          {balance > 0 ? 'Balance remaining after check-in' : 'Fully paid ✓'}
        </span>
        <span className="font-bold" style={{ color: balance > 0 ? 'var(--s-yellow-text)' : 'var(--s-green-text)' }}>
          {balance > 0 ? formatCurrency(balance) : ''}
        </span>
      </div>

      <div className="flex justify-end">
        <button onClick={handleCheckIn} disabled={isBusy || !canCheckIn}
          className="btn-primary">
          {isBusy ? 'Processing…' : 'Confirm Check-in'}
        </button>
      </div>
    </div>
  );
}
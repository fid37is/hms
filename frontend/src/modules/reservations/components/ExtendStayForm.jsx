import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as resApi from '../../../lib/api/reservationApi';
import { formatDate, formatCurrency } from '../../../utils/format';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'mobile_money'];

export default function ExtendStayForm({ reservation: res, onSuccess, onClose }) {
  const currentCheckOut = res.check_out_date;

  // Default new checkout = current checkout + 1 day
  const defaultDate = new Date(currentCheckOut);
  defaultDate.setDate(defaultDate.getDate() + 1);
  const defaultDateStr = defaultDate.toISOString().split('T')[0];

  const [newCheckOut,    setNewCheckOut]    = useState(defaultDateStr);
  const [paidAmount,     setPaidAmount]     = useState('');
  const [paymentMethod,  setPaymentMethod]  = useState('cash');
  const [paymentNotes,   setPaymentNotes]   = useState('');
  const [collectNow,     setCollectNow]     = useState(true);

  const extraNights = newCheckOut > currentCheckOut
    ? Math.ceil((new Date(newCheckOut) - new Date(currentCheckOut)) / 86400000)
    : 0;
  const extraAmount = extraNights * res.rate_per_night;

  const extend = useMutation({
    mutationFn: (payload) => resApi.extendStay(res.id, payload),
    onSuccess: (r) => {
      const ext = r.data.data.extension;
      toast.success(`Stay extended by ${ext.extra_nights} night${ext.extra_nights > 1 ? 's' : ''}`);
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to extend stay'),
  });

  const handleSubmit = () => {
    extend.mutate({
      new_check_out_date: newCheckOut,
      paid_amount:    collectNow ? Number(paidAmount || 0) : 0,
      payment_method: paymentMethod,
      payment_notes:  paymentNotes,
    });
  };

  return (
    <div className="space-y-4 pt-4">

      {/* Current stay summary */}
      <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        {[
          ['Guest',            res.guests?.full_name],
          ['Room',             `Room ${res.rooms?.number}`],
          ['Current Check-out', formatDate(currentCheckOut)],
          ['Rate/Night',       formatCurrency(res.rate_per_night)],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span className="font-medium" style={{ color: 'var(--text-base)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* New checkout date */}
      <div className="form-group">
        <label className="label">New Check-out Date *</label>
        <input
          type="date" className="input"
          value={newCheckOut}
          min={new Date(new Date(currentCheckOut).getTime() + 86400000).toISOString().split('T')[0]}
          onChange={e => {
            setNewCheckOut(e.target.value);
            if (collectNow) setPaidAmount('');
          }}
        />
      </div>

      {/* Extension summary */}
      {extraNights > 0 && (
        <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: 'var(--brand-subtle)' }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>Extra nights</span>
            <span className="font-medium" style={{ color: 'var(--brand)' }}>{extraNights}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>New check-out</span>
            <span className="font-medium" style={{ color: 'var(--brand)' }}>{formatDate(newCheckOut)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold pt-1" style={{ borderTop: '1px solid var(--border-soft)' }}>
            <span style={{ color: 'var(--text-base)' }}>Extra charges</span>
            <span style={{ color: 'var(--brand)' }}>{formatCurrency(extraAmount)}</span>
          </div>
        </div>
      )}

      {/* Payment for extension */}
      {extraNights > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="collect-now" checked={collectNow}
              onChange={e => setCollectNow(e.target.checked)} style={{ accentColor: 'var(--brand)' }} />
            <label htmlFor="collect-now" className="text-sm cursor-pointer" style={{ color: 'var(--text-base)' }}>
              Collect payment for extension now
            </label>
          </div>

          {collectNow && (
            <div className="space-y-3 pl-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Amount (₦)</label>
                  <input type="number" className="input" min="0" max={extraAmount}
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                    placeholder={String(extraAmount)} />
                  {Number(paidAmount) < extraAmount && paidAmount !== '' && (
                    <p className="text-xs mt-1" style={{ color: 'var(--s-yellow-text)' }}>
                      Partial — {formatCurrency(extraAmount - Number(paidAmount))} still outstanding
                    </p>
                  )}
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
              <div className="form-group">
                <label className="label">Notes</label>
                <input type="text" className="input" value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)} placeholder="e.g. Receipt #456" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={extend.isPending || extraNights === 0}
          className="btn-primary"
        >
          {extend.isPending ? 'Extending…' : `Extend Stay to ${formatDate(newCheckOut)}`}
        </button>
      </div>
    </div>
  );
}
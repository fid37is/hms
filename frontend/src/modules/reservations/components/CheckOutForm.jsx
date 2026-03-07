import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as resApi   from '../../../lib/api/reservationApi';
import * as folioApi from '../../../lib/api/folioApi';
import { formatDate, formatCurrency } from '../../../utils/format';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'mobile_money'];

export default function CheckOutForm({ reservation: res, onSuccess, onExtend }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [payAmount,   setPayAmount]   = useState('');
  const [payMethod,   setPayMethod]   = useState('cash');
  const [payNotes,    setPayNotes]    = useState('');
  const [showPay,     setShowPay]     = useState(false);

  const { data: folio, isLoading, refetch } = useQuery({
    queryKey: ['folio-res', res.id],
    queryFn:  () => folioApi.getFolioByReservation(res.id).then(r => r.data.data),
    retry: false,
    // folio only exists after check-in — don't throw, just return null
    throwOnError: false,
  });

  const addPayment = useMutation({
    mutationFn: (d) => folioApi.addPayment(folio.id, d),
    onSuccess: () => {
      toast.success('Payment recorded');
      setPayAmount(''); setPayNotes(''); setShowPay(false);
      refetch();
      qc.invalidateQueries(['folio-res', res.id]);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Payment failed'),
  });

  const checkOut = useMutation({
    mutationFn: () => resApi.checkOut(res.id),
    onSuccess: () => { toast.success('Guest checked out'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Check-out failed'),
  });

  if (isLoading) return <LoadingSpinner center />;

  const totalCharges  = folio?.total_charges  || 0;
  const totalPayments = folio?.total_payments  || 0;
  const balance       = folio?.balance         || 0;

  return (
    <div className="space-y-4" style={{paddingTop: 12}}>

      {/* Summary */}
      <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        {[
          ['Guest',         res.guests?.full_name],
          ['Room',          res.rooms?.number ? `Room ${res.rooms.number}` : '—'],
          ['Checked in',    formatDate(res.actual_check_in || res.check_in_date)],
          ['Check-out',     formatDate(res.check_out_date)],
          ['Total Charges', formatCurrency(totalCharges)],
          ['Total Paid',    formatCurrency(totalPayments)],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span className="font-medium" style={{ color: 'var(--text-base)' }}>{value}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-semibold pt-2"
          style={{ borderTop: '1px solid var(--border-soft)' }}>
          <span style={{ color: 'var(--text-base)' }}>Balance Due</span>
          <span style={{ color: balance > 0 ? 'var(--s-red-text)' : 'var(--s-green-text)' }}>
            {balance > 0 ? formatCurrency(balance) : '✓ Settled'}
          </span>
        </div>
      </div>

      {/* Outstanding balance — collect payment inline */}
      {balance > 0 && (
        <div className="space-y-3 rounded-lg p-4"
          style={{ backgroundColor: 'var(--s-yellow-bg)', border: '1px solid var(--s-yellow-text)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--s-yellow-text)' }}>
            Outstanding balance of {formatCurrency(balance)} must be settled before check-out.
          </p>
          {!showPay ? (
            <button onClick={() => { setShowPay(true); setPayAmount(String(balance)); }}
              className="btn-primary text-xs">
              Collect Payment
            </button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Amount (₦)</label>
                  <input type="number" className="input" min="1" max={balance}
                    value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">Method</label>
                  <select className="input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
              <input type="text" className="input" placeholder="Notes (optional)"
                value={payNotes} onChange={e => setPayNotes(e.target.value)} />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => addPayment.mutate({ amount: Number(payAmount), method: payMethod, notes: payNotes })}
                  disabled={addPayment.isPending || !payAmount}
                  className="btn-primary text-xs">
                  {addPayment.isPending ? 'Recording…' : 'Record Payment'}
                </button>
                <button onClick={() => setShowPay(false)} className="btn-secondary text-xs">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        {folio && (
          <button onClick={() => navigate(`/folio/${folio.id}`)} className="btn-secondary text-sm">
            View Folio
          </button>
        )}
        {onExtend && (
          <button onClick={onExtend} className="btn-secondary text-sm">
            Extend Stay
          </button>
        )}
        <button
          onClick={() => checkOut.mutate()}
          disabled={checkOut.isPending || balance > 0}
          className="btn-primary text-sm"
          title={balance > 0 ? 'Settle balance first' : ''}
        >
          {checkOut.isPending ? 'Checking out…' : 'Confirm Check-out'}
        </button>
      </div>
    </div>
  );
}
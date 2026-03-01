import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, CreditCard, XCircle } from 'lucide-react';
import * as folioApi from '../../lib/api/folioApi';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import StatusBadge    from '../../components/shared/StatusBadge';
import Modal          from '../../components/shared/Modal';
import AddChargeForm  from './components/AddChargeForm';
import PaymentForm    from './components/PaymentForm';
import { formatCurrency, formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';

export default function FolioPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCharge,  setShowCharge]  = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [voidItem,    setVoidItem]    = useState(null);
  const [voidReason,  setVoidReason]  = useState('');

  const { data: folio, isLoading } = useQuery({
    queryKey: ['folio', id],
    queryFn:  () => folioApi.getFolioById(id).then(r => r.data.data),
  });

  const doVoid = useMutation({
    mutationFn: () => folioApi.voidCharge(id, voidItem.id, { reason: voidReason }),
    onSuccess: () => {
      toast.success('Charge voided');
      setVoidItem(null); setVoidReason('');
      qc.invalidateQueries(['folio', id]);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to void'),
  });

  if (isLoading) return <LoadingSpinner center />;
  if (!folio) return <p style={{ color: 'var(--text-muted)' }}>Folio not found</p>;

  const items    = folio.folio_items    || [];
  const payments = folio.payments       || [];
  const balance  = folio.balance        || 0;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost gap-1.5"
          style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={14} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="page-title">Folio {folio.folio_no}</h1>
            <StatusBadge status={folio.status} />
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {folio.guests?.full_name} · {folio.reservations?.reservation_no}
          </p>
        </div>
        {folio.status === 'open' && (
          <div className="flex gap-2">
            <button onClick={() => setShowCharge(true)} className="btn-secondary">
              <Plus size={14} /> Add Charge
            </button>
            <button onClick={() => setShowPayment(true)} className="btn-primary">
              <CreditCard size={14} /> Payment
            </button>
          </div>
        )}
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Charges',  value: folio.total_charges  || 0, color: 'var(--text-base)'    },
          { label: 'Total Payments', value: folio.total_payments || 0, color: 'var(--s-green-text)' },
          { label: 'Balance Due',    value: balance,                   color: balance > 0 ? 'var(--s-red-text)' : 'var(--s-green-text)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <p className="stat-label">{label}</p>
            <p className="text-xl font-semibold mt-1" style={{ color }}>{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      {/* Charges */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Charges</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{items.length} items</span>
        </div>
        <table className="w-full">
          <thead>
            <tr>
              {['Description', 'Dept', 'Qty', 'Unit Price', 'Amount', 'Status', ''].map(h => (
                <th key={h} className="table-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="table-row"
                style={{ opacity: item.is_voided ? 0.45 : 1 }}>
                <td className="table-td">
                  <span style={{ color: 'var(--text-base)' }}>{item.description}</span>
                </td>
                <td className="table-td">
                  <span className="badge badge-gray capitalize">{item.department}</span>
                </td>
                <td className="table-td font-mono text-xs">{item.quantity}</td>
                <td className="table-td font-mono text-xs">{formatCurrency(item.unit_price)}</td>
                <td className="table-td font-mono text-sm font-medium">{formatCurrency(item.amount)}</td>
                <td className="table-td">
                  {item.is_voided
                    ? <span className="badge" style={{ backgroundColor: 'var(--s-gray-bg)', color: 'var(--s-gray-text)' }}>Voided</span>
                    : <span className="badge" style={{ backgroundColor: 'var(--s-green-bg)', color: 'var(--s-green-text)' }}>Active</span>
                  }
                </td>
                <td className="table-td">
                  {!item.is_voided && folio.status === 'open' && (
                    <button onClick={() => setVoidItem(item)}
                      className="btn-ghost p-1" style={{ color: 'var(--s-red-text)' }}>
                      <XCircle size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan={7} className="table-td text-center py-8"
                style={{ color: 'var(--text-muted)' }}>No charges posted</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payments */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Payments</span>
        </div>
        <table className="w-full">
          <thead>
            <tr>
              {['Ref', 'Method', 'Amount', 'Received At', 'Status'].map(h => (
                <th key={h} className="table-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="table-row">
                <td className="table-td font-mono text-xs" style={{ color: 'var(--brand)' }}>{p.payment_no}</td>
                <td className="table-td capitalize">{p.method?.replace(/_/g, ' ')}</td>
                <td className="table-td font-mono text-sm font-medium"
                  style={{ color: 'var(--s-green-text)' }}>
                  {formatCurrency(p.amount)}
                </td>
                <td className="table-td text-xs">{formatDateTime(p.received_at)}</td>
                <td className="table-td"><StatusBadge status={p.status} /></td>
              </tr>
            ))}
            {!payments.length && (
              <tr><td colSpan={5} className="table-td text-center py-8"
                style={{ color: 'var(--text-muted)' }}>No payments recorded</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Void charge modal */}
      <Modal open={!!voidItem} onClose={() => setVoidItem(null)} title="Void Charge" size="sm">
        {voidItem && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-sub)' }}>
              Void <strong style={{ color: 'var(--text-base)' }}>{voidItem.description}</strong> ({formatCurrency(voidItem.amount)})?
            </p>
            <div className="form-group">
              <label className="label">Reason *</label>
              <input className="input" required value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                placeholder="Enter void reason…" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setVoidItem(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => doVoid.mutate()}
                disabled={!voidReason || doVoid.isPending}
                className="btn-danger"
              >
                {doVoid.isPending ? 'Voiding…' : 'Void Charge'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showCharge} onClose={() => setShowCharge(false)} title="Add Charge">
        <AddChargeForm folioId={id}
          onSuccess={() => { setShowCharge(false); qc.invalidateQueries(['folio', id]); }} />
      </Modal>

      <Modal open={showPayment} onClose={() => setShowPayment(false)} title="Record Payment">
        <PaymentForm folioId={id} balance={balance}
          onSuccess={() => { setShowPayment(false); qc.invalidateQueries(['folio', id]); }} />
      </Modal>
    </div>
  );
}

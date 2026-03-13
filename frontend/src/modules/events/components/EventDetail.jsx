// src/modules/events/components/EventDetail.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, Edit2, XCircle, Plus, Trash2, ChevronDown, Users,
  CreditCard, UserCheck, FileText,
} from 'lucide-react';
import * as eventApi from '../../../lib/api/eventApi';
import StatusBadge   from '../../../components/shared/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/format';
import toast from 'react-hot-toast';

const STATUS_FLOW = ['enquiry','confirmed','deposit_paid','in_progress','completed','cancelled'];
const STATUS_LABELS = {
  enquiry: 'Enquiry', confirmed: 'Confirmed', deposit_paid: 'Deposit Paid',
  in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
};
const SERVICE_CATS = ['venue','catering','beverage','av_equipment','decoration','staffing','transport','accommodation','other'];
const PAY_METHODS  = ['cash','card','bank_transfer','mobile_money','complimentary','other'];

function Section({ title, icon: Icon, children, action }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={13} style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{title}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function AddServiceForm({ eventId, onDone }) {
  const [form, setForm] = useState({ category: 'other', description: '', quantity: 1, unit_price: '', notes: '' });
  const mut = useMutation({
    mutationFn: () => eventApi.addService(eventId, {
      ...form,
      unit_price: Math.round(parseFloat(form.unit_price) * 100),
      quantity: parseInt(form.quantity) || 1,
    }),
    onSuccess: () => { toast.success('Service added'); onDone(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
      <div className="grid grid-cols-2 gap-2">
        <select className="input text-xs" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
          {SERVICE_CATS.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
        </select>
        <input className="input text-xs" placeholder="Description" value={form.description}
          onChange={e => setForm(f => ({...f, description: e.target.value}))} />
        <input className="input text-xs" type="number" min="1" placeholder="Qty" value={form.quantity}
          onChange={e => setForm(f => ({...f, quantity: e.target.value}))} />
        <input className="input text-xs" type="number" min="0" placeholder="Unit price (₦)" value={form.unit_price}
          onChange={e => setForm(f => ({...f, unit_price: e.target.value}))} />
        <input className="input text-xs col-span-2" placeholder="Notes (optional)" value={form.notes}
          onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
      </div>
      <div className="flex justify-end gap-2">
        <button className="btn-ghost text-xs" onClick={onDone}>Cancel</button>
        <button className="btn-primary text-xs" onClick={() => mut.mutate()} disabled={mut.isPending || !form.description || !form.unit_price}>
          {mut.isPending ? 'Adding…' : 'Add'}
        </button>
      </div>
    </div>
  );
}

function AddPaymentForm({ eventId, onDone }) {
  const [form, setForm] = useState({ amount: '', method: 'cash', is_deposit: false, reference: '', notes: '' });
  const mut = useMutation({
    mutationFn: () => eventApi.addPayment(eventId, {
      ...form,
      amount: Math.round(parseFloat(form.amount) * 100),
      is_deposit: form.is_deposit === true || form.is_deposit === 'true',
    }),
    onSuccess: () => { toast.success('Payment recorded'); onDone(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
      <div className="grid grid-cols-2 gap-2">
        <input className="input text-xs" type="number" min="0" placeholder="Amount (₦)" value={form.amount}
          onChange={e => setForm(f => ({...f, amount: e.target.value}))} />
        <select className="input text-xs" value={form.method} onChange={e => setForm(f => ({...f, method: e.target.value}))}>
          {PAY_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
        </select>
        <input className="input text-xs" placeholder="Reference (optional)" value={form.reference}
          onChange={e => setForm(f => ({...f, reference: e.target.value}))} />
        <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-sub)' }}>
          <input type="checkbox" checked={form.is_deposit} onChange={e => setForm(f => ({...f, is_deposit: e.target.checked}))} />
          Mark as deposit
        </label>
        <input className="input text-xs col-span-2" placeholder="Notes (optional)" value={form.notes}
          onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
      </div>
      <div className="flex justify-end gap-2">
        <button className="btn-ghost text-xs" onClick={onDone}>Cancel</button>
        <button className="btn-primary text-xs" onClick={() => mut.mutate()} disabled={mut.isPending || !form.amount}>
          {mut.isPending ? 'Saving…' : 'Record Payment'}
        </button>
      </div>
    </div>
  );
}

export default function EventDetail({ eventId, onClose, onEdit, onRefresh }) {
  const qc = useQueryClient();
  const [addingService, setAddingService]   = useState(false);
  const [addingPayment, setAddingPayment]   = useState(false);
  const [statusOpen, setStatusOpen]         = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn:  () => eventApi.getEvent(eventId).then(r => r.data.data),
  });

  const refetch = () => {
    qc.invalidateQueries(['event', eventId]);
    qc.invalidateQueries(['events']);
    onRefresh?.();
  };

  const statusMut = useMutation({
    mutationFn: (status) => eventApi.updateEvent(eventId, { status }),
    onSuccess: () => { toast.success('Status updated'); refetch(); setStatusOpen(false); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const cancelMut = useMutation({
    mutationFn: () => eventApi.cancelEvent(eventId, 'Cancelled by staff'),
    onSuccess: () => { toast.success('Event cancelled'); refetch(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const voidServiceMut = useMutation({
    mutationFn: (sid) => eventApi.voidService(eventId, sid),
    onSuccess: () => { toast.success('Service voided'); refetch(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const removeStaffMut = useMutation({
    mutationFn: (aid) => eventApi.removeStaff(eventId, aid),
    onSuccess: () => { toast.success('Staff removed'); refetch(); },
  });

  if (isLoading) return (
    <div className="slide-panel-overlay">
      <div className="slide-panel" style={{ maxWidth: 560, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2" style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }} />
      </div>
    </div>
  );

  if (!event) return null;

  const canCancel  = !['cancelled','completed'].includes(event.status);
  const isCancelled = event.status === 'cancelled';
  const services   = (event.event_services || []).filter(s => !s.is_voided);
  const payments   = event.event_payments || [];
  const staffList  = event.event_staff || [];

  return (
    <div className="slide-panel-overlay">
      <div className="slide-panel" style={{ maxWidth: 560 }}>
        {/* Header */}
        <div className="slide-panel-header">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-base)' }}>{event.title}</h2>
              <StatusBadge status={event.status} />
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {event.event_no} · {event.client_name}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {!isCancelled && (
              <button className="btn-ghost p-2 rounded-lg" title="Edit" onClick={() => onEdit(event)}>
                <Edit2 size={14} />
              </button>
            )}
            <button className="btn-ghost p-2 rounded-lg" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        <div className="slide-panel-body space-y-5">

          {/* Status changer */}
          {!isCancelled && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Change status:</span>
              <div className="flex flex-wrap gap-1">
                {STATUS_FLOW.filter(s => s !== 'cancelled' && s !== event.status).map(s => (
                  <button key={s} className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                    style={{ borderColor: 'var(--border-base)', color: 'var(--text-sub)', background: 'transparent' }}
                    onClick={() => statusMut.mutate(s)} disabled={statusMut.isPending}>
                    → {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Event Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow label="Date"   value={formatDate(event.event_date)} />
            <InfoRow label="Time"   value={`${event.start_time?.slice(0,5)} – ${event.end_time?.slice(0,5)}`} />
            <InfoRow label="Venue"  value={event.event_venues?.name || '—'} />
            <InfoRow label="Layout" value={event.layout} />
            <InfoRow label="Type"   value={event.event_type} />
            <InfoRow label="Guests" value={event.guest_count || 0} />
            <InfoRow label="Phone"  value={event.client_phone || '—'} />
            <InfoRow label="Email"  value={event.client_email || '—'} />
            {event.coordinator_id && (
              <InfoRow label="Coordinator" value={event.users?.full_name || '—'} />
            )}
          </div>

          {/* Notes */}
          {(event.special_requests || event.catering_notes || event.setup_notes || event.internal_notes) && (
            <div className="space-y-2">
              {event.special_requests && <NoteBlock label="Special Requests" text={event.special_requests} />}
              {event.catering_notes   && <NoteBlock label="Catering"         text={event.catering_notes} />}
              {event.setup_notes      && <NoteBlock label="Setup / Décor"    text={event.setup_notes} />}
              {event.internal_notes   && <NoteBlock label="Internal Notes"   text={event.internal_notes} />}
            </div>
          )}

          {/* Financial summary */}
          <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
            <FinRow label="Subtotal"     value={formatCurrency(event.subtotal     || 0)} />
            {event.discount > 0 && <FinRow label="Discount" value={`– ${formatCurrency(event.discount)}`} muted />}
            {event.tax_amount > 0 && <FinRow label="Tax"    value={formatCurrency(event.tax_amount)} />}
            <div style={{ borderTop: '1px solid var(--border-base)', paddingTop: 8, marginTop: 4 }}>
              <FinRow label="Total"      value={formatCurrency(event.total_amount || 0)} bold />
            </div>
            <FinRow label="Deposit Paid" value={formatCurrency(event.deposit_paid || 0)} />
            <FinRow label="Balance Due"  value={formatCurrency(event.balance_due  || 0)} bold={event.balance_due > 0} />
          </div>

          {/* Services */}
          <Section title="Services" icon={FileText}
            action={!isCancelled && (
              <button className="btn-ghost text-xs flex items-center gap-1" onClick={() => setAddingService(s => !s)}>
                <Plus size={12} /> Add
              </button>
            )}>
            {addingService && (
              <AddServiceForm eventId={eventId} onDone={() => { setAddingService(false); refetch(); }} />
            )}
            {services.length === 0 && !addingService && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No services added yet</p>
            )}
            {services.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-base)' }}>{s.description}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {s.category.replace(/_/g,' ')} · {s.quantity} × {formatCurrency(s.unit_price)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium font-mono" style={{ color: 'var(--text-base)' }}>
                    {formatCurrency(s.amount)}
                  </span>
                  {!isCancelled && (
                    <button className="btn-ghost p-1 rounded" onClick={() => voidServiceMut.mutate(s.id)}>
                      <Trash2 size={11} style={{ color: 'var(--s-red-text)' }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </Section>

          {/* Payments */}
          <Section title="Payments" icon={CreditCard}
            action={!isCancelled && (
              <button className="btn-ghost text-xs flex items-center gap-1" onClick={() => setAddingPayment(s => !s)}>
                <Plus size={12} /> Record
              </button>
            )}>
            {addingPayment && (
              <AddPaymentForm eventId={eventId} onDone={() => { setAddingPayment(false); refetch(); }} />
            )}
            {payments.length === 0 && !addingPayment && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No payments recorded</p>
            )}
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-base)' }}>
                    {p.payment_no} {p.is_deposit && <span style={{ color: 'var(--brand)', fontSize: 10 }}>· deposit</span>}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {p.method.replace(/_/g,' ')} · {formatDateTime(p.received_at)}
                  </p>
                </div>
                <span className="text-xs font-medium font-mono" style={{ color: 'var(--s-green-text)' }}>
                  {formatCurrency(p.amount)}
                </span>
              </div>
            ))}
          </Section>

          {/* Staff */}
          <Section title="Assigned Staff" icon={UserCheck}
            action={null}>
            {staffList.length === 0 && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No staff assigned</p>
            )}
            {staffList.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-base)' }}>
                    {a.staff?.full_name || '—'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {a.role || a.staff?.job_title || '—'}
                  </p>
                </div>
                {!isCancelled && (
                  <button className="btn-ghost p-1 rounded" onClick={() => removeStaffMut.mutate(a.id)}>
                    <Trash2 size={11} style={{ color: 'var(--s-red-text)' }} />
                  </button>
                )}
              </div>
            ))}
          </Section>

          {/* Cancel */}
          {canCancel && (
            <div style={{ paddingTop: 8 }}>
              <button className="text-xs flex items-center gap-1.5 transition-colors"
                style={{ color: 'var(--s-red-text)' }}
                onClick={() => { if (window.confirm('Cancel this event?')) cancelMut.mutate(); }}>
                <XCircle size={13} /> Cancel Event
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm capitalize" style={{ color: 'var(--text-base)' }}>{value}</p>
    </div>
  );
}

function NoteBlock({ label, text }) {
  return (
    <div className="rounded-md p-3" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-xs whitespace-pre-wrap" style={{ color: 'var(--text-sub)' }}>{text}</p>
    </div>
  );
}

function FinRow({ label, value, bold, muted }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs" style={{ color: muted ? 'var(--text-muted)' : 'var(--text-sub)' }}>{label}</span>
      <span className={`text-xs font-mono ${bold ? 'font-semibold' : ''}`}
        style={{ color: bold ? 'var(--text-base)' : 'var(--text-sub)' }}>{value}</span>
    </div>
  );
}
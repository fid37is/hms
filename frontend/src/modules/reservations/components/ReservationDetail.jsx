// src/modules/reservations/components/ReservationDetail.jsx
import { useQuery } from '@tanstack/react-query';
import { LogIn, LogOut, BedDouble, User, Calendar, CreditCard, FileText, Expand } from 'lucide-react';
import * as resApi from '../../../lib/api/reservationApi';
import StatusBadge from '../../../components/shared/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/format';

const PAYMENT_STATUS_STYLE = {
  pending:          { color: 'var(--s-yellow-text)', bg: 'var(--s-yellow-bg)', label: 'Pending' },
  pending_transfer: { color: 'var(--s-blue-text)',   bg: 'var(--s-blue-bg)',   label: 'Awaiting Transfer' },
  paid:             { color: 'var(--s-green-text)',  bg: 'var(--s-green-bg)',  label: 'Paid' },
  refunded:         { color: 'var(--s-red-text)',    bg: 'var(--s-red-bg)',    label: 'Refunded' },
};

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-start py-2" style={{ borderBottom: '1px solid var(--border-soft)' }}>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-xs font-medium text-right ml-4" style={{ color: 'var(--text-base)' }}>{value}</span>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={12} style={{ color: 'var(--text-muted)' }} />
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

export default function ReservationDetail({ reservation: r, onAction }) {
  // Fetch full detail
  const { data, isLoading } = useQuery({
    queryKey: ['reservation', r.id],
    queryFn:  () => resApi.getReservationById(r.id).then(res => res.data.data),
  });

  const res = data || r;
  const nights = Math.ceil((new Date(res.check_out_date) - new Date(res.check_in_date)) / 86400000);
  const payStyle = PAYMENT_STATUS_STYLE[res.payment_status] || PAYMENT_STATUS_STYLE.pending;

  if (isLoading && !data) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-7 w-7 border-2"
        style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Subheader */}
      <div className="px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-subtle)' }}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>
              {res.guests?.full_name || '—'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{res.reservation_no}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={res.status} />
            {!['cancelled','no_show'].includes(res.status) && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: payStyle.bg, color: payStyle.color }}>
                {payStyle.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* Stay */}
        <Section icon={Calendar} title="Stay">
          <InfoRow label="Room"      value={res.rooms?.number ? `Room ${res.rooms.number}${res.rooms.room_types?.name ? ` — ${res.rooms.room_types.name}` : ''}` : 'Unassigned'} />
          <InfoRow label="Check-in"  value={formatDate(res.check_in_date)} />
          <InfoRow label="Check-out" value={formatDate(res.check_out_date)} />
          <InfoRow label="Duration"  value={`${nights} night${nights !== 1 ? 's' : ''}`} />
          <InfoRow label="Adults"    value={res.adults} />
          {res.children > 0 && <InfoRow label="Children" value={res.children} />}
          <InfoRow label="Source"    value={res.booking_source?.replace(/_/g, ' ')} />
        </Section>

        {/* Guest */}
        <Section icon={User} title="Guest">
          <InfoRow label="Name"  value={res.guests?.full_name} />
          <InfoRow label="Email" value={res.guests?.email} />
          <InfoRow label="Phone" value={res.guests?.phone} />
          {res.guests?.nationality && <InfoRow label="Nationality" value={res.guests.nationality} />}
        </Section>

        {/* Financials */}
        <Section icon={CreditCard} title="Financials">
          <InfoRow label="Rate / night"  value={formatCurrency(res.rate_per_night)} />
          <InfoRow label="Total"         value={formatCurrency(res.total_amount)} />
          {res.deposit_amount > 0 && <InfoRow label="Deposit" value={formatCurrency(res.deposit_amount)} />}
          {res.amount_paid > 0    && <InfoRow label="Paid"    value={formatCurrency(res.amount_paid)} />}
          <InfoRow label="Payment method" value={res.payment_method?.replace(/_/g, ' ')} />
        </Section>

        {/* Timestamps */}
        {(res.actual_check_in || res.actual_check_out) && (
          <Section icon={FileText} title="Activity">
            {res.actual_check_in  && <InfoRow label="Checked in"  value={formatDateTime(res.actual_check_in)} />}
            {res.actual_check_out && <InfoRow label="Checked out" value={formatDateTime(res.actual_check_out)} />}
          </Section>
        )}

        {/* Notes */}
        {(res.special_requests || res.notes) && (
          <Section icon={FileText} title="Notes">
            {res.special_requests && (
              <div className="rounded-md p-3 text-xs" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-sub)' }}>
                <p className="font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Special Requests</p>
                {res.special_requests}
              </div>
            )}
            {res.notes && (
              <div className="rounded-md p-3 text-xs mt-2" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-sub)' }}>
                <p className="font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Notes</p>
                {res.notes}
              </div>
            )}
          </Section>
        )}
      </div>

      {/* Action footer — contextual buttons based on status */}
      {['confirmed','checked_in'].includes(res.status) && (
        <div className="px-5 py-3 flex items-center gap-2 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border-soft)' }}>
          {res.status === 'confirmed' && (
            <button className="btn-primary text-sm flex items-center gap-2 flex-1 justify-center"
              onClick={() => onAction('checkin')}>
              <LogIn size={14} /> Check In
            </button>
          )}
          {res.status === 'checked_in' && (
            <button className="btn-secondary text-sm flex items-center gap-2 flex-1 justify-center"
              onClick={() => onAction('checkout')}>
              <LogOut size={14} /> Check Out
            </button>
          )}
        </div>
      )}
    </div>
  );
}
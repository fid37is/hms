import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, Flag } from 'lucide-react';
import * as guestApi  from '../../lib/api/guestApi';
import LoadingSpinner  from '../../components/shared/LoadingSpinner';
import StatusBadge     from '../../components/shared/StatusBadge';
import { formatDate, formatCurrency } from '../../utils/format';

export default function GuestProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: guest, isLoading: guestLoading } = useQuery({
    queryKey: ['guest', id],
    queryFn:  () => guestApi.getGuestById(id).then(r => r.data.data),
    enabled:  !!id,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['guest-history', id],
    queryFn:  () => guestApi.getGuestHistory(id).then(r => r.data.data),
    enabled:  !!id,
  });

  if (guestLoading) return <LoadingSpinner center />;
  if (!guest) return (
    <div className="space-y-4">
      <button onClick={() => navigate('/guests')} className="btn-ghost text-sm gap-1.5" style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={14} /> Back to Guests
      </button>
      <p style={{ color: 'var(--text-muted)' }}>Guest not found.</p>
    </div>
  );

  const initials = (guest.full_name || '?').charAt(0).toUpperCase();

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/guests')}
        className="btn-ghost text-sm gap-1.5"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={14} /> Back to Guests
      </button>

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-base)' }}>
                {guest.full_name}
              </h2>
              <StatusBadge status={guest.category || 'regular'} />
              {guest.is_flagged && (
                <span className="badge" style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}>
                  Flagged
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              {guest.phone && (
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-sub)' }}>
                  <Phone size={13} /> {guest.phone}
                </div>
              )}
              {guest.email && (
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-sub)' }}>
                  <Mail size={13} /> {guest.email}
                </div>
              )}
              {guest.nationality && (
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-sub)' }}>
                  <Flag size={13} /> {guest.nationality}
                </div>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-semibold" style={{ color: 'var(--brand)' }}>{guest.total_visits || 0}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>total visits</p>
          </div>
        </div>
      </div>

      {/* Stay history */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Stay History</span>
        </div>
        {historyLoading ? (
          <div className="py-8"><LoadingSpinner center /></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                {['Ref', 'Room', 'Check-in', 'Check-out', 'Amount', 'Status'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(history || []).length > 0 ? (history || []).map(r => (
                <tr key={r.id} className="table-row">
                  <td className="table-td">
                    <span className="font-mono text-xs" style={{ color: 'var(--brand)' }}>{r.reservation_no}</span>
                  </td>
                  <td className="table-td">{r.rooms?.number ?? '—'}</td>
                  <td className="table-td">{formatDate(r.check_in_date)}</td>
                  <td className="table-td">{formatDate(r.check_out_date)}</td>
                  <td className="table-td">{formatCurrency(r.total_amount ?? 0)}</td>
                  <td className="table-td"><StatusBadge status={r.status} /></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="table-td text-center py-8" style={{ color: 'var(--text-muted)' }}>
                    No stay history
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
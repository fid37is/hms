import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import * as resApi from '../../lib/api/reservationApi';
import PageHeader     from '../../components/shared/PageHeader';
import DataTable      from '../../components/shared/DataTable';
import StatusBadge    from '../../components/shared/StatusBadge';
import Modal          from '../../components/shared/Modal';
import ConfirmDialog  from '../../components/shared/ConfirmDialog';
import ReservationForm from './components/ReservationForm';
import CheckInForm    from './components/CheckInForm';
import CheckOutForm   from './components/CheckOutForm';
import { formatDate, formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { label: 'All',         value: ''            },
  { label: 'Confirmed',   value: 'confirmed'   },
  { label: 'In House',    value: 'checked_in'  },
  { label: 'Checked Out', value: 'checked_out' },
  { label: 'Cancelled',   value: 'cancelled'   },
];

export default function ReservationsPage() {
  const qc = useQueryClient();
  const [status,    setStatus]    = useState('');
  const [search,    setSearch]    = useState('');
  const [showNew,   setShowNew]   = useState(false);
  const [checkIn,   setCheckIn]   = useState(null);
  const [checkOut,  setCheckOut]  = useState(null);
  const [cancel,    setCancel]    = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', status],
    queryFn:  () => resApi.getReservations(status ? { status } : {}).then(r => r.data.data),
  });

  const doCancel = useMutation({
    mutationFn: ({ id, reason }) => resApi.cancelReservation(id, { reason }),
    onSuccess: () => { toast.success('Reservation cancelled'); setCancel(null); qc.invalidateQueries(['reservations']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const reservations = (data || []).filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.reservation_no?.toLowerCase().includes(q) ||
      r.guests?.full_name?.toLowerCase().includes(q) ||
      r.rooms?.number?.toLowerCase().includes(q)
    );
  });

  const columns = [
    { key: 'reservation_no', label: 'Ref No.',
      render: r => <span className="font-mono text-xs font-medium" style={{ color: 'var(--brand)' }}>{r.reservation_no}</span> },
    { key: 'guest', label: 'Guest',
      render: r => <span style={{ color: 'var(--text-base)' }}>{r.guests?.full_name || '—'}</span> },
    { key: 'room', label: 'Room',
      render: r => r.rooms?.number
        ? <span className="font-medium" style={{ color: 'var(--text-base)' }}>Room {r.rooms.number}</span>
        : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span> },
    { key: 'check_in_date',  label: 'Check-in',  render: r => formatDate(r.check_in_date)  },
    { key: 'check_out_date', label: 'Check-out', render: r => formatDate(r.check_out_date) },
    { key: 'total_amount',   label: 'Amount',    render: r => formatCurrency(r.total_amount) },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'actions', label: '', width: '120px',
      render: r => (
        <div className="flex gap-1.5 justify-end">
          {r.status === 'confirmed' && (
            <button onClick={e => { e.stopPropagation(); setCheckIn(r); }}
              className="btn-primary text-xs px-2.5 py-1">
              Check In
            </button>
          )}
          {r.status === 'checked_in' && (
            <button onClick={e => { e.stopPropagation(); setCheckOut(r); }}
              className="btn-secondary text-xs px-2.5 py-1">
              Check Out
            </button>
          )}
          {['confirmed'].includes(r.status) && (
            <button onClick={e => { e.stopPropagation(); setCancel(r); }}
              className="btn-ghost text-xs px-2.5 py-1"
              style={{ color: 'var(--s-red-text)' }}>
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reservations"
        subtitle={`${reservations.length} records`}
        action={
          <button onClick={() => setShowNew(true)} className="btn-primary">
            <Plus size={15} /> New Reservation
          </button>
        }
      />

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          {STATUS_TABS.map(t => (
            <button key={t.value} onClick={() => setStatus(t.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
              style={{
                backgroundColor: status === t.value ? 'var(--bg-surface)' : 'transparent',
                color:           status === t.value ? 'var(--text-base)'  : 'var(--text-muted)',
                boxShadow:       status === t.value ? 'var(--shadow-xs)'  : 'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-8 w-56 text-xs" placeholder="Search guest, room, ref…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={reservations} loading={isLoading}
          emptyTitle="No reservations found" />
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Reservation" size="lg">
        <ReservationForm onSuccess={() => { setShowNew(false); qc.invalidateQueries(['reservations']); }} />
      </Modal>

      <Modal open={!!checkIn} onClose={() => setCheckIn(null)} title="Check In" size="md">
        {checkIn && <CheckInForm reservation={checkIn}
          onSuccess={() => { setCheckIn(null); qc.invalidateQueries(['reservations']); }} />}
      </Modal>

      <Modal open={!!checkOut} onClose={() => setCheckOut(null)} title="Check Out" size="md">
        {checkOut && <CheckOutForm reservation={checkOut}
          onSuccess={() => { setCheckOut(null); qc.invalidateQueries(['reservations']); }} />}
      </Modal>

      <ConfirmDialog
        open={!!cancel} danger
        title="Cancel Reservation"
        message={`Cancel reservation ${cancel?.reservation_no} for ${cancel?.guests?.full_name}? This cannot be undone.`}
        loading={doCancel.isPending}
        onClose={() => setCancel(null)}
        onConfirm={() => doCancel.mutate({ id: cancel.id, reason: 'Cancelled by staff' })}
      />
    </div>
  );
}

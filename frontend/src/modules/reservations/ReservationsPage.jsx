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
  { label: 'All',       value: ''            },
  { label: 'Confirmed', value: 'confirmed'   },
  { label: 'In House',  value: 'checked_in'  },
  { label: 'Checked Out', value: 'checked_out' },
  { label: 'Cancelled', value: 'cancelled'   },
];

export default function ReservationsPage() {
  const qc = useQueryClient();
  const [status,   setStatus]   = useState('');
  const [search,   setSearch]   = useState('');
  const [showNew,  setShowNew]  = useState(false);
  const [checkIn,  setCheckIn]  = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [cancel,   setCancel]   = useState(null);

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
    { key: 'reservation_no', label: 'Ref',
      render: r => <span className="font-mono text-xs font-medium" style={{ color: 'var(--brand)' }}>{r.reservation_no}</span> },
    { key: 'guest', label: 'Guest',
      render: r => <span style={{ color: 'var(--text-base)' }}>{r.guests?.full_name || '—'}</span> },
    { key: 'room', label: 'Room',
      render: r => r.rooms?.number ? <span className="font-medium" style={{ color: 'var(--text-base)' }}>Room {r.rooms.number}</span> : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span> },
    { key: 'check_in_date',  label: 'Check-in',  render: r => formatDate(r.check_in_date)  },
    { key: 'check_out_date', label: 'Check-out', render: r => formatDate(r.check_out_date) },
    { key: 'total_amount',   label: 'Amount',    render: r => formatCurrency(r.total_amount) },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'actions', label: '', width: '120px',
      render: r => (
        <div className="flex gap-1.5 justify-end flex-wrap">
          {r.status === 'confirmed' && (
            <button onClick={e => { e.stopPropagation(); setCheckIn(r); }}
              className="btn-primary text-xs px-2.5 py-1">Check In</button>
          )}
          {r.status === 'checked_in' && (
            <button onClick={e => { e.stopPropagation(); setCheckOut(r); }}
              className="btn-secondary text-xs px-2.5 py-1">Check Out</button>
          )}
          {['confirmed','checked_in'].includes(r.status) && (
            <button onClick={e => { e.stopPropagation(); setCancel(r); }}
              className="text-xs px-2.5 py-1 rounded-md"
              style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}>
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  // Mobile card
  const MobileCard = ({ row: r }) => (
    <div className="card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-mono text-xs font-medium" style={{ color: 'var(--brand)' }}>{r.reservation_no}</span>
          <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-base)' }}>{r.guests?.full_name || '—'}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {r.rooms?.number ? `Room ${r.rooms.number}` : 'Unassigned'} · {formatDate(r.check_in_date)} → {formatDate(r.check_out_date)}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <StatusBadge status={r.status} />
          <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-base)' }}>{formatCurrency(r.total_amount)}</p>
        </div>
      </div>
      <div className="flex gap-2 pt-1" style={{ borderTop: '1px solid var(--border-soft)' }}>
        {r.status === 'confirmed' && (
          <button onClick={() => setCheckIn(r)} className="btn-primary text-xs px-3 py-1.5 flex-1 justify-center">Check In</button>
        )}
        {r.status === 'checked_in' && (
          <button onClick={() => setCheckOut(r)} className="btn-secondary text-xs px-3 py-1.5 flex-1 justify-center">Check Out</button>
        )}
        {['confirmed','checked_in'].includes(r.status) && (
          <button onClick={() => setCancel(r)}
            className="text-xs px-3 py-1.5 rounded-md flex-shrink-0"
            style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        subtitle={`${reservations.length} records`}
        action={
          <button onClick={() => setShowNew(true)} className="btn-primary text-xs">
            <Plus size={14} /> New
          </button>
        }
      />

      {/* Search + tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input pl-8 text-sm"
            placeholder="Search name, room, ref…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="flex gap-1 p-1 rounded-lg w-max" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            {STATUS_TABS.map(t => (
              <button key={t.value} onClick={() => setStatus(t.value)}
                className="px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap"
                style={{
                  backgroundColor: status === t.value ? 'var(--bg-surface)' : 'transparent',
                  color:           status === t.value ? 'var(--text-base)'  : 'var(--text-muted)',
                  boxShadow:       status === t.value ? 'var(--shadow-xs)'  : 'none',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={reservations} loading={isLoading} emptyTitle="No reservations found" mobileCard={MobileCard} />

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Reservation" size="lg">
        <ReservationForm onSuccess={() => { setShowNew(false); qc.invalidateQueries(['reservations']); }} />
      </Modal>
      <Modal open={!!checkIn} onClose={() => setCheckIn(null)} title="Check In">
        <CheckInForm reservation={checkIn} onSuccess={() => { setCheckIn(null); qc.invalidateQueries(['reservations']); }} />
      </Modal>
      <Modal open={!!checkOut} onClose={() => setCheckOut(null)} title="Check Out">
        <CheckOutForm reservation={checkOut} onSuccess={() => { setCheckOut(null); qc.invalidateQueries(['reservations']); }} />
      </Modal>
      <ConfirmDialog
        open={!!cancel} onClose={() => setCancel(null)}
        onConfirm={() => doCancel.mutate({ id: cancel?.id, reason: 'Cancelled by staff' })}
        title="Cancel Reservation" message={`Cancel reservation for ${cancel?.guests?.full_name}?`}
        confirmLabel="Yes, Cancel" danger
      />
    </div>
  );
}

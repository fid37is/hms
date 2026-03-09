import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ChevronUp, ChevronDown, X, CreditCard } from 'lucide-react';
import * as resApi        from '../../lib/api/reservationApi';
import DataTable          from '../../components/shared/DataTable';
import StatusBadge        from '../../components/shared/StatusBadge';
import ConfirmDialog      from '../../components/shared/ConfirmDialog';
import ReservationForm    from './components/ReservationForm';
import CheckInForm        from './components/CheckInForm';
import CheckOutForm       from './components/CheckOutForm';
import ExtendStayForm     from './components/ExtendStayForm';
import { formatDate, formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { label: 'All',         value: ''            },
  { label: 'Confirmed',   value: 'confirmed'   },
  { label: 'In House',    value: 'checked_in'  },
  { label: 'Checked Out', value: 'checked_out' },
  { label: 'Cancelled',   value: 'cancelled'   },
];

const SORT_OPTIONS = [
  { value: 'check_in_date',  label: 'Check-in'  },
  { value: 'check_out_date', label: 'Check-out' },
  { value: 'total_amount',   label: 'Amount'    },
  { value: 'created_at',     label: 'Created'   },
];

const PANEL_WIDTH = 440;

const PAYMENT_METHOD_LABEL = {
  on_arrival:    'On Arrival',
  bank_transfer: 'Bank Transfer',
  paystack:      'Card',
};

const PAYMENT_STATUS_STYLE = {
  pending:          { bg: 'var(--s-yellow-bg)', color: 'var(--s-yellow-text)', label: 'Pending'           },
  pending_transfer: { bg: 'var(--s-blue-bg)',   color: 'var(--s-blue-text)',   label: 'Awaiting Transfer' },
  paid:             { bg: 'var(--s-green-bg)',   color: 'var(--s-green-text)', label: 'Paid'              },
  refunded:         { bg: 'var(--s-red-bg)',     color: 'var(--s-red-text)',   label: 'Refunded'          },
};

function PaymentBadge({ status }) {
  const s = PAYMENT_STATUS_STYLE[status] || PAYMENT_STATUS_STYLE.pending;
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

export default function ReservationsPage() {
  const qc = useQueryClient();
  const isMobile = useIsMobile();

  const [status,   setStatus]   = useState('');
  const [search,   setSearch]   = useState('');
  const [sort,     setSort]     = useState('check_in_date');
  const [order,    setOrder]    = useState('desc');
  const [panel,    setPanel]    = useState(null); // { type, res }
  const [cancel,   setCancel]   = useState(null);
  const [markPaid, setMarkPaid] = useState(null);

  const openPanel  = (type, res = null) => setPanel({ type, res });
  const closePanel = () => setPanel(null);
  const onDone     = () => { closePanel(); qc.invalidateQueries(['reservations']); };

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', status],
    queryFn:  () => resApi.getReservations(status ? { status } : {}).then(r => r.data.data),
  });

  const doCancel = useMutation({
    mutationFn: ({ id, reason }) => resApi.cancelReservation(id, { reason }),
    onSuccess: () => { toast.success('Reservation cancelled'); setCancel(null); qc.invalidateQueries(['reservations']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const doMarkPaid = useMutation({
    mutationFn: (id) => resApi.markPaymentReceived(id, { payment_status: 'paid' }),
    onSuccess: () => { toast.success('Payment marked as received'); setMarkPaid(null); qc.invalidateQueries(['reservations']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to update payment'),
  });

  const reservations = (data || [])
    .filter(r => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.reservation_no?.toLowerCase().includes(q) ||
        r.guests?.full_name?.toLowerCase().includes(q) ||
        r.rooms?.number?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const av = a[sort] ?? '';
      const bv = b[sort] ?? '';
      if (typeof av === 'number') return order === 'asc' ? av - bv : bv - av;
      return order === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

  const panelTitle = { new: 'New Reservation', checkin: 'Check In', checkout: 'Check Out', extend: 'Extend Stay' }[panel?.type] || '';

  const panelContent = () => {
    if (!panel) return null;
    switch (panel.type) {
      case 'new':      return <ReservationForm onSuccess={onDone} />;
      case 'checkin':  return <CheckInForm reservation={panel.res} onSuccess={onDone} />;
      case 'checkout': return <CheckOutForm reservation={panel.res} onSuccess={onDone} onExtend={() => openPanel('extend', panel.res)} />;
      case 'extend':   return <ExtendStayForm reservation={panel.res} onSuccess={onDone} />;
      default:         return null;
    }
  };

  const columns = [
    { key: 'reservation_no', label: 'Ref',
      render: r => <span className="font-mono text-xs font-medium" style={{ color: 'var(--brand)' }}>{r.reservation_no}</span> },
    { key: 'guest', label: 'Guest',
      render: r => <span style={{ color: 'var(--text-base)' }}>{r.guests?.full_name || '—'}</span> },
    { key: 'room', label: 'Room',
      render: r => r.rooms?.number
        ? <span className="font-medium" style={{ color: 'var(--text-base)' }}>Room {r.rooms.number}</span>
        : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span> },
    { key: 'check_in_date',  label: 'Check-in',  render: r => formatDate(r.check_in_date)   },
    { key: 'check_out_date', label: 'Check-out', render: r => formatDate(r.check_out_date)  },
    { key: 'total_amount',   label: 'Amount',    render: r => formatCurrency(r.total_amount) },
    { key: 'status',         label: 'Status',    render: r => <StatusBadge status={r.status} /> },

    // ── Payment ──────────────────────────────────────────────────────────
    { key: 'payment', label: 'Payment',
      render: r => (
        <div className="flex flex-col gap-1 items-start">
          <PaymentBadge status={r.payment_status || 'pending'} />
          {r.payment_method && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {PAYMENT_METHOD_LABEL[r.payment_method] || r.payment_method}
            </span>
          )}
        </div>
      ),
    },

    { key: 'actions', label: '', width: '140px',
      render: r => (
        <div className="flex gap-1.5 justify-end flex-wrap">
          {r.status === 'confirmed' && (
            <button onClick={e => { e.stopPropagation(); openPanel('checkin', r); }}
              className="btn-primary text-xs px-2.5 py-1">Check In</button>
          )}
          {r.status === 'checked_in' && (
            <button onClick={e => { e.stopPropagation(); openPanel('checkout', r); }}
              className="btn-secondary text-xs px-2.5 py-1">Check Out</button>
          )}
          {/* Mark Paid — only when payment is still outstanding */}
          {['confirmed','checked_in'].includes(r.status) &&
           ['pending','pending_transfer'].includes(r.payment_status) && (
            <button onClick={e => { e.stopPropagation(); setMarkPaid(r); }}
              className="text-xs px-2.5 py-1 rounded-md flex items-center gap-1"
              style={{ backgroundColor: 'var(--s-green-bg)', color: 'var(--s-green-text)' }}>
              <CreditCard size={11} /> Paid
            </button>
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
        <div className="text-right flex-shrink-0 flex flex-col gap-1 items-end">
          <StatusBadge status={r.status} />
          <PaymentBadge status={r.payment_status || 'pending'} />
          <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-base)' }}>{formatCurrency(r.total_amount)}</p>
          {r.payment_method && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {PAYMENT_METHOD_LABEL[r.payment_method] || r.payment_method}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 pt-1 flex-wrap" style={{ borderTop: '1px solid var(--border-soft)' }}>
        {r.status === 'confirmed' && (
          <button onClick={() => openPanel('checkin', r)} className="btn-primary text-xs px-3 py-1.5 flex-1 justify-center">Check In</button>
        )}
        {r.status === 'checked_in' && (
          <button onClick={() => openPanel('checkout', r)} className="btn-secondary text-xs px-3 py-1.5 flex-1 justify-center">Check Out</button>
        )}
        {['confirmed','checked_in'].includes(r.status) &&
         ['pending','pending_transfer'].includes(r.payment_status) && (
          <button onClick={() => setMarkPaid(r)}
            className="text-xs px-3 py-1.5 rounded-md flex items-center gap-1"
            style={{ backgroundColor: 'var(--s-green-bg)', color: 'var(--s-green-text)' }}>
            <CreditCard size={11} /> Mark Paid
          </button>
        )}
        {['confirmed','checked_in'].includes(r.status) && (
          <button onClick={() => setCancel(r)}
            className="text-xs px-3 py-1.5 rounded-md"
            style={{ backgroundColor: 'var(--s-red-bg)', color: 'var(--s-red-text)' }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );

  const panelOpen = !!panel;

  return (
    <div style={{ display: 'flex', gap: 0, minHeight: 0, position: 'relative', overflow: 'hidden' }}>

      {/* ── Left: table area ── */}
      <div style={{
        flex: 1,
        minWidth: 0,
        marginRight: panelOpen && !isMobile ? PANEL_WIDTH + 16 : 0,
        transition: 'margin-right 280ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div className="space-y-4">

          {/* Controls row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative" style={{ width: 200 }}>
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input className="input pl-8 text-sm" placeholder="Search…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="flex gap-0.5 p-1 rounded-lg overflow-x-auto" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              {STATUS_TABS.map(t => (
                <button key={t.value} onClick={() => setStatus(t.value)}
                  className="px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: status === t.value ? 'var(--bg-surface)' : 'transparent',
                    color:           status === t.value ? 'var(--text-base)'  : 'var(--text-muted)',
                    boxShadow:       status === t.value ? 'var(--shadow-xs)'  : 'none',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            <select className="input text-sm" style={{ width: 'auto' }}
              value={sort} onChange={e => setSort(e.target.value)}>
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>Sort: {o.label}</option>
              ))}
            </select>

            <button onClick={() => setOrder(o => o === 'asc' ? 'desc' : 'asc')}
              className="btn-ghost px-2.5 py-1.5 flex items-center gap-1 text-xs"
              style={{ color: 'var(--text-muted)' }}>
              {order === 'asc' ? <><ChevronUp size={13} /> Asc</> : <><ChevronDown size={13} /> Desc</>}
            </button>

            <div style={{ flex: 1 }} />

            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {reservations.length} record{reservations.length !== 1 ? 's' : ''}
            </span>

            <button onClick={() => openPanel('new')} className="btn-primary text-xs">
              <Plus size={14} /> New
            </button>
          </div>

          <DataTable
            columns={columns}
            data={reservations}
            loading={isLoading}
            emptyTitle="No reservations found"
            mobileCard={MobileCard}
          />
        </div>
      </div>

      {/* Mobile backdrop */}
      {isMobile && (
        <div
          onClick={closePanel}
          style={{
            position: 'fixed', inset: 0, zIndex: 49,
            backgroundColor: 'rgba(0,0,0,0.4)',
            opacity: panelOpen ? 1 : 0,
            pointerEvents: panelOpen ? 'auto' : 'none',
            transition: 'opacity 280ms ease',
          }}
        />
      )}

      {/* ── Right: slide-in panel ── */}
      {panelOpen && (
        <div style={{
          position: 'fixed',
          top: isMobile ? 0 : 56,
          right: 0,
          bottom: 0,
          left: isMobile ? 0 : 'auto',
          width: isMobile ? '100%' : PANEL_WIDTH,
          zIndex: isMobile ? 50 : 30,
          backgroundColor: 'var(--bg-surface)',
          borderLeft: isMobile ? 'none' : '1px solid var(--border-soft)',
          boxShadow: isMobile ? 'none' : '-6px 0 24px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInPanel 240ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <div className="flex items-center justify-between px-5 flex-shrink-0"
            style={{ height: 44, borderBottom: '1px solid var(--border-soft)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>{panelTitle}</h2>
            <button onClick={closePanel}
              className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <X size={15} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-6" style={{ paddingTop: 12 }}>
            {panelContent()}
          </div>
        </div>
      )}

      {/* Cancel confirm */}
      <ConfirmDialog
        open={!!cancel} onClose={() => setCancel(null)}
        onConfirm={() => doCancel.mutate({ id: cancel?.id, reason: 'Cancelled by staff' })}
        title="Cancel Reservation"
        message={`Cancel ${cancel?.reservation_no} for ${cancel?.guests?.full_name}?`}
        confirmLabel="Yes, Cancel" danger
      />

      {/* Mark as Paid confirm */}
      <ConfirmDialog
        open={!!markPaid} onClose={() => setMarkPaid(null)}
        onConfirm={() => doMarkPaid.mutate(markPaid?.id)}
        title="Confirm Payment Received"
        message={
          markPaid?.payment_method === 'bank_transfer'
            ? `Confirm bank transfer from ${markPaid?.guests?.full_name} has been received and verified?`
            : `Mark payment as received for ${markPaid?.guests?.full_name}?`
        }
        confirmLabel="Yes, Mark Paid"
      />
    </div>
  );
}
// src/modules/events/EventsPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient }    from '@tanstack/react-query';
import {
  Plus, ChevronDown, Calendar, Search, MapPin, Users,
  CalendarDays, LayoutGrid, List,
} from 'lucide-react';
import * as eventApi    from '../../lib/api/eventApi';
import DataTable        from '../../components/shared/DataTable';
import StatusBadge      from '../../components/shared/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';
import EventDetail      from './components/EventDetail';
import EventForm        from './components/EventForm';
import VenuesPanel      from './components/VenuesPanel';
import EventCalendar    from './components/EventCalendar';
import toast            from 'react-hot-toast';

const TABS = ['Events', 'Calendar', 'Venues'];

const STATUS_OPTS = [
  { label: 'All statuses',  value: '' },
  { label: 'Enquiry',       value: 'enquiry' },
  { label: 'Confirmed',     value: 'confirmed' },
  { label: 'Deposit Paid',  value: 'deposit_paid' },
  { label: 'In Progress',   value: 'in_progress' },
  { label: 'Completed',     value: 'completed' },
  { label: 'Cancelled',     value: 'cancelled' },
];

const TYPE_OPTS = [
  { label: 'All types',    value: '' },
  { label: 'Wedding',      value: 'wedding' },
  { label: 'Conference',   value: 'conference' },
  { label: 'Birthday',     value: 'birthday' },
  { label: 'Corporate',    value: 'corporate' },
  { label: 'Gala',         value: 'gala' },
  { label: 'Exhibition',   value: 'exhibition' },
  { label: 'Meeting',      value: 'meeting' },
  { label: 'Workshop',     value: 'workshop' },
  { label: 'Other',        value: 'other' },
];

const EVENT_TYPE_COLORS = {
  wedding:     '#e91e8c',
  conference:  'var(--brand)',
  birthday:    '#9c27b0',
  corporate:   '#1976d2',
  gala:        '#f57c00',
  exhibition:  '#00897b',
  meeting:     'var(--text-muted)',
  workshop:    '#5c6bc0',
  other:       'var(--text-muted)',
};

function Dropdown({ value, options, onChange, style = {} }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const sel = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <button className="btn-ghost text-xs flex items-center gap-1.5" style={{ minWidth: 130 }}
        onClick={() => setOpen(o => !o)}>
        {sel.label}
        <ChevronDown size={12} style={{ opacity: .5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {open && (
        <div className="card" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: 170, zIndex: 50, padding: 4, boxShadow: 'var(--shadow-md)' }}>
          {options.map(o => (
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs rounded-md transition-colors"
              style={{ background: value === o.value ? 'var(--brand-subtle)' : 'transparent', color: value === o.value ? 'var(--brand)' : 'var(--text-base)' }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EventsPage() {
  const qc = useQueryClient();
  const [tab, setTab]           = useState(0);
  const [status, setStatus]     = useState('');
  const [type, setType]         = useState('');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [selected, setSelected] = useState(null);  // event detail panel
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['events', { status, type, search, page }],
    queryFn:  () => eventApi.getEvents({ status, event_type: type, search, page, limit: 20 })
                     .then(r => r.data),
    enabled:  tab === 0,
  });

  const events   = data?.data || [];
  const total    = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  const COLUMNS = [
    {
      key: 'event',
      label: 'Event',
      render: (r) => (
        <div>
          <p className="font-medium text-sm" style={{ color: 'var(--text-base)' }}>{r.title}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.event_no} · {r.client_name}</p>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (r) => (
        <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${EVENT_TYPE_COLORS[r.event_type]}18`, color: EVENT_TYPE_COLORS[r.event_type] }}>
          {r.event_type}
        </span>
      ),
    },
    {
      key: 'venue',
      label: 'Venue',
      render: (r) => (
        <span className="text-xs" style={{ color: 'var(--text-sub)' }}>
          {r.event_venues?.name || '—'}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (r) => (
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-base)' }}>{formatDate(r.event_date)}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.start_time?.slice(0,5)} – {r.end_time?.slice(0,5)}</p>
        </div>
      ),
    },
    {
      key: 'guests',
      label: 'Guests',
      render: (r) => (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          <Users size={11} className="inline mr-1" />{r.guest_count || 0}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Total',
      render: (r) => (
        <span className="text-xs font-medium font-mono" style={{ color: 'var(--text-base)' }}>
          {formatCurrency(r.total_amount || 0)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];

  const handleEdit = (event) => {
    setEditEvent(event);
    setShowForm(true);
    setSelected(null);
  };

  return (
    <div className="space-y-4">

      {/* ── Tab bar ── */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit"
        style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background:  tab === i ? 'var(--bg-surface)' : 'transparent',
              color:       tab === i ? 'var(--text-base)'  : 'var(--text-muted)',
              boxShadow:   tab === i ? 'var(--shadow-sm)'  : 'none',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Events tab ── */}
      {tab === 0 && (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative" style={{ maxWidth: 280, flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input className="input text-sm pl-8" placeholder="Search events, clients…"
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <Dropdown value={status} options={STATUS_OPTS} onChange={v => { setStatus(v); setPage(1); }} />
              <Dropdown value={type}   options={TYPE_OPTS}   onChange={v => { setType(v);   setPage(1); }} />
            </div>
            <button className="btn-primary text-sm flex items-center gap-2"
              onClick={() => { setEditEvent(null); setShowForm(true); }}>
              <Plus size={15} /> New Event
            </button>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <DataTable
              columns={COLUMNS}
              data={events}
              loading={isLoading}
              emptyTitle="No events found"
              onRowClick={setSelected}
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>{total} total events</span>
              <div className="flex items-center gap-1">
                <button className="btn-ghost text-xs px-2 py-1" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>Prev</button>
                <span>Page {page} of {totalPages}</span>
                <button className="btn-ghost text-xs px-2 py-1" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Calendar tab ── */}
      {tab === 1 && <EventCalendar />}

      {/* ── Venues tab ── */}
      {tab === 2 && <VenuesPanel />}

      {/* ── Detail panel ── */}
      {selected && (
        <EventDetail
          eventId={selected.id}
          onClose={() => setSelected(null)}
          onEdit={handleEdit}
          onRefresh={() => qc.invalidateQueries(['events'])}
        />
      )}

      {/* ── Create/Edit form ── */}
      {showForm && (
        <EventForm
          event={editEvent}
          onClose={() => { setShowForm(false); setEditEvent(null); }}
          onSaved={() => {
            setShowForm(false);
            setEditEvent(null);
            qc.invalidateQueries(['events']);
            qc.invalidateQueries(['events-upcoming']);
          }}
        />
      )}
    </div>
  );
}
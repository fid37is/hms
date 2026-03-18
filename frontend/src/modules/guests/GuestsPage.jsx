import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as guestApi  from '../../lib/api/guestApi';
import DataTable       from '../../components/shared/DataTable';
import StatusBadge     from '../../components/shared/StatusBadge';
import GuestForm       from './components/GuestForm';
import { formatDate }  from '../../utils/format';
import { useSubscriptionGate }    from '../../hooks/useSubscriptionGate';
import SubscriptionPaywall         from '../../components/shared/SubscriptionPaywall';

const PANEL_WIDTH = 440;
const CATEGORIES = ['all', 'regular', 'vip', 'corporate', 'blacklisted'];
const SORT_OPTIONS = [
  { value: 'full_name',    label: 'Name'   },
  { value: 'created_at',  label: 'Newest' },
  { value: 'total_visits',label: 'Visits' },
];

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return m;
}

export default function GuestsPage() {
  const { isLocked } = useSubscriptionGate();
  if (isLocked) return <SubscriptionPaywall />;

  const qc       = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('all');
  const [sort,     setSort]     = useState('full_name');
  const [order,    setOrder]    = useState('asc');
  const [page,     setPage]     = useState(1);
  // panel: { type: 'new' | 'edit', guest: null | {...} }
  const [panel, setPanel] = useState(null);

  const openNew  = ()      => setPanel({ type: 'new',  guest: null });
  const openEdit = (guest) => setPanel({ type: 'edit', guest });
  const close    = ()      => setPanel(null);

  const params = {
    page, limit: 25,
    ...(search            ? { search }   : {}),
    ...(category !== 'all'? { category } : {}),
    sort, order,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['guests', params],
    queryFn:  () => guestApi.getGuests(params).then(r => r.data.data),
  });

  const guests = data?.data  || [];
  const total  = data?.total || 0;

  const toggleSort = (field) => {
    if (sort === field) setOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSort(field); setOrder('asc'); }
    setPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sort !== field) return null;
    return order === 'asc'
      ? <ChevronUp size={12} className="inline ml-0.5" />
      : <ChevronDown size={12} className="inline ml-0.5" />;
  };

  const panelOpen = !!panel;

  const columns = [
    { key: 'full_name',
      label: <span className="cursor-pointer select-none" onClick={() => toggleSort('full_name')}>Name <SortIcon field="full_name" /></span>,
      render: r => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.full_name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.email || '—'}</p>
        </div>
      ),
    },
    { key: 'phone',       label: 'Phone',      render: r => r.phone || '—' },
    { key: 'nationality', label: 'Nationality', render: r => r.nationality || '—' },
    { key: 'category',    label: 'Category',    render: r => <StatusBadge status={r.category || 'regular'} /> },
    { key: 'visits',
      label: <span className="cursor-pointer select-none" onClick={() => toggleSort('total_visits')}>Visits <SortIcon field="total_visits" /></span>,
      render: r => <span className="font-mono text-xs">{r.total_visits || 0}</span>,
    },
    { key: 'created_at',
      label: <span className="cursor-pointer select-none" onClick={() => toggleSort('created_at')}>Since <SortIcon field="created_at" /></span>,
      render: r => formatDate(r.created_at),
    },
    { key: 'actions', label: '', width: '80px',
      render: r => {
        const isOpen = panel?.guest?.id === r.id;
        if (isOpen) return null;
        return (
          <button onClick={e => { e.stopPropagation(); openEdit(r); }}
            className="btn-ghost text-xs px-2 py-1">Edit</button>
        );
      },
    },
  ];

  const MobileCard = ({ row: r }) => (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div onClick={() => navigate(`/guests/${r.id}`)} className="flex-1 cursor-pointer">
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.full_name}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {r.phone || r.email || '—'} · {r.nationality || '—'}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <StatusBadge status={r.category || 'regular'} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.total_visits || 0} visits</span>
          </div>
        </div>
        {panel?.guest?.id !== r.id && (
          <button onClick={() => openEdit(r)} className="btn-ghost text-xs px-2 py-1 flex-shrink-0">Edit</button>
        )}
      </div>
    </div>
  );

  const panelTitle = panel?.type === 'new' ? 'Add Guest' : `Edit · ${panel?.guest?.full_name || ''}`;

  return (
    <div style={{ display: 'flex', gap: 0, position: 'relative' }}>

      {/* Left: table */}
      <div style={{
        flex: 1, minWidth: 0,
        marginRight: panelOpen && !isMobile ? PANEL_WIDTH + 16 : 0,
        transition: 'margin-right 280ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input className="input pl-8 text-sm" placeholder="Search…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="input text-sm" style={{ width: 'auto' }}
              value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <select className="input text-sm" style={{ width: 'auto' }}
              value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
            </select>
            <button onClick={() => setOrder(o => o === 'asc' ? 'desc' : 'asc')}
              className="btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1">
              {order === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <div className="flex-1" />
            <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{total} guests</span>
            {!panelOpen && (
              <button onClick={openNew} className="btn-primary text-xs flex-shrink-0">
                <Plus size={14} /> Add Guest
              </button>
            )}
          </div>

          <DataTable
            columns={columns}
            data={guests}
            loading={isLoading}
            emptyTitle="No guests found"
            onRowClick={r => navigate(`/guests/${r.id}`)}
            mobileCard={MobileCard}
          />

          {!search && total > 25 && (
            <div className="hidden md:flex items-center justify-between">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {page} of {Math.ceil(total / 25)}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-secondary text-xs px-3">Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page * 25 >= total}
                  className="btn-secondary text-xs px-3">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile backdrop */}
      {isMobile && panelOpen && (
        <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 49, backgroundColor: 'rgba(0,0,0,0.4)' }} />
      )}

      {/* Slide panel */}
      {panelOpen && (
        <div style={{
          position: 'fixed',
          top: isMobile ? 0 : 56,
          right: 0, bottom: 0,
          left: isMobile ? 0 : 'auto',
          width: isMobile ? '100%' : PANEL_WIDTH,
          zIndex: isMobile ? 50 : 30,
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-soft)',
          boxShadow: '-6px 0 24px rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column',
          animation: 'slideInPanel 240ms cubic-bezier(0.4,0,0.2,1)',
        }}>
          <div className="flex items-center justify-between px-5 flex-shrink-0"
            style={{ height: 44, borderBottom: '1px solid var(--border-soft)' }}>
            <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--text-base)' }}>{panelTitle}</h2>
            <button onClick={close}
              className="w-7 h-7 flex items-center justify-center rounded-md"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <X size={15} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <GuestForm
              guest={panel.guest}
              onSuccess={() => { close(); qc.invalidateQueries(['guests']); }}
              onClose={close}
            />
          </div>
        </div>
      )}
    </div>
  );
}
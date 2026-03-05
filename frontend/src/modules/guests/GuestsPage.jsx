import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as guestApi  from '../../lib/api/guestApi';
import PageHeader      from '../../components/shared/PageHeader';
import DataTable       from '../../components/shared/DataTable';
import StatusBadge     from '../../components/shared/StatusBadge';
import Modal           from '../../components/shared/Modal';
import GuestForm       from './components/GuestForm';
import { formatDate }  from '../../utils/format';

export default function GuestsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search,    setSearch]    = useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [editGuest, setEditGuest] = useState(null);
  const [page,      setPage]      = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['guests', page],
    // r.data = { success, message, data: { data: [...], total: N } }
    queryFn:  () => guestApi.getGuests({ page, limit: 25 }).then(r => r.data.data),
  });

  const { data: searchResults } = useQuery({
    queryKey: ['guest-search', search],
    // r.data = { success, message, data: [...] }
    queryFn:  () => guestApi.searchGuests(search).then(r => r.data.data),
    enabled:  search.length >= 2,
  });

  const guests = search.length >= 2 ? (searchResults || []) : (data?.data || []);
  const total  = data?.total || 0;

  const columns = [
    { key: 'full_name', label: 'Name',
      render: r => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.full_name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.email || '—'}</p>
        </div>
      )
    },
    { key: 'phone',       label: 'Phone',      render: r => r.phone || '—' },
    { key: 'nationality', label: 'Nationality', render: r => r.nationality || '—' },
    { key: 'category',    label: 'Category',    render: r => <StatusBadge status={r.category || 'regular'} /> },
    { key: 'visits',      label: 'Visits',      render: r => <span className="font-mono text-xs">{r.total_visits || 0}</span> },
    { key: 'created_at',  label: 'Since',       render: r => formatDate(r.created_at) },
    { key: 'actions',     label: '', width: '80px',
      render: r => (
        <button
          onClick={e => { e.stopPropagation(); setEditGuest(r); setShowForm(true); }}
          className="btn-ghost text-xs px-2 py-1">Edit</button>
      )
    },
  ];

  const MobileCard = ({ row: r }) => (
    <div className="card p-4 active:opacity-80">
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
        <button
          onClick={() => { setEditGuest(r); setShowForm(true); }}
          className="btn-ghost text-xs px-2 py-1 flex-shrink-0">Edit</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        subtitle={`${total} total`}
        action={
          <button onClick={() => { setEditGuest(null); setShowForm(true); }} className="btn-primary text-xs">
            <Plus size={14} /> Add
          </button>
        }
      />

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          className="input pl-8 text-sm"
          placeholder="Search name, phone, email…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
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
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Page {page} of {Math.ceil(total / 25)}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary text-xs px-3">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 25 >= total}
              className="btn-secondary text-xs px-3">Next</button>
          </div>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editGuest ? 'Edit Guest' : 'Add Guest'}>
        <GuestForm
          guest={editGuest}
          onSuccess={() => { setShowForm(false); qc.invalidateQueries(['guests']); }}
        />
      </Modal>
    </div>
  );
}
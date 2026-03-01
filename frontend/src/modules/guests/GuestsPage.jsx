import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as guestApi  from '../../lib/api/guestApi';
import PageHeader      from '../../components/shared/PageHeader';
import DataTable       from '../../components/shared/DataTable';
import StatusBadge     from '../../components/shared/StatusBadge';
import Modal           from '../../components/shared/Modal';
import GuestForm       from './components/GuestForm';
import { formatDate }  from '../../utils/format';
import toast from 'react-hot-toast';

export default function GuestsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search,    setSearch]    = useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [editGuest, setEditGuest] = useState(null);
  const [page,      setPage]      = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['guests', page],
    queryFn:  () => guestApi.getGuests({ page, limit: 25 }).then(r => r.data),
  });

  const { data: searchData } = useQuery({
    queryKey: ['guest-search', search],
    queryFn:  () => guestApi.searchGuests(search).then(r => r.data.data),
    enabled:  search.length >= 2,
  });

  const guests = search.length >= 2 ? (searchData || []) : (data?.data || []);

  const columns = [
    { key: 'full_name', label: 'Name',
      render: r => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.full_name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.email || '—'}</p>
        </div>
      )
    },
    { key: 'phone',       label: 'Phone',       render: r => r.phone || '—' },
    { key: 'nationality', label: 'Nationality',  render: r => r.nationality || '—' },
    { key: 'category',    label: 'Category',     render: r => <StatusBadge status={r.category || 'regular'} /> },
    { key: 'visits',      label: 'Visits',
      render: r => <span className="font-mono text-xs">{r.total_visits || 0}</span> },
    { key: 'created_at',  label: 'Since',        render: r => formatDate(r.created_at) },
    { key: 'actions',     label: '', width: '80px',
      render: r => (
        <button
          onClick={e => { e.stopPropagation(); setEditGuest(r); setShowForm(true); }}
          className="btn-ghost text-xs px-2 py-1"
        >
          Edit
        </button>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Guests"
        subtitle={`${data?.meta?.total || 0} total guests`}
        action={
          <button onClick={() => { setEditGuest(null); setShowForm(true); }} className="btn-primary">
            <Plus size={15} /> Add Guest
          </button>
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }} />
          <input
            className="input pl-8 w-64 text-xs"
            placeholder="Search name, phone, email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={guests}
          loading={isLoading}
          emptyTitle="No guests found"
          onRowClick={r => navigate(`/guests/${r.id}`)}
        />
      </div>

      {/* Pagination */}
      {!search && data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>Page {data.meta.page} of {data.meta.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={!data.meta.hasPrev} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs px-3">
              Previous
            </button>
            <button disabled={!data.meta.hasNext} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs px-3">
              Next
            </button>
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

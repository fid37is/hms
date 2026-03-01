import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import * as hkApi    from '../../../lib/api/housekeepingApi';
import DataTable     from '../../../components/shared/DataTable';
import StatusBadge   from '../../../components/shared/StatusBadge';
import Modal         from '../../../components/shared/Modal';
import { formatDate } from '../../../utils/format';
import toast from 'react-hot-toast';

const EMPTY = { item_description: '', location_found: '', found_by: '', guest_name: '', notes: '' };

export default function LostFoundPanel() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ['lost-found'],
    queryFn:  () => hkApi.getLostAndFound({}).then(r => r.data.data),
  });

  const create = useMutation({
    mutationFn: (d) => hkApi.createLostItem(d),
    onSuccess: () => { toast.success('Item logged'); setShowForm(false); setForm(EMPTY); qc.invalidateQueries(['lost-found']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const markReturned = useMutation({
    mutationFn: (id) => hkApi.markReturned(id, { returned_at: new Date().toISOString() }),
    onSuccess: () => { toast.success('Marked as returned'); qc.invalidateQueries(['lost-found']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const columns = [
    { key: 'item_description', label: 'Item',
      render: r => <span className="font-medium" style={{ color: 'var(--text-base)' }}>{r.item_description}</span> },
    { key: 'location_found', label: 'Found At',   render: r => r.location_found || '—' },
    { key: 'guest_name',     label: 'Guest',       render: r => r.guest_name     || '—' },
    { key: 'found_date',     label: 'Date Found',  render: r => formatDate(r.found_date || r.created_at) },
    { key: 'status',         label: 'Status',      render: r => <StatusBadge status={r.status || 'found'} /> },
    { key: 'actions', label: '', width: '100px',
      render: r => r.status !== 'returned' && (
        <button onClick={e => { e.stopPropagation(); markReturned.mutate(r.id); }}
          className="text-xs px-2.5 py-1 rounded-md transition-colors"
          style={{ backgroundColor: 'var(--s-green-bg)', color: 'var(--s-green-text)' }}>
          Mark Returned
        </button>
      )
    },
  ];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={15} /> Log Item
        </button>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={data || []} loading={isLoading}
          emptyTitle="No lost & found items" />
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Log Lost Item">
        <form onSubmit={e => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
          {[
            { label: 'Item Description *', key: 'item_description', required: true },
            { label: 'Location Found *',   key: 'location_found',   required: true },
            { label: 'Found By (staff)',    key: 'found_by'                         },
            { label: 'Guest Name',          key: 'guest_name'                       },
          ].map(({ label, key, required }) => (
            <div key={key} className="form-group">
              <label className="label">{label}</label>
              <input className="input" required={required} value={form[key]}
                onChange={e => set(key, e.target.value)} />
            </div>
          ))}
          <div className="form-group">
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes}
              onChange={e => set('notes', e.target.value)} />
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={create.isPending} className="btn-primary">
              {create.isPending ? 'Saving…' : 'Log Item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as hkApi     from '../../../lib/api/housekeepingApi';
import DataTable      from '../../../components/shared/DataTable';
import StatusBadge    from '../../../components/shared/StatusBadge';
import Modal          from '../../../components/shared/Modal';
import { formatDate } from '../../../utils/format';
import toast from 'react-hot-toast';

const BLANK = () => ({ item_description: '', location_found: '', found_by: '', guest_name: '', notes: '' });

export default function LostFoundPanel({ openForm, onFormClose }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(BLANK());

  // Sync external open trigger from parent
  useEffect(() => { if (openForm) setShowForm(true); }, [openForm]);

  const handleClose = () => {
    setShowForm(false);
    onFormClose?.();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['lost-found'],
    queryFn:  () => hkApi.getLostAndFound({}).then(r => r.data.data),
  });

  const create = useMutation({
    mutationFn: (d) => hkApi.createLostItem(d),
    onSuccess: () => {
      toast.success('Item logged');
      handleClose();
      setForm(BLANK());
      qc.invalidateQueries(['lost-found']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const markReturned = useMutation({
    mutationFn: (id) => hkApi.markReturned(id, { returned_at: new Date().toISOString() }),
    onSuccess: () => { toast.success('Marked as returned'); qc.invalidateQueries(['lost-found']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const columns = [
    {
      key: 'item_description', label: 'Item',
      render: r => <span className="font-medium" style={{ color: 'var(--text-base)' }}>{r.item_description}</span>,
    },
    { key: 'location_found', label: 'Found At',  render: r => r.location_found || '—' },
    { key: 'guest_name',     label: 'Guest',      render: r => r.guest_name     || '—' },
    { key: 'found_date',     label: 'Date Found', render: r => formatDate(r.found_date || r.created_at) },
    { key: 'status',         label: 'Status',     render: r => <StatusBadge status={r.status || 'found'} /> },
    {
      key: 'actions', label: '', width: '120px',
      render: r => r.status !== 'returned' && (
        <button
          onClick={e => { e.stopPropagation(); markReturned.mutate(r.id); }}
          className="text-xs px-2.5 py-1 rounded-md transition-colors"
          style={{ backgroundColor: 'var(--s-green-bg)', color: 'var(--s-green-text)' }}
        >
          Mark Returned
        </button>
      ),
    },
  ];

  return (
    <>
      <div className="overflow-hidden">
        <DataTable
          columns={columns}
          data={data || []}
          loading={isLoading}
          emptyTitle="No lost & found items"
        />
      </div>

      <Modal open={showForm} onClose={handleClose} title="Log Lost Item">
        <form onSubmit={e => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
          <div className="form-group">
            <label className="label" htmlFor="lf-item_description">Item Description *</label>
            <input id="lf-item_description" name="item_description" className="input" required
              value={form.item_description} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="lf-location_found">Location Found *</label>
            <input id="lf-location_found" name="location_found" className="input" required
              value={form.location_found} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="lf-found_by">Found By (staff)</label>
            <input id="lf-found_by" name="found_by" className="input"
              value={form.found_by} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="lf-guest_name">Guest Name</label>
            <input id="lf-guest_name" name="guest_name" className="input"
              value={form.guest_name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="lf-notes">Notes</label>
            <textarea id="lf-notes" name="notes" rows={2} className="input"
              value={form.notes} onChange={handleChange} />
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={create.isPending} className="btn-primary">
              {create.isPending ? 'Saving…' : 'Log Item'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
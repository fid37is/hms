import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertTriangle } from 'lucide-react';
import * as maintApi from '../../../lib/api/maintenanceApi';
import DataTable     from '../../../components/shared/DataTable';
import Modal         from '../../../components/shared/Modal';
import { formatDate } from '../../../utils/format';
import toast from 'react-hot-toast';

const EMPTY = { name: '', category: '', location: '', serial_no: '', purchase_date: '', next_service_date: '', notes: '' };

export default function AssetRegister() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn:  () => maintApi.getAssets({}).then(r => r.data.data),
  });

  const create = useMutation({
    mutationFn: (d) => maintApi.createAsset(d),
    onSuccess: () => { toast.success('Asset added'); setShowForm(false); setForm(EMPTY); qc.invalidateQueries(['assets']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const today = new Date().toISOString().split('T')[0];

  const columns = [
    { key: 'name', label: 'Asset',
      render: r => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.serial_no || '—'}</p>
        </div>
      )
    },
    { key: 'category',  label: 'Category', render: r => r.category || '—'         },
    { key: 'location',  label: 'Location', render: r => r.location || '—'         },
    { key: 'purchase_date', label: 'Purchased', render: r => formatDate(r.purchase_date) },
    { key: 'next_service_date', label: 'Next Service',
      render: r => {
        const due = r.next_service_date && r.next_service_date <= today;
        return (
          <span style={{ color: due ? 'var(--s-red-text)' : 'var(--text-sub)' }}>
            {formatDate(r.next_service_date)}
            {due && <AlertTriangle size={12} className="inline ml-1" />}
          </span>
        );
      }
    },
  ];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={15} /> Add Asset
        </button>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={data || []} loading={isLoading} emptyTitle="No assets registered" />
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Asset">
        <form onSubmit={e => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Asset Name *', key: 'name',     required: true },
              { label: 'Category',     key: 'category'                 },
              { label: 'Location',     key: 'location'                 },
              { label: 'Serial No',    key: 'serial_no'                },
            ].map(({ label, key, required }) => (
              <div key={key} className="form-group">
                <label className="label">{label}</label>
                <input className="input" required={required} value={form[key]}
                  onChange={e => set(key, e.target.value)} />
              </div>
            ))}
            <div className="form-group">
              <label className="label">Purchase Date</label>
              <input type="date" className="input" value={form.purchase_date}
                onChange={e => set('purchase_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Next Service Date</label>
              <input type="date" className="input" value={form.next_service_date}
                onChange={e => set('next_service_date', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes}
              onChange={e => set('notes', e.target.value)} />
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={create.isPending} className="btn-primary">
              {create.isPending ? 'Saving…' : 'Add Asset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

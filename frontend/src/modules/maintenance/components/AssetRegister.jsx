import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import * as maintApi from '../../../lib/api/maintenanceApi';
import DataTable     from '../../../components/shared/DataTable';
import Modal         from '../../../components/shared/Modal';
import { formatDate } from '../../../utils/format';
import toast from 'react-hot-toast';

const BLANK = () => ({
  name: '', category: '', location: '', serial_no: '',
  purchase_date: '', next_service_date: '', notes: '',
});

export default function AssetRegister({ openForm, onFormClose }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(BLANK());

  useEffect(() => { if (openForm) setShowForm(true); }, [openForm]);

  const handleClose = () => { setShowForm(false); onFormClose?.(); };

  const { data, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn:  () => maintApi.getAssets({}).then(r => r.data.data),
  });

  const create = useMutation({
    mutationFn: (d) => maintApi.createAsset(d),
    onSuccess: () => {
      toast.success('Asset added');
      handleClose();
      setForm(BLANK());
      qc.invalidateQueries(['assets']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const today = new Date().toISOString().split('T')[0];

  const columns = [
    { key: 'name', label: 'Asset',
      render: r => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.serial_no || '—'}</p>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: r => r.category || '—' },
    { key: 'location',  label: 'Location', render: r => r.location  || '—' },
    { key: 'purchase_date',     label: 'Purchased',    render: r => formatDate(r.purchase_date) },
    { key: 'next_service_date', label: 'Next Service',
      render: r => {
        const due = r.next_service_date && r.next_service_date <= today;
        return (
          <span style={{ color: due ? 'var(--s-red-text)' : 'var(--text-sub)' }}>
            {formatDate(r.next_service_date)}
            {due && <AlertTriangle size={12} className="inline ml-1" />}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={data || []} loading={isLoading} emptyTitle="No assets registered" />
      </div>

      <Modal open={showForm} onClose={handleClose} title="Add Asset">
        <form onSubmit={e => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label" htmlFor="ar-name">Asset Name *</label>
              <input id="ar-name" name="name" className="input" required
                value={form.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="ar-category">Category</label>
              <input id="ar-category" name="category" className="input"
                value={form.category} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="ar-location">Location</label>
              <input id="ar-location" name="location" className="input"
                value={form.location} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="ar-serial_no">Serial No</label>
              <input id="ar-serial_no" name="serial_no" className="input"
                value={form.serial_no} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="ar-purchase_date">Purchase Date</label>
              <input id="ar-purchase_date" name="purchase_date" type="date" className="input"
                value={form.purchase_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="ar-next_service_date">Next Service Date</label>
              <input id="ar-next_service_date" name="next_service_date" type="date" className="input"
                value={form.next_service_date} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="ar-notes">Notes</label>
            <textarea id="ar-notes" name="notes" rows={2} className="input"
              value={form.notes} onChange={handleChange} />
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={create.isPending} className="btn-primary">
              {create.isPending ? 'Saving…' : 'Add Asset'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
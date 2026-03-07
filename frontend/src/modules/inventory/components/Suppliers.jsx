import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import * as invApi   from '../../../lib/api/inventoryApi';
import Modal          from '../../../components/shared/Modal';
import ConfirmDialog  from '../../../components/shared/ConfirmDialog';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import EmptyState     from '../../../components/shared/EmptyState';
import toast          from 'react-hot-toast';

const BLANK = () => ({
  name: '', contact_person: '', email: '', phone: '',
  address: '', category: '', payment_terms: '', notes: '',
});

function SupplierForm({ supplier, onSuccess }) {
  const [form, setForm] = useState(supplier ? {
    name:           supplier.name           || '',
    contact_person: supplier.contact_person || '',
    email:          supplier.email          || '',
    phone:          supplier.phone          || '',
    address:        supplier.address        || '',
    category:       supplier.category       || '',
    payment_terms:  supplier.payment_terms  || '',
    notes:          supplier.notes          || '',
  } : BLANK());

  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: (d) => supplier
      ? invApi.updateSupplier(supplier.id, d)
      : invApi.createSupplier(d),
    onSuccess: () => {
      toast.success(supplier ? 'Supplier updated' : 'Supplier created');
      qc.invalidateQueries(['suppliers']);
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save supplier'),
  });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = e => { e.preventDefault(); save.mutate(form); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Supplier Name *</label>
          <input name="name" className="input" required value={form.name} onChange={handleChange} placeholder="e.g. Lagos Linen Co." />
        </div>
        <div>
          <label className="label">Contact Person</label>
          <input name="contact_person" className="input" value={form.contact_person} onChange={handleChange} placeholder="Full name" />
        </div>
        <div>
          <label className="label">Category</label>
          <select name="category" className="input" value={form.category} onChange={handleChange}>
            <option value="">— Select —</option>
            <option value="linen">Linen & Bedding</option>
            <option value="toiletries">Toiletries</option>
            <option value="cleaning">Cleaning Supplies</option>
            <option value="food_beverage">Food & Beverage</option>
            <option value="maintenance">Maintenance</option>
            <option value="office">Office Supplies</option>
            <option value="electronics">Electronics</option>
            <option value="furniture">Furniture</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" className="input" value={form.email} onChange={handleChange} placeholder="supplier@email.com" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" className="input" value={form.phone} onChange={handleChange} placeholder="+234..." />
        </div>
        <div className="col-span-2">
          <label className="label">Address</label>
          <input name="address" className="input" value={form.address} onChange={handleChange} placeholder="Street, City, State" />
        </div>
        <div>
          <label className="label">Payment Terms</label>
          <select name="payment_terms" className="input" value={form.payment_terms} onChange={handleChange}>
            <option value="">— Select —</option>
            <option value="immediate">Immediate</option>
            <option value="net_7">Net 7 days</option>
            <option value="net_14">Net 14 days</option>
            <option value="net_30">Net 30 days</option>
            <option value="net_60">Net 60 days</option>
            <option value="prepaid">Prepaid</option>
          </select>
        </div>
        <div>
          <label className="label">Notes</label>
          <input name="notes" className="input" value={form.notes} onChange={handleChange} placeholder="Any additional notes" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" className="btn-primary" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : supplier ? 'Save Changes' : 'Add Supplier'}
        </button>
      </div>
    </form>
  );
}

export default function Suppliers({ openForm, onFormClose }) {
  const qc = useQueryClient();
  const [showForm,     setShowForm]     = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { if (openForm) { setEditItem(null); setShowForm(true); } }, [openForm]);

  const handleClose = () => {
    setShowForm(false);
    onFormClose?.();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn:  () => invApi.getSuppliers().then(r => r.data.data),
  });

  const doDelete = useMutation({
    mutationFn: (id) => invApi.deleteSupplier(id),
    onSuccess:  () => { toast.success('Supplier deactivated'); qc.invalidateQueries(['suppliers']); setDeleteTarget(null); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const suppliers = data || [];

  const TERM_LABELS = {
    immediate: 'Immediate', net_7: 'Net 7d', net_14: 'Net 14d',
    net_30: 'Net 30d', net_60: 'Net 60d', prepaid: 'Prepaid',
  };
  const CAT_LABELS = {
    linen: 'Linen', toiletries: 'Toiletries', cleaning: 'Cleaning',
    food_beverage: 'F&B', maintenance: 'Maintenance', office: 'Office',
    electronics: 'Electronics', furniture: 'Furniture', other: 'Other',
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      {suppliers.length === 0 ? (
        <EmptyState
          title="No suppliers yet"
          description="Add suppliers to assign them to inventory items and purchase orders."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map(s => (
            <div key={s.id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
                      <Building2 size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-base)' }}>{s.name}</p>
                      {s.contact_person && (
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{s.contact_person}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditItem(s); setShowForm(true); }}
                    className="btn-ghost p-1.5 rounded-md"><Pencil size={13} /></button>
                  <button onClick={() => setDeleteTarget(s)}
                    className="btn-ghost p-1.5 rounded-md" style={{ color: 'var(--s-red-text)' }}><Trash2 size={13} /></button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {s.category && (
                  <span className="badge text-xs" style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
                    {CAT_LABELS[s.category] || s.category}
                  </span>
                )}
                {s.payment_terms && (
                  <span className="badge text-xs" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                    {TERM_LABELS[s.payment_terms] || s.payment_terms}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {s.phone && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Phone size={11} /><span>{s.phone}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Mail size={11} /><span className="truncate">{s.email}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <MapPin size={11} /><span className="truncate">{s.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={handleClose} title={editItem ? 'Edit Supplier' : 'Add Supplier'}>
        <SupplierForm supplier={editItem} onSuccess={handleClose} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Deactivate Supplier"
        message={`Remove "${deleteTarget?.name}" from your active suppliers? This won't affect existing purchase orders.`}
        confirmLabel="Deactivate"
        danger
        onConfirm={() => doDelete.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
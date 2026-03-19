import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import * as roomApi from '../../../lib/api/roomApi';
import { formatCurrency } from '../../../utils/format';
import toast from 'react-hot-toast';

const BLANK_DETAILS = () => ({ name: '', description: '', base_rate: '', max_occupancy: '2', amenities: '' });
const BLANK_RATE    = () => ({ name: '', rate_per_night: '', description: '', cancellation_policy: 'refundable', free_cancellation_window: '24h', payment_timing: 'at_property' });

const CANCEL_OPTIONS = [
  { value: '24h',  label: 'Up to 24 hours before' },
  { value: '48h',  label: 'Up to 48 hours before' },
  { value: '72h',  label: 'Up to 72 hours before' },
  { value: 'none', label: 'No free cancellation'  },
];

export default function RoomTypeForm({ onSuccess, onClose }) {
  const qc      = useQueryClient();
  const [step,  setStep]  = useState(1); // 1 = details, 2 = rate plans
  const [form,  setForm]  = useState(BLANK_DETAILS());
  const [rates, setRates] = useState([]); // staged rate plans
  const [rateForm, setRateForm] = useState(BLANK_RATE());
  const [addingRate, setAddingRate] = useState(false);
  const [createdTypeId, setCreatedTypeId] = useState(null);

  // Step 1 — create the type
  const createType = useMutation({
    mutationFn: (d) => roomApi.createRoomType(d),
    onSuccess: (res) => {
      const typeId = res.data.data.id;
      setCreatedTypeId(typeId);
      qc.invalidateQueries(['room-types']);
      if (rates.length === 0) {
        // no staged rates — go straight to step 2 so user can add if they want
      }
      setStep(2);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create type'),
  });

  // Step 2 — save a staged rate plan to the server
  const createRate = useMutation({
    mutationFn: ({ typeId, data }) => roomApi.createRatePlan(typeId, data),
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save rate plan'),
  });

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    createType.mutate({
      name:          form.name,
      description:   form.description || null,
      base_rate:     Math.round(Number(form.base_rate) * 100),
      max_occupancy: Number(form.max_occupancy),
      amenities:     form.amenities ? form.amenities.split(',').map(a => a.trim()).filter(Boolean) : [],
    });
  };

  const addStagedRate = () => {
    if (!rateForm.name || !rateForm.rate_per_night) return;
    setRates(prev => [...prev, { ...rateForm, id: Date.now() }]);
    setRateForm(BLANK_RATE());
    setAddingRate(false);
  };

  const removeStagedRate = (id) => setRates(prev => prev.filter(r => r.id !== id));

  const handleFinish = async () => {
    if (createdTypeId && rates.length > 0) {
      for (const r of rates) {
        await createRate.mutateAsync({
          typeId: createdTypeId,
          data: { ...r, rate_per_night: Math.round(Number(r.rate_per_night) * 100) },
        });
      }
      qc.invalidateQueries(['rate-plans', createdTypeId]);
    }
    toast.success('Room type created');
    onSuccess?.();
  };

  // ── Step 1: Details ──────────────────────────────────────
  if (step === 1) return (
    <form onSubmit={handleDetailsSubmit} className="space-y-3">
      <div className="form-group">
        <label className="label">Type Name *</label>
        <input name="name" className="input" required placeholder="e.g. Standard, Deluxe, Suite"
          value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="label">Base Rate (₦) *</label>
          <input name="base_rate" type="number" min="0" required className="input" placeholder="e.g. 45000"
            value={form.base_rate} onChange={e => setForm(p => ({ ...p, base_rate: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="label">Max Occupancy</label>
          <input name="max_occupancy" type="number" min="1" className="input"
            value={form.max_occupancy} onChange={e => setForm(p => ({ ...p, max_occupancy: e.target.value }))} />
        </div>
      </div>
      <div className="form-group">
        <label className="label">Description</label>
        <textarea rows={2} className="input" placeholder="Brief description shown to guests…"
          value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
      </div>
      <div className="form-group">
        <label className="label">Amenities</label>
        <input className="input" placeholder="WiFi, AC, TV, Mini Bar (comma-separated)"
          value={form.amenities} onChange={e => setForm(p => ({ ...p, amenities: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={createType.isPending} className="btn-primary flex items-center gap-1.5">
          {createType.isPending ? 'Creating…' : <> Next: Rate Plans <ChevronRight size={14} /> </>}
        </button>
      </div>
    </form>
  );

  // ── Step 2: Rate Plans ───────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="rounded-lg px-3 py-2.5 text-xs" style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
        <strong>{form.name}</strong> created — base rate {formatCurrency(Number(form.base_rate) * 100)}/night.
        Add rate plans below or skip to finish.
      </div>

      {/* Staged rates list */}
      {rates.length > 0 && (
        <div className="space-y-2">
          {rates.map(r => (
            <div key={r.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg"
              style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{r.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {r.cancellation_policy === 'refundable' ? 'Refundable' : 'Non-refundable'}
                  {' · '}{r.payment_timing === 'now' ? 'Pay now' : 'Pay at property'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className="text-sm font-bold" style={{ color: 'var(--brand)' }}>
                  ₦{Number(r.rate_per_night).toLocaleString()}
                </p>
                <button type="button" onClick={() => removeStagedRate(r.id)}
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ color: 'var(--s-red-text)' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add rate form */}
      {addingRate ? (
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="label">Plan Name *</label>
              <input className="input" placeholder="e.g. Flexible Rate"
                value={rateForm.name} onChange={e => setRateForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Rate/Night (₦) *</label>
              <input className="input" type="number" min="0" placeholder="e.g. 50000"
                value={rateForm.rate_per_night} onChange={e => setRateForm(p => ({ ...p, rate_per_night: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Description (optional)</label>
            <input className="input" placeholder="Shown to guests during booking"
              value={rateForm.description} onChange={e => setRateForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="label">Cancellation</label>
              <select className="input" value={rateForm.cancellation_policy}
                onChange={e => setRateForm(p => ({ ...p, cancellation_policy: e.target.value }))}>
                <option value="refundable">Refundable</option>
                <option value="non_refundable">Non-refundable</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Payment</label>
              <select className="input" value={rateForm.payment_timing}
                onChange={e => setRateForm(p => ({ ...p, payment_timing: e.target.value }))}>
                <option value="at_property">Pay at property</option>
                <option value="now">Pay now</option>
              </select>
            </div>
          </div>
          {rateForm.cancellation_policy === 'refundable' && (
            <div className="form-group">
              <label className="label">Free Cancellation Window</label>
              <select className="input" value={rateForm.free_cancellation_window}
                onChange={e => setRateForm(p => ({ ...p, free_cancellation_window: e.target.value }))}>
                {CANCEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAddingRate(false)} className="btn-secondary text-xs">Cancel</button>
            <button type="button" onClick={addStagedRate}
              disabled={!rateForm.name || !rateForm.rate_per_night}
              className="btn-primary text-xs">Add Plan</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAddingRate(true)}
          className="flex items-center gap-2 text-sm w-full justify-center py-2.5 rounded-lg transition-colors"
          style={{ border: '1px dashed var(--border-base)', color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-base)'}>
          <Plus size={14} /> Add Rate Plan
        </button>
      )}

      <div className="flex justify-between pt-1">
        <button type="button" onClick={() => setStep(1)} className="btn-secondary text-xs flex items-center gap-1.5">
          <ChevronLeft size={14} /> Back
        </button>
        <button type="button" onClick={handleFinish} disabled={createRate.isPending}
          className="btn-primary text-xs">
          {createRate.isPending ? 'Saving…' : rates.length > 0 ? `Finish & Save ${rates.length} Plan${rates.length > 1 ? 's' : ''}` : 'Finish'}
        </button>
      </div>
    </div>
  );
}
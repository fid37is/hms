// src/frontend/src/modules/maintenance/components/WorkOrderForm.jsx
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link2Off } from 'lucide-react';
import * as maintApi from '../../../lib/api/maintenanceApi';
import * as roomApi  from '../../../lib/api/roomApi';
import toast from 'react-hot-toast';

const WO_CATEGORIES = ['general','electrical','plumbing','hvac','furniture','appliance','structural','other'];

export default function WorkOrderForm({ onSuccess }) {
  const [assetLinked, setAssetLinked] = useState(true); // encouraged by default
  const [form, setForm] = useState({
    asset_id:    '',
    title:       '',
    description: '',
    priority:    'normal',
    category:    'general',
    room_id:     '',
    location:    '',
  });

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn:  () => maintApi.getAssets({}).then(r => r.data.data),
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn:  () => roomApi.getRooms({}).then(r => r.data.data),
  });

  const save = useMutation({
    mutationFn: (d) => maintApi.createWO(d),
    onSuccess: () => { toast.success('Work order created'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to create work order'),
  });

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleAssetChange = e => {
    const id = e.target.value;
    const asset = (assets || []).find(a => a.id === id);
    setForm(p => ({
      ...p,
      asset_id: id,
      // Auto-fill location and category from asset if available
      location: asset?.location || p.location,
      category: asset?.category || p.category,
      // Pre-fill title as a hint if empty
      title: p.title || (asset ? `Service / repair: ${asset.name}` : ''),
    }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    save.mutate({
      ...form,
      asset_id: assetLinked ? (form.asset_id || null) : null,
      room_id:  form.room_id  || null,
      location: form.location || null,
    });
  };

  const selectedAsset = (assets || []).find(a => a.id === form.asset_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Asset picker ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="label" htmlFor="wo-asset_id">
            Asset
            <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
              — select what needs work
            </span>
          </label>
          {assetLinked ? (
            <button type="button"
              onClick={() => { setAssetLinked(false); setForm(p => ({ ...p, asset_id: '' })); }}
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--text-muted)' }}>
              <Link2Off size={11} /> Not asset-related
            </button>
          ) : (
            <button type="button"
              onClick={() => setAssetLinked(true)}
              className="text-xs"
              style={{ color: 'var(--brand)' }}>
              Link to an asset
            </button>
          )}
        </div>

        {assetLinked && (
          <>
            <select id="wo-asset_id" name="asset_id" className="input"
              value={form.asset_id} onChange={handleAssetChange}>
              <option value="">— Select asset —</option>
              {(assets || []).map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}{a.location ? ` · ${a.location}` : ''}{a.serial_number ? ` (${a.serial_number})` : ''}
                </option>
              ))}
            </select>
            {selectedAsset && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs"
                style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                <div className="flex-1">
                  <span className="font-medium" style={{ color: 'var(--text-base)' }}>{selectedAsset.name}</span>
                  {selectedAsset.serial_number && <span className="ml-2 font-mono">{selectedAsset.serial_number}</span>}
                  {selectedAsset.location && <span className="ml-2">· {selectedAsset.location}</span>}
                </div>
              </div>
            )}
            {(assets || []).length === 0 && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No assets registered yet — you can still create the work order without one.
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Issue title ── */}
      <div className="form-group">
        <label className="label" htmlFor="wo-title">Issue / Title *</label>
        <input id="wo-title" name="title" className="input" required
          placeholder="e.g. AC not cooling, Pipe leaking"
          value={form.title} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-2 gap-3">

        <div className="form-group">
          <label className="label" htmlFor="wo-priority">Priority</label>
          <select id="wo-priority" name="priority" className="input"
            value={form.priority} onChange={handleChange}>
            {['low','normal','high','urgent'].map(p => (
              <option key={p} value={p} className="capitalize">{p}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="wo-category">Category</label>
          <select id="wo-category" name="category" className="input"
            value={form.category} onChange={handleChange}>
            {WO_CATEGORIES.map(c => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="wo-room_id">Room</label>
          <select id="wo-room_id" name="room_id" className="input"
            value={form.room_id} onChange={handleChange}>
            <option value="">None / Other area</option>
            {(rooms || []).map(r => (
              <option key={r.id} value={r.id}>Room {r.number}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="wo-location">Location</label>
          <input id="wo-location" name="location" className="input"
            placeholder="e.g. Lobby, Pool area"
            value={form.location} onChange={handleChange} />
        </div>

      </div>

      <div className="form-group">
        <label className="label" htmlFor="wo-description">Description</label>
        <textarea id="wo-description" name="description" rows={3} className="input"
          placeholder="Additional details about the issue"
          value={form.description} onChange={handleChange} />
      </div>

      <div className="flex justify-end pt-1">
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Creating…' : 'Create Work Order'}
        </button>
      </div>
    </form>
  );
}
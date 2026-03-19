// src/frontend/src/modules/maintenance/components/WorkOrderForm.jsx
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Link2Off, AlertTriangle } from 'lucide-react';
import * as maintApi from '../../../lib/api/maintenanceApi';
import * as roomApi  from '../../../lib/api/roomApi';
import * as staffApi from '../../../lib/api/staffApi';
import toast from 'react-hot-toast';

const ROOM_STATUS_LABEL = {
  available:    'Available',
  occupied:     'Occupied',
  dirty:        'Dirty',
  clean:        'Ready',
  maintenance:  'Maintenance',
  out_of_order: 'Out of Order',
};

const WO_CATEGORIES = ['general','electrical','plumbing','hvac','furniture','appliance','structural','other'];

export default function WorkOrderForm({ onSuccess, onClose }) {
  const qc = useQueryClient();
  const [assetLinked, setAssetLinked] = useState(true); // encouraged by default
  const [form, setForm] = useState({
    asset_id:    '',
    title:       '',
    description: '',
    priority:    'normal',
    category:    'general',
    room_id:     '',
    location:    '',
    assigned_to: '',
  });

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn:  () => maintApi.getAssets({}).then(r => r.data.data),
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn:  () => roomApi.getRooms({}).then(r => r.data.data),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn:  () => staffApi.getDepartments().then(r => r.data.data),
  });

  // Find all department IDs whose name contains "maintenance" (case-insensitive)
  const maintDeptIds = (departments || [])
    .filter(d => d.name?.toLowerCase().includes('maintenance'))
    .map(d => d.id);

  const { data: allStaff } = useQuery({
    queryKey: ['staff', 'maintenance-only'],
    queryFn:  () => staffApi.getStaff({ limit: 500, status: 'active' }).then(r => r.data.data),
  });

  // Filter to only staff in a maintenance department
  // Note: staff object has departments:{id,name} join, not a flat department_id field
  const maintStaff = (allStaff || []).filter(s =>
    maintDeptIds.length > 0
      ? maintDeptIds.includes(s.departments?.id)
      : s.departments?.name?.toLowerCase().includes('maintenance')
  );

  const [markRoomMaintenance, setMarkRoomMaintenance] = useState(true);

  const save = useMutation({
    mutationFn: async (d) => {
      const wo = await maintApi.createWO(d);
      // Optionally mark the room as under maintenance
      if (d.room_id && markRoomMaintenance) {
        await roomApi.updateRoomStatus(d.room_id, { status: 'maintenance' });
        qc.invalidateQueries(['rooms']);
      }
      return wo;
    },
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
      asset_id:    assetLinked ? (form.asset_id || null) : null,
      room_id:     form.room_id  || null,
      location:    form.location || null,
      assigned_to: form.assigned_to || null,
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

        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="label" htmlFor="wo-assigned_to">
            Assignee
            <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
              — maintenance staff only
            </span>
          </label>
          <select id="wo-assigned_to" name="assigned_to" className="input"
            value={form.assigned_to} onChange={handleChange}>
            <option value="">Unassigned</option>
            {maintStaff.length === 0
              ? <option disabled value="">No maintenance staff found</option>
              : maintStaff.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}{s.job_title ? ` — ${s.job_title}` : ''}
                  </option>
                ))
            }
          </select>
          {allStaff && maintStaff.length === 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              No staff found with a department named "Maintenance".
              Make sure your maintenance staff are assigned to a department whose name includes that word.
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="label" htmlFor="wo-room_id">Room</label>
          <select id="wo-room_id" name="room_id" className="input"
            value={form.room_id} onChange={handleChange}>
            <option value="">None / Other area</option>
            {/* Maintenance rooms first */}
            {(rooms || []).filter(r => r.status === 'maintenance' || r.status === 'out_of_order').length > 0 && (
              <optgroup label="⚠ Already flagged">
                {(rooms || [])
                  .filter(r => r.status === 'maintenance' || r.status === 'out_of_order')
                  .map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.number} — {ROOM_STATUS_LABEL[r.status] || r.status}
                    </option>
                  ))}
              </optgroup>
            )}
            <optgroup label="Other rooms">
              {(rooms || [])
                .filter(r => r.status !== 'maintenance' && r.status !== 'out_of_order')
                .map(r => (
                  <option key={r.id} value={r.id}>
                    Room {r.number} — {ROOM_STATUS_LABEL[r.status] || r.status}
                  </option>
                ))}
            </optgroup>
          </select>

          {/* Mark room as maintenance toggle — only show when a room is selected and not already in maintenance */}
          {form.room_id && (() => {
            const sel = (rooms || []).find(r => r.id === form.room_id);
            if (!sel || sel.status === 'maintenance') return null;
            return (
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none"
                style={{ color: 'var(--text-sub)', fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={markRoomMaintenance}
                  onChange={e => setMarkRoomMaintenance(e.target.checked)}
                  style={{ accentColor: 'var(--brand)', width: 13, height: 13 }}
                />
                <AlertTriangle size={11} style={{ color: 'var(--s-yellow-text)', flexShrink: 0 }} />
                Mark Room {sel.number} as <strong style={{ color: 'var(--text-base)' }}>Under Maintenance</strong>
              </label>
            );
          })()}

          {/* Info when room already in maintenance */}
          {form.room_id && (() => {
            const sel = (rooms || []).find(r => r.id === form.room_id);
            if (!sel || sel.status !== 'maintenance') return null;
            return (
              <p className="mt-1.5 text-xs" style={{ color: 'var(--s-yellow-text)' }}>
                Room {sel.number} is already marked as Under Maintenance
              </p>
            );
          })()}
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

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Creating…' : 'Create Work Order'}
        </button>
      </div>
    </form>
  );
}
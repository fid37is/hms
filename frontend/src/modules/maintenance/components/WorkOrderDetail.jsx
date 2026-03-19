// src/frontend/src/modules/maintenance/components/WorkOrderDetail.jsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as maintApi from '../../../lib/api/maintenanceApi';
import * as staffApi from '../../../lib/api/staffApi';
import StatusBadge   from '../../../components/shared/StatusBadge';
import { formatDateTime } from '../../../utils/format';
import toast from 'react-hot-toast';

export default function WorkOrderDetail({ workOrder: wo, onClose }) {
  const qc = useQueryClient();
  const [resolution,      setResolution]      = useState(wo.resolution || '');
  const [roomStatusAfter, setRoomStatusAfter] = useState('dirty');
  const [reopenReason,    setReopenReason]    = useState(''); // default: needs cleaning after maintenance
  const [assignTo,   setAssignTo]   = useState(wo.assignee?.id || wo.assigned_to || '');

  const refresh = () => qc.invalidateQueries(['work-orders']);

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn:  () => staffApi.getDepartments().then(r => r.data.data),
  });

  const { data: allStaff } = useQuery({
    queryKey: ['staff', 'maintenance-only'],
    queryFn:  () => staffApi.getStaff({ limit: 500, status: 'active' }).then(r => r.data.data),
  });

  const maintDeptIds = (departments || [])
    .filter(d => d.name?.toLowerCase().includes('maintenance'))
    .map(d => d.id);

  const staff = (allStaff || []).filter(s =>
    maintDeptIds.length > 0
      ? maintDeptIds.includes(s.departments?.id)
      : s.departments?.name?.toLowerCase().includes('maintenance')
  );

  const assign = useMutation({
    mutationFn: () => maintApi.assignWO(wo.id, { assigned_to: assignTo }),
    onSuccess: () => { toast.success('Work order assigned'); refresh(); onClose(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to assign'),
  });

  const start = useMutation({
    mutationFn: () => maintApi.startWO(wo.id),
    onSuccess: () => { toast.success('Work started'); refresh(); onClose(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const resolve = useMutation({
    mutationFn: () => maintApi.resolveWO(wo.id, { resolution, room_status_after: wo.room_id ? roomStatusAfter : null }),
    onSuccess: () => { toast.success('Work order resolved'); refresh(); onClose(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to resolve'),
  });

  const close = useMutation({
    mutationFn: () => maintApi.closeWO(wo.id),
    onSuccess: () => { toast.success('Work order closed'); refresh(); onClose(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const reopen = useMutation({
    mutationFn: () => maintApi.reopenWO(wo.id, { reason: reopenReason }),
    onSuccess: () => { toast.success('Work order reopened'); refresh(); onClose(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to reopen'),
  });

  const isOpen       = wo.status === 'open';
  const isAssigned   = wo.status === 'assigned';
  const isInProgress = wo.status === 'in_progress';
  const isResolved   = wo.status === 'resolved';
  const isClosed     = wo.status === 'closed';

  return (
    <div className="space-y-5">

      {/* WO number + status */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold" style={{ color: 'var(--brand)' }}>
          {wo.wo_number || wo.wo_no || '—'}
        </span>
        <StatusBadge status={wo.status} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {[
          ['Priority',  <span className="text-sm capitalize" style={{ color: 'var(--text-base)' }}>{wo.priority}</span>],
          ['Category',  <span className="text-sm capitalize" style={{ color: 'var(--text-base)' }}>{wo.category || '—'}</span>],
          ['Asset',     <span className="text-sm" style={{ color: 'var(--text-base)' }}>{wo.assets?.name || <span style={{color:'var(--text-muted)'}}>None</span>}</span>],
          ['Location',  <span className="text-sm" style={{ color: 'var(--text-base)' }}>{wo.rooms?.number ? `Room ${wo.rooms.number}` : (wo.location || '—')}</span>],
          ['Raised',    <span className="text-sm" style={{ color: 'var(--text-base)' }}>{formatDateTime(wo.created_at)}</span>],
          ['Raised By', <span className="text-sm" style={{ color: 'var(--text-base)' }}>{wo.reporter?.full_name || '—'}</span>],
          ['Assigned',  <span className="text-sm" style={{ color: wo.assignee ? 'var(--text-base)' : 'var(--text-muted)' }}>{wo.assignee?.full_name || 'Unassigned'}</span>],
          ...((() => {
            const match = wo.description?.match(/\[Reopened\] (.+)/);
            return match ? [['Reopened', <span className="text-sm" style={{ color: 'var(--s-yellow-text)' }}>{match[1]}</span>]] : [];
          })()),
        ].map(([label, value]) => (
          <div key={label}>
            <p className="label mb-0.5">{label}</p>
            {value}
          </div>
        ))}
      </div>

      {/* Description */}
      {wo.description && (
        <div>
          <p className="label mb-1">Description</p>
          <p className="text-sm" style={{ color: 'var(--text-sub)' }}>{wo.description}</p>
        </div>
      )}

      {/* Assign section — show for open/assigned WOs */}
      {(isOpen || isAssigned) && !isClosed && (
        <div className="space-y-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-base)' }}>
            Assign to Staff
          </p>
          <div className="flex gap-2">
            <select
              className="input flex-1 text-sm"
              value={assignTo}
              onChange={e => setAssignTo(e.target.value)}>
              <option value="">— Select staff member —</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}{s.job_title ? ` — ${s.job_title}` : ''}{s.departments?.name ? ` (${s.departments.name})` : ''}</option>
              ))}
            </select>
            <button
              onClick={() => assign.mutate()}
              disabled={!assignTo || assign.isPending}
              className="btn-primary text-xs px-3 whitespace-nowrap">
              {assign.isPending ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </div>
      )}

      {/* Resolution input — show for in_progress */}
      {isInProgress && (
        <div className="space-y-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-base)' }}>
            Resolution Notes *
          </p>
          <textarea
            className="input text-sm"
            rows={3}
            placeholder="Describe what was done to resolve the issue…"
            value={resolution}
            onChange={e => setResolution(e.target.value)}
          />
          {wo.room_id && (
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--text-base)' }}>
                Room {wo.rooms?.number} after
              </label>
              <select
                className="input text-sm"
                value={roomStatusAfter}
                onChange={e => setRoomStatusAfter(e.target.value)}
              >
                <option value="dirty">Dirty — needs cleaning</option>
                <option value="available">Available — ready to use</option>
                <option value="out_of_order">Out of Order — not usable yet</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Resolution display — if already resolved/closed */}
      {(isResolved || isClosed) && wo.resolution && (
        <div>
          <p className="label mb-1">Resolution</p>
          <p className="text-sm" style={{ color: 'var(--text-sub)' }}>{wo.resolution}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3 pt-2" style={{ borderTop: '1px solid var(--border-soft)' }}>
        {!isClosed && (
          <div className="flex gap-2 flex-wrap justify-end">
            {(isOpen || isAssigned) && (
              <button onClick={() => start.mutate()} disabled={start.isPending} className="btn-primary">
                {start.isPending ? 'Updating…' : 'Start Work'}
              </button>
            )}
            {isInProgress && (
              <button
                onClick={() => resolve.mutate()}
                disabled={!resolution.trim() || resolve.isPending}
                className="btn-primary">
                {resolve.isPending ? 'Resolving…' : 'Mark Resolved'}
              </button>
            )}
            {isResolved && (
              <button onClick={() => close.mutate()} disabled={close.isPending} className="btn-secondary">
                {close.isPending ? 'Closing…' : 'Close Work Order'}
              </button>
            )}
          </div>
        )}

        {(isResolved || isClosed) && (
          <div className="flex items-center gap-2">
            <input
              className="input text-sm"
              style={{ flex: 1 }}
              placeholder="Reason for reopening…"
              value={reopenReason}
              onChange={e => setReopenReason(e.target.value)}
            />
            <button
              onClick={() => reopen.mutate()}
              disabled={!reopenReason.trim() || reopen.isPending}
              className="btn-ghost text-xs flex-shrink-0"
              style={{ color: 'var(--brand)' }}>
              {reopen.isPending ? 'Reopening…' : 'Reopen'}
            </button>
          </div>
        )}
      </div>

      {isClosed && (
        <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
          This work order is closed.
        </p>
      )}
    </div>
  );
}
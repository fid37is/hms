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
  const [resolution, setResolution] = useState(wo.resolution || '');
  const [assignTo,   setAssignTo]   = useState(wo.assignee?.id || wo.assigned_to || '');

  const refresh = () => qc.invalidateQueries(['work-orders']);

  const { data: staff } = useQuery({
    queryKey: ['staff-list'],
    queryFn:  () => staffApi.getStaff({}).then(r => r.data.data),
  });

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
    mutationFn: () => maintApi.resolveWO(wo.id, { resolution }),
    onSuccess: () => { toast.success('Work order resolved'); refresh(); onClose(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to resolve'),
  });

  const close = useMutation({
    mutationFn: () => maintApi.closeWO(wo.id),
    onSuccess: () => { toast.success('Work order closed'); refresh(); onClose(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
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
              {(staff || []).map(s => (
                <option key={s.id} value={s.id}>{s.full_name} — {s.department || s.role || 'Staff'}</option>
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
        <div className="space-y-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)' }}>
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
      {!isClosed && (
        <div className="flex gap-2 pt-2 flex-wrap" style={{ borderTop: '1px solid var(--border-soft)' }}>
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

      {isClosed && (
        <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
          This work order is closed.
        </p>
      )}
    </div>
  );
}
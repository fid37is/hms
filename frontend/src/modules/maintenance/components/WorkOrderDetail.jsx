import { useMutation } from '@tanstack/react-query';
import * as maintApi from '../../../lib/api/maintenanceApi';
import StatusBadge   from '../../../components/shared/StatusBadge';
import { formatDateTime } from '../../../utils/format';
import toast from 'react-hot-toast';

export default function WorkOrderDetail({ workOrder: wo, onClose, onUpdate }) {
  const start = useMutation({
    mutationFn: () => maintApi.startWO(wo.id),
    onSuccess: () => { toast.success('Work started'); onUpdate(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const resolve = useMutation({
    mutationFn: () => maintApi.resolveWO(wo.id, { resolution_notes: 'Resolved' }),
    onSuccess: () => { toast.success('Work order resolved'); onUpdate(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const close = useMutation({
    mutationFn: () => maintApi.closeWO(wo.id),
    onSuccess: () => { toast.success('Work order closed'); onUpdate(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {[
          ['Status',      <StatusBadge status={wo.status} />],
          ['Priority',    <span className="text-sm capitalize" style={{ color: 'var(--text-base)' }}>{wo.priority}</span>],
          ['Category',    wo.category || '—'],
          ['Location',    wo.rooms?.number ? `Room ${wo.rooms.number}` : (wo.location || '—')],
          ['Assigned To', wo.assigned_to_user?.full_name || 'Unassigned'],
          ['Raised',      formatDateTime(wo.created_at)],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="label">{label}</p>
            <p className="text-sm" style={{ color: 'var(--text-sub)' }}>{value}</p>
          </div>
        ))}
      </div>

      {wo.description && (
        <div>
          <p className="label">Description</p>
          <p className="text-sm" style={{ color: 'var(--text-sub)' }}>{wo.description}</p>
        </div>
      )}

      {wo.resolution_notes && (
        <div>
          <p className="label">Resolution</p>
          <p className="text-sm" style={{ color: 'var(--text-sub)' }}>{wo.resolution_notes}</p>
        </div>
      )}

      <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--border-soft)' }}>
        {(wo.status === 'open' || wo.status === 'assigned') && (
          <button onClick={() => start.mutate()} disabled={start.isPending} className="btn-primary">
            {start.isPending ? 'Updating…' : 'Start Work'}
          </button>
        )}
        {wo.status === 'in_progress' && (
          <button onClick={() => resolve.mutate()} disabled={resolve.isPending} className="btn-primary">
            {resolve.isPending ? 'Updating…' : 'Mark Resolved'}
          </button>
        )}
        {wo.status === 'resolved' && (
          <button onClick={() => close.mutate()} disabled={close.isPending} className="btn-secondary">
            {close.isPending ? 'Closing…' : 'Close Work Order'}
          </button>
        )}
      </div>
    </div>
  );
}
import { Play, CheckCircle, Pencil } from 'lucide-react';

const COLUMNS = [
  { status: 'pending',     label: 'Pending',     color: 'var(--s-yellow-text)' },
  { status: 'in_progress', label: 'In Progress',  color: 'var(--brand)'         },
  { status: 'done',        label: 'Done',         color: 'var(--s-green-text)'  },
  { status: 'inspected',   label: 'Inspected',    color: 'var(--s-gray-text)'   },
];

const PRIORITY_COLOR = {
  urgent: 'var(--s-red-text)',
  high:   'var(--s-yellow-text)',
  normal: 'var(--text-muted)',
  low:    'var(--text-muted)',
};

function TaskCard({ task, onStart, onComplete, onEdit }) {
  return (
    <div
      className="card p-3 space-y-2"
      style={{ borderLeft: `3px solid ${PRIORITY_COLOR[task.priority] || 'var(--border-base)'}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-base)' }}>
            {task.task_type?.replace(/_/g, ' ')}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Room {task.rooms?.number || '—'}
          </p>
        </div>
        <button
          onClick={() => onEdit(task)}
          className="flex-shrink-0 p-1 rounded transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-base)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <Pencil size={12} />
        </button>
      </div>

      {task.notes && (
        <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{task.notes}</p>
      )}

      {task.assigned_to_user && (
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)', fontSize: '9px' }}
          >
            {task.assigned_to_user?.full_name?.charAt(0)}
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {task.assigned_to_user?.full_name}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs capitalize font-medium" style={{ color: PRIORITY_COLOR[task.priority] }}>
          {task.priority}
        </span>
        <div className="flex gap-1.5">
          {task.status === 'pending' && (
            <button
              onClick={() => onStart(task.id)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors"
              style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}
            >
              <Play size={10} /> Start
            </button>
          )}
          {task.status === 'in_progress' && (
            <button
              onClick={() => onComplete(task.id)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors"
              style={{ backgroundColor: 'var(--s-green-bg)', color: 'var(--s-green-text)' }}
            >
              <CheckCircle size={10} /> Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaskBoard({ tasks, onStart, onComplete, onEdit }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.status);
        return (
          <div key={col.status} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: col.color }}>
                {col.label}
              </p>
              <span
                className="text-xs font-medium px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
              >
                {colTasks.length}
              </span>
            </div>
            <div className="space-y-2 min-h-24">
              {colTasks.map(task => (
                <TaskCard key={task.id} task={task}
                  onStart={onStart} onComplete={onComplete} onEdit={onEdit} />
              ))}
              {!colTasks.length && (
                <div
                  className="rounded-lg border-2 border-dashed flex items-center justify-center h-16"
                  style={{ borderColor: 'var(--border-soft)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Empty</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import * as hkApi     from '../../lib/api/housekeepingApi';
import PageHeader      from '../../components/shared/PageHeader';
import Modal           from '../../components/shared/Modal';
import LoadingSpinner  from '../../components/shared/LoadingSpinner';
import TaskBoard       from './components/TaskBoard';
import TaskForm        from './components/TaskForm';
import LostFoundPanel  from './components/LostFoundPanel';
import toast from 'react-hot-toast';

const TABS = ['Tasks', 'Lost & Found'];

export default function HousekeepingPage() {
  const qc = useQueryClient();
  const [tab,      setTab]      = useState('Tasks');
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['hk-tasks'],
    queryFn:  () => hkApi.getTasks({}).then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const updateTask = useMutation({
    mutationFn: ({ id, ...d }) => hkApi.updateTask(id, d),
    onSuccess: () => { qc.invalidateQueries(['hk-tasks']); toast.success('Task updated'); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const startTask = useMutation({
    mutationFn: (id) => hkApi.startTask(id),
    onSuccess: () => { qc.invalidateQueries(['hk-tasks']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const completeTask = useMutation({
    mutationFn: (id) => hkApi.completeTask(id, {}),
    onSuccess: () => { qc.invalidateQueries(['hk-tasks']); toast.success('Task completed'); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Housekeeping"
        action={
          tab === 'Tasks' && (
            <button onClick={() => { setEditTask(null); setShowForm(true); }} className="btn-primary">
              <Plus size={15} /> New Task
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 text-xs font-medium rounded-md transition-all"
            style={{
              backgroundColor: tab === t ? 'var(--bg-surface)' : 'transparent',
              color:           tab === t ? 'var(--text-base)'  : 'var(--text-muted)',
              boxShadow:       tab === t ? 'var(--shadow-xs)'  : 'none',
            }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Tasks' && (
        isLoading
          ? <LoadingSpinner center />
          : <TaskBoard
              tasks={data || []}
              onStart={id => startTask.mutate(id)}
              onComplete={id => completeTask.mutate(id)}
              onEdit={task => { setEditTask(task); setShowForm(true); }}
            />
      )}

      {tab === 'Lost & Found' && <LostFoundPanel />}

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editTask ? 'Edit Task' : 'New Task'}>
        <TaskForm
          task={editTask}
          onSuccess={() => { setShowForm(false); qc.invalidateQueries(['hk-tasks']); }}
        />
      </Modal>
    </div>
  );
}

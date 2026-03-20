import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import SlidePanel            from '../../components/shared/SlidePanel';
import { usePanelLayout }    from '../../hooks/usePanelLayout';
import { useSubscriptionGate }   from '../../hooks/useSubscriptionGate';
import SubscriptionPaywall       from '../../components/shared/SubscriptionPaywall';
import LoadingSpinner        from '../../components/shared/LoadingSpinner';
import * as hkApi            from '../../lib/api/housekeepingApi';
import TaskBoard             from './components/TaskBoard';
import TaskForm              from './components/TaskForm';
import LostFoundPanel        from './components/LostFoundPanel';
import LostFoundForm         from './components/LostFoundForm';
import toast from 'react-hot-toast';

const TABS = ['Tasks', 'Lost & Found'];

export default function HousekeepingPage() {
  // ── All hooks before any early returns (Rules of Hooks) ────────────────────
  const { isLocked }  = useSubscriptionGate();
  const qc            = useQueryClient();
  const [panel, setPanel] = useState(null);
  const [tab,   setTab]   = useState('Tasks');
  const { contentStyle }  = usePanelLayout(!!panel);

  const { data, isLoading } = useQuery({
    queryKey: ['hk-tasks'],
    queryFn:  () => hkApi.getTasks({}).then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const startTask = useMutation({
    mutationFn: (id) => hkApi.startTask(id),
    onSuccess:  () => qc.invalidateQueries(['hk-tasks']),
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const completeTask = useMutation({
    mutationFn: (id) => hkApi.completeTask(id, {}),
    onSuccess: () => {
      toast.success('Task marked as done — pending inspection');
      qc.invalidateQueries(['hk-tasks']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const inspectTask = useMutation({
    mutationFn: (id) => hkApi.inspectTask(id, {}),
    onSuccess: () => {
      toast.success('Room marked as available');
      qc.invalidateQueries(['hk-tasks']);
      qc.invalidateQueries(['rooms']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  // ── Early return after all hooks ───────────────────────────────────────────
  if (isLocked) return <SubscriptionPaywall />;

  const openPanel  = (type, data = null) => setPanel({ type, data });
  const closePanel = () => setPanel(null);
  const panelOpen  = !!panel;

  const panelTitle = {
    'new-task':  'New Task',
    'edit-task': 'Edit Task',
    'log-item':  'Log Lost Item',
  }[panel?.type] || '';

  const panelContent = () => {
    if (!panel) return null;
    if (panel.type === 'log-item')  return <LostFoundForm onSuccess={closePanel} onClose={closePanel} />;
    if (panel.type === 'new-task')  return <TaskForm onSuccess={() => { closePanel(); qc.invalidateQueries(['hk-tasks']); }} onClose={closePanel} />;
    if (panel.type === 'edit-task') return <TaskForm task={panel.data} onSuccess={() => { closePanel(); qc.invalidateQueries(['hk-tasks']); }} onClose={closePanel} />;
    return null;
  };

  return (
    <div style={{ display: 'flex', gap: 0, position: 'relative' }}>

      <div style={{ flex: 1, minWidth: 0, ...contentStyle }}>
        <div className="space-y-4">

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              {TABS.map(t => (
                <button key={t} onClick={() => { setTab(t); closePanel(); }}
                  className="px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: tab === t ? 'var(--bg-surface)' : 'transparent',
                    color:           tab === t ? 'var(--text-base)'  : 'var(--text-muted)',
                    boxShadow:       tab === t ? 'var(--shadow-xs)'  : 'none',
                  }}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            {tab === 'Tasks' && !panelOpen && (
              <button onClick={() => openPanel('new-task')} className="btn-primary text-xs flex-shrink-0">
                <Plus size={14} /> Task
              </button>
            )}
            {tab === 'Lost & Found' && !panelOpen && (
              <button onClick={() => openPanel('log-item')} className="btn-primary text-xs flex-shrink-0">
                <Plus size={14} /> Log Item
              </button>
            )}
          </div>

          {/* Tasks tab */}
          {tab === 'Tasks' && (
            isLoading
              ? <LoadingSpinner center />
              : <TaskBoard
                  tasks={data || []}
                  onStart={id => startTask.mutate(id)}
                  onComplete={id => completeTask.mutate(id)}
                  onInspect={id => inspectTask.mutate(id)}
                  onEdit={task => openPanel('edit-task', task)}
                />
          )}

          {/* Lost & Found tab */}
          {tab === 'Lost & Found' && <LostFoundPanel />}

        </div>
      </div>

      <SlidePanel open={panelOpen} onClose={closePanel} title={panelTitle}>
        {panelContent()}
      </SlidePanel>
    </div>
  );
}
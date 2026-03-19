import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import * as roomApi       from '../../lib/api/roomApi';
import LoadingSpinner     from '../../components/shared/LoadingSpinner';
import RoomGrid           from './components/RoomGrid';
import RoomForm           from './components/RoomForm';
import RoomTypeForm       from './components/RoomTypeForm';
import RoomTypesPanel     from './components/RoomTypesPanel';
import RoomDetailModal    from './components/RoomsDetailModal';
import SlidePanel from '../../components/shared/SlidePanel';
import { usePanelLayout }       from '../../hooks/usePanelLayout';
import toast              from 'react-hot-toast';
import { useSubscriptionGate }    from '../../hooks/useSubscriptionGate';
import SubscriptionPaywall         from '../../components/shared/SubscriptionPaywall';

const STATUS_FILTERS = [
  { label: 'All',          value: ''             },
  { label: 'Available',    value: 'available'    },
  { label: 'Occupied',     value: 'occupied'     },
  { label: 'Dirty',        value: 'dirty'        },
  { label: 'Maintenance',  value: 'maintenance'  },
  { label: 'Out of Order', value: 'out_of_order' },
];

function TabBar({ value, onChange, tabs }) {
  return (
    <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ backgroundColor: 'var(--bg-subtle)' }}>
      {tabs.map(t => (
        <button key={t.value} onClick={() => onChange(t.value)}
          className="px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap"
          style={{
            backgroundColor: value === t.value ? 'var(--bg-surface)' : 'transparent',
            color:           value === t.value ? 'var(--text-base)'  : 'var(--text-muted)',
            boxShadow:       value === t.value ? 'var(--shadow-xs)'  : 'none',
          }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function RoomsPage() {
  // All hooks must be declared before any early returns (Rules of Hooks)
  const { isLocked } = useSubscriptionGate();
  const [pageTab,      setPageTab]      = useState('rooms');
  const [statusFilter, setStatusFilter] = useState('');
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editRoom,     setEditRoom]     = useState(null);
  const [viewRoomId,   setViewRoomId]   = useState(null);
  const panelOpen = showRoomForm || showTypeForm;
  const { contentStyle } = usePanelLayout(panelOpen);
  const qc = useQueryClient();
  if (isLocked) return <SubscriptionPaywall />;


  const { data: roomsRes, isLoading: loadingRooms } = useQuery({
    queryKey: ['rooms', statusFilter],
    queryFn: () => {
      const params = statusFilter
        ? statusFilter === 'available' ? { status: 'available,clean' } : { status: statusFilter }
        : {};
      return roomApi.getRooms(params).then(r => r.data.data);
    },
  });

  const { data: typesRes, isLoading: loadingTypes } = useQuery({
    queryKey: ['room-types'],
    queryFn:  () => roomApi.getRoomTypes().then(r => r.data.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => roomApi.updateRoomStatus(id, { status }),
    onSuccess: () => { qc.invalidateQueries(['rooms']); toast.success('Status updated'); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const rooms    = roomsRes || [];
  const types    = typesRes || [];
  const viewRoom = viewRoomId ? rooms.find(r => r.id === viewRoomId) ?? null : null;

  return (
    <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
      <div style={{ flex: 1, minWidth: 0, ...contentStyle }}>
      <div className="space-y-4">

      {/* Top bar — page tabs + action */}
      <div className="flex items-center justify-between gap-4">
        <TabBar
          value={pageTab}
          onChange={(v) => { setPageTab(v); setStatusFilter(''); }}
          tabs={[{ label: 'Rooms', value: 'rooms' }, { label: 'Room Types', value: 'types' }]}
        />
        {pageTab === 'rooms' && !panelOpen && (
          <button onClick={() => { setEditRoom(null); setShowRoomForm(true); }} className="btn-primary text-xs">
            <Plus size={14} /> Add Room
          </button>
        )}
        {pageTab === 'types' && !panelOpen && (
          <button onClick={() => setShowTypeForm(true)} className="btn-primary text-xs">
            <Plus size={14} /> Add Type
          </button>
        )}
      </div>

      {/* Rooms tab */}
      {pageTab === 'rooms' && (
        <>
          <div className="overflow-x-auto -mb-1 pb-1">
            <TabBar value={statusFilter} onChange={setStatusFilter} tabs={STATUS_FILTERS} />
          </div>
          {loadingRooms
            ? <LoadingSpinner center />
            : <RoomGrid
                rooms={rooms}
                onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
                onView={(room) => setViewRoomId(room.id)}
              />
          }
        </>
      )}

      {/* Room Types tab */}
      {pageTab === 'types' && (
        <RoomTypesPanel
          types={types}
          isLoading={loadingTypes}
          onAddNew={() => setShowTypeForm(true)}
        />
      )}

      {viewRoom && (
        <RoomDetailModal
          room={viewRoom}
          onClose={() => setViewRoomId(null)}
          onEdit={(room) => { setViewRoomId(null); setEditRoom(room); setShowRoomForm(true); }}
        />
      )}

      </div>  {/* end space-y-4 */}
      </div>  {/* end contentStyle wrapper */}

      <SlidePanel open={showRoomForm} onClose={() => { setShowRoomForm(false); setEditRoom(null); }}
        title={editRoom ? 'Edit Room' : 'Add Room'}>
        <RoomForm room={editRoom} types={types}
          onSuccess={() => { setShowRoomForm(false); setEditRoom(null); qc.invalidateQueries(['rooms']); }}
          onClose={() => { setShowRoomForm(false); setEditRoom(null); }} />
      </SlidePanel>

      <SlidePanel open={showTypeForm} onClose={() => setShowTypeForm(false)} title="New Room Type">
        <RoomTypeForm
          onSuccess={() => setShowTypeForm(false)}
          onClose={() => setShowTypeForm(false)} />
      </SlidePanel>
    </div>
  );
}
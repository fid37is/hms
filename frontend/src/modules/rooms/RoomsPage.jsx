import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import * as roomApi from '../../lib/api/roomApi';
import PageHeader    from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import RoomGrid      from './components/RoomGrid';
import RoomForm      from './components/RoomForm';
import RoomTypeForm  from './components/RoomTypeForm';
import Modal         from '../../components/shared/Modal';
import toast         from 'react-hot-toast';

const STATUS_FILTERS = [
  { label: 'All',          value: ''             },
  { label: 'Available',    value: 'available'    },
  { label: 'Occupied',     value: 'occupied'     },
  { label: 'Dirty',        value: 'dirty'        },
  { label: 'Maintenance',  value: 'maintenance'  },
  { label: 'Out of Order', value: 'out_of_order' },
];

function FilterTabs({ value, onChange, tabs }) {
  return (
    <div className="overflow-x-auto pb-1 -mb-1">
      <div className="flex gap-1 p-1 rounded-lg w-max min-w-full sm:w-fit" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        {tabs.map(f => (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-100 whitespace-nowrap"
            style={{
              backgroundColor: value === f.value ? 'var(--bg-surface)' : 'transparent',
              color:           value === f.value ? 'var(--text-base)'  : 'var(--text-muted)',
              boxShadow:       value === f.value ? 'var(--shadow-xs)'  : 'none',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RoomsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editRoom,     setEditRoom]     = useState(null);

  const { data: roomsRes, isLoading } = useQuery({
    queryKey: ['rooms', statusFilter],
    queryFn: () => {
      const params = statusFilter
        ? statusFilter === 'available' ? { status: 'available,clean' } : { status: statusFilter }
        : {};
      return roomApi.getRooms(params).then(r => r.data.data);
    },
  });

  const { data: typesRes } = useQuery({
    queryKey: ['room-types'],
    queryFn:  () => roomApi.getRoomTypes().then(r => r.data.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => roomApi.updateRoomStatus(id, { status }),
    onSuccess: () => { qc.invalidateQueries(['rooms']); toast.success('Status updated'); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const rooms = roomsRes || [];
  const types = typesRes || [];

  return (
    <div className="space-y-4">
      <PageHeader
        subtitle={`${rooms.length} rooms`}
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowTypeForm(true)} className="btn-secondary text-xs">
              Types
            </button>
            <button onClick={() => { setEditRoom(null); setShowRoomForm(true); }} className="btn-primary text-xs">
              <Plus size={14} /> Add
            </button>
          </div>
        }
      />

      <FilterTabs value={statusFilter} onChange={setStatusFilter} tabs={STATUS_FILTERS} />

      {isLoading
        ? <LoadingSpinner center />
        : <RoomGrid
            rooms={rooms}
            onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
            onEdit={(room) => { setEditRoom(room); setShowRoomForm(true); }}
          />
      }

      <Modal open={showRoomForm} onClose={() => setShowRoomForm(false)} title={editRoom ? 'Edit Room' : 'Add Room'}>
        <RoomForm room={editRoom} types={types} onSuccess={() => { setShowRoomForm(false); qc.invalidateQueries(['rooms']); }} />
      </Modal>

      <Modal open={showTypeForm} onClose={() => setShowTypeForm(false)} title="Room Types" size="lg">
        <RoomTypeForm onSuccess={() => qc.invalidateQueries(['room-types'])} />
      </Modal>
    </div>
  );
}

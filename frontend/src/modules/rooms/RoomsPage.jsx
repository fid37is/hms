import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Filter } from 'lucide-react';
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

export default function RoomsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editRoom,     setEditRoom]     = useState(null);

  const { data: roomsRes, isLoading } = useQuery({
    queryKey: ['rooms', statusFilter],
    queryFn:  () => {
      // 'available' tab shows both available + clean rooms (both are bookable)
      const params = statusFilter
        ? statusFilter === 'available'
          ? { status: 'available,clean' }
          : { status: statusFilter }
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
    onSuccess: () => { qc.invalidateQueries(['rooms']); toast.success('Room status updated'); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to update status'),
  });

  const rooms = roomsRes || [];
  const types = typesRes || [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rooms"
        subtitle={`${rooms.length} rooms`}
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowTypeForm(true)} className="btn-secondary">
              Room Types
            </button>
            <button onClick={() => { setEditRoom(null); setShowRoomForm(true); }} className="btn-primary">
              <Plus size={15} /> Add Room
            </button>
          </div>
        }
      />

      {/* Status filter tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-100"
            style={{
              backgroundColor: statusFilter === f.value ? 'var(--bg-surface)' : 'transparent',
              color:           statusFilter === f.value ? 'var(--text-base)'  : 'var(--text-muted)',
              boxShadow:       statusFilter === f.value ? 'var(--shadow-xs)'  : 'none',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading
        ? <LoadingSpinner center />
        : <RoomGrid
            rooms={rooms}
            onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
            onEdit={(room) => { setEditRoom(room); setShowRoomForm(true); }}
          />
      }

      <Modal open={showRoomForm} onClose={() => setShowRoomForm(false)}
        title={editRoom ? 'Edit Room' : 'Add Room'}>
        <RoomForm
          room={editRoom}
          types={types}
          onSuccess={() => { setShowRoomForm(false); qc.invalidateQueries(['rooms']); }}
        />
      </Modal>

      <Modal open={showTypeForm} onClose={() => setShowTypeForm(false)} title="Room Types" size="lg">
        <RoomTypeForm onSuccess={() => qc.invalidateQueries(['room-types'])} />
      </Modal>
    </div>
  );
}
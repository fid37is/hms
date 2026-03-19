import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as hkApi     from '../../../lib/api/housekeepingApi';
import DataTable      from '../../../components/shared/DataTable';
import StatusBadge    from '../../../components/shared/StatusBadge';
import { formatDate } from '../../../utils/format';
import toast from 'react-hot-toast';

export default function LostFoundPanel() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['lost-found'],
    queryFn:  () => hkApi.getLostAndFound({}).then(r => r.data.data),
  });

  const markReturned = useMutation({
    mutationFn: (id) => hkApi.markReturned(id, { returned_at: new Date().toISOString() }),
    onSuccess: () => { toast.success('Marked as returned'); qc.invalidateQueries(['lost-found']); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const columns = [
    {
      key: 'item_description', label: 'Item',
      render: r => <span className="font-medium" style={{ color: 'var(--text-base)' }}>{r.item_description}</span>,
    },
    { key: 'location_found', label: 'Found At',  render: r => r.location_found || '—' },
    { key: 'guest_name',     label: 'Guest',      render: r => r.guest_name     || '—' },
    { key: 'found_date',     label: 'Date Found', render: r => formatDate(r.found_date || r.created_at) },
    { key: 'status',         label: 'Status',     render: r => <StatusBadge status={r.status || 'found'} /> },
    {
      key: 'actions', label: '', width: '120px',
      render: r => r.status !== 'returned' && (
        <button
          onClick={e => { e.stopPropagation(); markReturned.mutate(r.id); }}
          className="text-xs px-2.5 py-1 rounded-md transition-colors"
          style={{ backgroundColor: 'var(--s-green-bg)', color: 'var(--s-green-text)' }}
        >
          Mark Returned
        </button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data || []}
      loading={isLoading}
      emptyTitle="No lost & found items"
    />
  );
}
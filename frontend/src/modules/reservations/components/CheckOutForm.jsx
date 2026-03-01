import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as resApi   from '../../../lib/api/reservationApi';
import * as folioApi from '../../../lib/api/folioApi';
import { formatDate, formatCurrency } from '../../../utils/format';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

export default function CheckOutForm({ reservation: res, onSuccess }) {
  const navigate = useNavigate();

  const { data: folio, isLoading } = useQuery({
    queryKey: ['folio-res', res.id],
    queryFn:  () => folioApi.getFolioByReservation(res.id).then(r => r.data.data),
  });

  const checkOut = useMutation({
    mutationFn: () => resApi.checkOut(res.id),
    onSuccess: () => { toast.success('Guest checked out'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Check-out failed'),
  });

  if (isLoading) return <LoadingSpinner center />;

  const balance = folio?.balance || 0;

  return (
    <div className="space-y-5">
      <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        {[
          ['Guest',        res.guests?.full_name],
          ['Room',         res.rooms?.number ? `Room ${res.rooms.number}` : '—'],
          ['Check-in',     formatDate(res.actual_check_in || res.check_in_date)],
          ['Check-out',    formatDate(res.check_out_date)],
          ['Total Charges', formatCurrency(folio?.total_charges || 0)],
          ['Total Paid',    formatCurrency(folio?.total_payments || 0)],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span className="font-medium" style={{ color: 'var(--text-base)' }}>{value}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm pt-2" style={{ borderTop: '1px solid var(--border-soft)' }}>
          <span className="font-semibold" style={{ color: 'var(--text-base)' }}>Balance Due</span>
          <span className="font-bold" style={{ color: balance > 0 ? 'var(--s-red-text)' : 'var(--s-green-text)' }}>
            {formatCurrency(balance)}
          </span>
        </div>
      </div>

      {balance > 0 && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: 'var(--s-yellow-bg)', color: 'var(--s-yellow-text)' }}
        >
          Outstanding balance of {formatCurrency(balance)}. Please collect payment before checking out.
        </div>
      )}

      <div className="flex gap-2">
        {folio && (
          <button
            onClick={() => navigate(`/folio/${folio.id}`)}
            className="btn-secondary flex-1 justify-center"
          >
            View Folio
          </button>
        )}
        <button
          onClick={() => checkOut.mutate()}
          disabled={checkOut.isPending}
          className="btn-primary flex-1 justify-center"
        >
          {checkOut.isPending ? 'Checking out…' : 'Confirm Check-out'}
        </button>
      </div>
    </div>
  );
}

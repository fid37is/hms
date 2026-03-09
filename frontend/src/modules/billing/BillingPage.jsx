import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, Plus, AlertCircle, Clock, CheckCircle2,
  User, BedDouble, Search,
} from 'lucide-react';
import * as folioApi from '../../lib/api/folioApi';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Modal from '../../components/shared/Modal';
import PaymentForm from './components/PaymentForm';
import AddChargeForm from './components/AddChargeForm';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';

export default function BillingPage() {
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [payFolio, setPayFolio] = useState(null);  // folio to record payment on
  const [chargeFolio, setChargeFolio] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['open-folios', page],
    queryFn:  () => folioApi.getOpenFolios({ page, limit: 25 }).then(r => r.data.data),
    keepPreviousData: true,
  });

  const folios = (data?.data || []).filter(f => {
    if (!search) return true;
    const s = search.toLowerCase();
    const g = f.reservations?.guests;
    return (
      g?.full_name?.toLowerCase().includes(s) ||
      f.reservations?.reservation_no?.toLowerCase().includes(s) ||
      f.reservations?.rooms?.number?.toString().includes(s) ||
      f.folio_no?.toLowerCase().includes(s)
    );
  });

  const totalBalance = folios.reduce((sum, f) => sum + (f.balance || 0), 0);
  const total        = data?.total || 0;

  return (
    <div className="space-y-5">

      {/* Header stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="stat-label">Open Folios</p>
          <p className="text-2xl font-semibold mt-1" style={{ color: 'var(--text-base)' }}>
            {isLoading ? '—' : total}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Outstanding Balance</p>
          <p className="text-2xl font-semibold mt-1" style={{ color: totalBalance > 0 ? 'var(--s-red-text)' : 'var(--s-green-text)' }}>
            {isLoading ? '—' : formatCurrency(totalBalance)}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg. per Folio</p>
          <p className="text-2xl font-semibold mt-1" style={{ color: 'var(--text-base)' }}>
            {isLoading || !total ? '—' : formatCurrency(Math.round(totalBalance / total))}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-8 text-sm" placeholder="Guest, room, folio…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex-1" />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {folios.length} open folio{folios.length !== 1 ? 's' : ''} with balance
        </span>
      </div>

      {/* Folios table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="py-12"><LoadingSpinner center /></div>
        ) : folios.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto" style={{ color: 'var(--s-green-text)', opacity: 0.5 }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>
              {search ? 'No matching folios' : 'No outstanding balances'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {search ? 'Try a different search' : 'All open folios are settled'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                {['Folio', 'Guest', 'Room', 'Check-in / out', 'Charges', 'Paid', 'Balance', ''].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {folios.map(f => {
                const res   = f.reservations;
                const guest = res?.guests;
                const room  = res?.rooms;
                const bal   = f.balance || 0;

                return (
                  <tr key={f.id} className="table-row cursor-pointer"
                    onClick={() => navigate(`/folio/${f.id}`)}>
                    <td className="table-td">
                      <span className="font-mono text-xs font-medium" style={{ color: 'var(--brand)' }}>
                        {f.folio_no}
                      </span>
                    </td>
                    <td className="table-td">
                      {guest ? (
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>
                            {guest.full_name}
                          </p>
                          {guest.phone && (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{guest.phone}</p>
                          )}
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="table-td">
                      {room ? (
                        <span className="font-medium text-sm" style={{ color: 'var(--text-base)' }}>
                          Room {room.number}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>TBA</span>}
                    </td>
                    <td className="table-td text-xs" style={{ color: 'var(--text-sub)' }}>
                      {res ? (
                        <>
                          <p>{formatDate(res.check_in_date)}</p>
                          <p style={{ color: 'var(--text-muted)' }}>→ {formatDate(res.check_out_date)}</p>
                        </>
                      ) : '—'}
                    </td>
                    <td className="table-td font-mono text-sm">
                      {formatCurrency(f.total_charges || 0)}
                    </td>
                    <td className="table-td font-mono text-sm" style={{ color: 'var(--s-green-text)' }}>
                      {formatCurrency(f.total_payments || 0)}
                    </td>
                    <td className="table-td">
                      <span className="font-mono text-sm font-semibold"
                        style={{ color: bal > 0 ? 'var(--s-red-text)' : 'var(--s-green-text)' }}>
                        {formatCurrency(bal)}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setChargeFolio(f)}
                          className="btn-ghost text-xs px-2 py-1 flex items-center gap-1"
                          title="Add charge">
                          <Plus size={12} /> Charge
                        </button>
                        <button
                          onClick={() => setPayFolio(f)}
                          className="btn-primary text-xs px-2 py-1 flex items-center gap-1"
                          title="Record payment">
                          <CreditCard size={12} /> Pay
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 25 && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Page {page} of {Math.ceil(total / 25)}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary text-xs px-3">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 25 >= total}
              className="btn-secondary text-xs px-3">Next</button>
          </div>
        </div>
      )}

      {/* Payment modal */}
      <Modal open={!!payFolio} onClose={() => setPayFolio(null)}
        title={`Record Payment — ${payFolio?.folio_no || ''}`}>
        {payFolio && (
          <PaymentForm
            folioId={payFolio.id}
            balance={payFolio.balance || 0}
            onSuccess={() => {
              setPayFolio(null);
              qc.invalidateQueries(['open-folios']);
              toast.success('Payment recorded');
            }}
          />
        )}
      </Modal>

      {/* Add charge modal */}
      <Modal open={!!chargeFolio} onClose={() => setChargeFolio(null)}
        title={`Add Charge — ${chargeFolio?.folio_no || ''}`}>
        {chargeFolio && (
          <AddChargeForm
            folioId={chargeFolio.id}
            onSuccess={() => {
              setChargeFolio(null);
              qc.invalidateQueries(['open-folios']);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
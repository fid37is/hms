import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, Flag, Building2, CreditCard, Calendar, MapPin, Edit3, BedDouble, ChevronRight } from 'lucide-react';
import * as guestApi from '../../lib/api/guestApi';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import GuestForm from './components/GuestForm';
import ReservationDetail from '../reservations/components/ReservationDetail';
import { formatDate, formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';
import SlidePanel from '../../components/shared/SlidePanel';
import { usePanelLayout }             from '../../hooks/usePanelLayout';


function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return m;
}

const ID_LABELS = { passport:'Passport', national_id:'National ID', nin:'NIN', drivers_license:"Driver's License", voters_card:"Voter's Card", residence_permit:'Residence Permit', other:'Other' };
const CATEGORIES = [
  { value:'regular',     label:'Regular',     color:'var(--text-muted)' },
  { value:'vip',         label:'VIP',          color:'#D97706' },
  { value:'corporate',   label:'Corporate',    color:'#2563EB' },
  { value:'blacklisted', label:'Blacklisted',  color:'#DC2626' },
];
const STATUS_STYLES = {
  confirmed:   { bg:'var(--s-blue-bg)',   text:'var(--s-blue-text)',  label:'Confirmed'   },
  checked_in:  { bg:'var(--s-green-bg)',  text:'var(--s-green-text)', label:'Checked In'  },
  checked_out: { bg:'var(--bg-subtle)',   text:'var(--text-muted)',   label:'Checked Out' },
  cancelled:   { bg:'var(--s-red-bg)',    text:'var(--s-red-text)',   label:'Cancelled'   },
  no_show:     { bg:'var(--s-red-bg)',    text:'var(--s-red-text)',   label:'No Show'     },
};

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor:'var(--bg-subtle)' }}>
        <Icon size={13} style={{ color:'var(--text-muted)' }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs" style={{ color:'var(--text-muted)' }}>{label}</p>
        <p className="text-sm font-medium mt-0.5" style={{ color:'var(--text-base)' }}>{value}</p>
      </div>
    </div>
  );
}

function ReservationCard({ res, onSelect }) {
  const s = STATUS_STYLES[res.status] || STATUS_STYLES.confirmed;
  const isActive = res.status === 'checked_in';
  const nights = Math.max(1, Math.round((new Date(res.check_out_date) - new Date(res.check_in_date)) / 86400000));
  return (
    <div className="rounded-xl overflow-hidden cursor-pointer"
      style={{ border: isActive ? '1.5px solid var(--s-green-text)' : '1px solid var(--border-soft)', backgroundColor: isActive ? 'var(--s-green-bg)' : 'var(--bg-subtle)' }}
      onClick={() => onSelect(res)}>      {isActive && (
        <div className="px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5" style={{ backgroundColor:'var(--s-green-text)', color:'white' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Currently staying
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <BedDouble size={13} style={{ color:'var(--text-muted)' }} />
              <span className="text-sm font-semibold" style={{ color:'var(--text-base)' }}>
                {res.rooms?.number ? `Room ${res.rooms.number}` : res.room_types?.name || 'Room TBA'}
              </span>
              {res.rooms?.room_types?.name && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor:'var(--brand-subtle)', color:'var(--brand)' }}>
                  {res.rooms.room_types.name}
                </span>
              )}
            </div>
            <p className="text-xs font-mono" style={{ color:'var(--text-muted)' }}>{res.reservation_no}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor:s.bg, color:s.text }}>{s.label}</span>
            <ChevronRight size={14} style={{ color:'var(--text-muted)' }} />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <div className="text-center">
            <p className="text-xs" style={{ color:'var(--text-muted)' }}>Check-in</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color:'var(--text-base)' }}>{formatDate(res.check_in_date)}</p>
          </div>
          <div className="flex-1 flex items-center gap-1">
            <div className="flex-1 h-px" style={{ backgroundColor:'var(--border-base)' }} />
            <span className="text-xs" style={{ color:'var(--text-muted)' }}>{nights}n</span>
            <div className="flex-1 h-px" style={{ backgroundColor:'var(--border-base)' }} />
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color:'var(--text-muted)' }}>Check-out</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color:'var(--text-base)' }}>{formatDate(res.check_out_date)}</p>
          </div>
          <div className="text-right ml-2">
            <p className="text-xs" style={{ color:'var(--text-muted)' }}>Total</p>
            <p className="text-sm font-bold mt-0.5" style={{ color:'var(--brand)' }}>{formatCurrency(res.total_amount ?? 0)}</p>
          </div>
        </div>
        {res.special_requests && (
          <p className="text-xs mt-2 px-2 py-1.5 rounded-lg italic" style={{ backgroundColor:'var(--bg-surface)', color:'var(--text-muted)' }}>
            "{res.special_requests}"
          </p>
        )}
      </div>
    </div>
  );
}

export default function GuestProfilePage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const { contentStyle } = usePanelLayout(!!(showEdit || selectedRes));
  const [showEdit,    setShowEdit]    = useState(false);
  const [selectedRes, setSelectedRes] = useState(null);
  const [activeTab,   setActiveTab]   = useState('all');

  const { data: guest, isLoading } = useQuery({
    queryKey: ['guest', id],
    queryFn:  () => guestApi.getGuestById(id).then(r => r.data.data),
    enabled:  !!id,
  });

  const { data: historyRes, isLoading: historyLoading } = useQuery({
    queryKey: ['guest-history', id],
    queryFn:  () => guestApi.getGuestHistory(id).then(r => r.data.data),
    enabled:  !!id,
  });

  const updateCategory = useMutation({
    mutationFn: (category) => guestApi.flagGuest(id, { category }),
    onSuccess: () => { toast.success('Category updated'); qc.invalidateQueries(['guest', id]); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  if (isLoading) return <LoadingSpinner center />;
  if (!guest) return (
    <div className="space-y-4">
      <button onClick={() => navigate('/guests')} className="btn-ghost text-sm gap-1.5"><ArrowLeft size={14} /> Back to Guests</button>
      <p style={{ color:'var(--text-muted)' }}>Guest not found.</p>
    </div>
  );

  const reservations = Array.isArray(historyRes) ? historyRes : Array.isArray(historyRes?.data) ? historyRes.data : [];
  const active    = reservations.filter(r => r.status === 'checked_in');
  const upcoming  = reservations.filter(r => r.status === 'confirmed');
  const past      = reservations.filter(r => ['checked_out','no_show'].includes(r.status));
  const cancelled = reservations.filter(r => r.status === 'cancelled');
  const tabs = [
    { key:'all',       label:'All',       count:reservations.length },
    { key:'active',    label:'Active',    count:active.length },
    { key:'upcoming',  label:'Upcoming',  count:upcoming.length },
    { key:'past',      label:'Past',      count:past.length },
    { key:'cancelled', label:'Cancelled', count:cancelled.length },
  ].filter(t => t.key === 'all' || t.count > 0);
  const displayed   = { all:reservations, active, upcoming, past, cancelled }[activeTab] || reservations;
  const initials    = (guest.full_name || '?').charAt(0).toUpperCase();
  const currentStay = active[0];

  return (
    <div style={{ display:'flex', position:'relative' }}>

      {/* Main content */}
      <div style={{ ...contentStyle }}>
        <div className="space-y-5">

          <button onClick={() => navigate('/guests')} className="btn-ghost text-sm gap-1.5" style={{ color:'var(--text-muted)' }}>
            <ArrowLeft size={14} /> Back to Guests
          </button>

          <div className="grid lg:grid-cols-5 gap-5" style={{ height: 'calc(100vh - 160px)', alignItems: 'start' }}>

            {/* LEFT — scrolls independently */}
            <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-1" style={{ maxHeight: '100%' }}>

              <div className="card p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ backgroundColor:'var(--brand-subtle)', color:'var(--brand)' }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-semibold leading-tight" style={{ color:'var(--text-base)' }}>{guest.full_name}</h2>
                        {guest.company_name && (
                          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color:'var(--text-muted)' }}>
                            <Building2 size={11} /> {guest.company_name}
                          </p>
                        )}
                      </div>
                      {!showEdit && (
                        <button onClick={() => setShowEdit(true)} className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ color:'var(--text-muted)' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <Edit3 size={13} />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {CATEGORIES.map(cat => (
                        <button key={cat.value} onClick={() => updateCategory.mutate(cat.value)}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: guest.category === cat.value ? cat.color : 'var(--bg-subtle)', color: guest.category === cat.value ? 'white' : 'var(--text-muted)', border:`1px solid ${guest.category === cat.value ? cat.color : 'var(--border-soft)'}`, opacity: updateCategory.isPending ? 0.6 : 1 }}>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4" style={{ borderTop:'1px solid var(--border-soft)' }}>
                  <div className="text-center">
                    <p className="text-xl font-bold" style={{ color:'var(--brand)' }}>{guest.total_visits || reservations.length || 0}</p>
                    <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>Stays</p>
                  </div>
                  <div className="text-center" style={{ borderLeft:'1px solid var(--border-soft)', borderRight:'1px solid var(--border-soft)' }}>
                    <p className="text-xl font-bold" style={{ color: active.length > 0 ? 'var(--s-green-text)' : 'var(--text-base)' }}>{active.length > 0 ? 'In' : 'Out'}</p>
                    <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>Status</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold" style={{ color:'var(--text-base)' }}>{guest.loyalty_points || 0}</p>
                    <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>Points</p>
                  </div>
                </div>

                {currentStay && (
                  <button onClick={() => setSelectedRes(currentStay)}
                    className="w-full mt-4 flex items-center gap-3 rounded-xl px-4 py-3 text-left hover:opacity-90"
                    style={{ backgroundColor:'var(--s-green-text)' }}>
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">Checked in · Room {currentStay.rooms?.number || '—'}</p>
                      <p className="text-xs text-white/70">Checks out {formatDate(currentStay.check_out_date)}</p>
                    </div>
                    <ChevronRight size={14} color="white" className="flex-shrink-0 opacity-70" />
                  </button>
                )}
              </div>

              <div className="card p-5 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color:'var(--text-muted)' }}>Contact & Identity</p>
                <div className="space-y-3">
                  <InfoRow icon={Phone}    label="Phone"         value={guest.phone} />
                  <InfoRow icon={Mail}     label="Email"         value={guest.email} />
                  <InfoRow icon={Flag}     label="Nationality"   value={guest.nationality} />
                  <InfoRow icon={Calendar} label="Date of Birth" value={guest.date_of_birth ? formatDate(guest.date_of_birth) : null} />
                  <InfoRow icon={MapPin}   label="Address"       value={guest.address} />
                  {guest.id_type && <InfoRow icon={CreditCard} label={ID_LABELS[guest.id_type] || guest.id_type} value={guest.id_number || 'On file'} />}
                </div>
              </div>

              {guest.notes && (
                <div className="card p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color:'var(--text-muted)' }}>Notes</p>
                  <p className="text-sm" style={{ color:'var(--text-sub)' }}>{guest.notes}</p>
                </div>
              )}

              {guest.preferences && Object.keys(guest.preferences).length > 0 && (
                <div className="card p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color:'var(--text-muted)' }}>Preferences</p>
                  <div className="space-y-1">
                    {Object.entries(guest.preferences).map(([k, v]) => (
                      <div key={k} className="flex gap-2 text-xs">
                        <span className="capitalize flex-shrink-0" style={{ color:'var(--text-muted)' }}>{k.replace(/_/g,' ')}:</span>
                        <span style={{ color:'var(--text-sub)' }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT — tab bar fixed, list scrolls */}
            <div className="lg:col-span-3 card overflow-hidden" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Sticky tab bar */}
              <div className="flex flex-shrink-0" style={{ borderBottom:'1px solid var(--border-soft)' }}>
                  {tabs.map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                      className="px-4 py-3 text-xs font-medium flex items-center gap-1.5"
                      style={{ color: activeTab === t.key ? 'var(--brand)' : 'var(--text-muted)', borderBottom: activeTab === t.key ? '2px solid var(--brand)' : '2px solid transparent', marginBottom:-1 }}>
                      {t.label}
                      {t.count > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ backgroundColor: activeTab === t.key ? 'var(--brand)' : 'var(--bg-subtle)', color: activeTab === t.key ? 'white' : 'var(--text-muted)' }}>
                          {t.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                  {historyLoading ? (
                    <div className="py-10"><LoadingSpinner center /></div>
                  ) : displayed.length === 0 ? (
                    <div className="py-12 text-center">
                      <BedDouble size={28} className="mx-auto mb-2" style={{ color:'var(--text-muted)', opacity:0.4 }} />
                      <p className="text-sm" style={{ color:'var(--text-muted)' }}>No {activeTab === 'all' ? '' : activeTab} reservations</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {displayed.map(res => <ReservationCard key={res.id} res={res} onSelect={setSelectedRes} />)}
                    </div>
                  )}
                </div>
            </div>

          </div>
        </div>
      </div>

      <SlidePanel open={!!selectedRes} onClose={() => setSelectedRes(null)} title="Reservation">
        <ReservationDetail reservation={selectedRes} onAction={() => {}} />
      </SlidePanel>

      <SlidePanel open={showEdit} onClose={() => setShowEdit(false)} title={`Edit · ${guest?.full_name}`}>
        <GuestForm
          guest={guest}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); qc.invalidateQueries(['guest', id]); qc.invalidateQueries(['guests']); }}
        />
      </SlidePanel>

    </div>
  );
}
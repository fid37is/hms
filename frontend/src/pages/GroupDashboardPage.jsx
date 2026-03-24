// src/pages/GroupDashboardPage.jsx
// Group-level dashboard — shows key stats for all properties side by side.
// Only accessible when the user belongs to 2+ organisations.
// Each property's data is fetched with the user's current token (which has
// access to all orgs via org_memberships) — no cross-org data leakage.

import { useQuery }     from '@tanstack/react-query';
import { useNavigate }  from 'react-router-dom';
import {
  BedDouble, Users, LogIn, LogOut,
  TrendingUp, Sparkles, Wrench, Building2,
  ArrowRight, RefreshCw,
} from 'lucide-react';
import { useAuthStore }    from '../store/authStore';
import { getGroupSummary } from '../lib/api/reportApi';
import * as authApi        from '../lib/api/authApi';
import { formatCurrency }  from '../utils/format';
import LoadingSpinner      from '../components/shared/LoadingSpinner';
import { useQueryClient }  from '@tanstack/react-query';
import toast               from 'react-hot-toast';

function StatCell({ icon: Icon, label, value, accent, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
        <Icon size={12} style={{ color: accent || 'var(--text-muted)', flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)' }}>
          {label}
        </span>
      </div>
      <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-base)', lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</span>}
    </div>
  );
}

function OccupancyBar({ rate }) {
  const color = rate >= 70 ? 'var(--s-green-text)' : rate >= 40 ? 'var(--accent)' : 'var(--s-red-text)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Occupancy</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{rate}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${rate}%`, background: color, borderRadius: 3, transition: 'width .5s ease' }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active:     { bg: 'var(--s-green-bg)', color: 'var(--s-green-text)', label: 'Active' },
    trial:      { bg: '#fff7ed',           color: '#c2410c',              label: 'Trial'  },
    suspended:  { bg: 'var(--s-red-bg)',   color: 'var(--s-red-text)',   label: 'Suspended' },
    past_due:   { bg: 'var(--s-red-bg)',   color: 'var(--s-red-text)',   label: 'Past Due'  },
  };
  const s = map[status] || map.trial;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function PropertyCard({ property, isCurrent, onSwitch, switching }) {
  const s = property.stats;
  const currency = 'NGN'; // TODO: pull from each org's config

  return (
    <div className="card" style={{
      padding: 0, overflow: 'hidden',
      outline: isCurrent ? '2px solid var(--brand)' : 'none',
      outlineOffset: 2,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-soft)',
        background: isCurrent ? 'var(--brand-subtle)' : 'var(--bg-surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: isCurrent ? 'var(--brand)' : 'var(--bg-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700,
            color: isCurrent ? '#fff' : 'var(--text-muted)',
          }}>
            {property.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-base)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {property.name}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{property.slug}.cierlo.io</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <StatusBadge status={property.subscription_status} />
          {!isCurrent && (
            <button
              onClick={() => onSwitch(property.org_id)}
              disabled={switching}
              className="btn-secondary"
              style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {switching ? <RefreshCw size={11} style={{ animation: 'spin .6s linear infinite' }} /> : <ArrowRight size={11} />}
              Switch
            </button>
          )}
          {isCurrent && (
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand)' }}>Current</span>
          )}
        </div>
      </div>

      {/* Occupancy bar */}
      <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid var(--border-soft)' }}>
        <OccupancyBar rate={s.occupancy_rate} />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
          {s.occupied_rooms} of {s.total_rooms} rooms occupied
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px 12px' }}>
        <StatCell icon={Users}     label="In House"    value={s.in_house}          accent="var(--brand)" />
        <StatCell icon={LogIn}     label="Arrivals"    value={s.arrivals_today}    accent="var(--s-green-text)" />
        <StatCell icon={LogOut}    label="Departures"  value={s.departures_today}  accent="#6366f1" />
        <StatCell icon={TrendingUp} label="Month Rev"  value={formatCurrency(s.monthly_revenue)} sub="this month" />
        <StatCell icon={Sparkles}  label="HK Tasks"    value={s.hk_pending}        accent={s.hk_pending > 0 ? 'var(--accent)' : 'var(--text-muted)'} />
        <StatCell icon={Wrench}    label="Maintenance" value={s.maintenance_open}  accent={s.maintenance_open > 0 ? 'var(--s-red-text)' : 'var(--text-muted)'} />
      </div>
    </div>
  );
}

export default function GroupDashboardPage() {
  const { org, orgs, switchOrg } = useAuthStore();
  const qc       = useQueryClient();
  const navigate = useNavigate();
  const orgIds   = (orgs || []).map(o => o.org_id).filter(Boolean);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['group-summary', orgIds.join(',')],
    queryFn:  () => getGroupSummary(orgIds).then(r => r.data.data),
    enabled:  orgIds.length > 1,
    refetchInterval: 60_000,
  });

  const [switchingId, setSwitchingId] = React.useState(null);

  const handleSwitch = async (targetOrgId) => {
    setSwitchingId(targetOrgId);
    try {
      const res = await authApi.switchOrg(targetOrgId);
      const { access_token, user, org: newOrg } = res.data.data;
      switchOrg({ user, token: access_token, org: newOrg });
      qc.clear();
      navigate('/dashboard');
      toast.success(`Switched to ${newOrg.name}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to switch');
    } finally {
      setSwitchingId(null);
    }
  };

  if (orgIds.length <= 1) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <Building2 size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-base)', marginBottom: 8 }}>No group view yet</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add another property to see a group overview.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-base)', marginBottom: 3 }}>
            Group Overview
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {orgIds.length} properties · Live stats
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-secondary"
          style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Group totals strip */}
      {data && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
          gap: 0, border: '1px solid var(--border-soft)', borderRadius: 12, overflow: 'hidden',
        }}>
          {[
            { label: 'Total Rooms',    value: data.reduce((s, p) => s + p.stats.total_rooms, 0),         icon: BedDouble },
            { label: 'In House',       value: data.reduce((s, p) => s + p.stats.in_house, 0),            icon: Users },
            { label: 'Arrivals Today', value: data.reduce((s, p) => s + p.stats.arrivals_today, 0),      icon: LogIn },
            { label: 'Month Revenue',  value: formatCurrency(data.reduce((s, p) => s + p.stats.monthly_revenue, 0)), icon: TrendingUp },
          ].map((item, i) => (
            <div key={item.label} style={{
              padding: '16px 20px', background: 'var(--bg-surface)',
              borderRight: i < 3 ? '1px solid var(--border-soft)' : 'none',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <item.icon size={13} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-muted)' }}>
                  {item.label}
                </span>
              </div>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-base)', lineHeight: 1 }}>{item.value}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>across all properties</span>
            </div>
          ))}
        </div>
      )}

      {/* Property cards */}
      {isLoading && <LoadingSpinner center />}
      {error && (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--s-red-text)' }}>
          Failed to load group data — {error.message}
        </div>
      )}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {data.map(property => (
            <PropertyCard
              key={property.org_id}
              property={property}
              isCurrent={property.org_id === org?.id}
              onSwitch={handleSwitch}
              switching={switchingId === property.org_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Need React for useState
import React from 'react';
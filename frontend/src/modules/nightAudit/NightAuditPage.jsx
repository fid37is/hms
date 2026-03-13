// src/modules/nightAudit/NightAuditPage.jsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Moon, CheckCircle, AlertTriangle, Clock,
  LogIn, LogOut, UserX, BedDouble,
} from 'lucide-react';
import * as nightAuditApi from '../../lib/api/nightAuditApi';
import { formatCurrency, formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';

const today = () => new Date().toISOString().split('T')[0];

// header 56px + main padding top 24px + main padding bottom 24px = 104px
const PAGE_H = 'calc(100vh - 104px)';
// toolbar ~44px + gap 16px = 60px
const BODY_H = 'calc(100vh - 164px)';

function AuditStatusBadge({ status }) {
  const cfg = {
    completed: { label: 'Completed', color: 'var(--s-green-text)', bg: 'var(--s-green-bg)',  icon: CheckCircle },
    running:   { label: 'Running',   color: 'var(--s-yellow-text)',bg: 'var(--s-yellow-bg)', icon: Clock },
    failed:    { label: 'Failed',    color: 'var(--s-red-text)',   bg: 'var(--s-red-bg)',    icon: AlertTriangle },
  }[status] || { label: status, color: 'var(--text-muted)', bg: 'var(--bg-subtle)', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}

function GuestSection({ label, icon: Icon, color, guests = [], showRate = true }) {
  if (!guests.length) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 px-5 py-2"
        style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-soft)' }}>
        <Icon size={11} style={{ color }} />
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium ml-1"
          style={{ backgroundColor: `${color}18`, color }}>
          {guests.length}
        </span>
      </div>
      {guests.map((r, i) => (
        <div key={r.id}
          className="flex items-center justify-between px-5 py-2.5"
          style={{
            borderBottom: i < guests.length - 1 ? '1px solid var(--border-soft)' : 'none',
            backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--bg-subtle)',
          }}>
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>
              {r.guests?.full_name || '—'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {r.reservation_no}{r.rooms?.number ? ` · Rm ${r.rooms.number}` : ''}
            </p>
          </div>
          {showRate && r.rate_per_night > 0 && (
            <span className="text-sm font-semibold font-mono flex-shrink-0 ml-4" style={{ color: 'var(--brand)' }}>
              {formatCurrency(r.rate_per_night)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function NightAuditPage() {
  const qc = useQueryClient();
  const [date, setDate]           = useState(today());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: preview, isLoading } = useQuery({
    queryKey: ['night-audit-preview', date],
    queryFn:  () => nightAuditApi.getPreview(date).then(r => r.data.data),
  });

  const { data: history = [] } = useQuery({
    queryKey: ['night-audit-history'],
    queryFn:  () => nightAuditApi.getHistory(30).then(r => r.data.data),
  });

  const runMutation = useMutation({
    mutationFn: () => nightAuditApi.runAudit(date),
    onSuccess: (res) => {
      const result = res.data.data;
      toast.success(`Audit complete — ${result.summary.charges_posted} charges posted`);
      setConfirmOpen(false);
      qc.invalidateQueries(['night-audit-preview', date]);
      qc.invalidateQueries(['night-audit-history']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Audit failed');
      setConfirmOpen(false);
    },
  });

  const alreadyRun = preview?.run?.status === 'completed';
  const isRunning  = preview?.run?.status === 'running';
  const totals     = preview?.totals || {};
  const isToday    = date === today();

  return (
    <div style={{ height: PAGE_H, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Audit date</label>
          <input type="date" className="input text-sm" style={{ width: 150 }}
            value={date} onChange={e => setDate(e.target.value)} max={today()} />
        </div>
        {preview?.run && <AuditStatusBadge status={preview.run.status} />}
        <div style={{ flex: 1 }} />
        {!alreadyRun ? (
          <button className="btn-primary text-sm flex items-center gap-2"
            onClick={() => setConfirmOpen(true)}
            disabled={isRunning || runMutation.isPending}>
            <Moon size={14} />
            {isRunning ? 'Running…' : 'Run Night Audit'}
          </button>
        ) : (
          <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--s-green-text)' }}>
            <CheckCircle size={13} /> Completed · {formatDateTime(preview.run.completed_at)}
          </span>
        )}
      </div>

      {/* ── Body — fills remaining height ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

        {/* LEFT — single card, fills full height */}
        <div className="card overflow-hidden" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Stats strip — fixed */}
          <div className="grid grid-cols-4 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border-soft)' }}>
            {[
              { icon: BedDouble, label: 'In House',   value: isLoading ? '—' : (totals.in_house   || 0), color: 'var(--brand)' },
              { icon: LogIn,     label: 'Arrivals',   value: isLoading ? '—' : (totals.arrivals   || 0), color: 'var(--s-green-text)' },
              { icon: LogOut,    label: 'Departures', value: isLoading ? '—' : (totals.departures || 0), color: 'var(--s-yellow-text)' },
              { icon: UserX,     label: 'No-Shows',   value: isLoading ? '—' : (totals.no_shows   || 0), color: 'var(--s-red-text)' },
            ].map(({ icon: Icon, label, value, color }, i, arr) => (
              <div key={label} className="flex items-center gap-3 px-5 py-4"
                style={{ borderRight: i < arr.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}18`, color }}>
                  <Icon size={15} />
                </div>
                <div>
                  <p className="text-xl font-bold leading-none" style={{ color: 'var(--text-base)' }}>{value}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Banner — fixed */}
          {preview && !alreadyRun && totals.room_revenue > 0 && (
            <div className="flex items-center justify-between px-5 py-2.5 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-subtle)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {totals.in_house} room charge{totals.in_house !== 1 ? 's' : ''} will be posted to folios
              </p>
              <p className="text-sm font-bold font-mono" style={{ color: 'var(--brand)' }}>
                {formatCurrency(totals.room_revenue)}
              </p>
            </div>
          )}

          {preview && alreadyRun && preview.run && (
            <div className="flex items-center justify-between px-5 py-2.5 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border-soft)', backgroundColor: 'var(--s-green-bg)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--s-green-text)' }}>
                {preview.run.charges_posted} charges posted · {preview.run.no_show_count} no-shows marked
              </p>
              <p className="text-sm font-bold font-mono" style={{ color: 'var(--s-green-text)' }}>
                {formatCurrency(preview.run.total_room_revenue || 0)}
              </p>
            </div>
          )}

          {/* No-show alert — fixed */}
          {preview?.pending_no_shows?.length > 0 && (
            <div className="flex items-start gap-2 px-5 py-2.5 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border-soft)', backgroundColor: 'var(--s-red-bg)' }}>
              <UserX size={12} style={{ color: 'var(--s-red-text)', marginTop: 1, flexShrink: 0 }} />
              <p className="text-xs" style={{ color: 'var(--s-red-text)' }}>
                <strong>{preview.pending_no_shows.length} pending no-show{preview.pending_no_shows.length !== 1 ? 's' : ''}:</strong>{' '}
                {preview.pending_no_shows.map(r => r.guests?.full_name).filter(Boolean).join(', ')}
              </p>
            </div>
          )}

          {/* Guest lists — scrollable, fills remaining height */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
              </div>
            )}
            {preview && (
              <>
                <GuestSection label="In House Tonight" icon={BedDouble} color="var(--brand)"
                  guests={preview.in_house || []} />
                <GuestSection label="Arrivals Today" icon={LogIn} color="var(--s-green-text)"
                  guests={preview.arrivals || []} showRate={false} />
                <GuestSection label="Departures Today" icon={LogOut} color="var(--s-yellow-text)"
                  guests={preview.departures || []} />

                {!preview.in_house?.length && !preview.arrivals?.length && !preview.departures?.length && (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Moon size={28} style={{ color: 'var(--text-muted)', opacity: .2 }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No activity for this date</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT — history card, fills full height */}
        <div className="card overflow-hidden" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-subtle)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Audit History</p>
            <span className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
              {history.length}
            </span>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Moon size={24} style={{ color: 'var(--text-muted)', opacity: .2 }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No audits run yet</p>
              </div>
            ) : history.map((h, i) => (
              <div key={h.id} className="px-4 py-3.5"
                style={{ borderBottom: i < history.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>{h.audit_date}</p>
                  <AuditStatusBadge status={h.status} />
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  {h.users?.full_name || '—'} · {formatDateTime(h.completed_at || h.started_at)}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Revenue',  value: formatCurrency(h.total_room_revenue || 0), mono: true, highlight: true },
                    { label: 'Charges',  value: h.charges_posted },
                    { label: 'In House', value: h.in_house_count },
                    { label: 'No-shows', value: h.no_show_count },
                  ].map(({ label, value, mono, highlight }) => (
                    <div key={label} className="rounded-md px-2 py-1.5 text-center"
                      style={{ backgroundColor: 'var(--bg-subtle)' }}>
                      <p className={`text-xs font-semibold ${mono ? 'font-mono' : ''} truncate`}
                        style={{ color: highlight ? 'var(--brand)' : 'var(--text-base)' }}>
                        {value}
                      </p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Confirm modal ── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="card w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
                <Moon size={16} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-base)' }}>Run Night Audit</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>For {date}</p>
              </div>
            </div>
            <div className="rounded-lg p-3 space-y-1.5"
              style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-base)' }}>This will:</p>
              <p className="text-xs" style={{ color: 'var(--text-sub)' }}>• Post <strong>{totals.in_house || 0}</strong> room charges to guest folios</p>
              <p className="text-xs" style={{ color: 'var(--text-sub)' }}>• Mark <strong>{totals.no_shows || 0}</strong> arrivals as no-shows</p>
              <p className="text-xs" style={{ color: 'var(--text-sub)' }}>• Lock the audit for <strong>{date}</strong></p>
              {!isToday && (
                <p className="text-xs pt-1" style={{ color: 'var(--s-yellow-text)' }}>
                  ⚠ Running for a past date ({date})
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-ghost text-sm" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="btn-primary text-sm" onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
                {runMutation.isPending ? 'Running…' : 'Confirm & Run'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
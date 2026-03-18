// src/modules/settings/components/BillingPanel.jsx
//
// Shown inside Settings → Billing tab.
// Displays current subscription status, trial countdown, subscribe CTA,
// payment history, and customer portal link.

import { useState }                        from 'react';
import { useQuery, useMutation }           from '@tanstack/react-query';
import toast                               from 'react-hot-toast';
import { useAuthStore }                    from '../../../store/authStore';
import { useSubscriptionGate }             from '../../../hooks/useSubscriptionGate';
import * as subscriptionApi                from '../../../lib/api/subscriptionApi';
import LoadingSpinner                      from '../../../components/shared/LoadingSpinner';

// Format smallest unit → display currency
const fmtAmount = (amount, currency = 'USD') => {
  if (amount == null) return '—';
  // Dodo stores amounts in cents (smallest unit) — divide by 100
  const value = amount / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: currency || 'USD', minimumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value.toFixed(0)}`;
  }
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

// ─── Status badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    trial:       { label: 'Free Trial',  bg: 'var(--s-blue-bg)',   color: 'var(--s-blue-text)'   },
    active:      { label: 'Active',      bg: 'var(--s-green-bg)',  color: 'var(--s-green-text)'  },
    soft_locked: { label: 'Trial Ended', bg: 'var(--s-red-bg)',    color: 'var(--s-red-text)'    },
    past_due:    { label: 'Past Due',    bg: 'var(--s-red-bg)',    color: 'var(--s-red-text)'    },
    suspended:   { label: 'Suspended',   bg: 'var(--s-red-bg)',    color: 'var(--s-red-text)'    },
    cancelled:   { label: 'Cancelled',   bg: 'var(--s-gray-bg)',   color: 'var(--s-gray-text)'   },
  };
  const s = map[status] || map.trial;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 99,
      fontSize: 12, fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

// ─── Days left countdown ────────────────────────────────────────
function TrialCountdown({ trialEnd }) {
  if (!trialEnd) return null;
  const days = Math.ceil((new Date(trialEnd) - new Date()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return <span style={{ fontSize: 13, color: 'var(--s-red-text)', fontWeight: 600 }}>Ended</span>;

  const color = days <= 3 ? 'var(--s-red-text)' : days <= 7 ? 'var(--s-yellow-text)' : 'var(--s-green-text)';
  return (
    <span style={{ fontSize: 13, color, fontWeight: 600 }}>
      {days} day{days !== 1 ? 's' : ''} remaining
    </span>
  );
}


// ─── Plan Picker ──────────────────────────────────────────────
function PlanPicker({ plans = [], selectedPlanId, onSelect }) {
  const monthly = plans.find(p => p.interval === 'monthly');
  const annual  = plans.find(p => p.interval === 'annually');

  // Default to monthly if nothing selected
  const active = selectedPlanId || monthly?.id;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-base)', marginBottom: 12 }}>
        Choose your plan
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[monthly, annual].filter(Boolean).map(plan => {
          const isSelected = (active === plan.id) || (!selectedPlanId && plan.interval === 'monthly');
          const isAnnual   = plan.interval === 'annually';
          return (
            <div
              key={plan.id}
              onClick={() => onSelect(plan.id)}
              style={{
                padding: '14px 16px',
                border: `2px solid ${isSelected ? 'var(--brand)' : 'var(--border-soft)'}`,
                borderRadius: 9,
                cursor: 'pointer',
                background: isSelected ? 'rgba(234,108,10,.06)' : 'var(--bg-subtle)',
                transition: 'all .15s',
                position: 'relative',
              }}
            >
              {isAnnual && (
                <div style={{
                  position: 'absolute', top: -10, right: 12,
                  background: 'var(--s-green-text)',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 99,
                  letterSpacing: '.4px',
                }}>
                  2 MONTHS FREE
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: `2px solid ${isSelected ? 'var(--brand)' : 'var(--border-base)'}`,
                    background: isSelected ? 'var(--brand)' : 'transparent',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-base)' }}>
                      {plan.name} — billed {plan.interval === 'monthly' ? 'monthly' : 'yearly'}
                    </div>
                    {isAnnual && (
                      <div style={{ fontSize: 12, color: 'var(--s-green-text)', marginTop: 2 }}>
                        Save ${((3200 * 12 - 32000) / 100).toFixed(0)} compared to monthly
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand)' }}>
                    ${(plan.amount / 100).toFixed(0)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {isAnnual ? 'per year' : 'per month'}
                  </div>
                  {isAnnual && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      (${(plan.amount / 100 / 12).toFixed(2)}/mo)
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
        Prices shown in USD. You will be charged in your local currency at checkout.
        14-day free trial — cancel anytime before day 14 and you won't be charged.
      </p>
    </div>
  );
}

export default function BillingPanel() {
  const user   = useAuthStore(s => s.user);
  const org    = useAuthStore(s => s.org);
  const setAuth = useAuthStore(s => s.setAuth);
  const { status, isLocked } = useSubscriptionGate();
  const [cancelling,     setCancelling]     = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const { data: allPlans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn:  () => subscriptionApi.getActivePlan().then(r => {
      // getActivePlan returns single plan — we need all plans
      return subscriptionApi.getMySubscription()
        .then(() => r.data.data);
    }).catch(() => null),
  });

  // Fetch full subscription detail
  const { data: sub, isLoading: loadingSub } = useQuery({
    queryKey: ['my-subscription'],
    queryFn:  () => subscriptionApi.getMySubscription().then(r => r.data.data),
  });

  // Fetch payment history
  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ['payment-history'],
    queryFn:  () => subscriptionApi.getPaymentHistory().then(r => r.data.data),
  });

  // Subscribe mutation — redirects to Dodo checkout
  const subscribeMutation = useMutation({
    mutationFn: () => subscriptionApi.initializePayment({
      email:   user?.email,
      name:    user?.full_name,
      plan_id: selectedPlanId,
    }),
    onSuccess: (res) => {
      const url = res.data.data?.checkout_url;
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Could not get checkout URL. Please try again.');
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to start checkout.'),
  });

  // Customer portal mutation
  const portalMutation = useMutation({
    mutationFn: () => subscriptionApi.getPaymentHistory(), // placeholder
    onSuccess: async () => {
      try {
        const res = await subscriptionApi.getCustomerPortalUrl?.() ||
          { data: { data: { url: null } } };
        if (res?.data?.data?.url) window.location.href = res.data.data.url;
      } catch {
        toast.error('Could not open customer portal.');
      }
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => subscriptionApi.cancelSubscription('Cancelled by user'),
    onSuccess: () => {
      toast.success('Subscription cancelled.');
      setCancelling(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Cancellation failed.');
      setCancelling(false);
    },
  });

  if (loadingSub) return <LoadingSpinner center />;

  const plan      = sub?.subscription_plans || sub?.plan || {};
  const trialEnd  = sub?.trial_end || org?.trial_ends_at;
  const isActive  = status === 'active';
  const isTrial   = status === 'trial';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>

      {/* Current plan card */}
      <div className="card">
        <div className="card-header">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>
            Current Plan
          </span>
          <StatusBadge status={status} />
        </div>
        <div className="card-body">

          {/* Plan name + price */}
          {isActive ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-base)', marginBottom: 4 }}>
                  {plan.name || 'Standard'} Plan
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Full access to all Cierlo HMS modules</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand)' }}>
                  {fmtAmount(plan.amount, plan.currency)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>per {plan.interval || 'month'}</div>
              </div>
            </div>
          ) : (
            <PlanPicker plans={allPlans} selectedPlanId={selectedPlanId} onSelect={setSelectedPlanId} />
          )}

          {/* Status rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {isTrial && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Trial ends</span>
                <TrialCountdown trialEnd={trialEnd} />
              </div>
            )}
            {isActive && sub?.current_period_end && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Next billing date</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-base)' }}>
                  {fmtDate(sub.current_period_end)}
                </span>
              </div>
            )}
            {isActive && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Billing period</span>
                <span style={{ fontSize: 13, color: 'var(--text-base)' }}>
                  {fmtDate(sub?.current_period_start)} – {fmtDate(sub?.current_period_end)}
                </span>
              </div>
            )}
          </div>

          {/* What's included */}
          <div style={{
            background: 'var(--bg-subtle)', border: '1px solid var(--border-soft)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
              Everything included
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
              {[
                'Reservations & check-in/out',
                'Room management & rates',
                'Billing, folios & payments',
                'Housekeeping tasks',
                'Staff & leave management',
                'Inventory management',
                'Maintenance & assets',
                'Events & F&B',
                'Reports & night audit',
                'Guest portal & website',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--s-green-text)', fontSize: 11 }}>✓</span>
                  <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          {!isActive && (
            <button
              onClick={() => subscribeMutation.mutate()}
              disabled={subscribeMutation.isLoading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: 14, padding: '11px' }}
            >
              {subscribeMutation.isLoading
                ? 'Redirecting to checkout…'
                : isTrial
                  ? 'Subscribe Now — Keep Full Access'
                  : 'Reactivate Subscription'}
            </button>
          )}

          {/* Active subscription actions */}
          {isActive && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  // Open Dodo customer portal
                  import('../../../lib/api/subscriptionApi').then(api => {
                    api.getCustomerPortal?.()
                      .then(r => { if (r.data.data?.url) window.location.href = r.data.data.url; })
                      .catch(() => toast.error('Could not open billing portal.'));
                  });
                }}
                style={{
                  flex: 1, padding: '9px', background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-base)', borderRadius: 7,
                  color: 'var(--text-sub)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Manage Billing
              </button>
              <button
                onClick={() => setCancelling(true)}
                style={{
                  padding: '9px 16px', background: 'none',
                  border: '1px solid rgba(220,38,38,.3)', borderRadius: 7,
                  color: 'var(--s-red-text)', fontSize: 13, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment history */}
      <div className="card">
        <div className="card-header">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>
            Payment History
          </span>
        </div>
        <div>
          {loadingPayments ? (
            <LoadingSpinner center />
          ) : !payments?.length ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              No payments yet. Payments will appear here after your first subscription charge.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date', 'Plan', 'Amount', 'Period', 'Status'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', fontSize: 11, fontWeight: 600,
                      color: 'var(--text-muted)', textTransform: 'uppercase',
                      letterSpacing: '.5px', padding: '8px 12px',
                      background: 'var(--bg-subtle)',
                      borderBottom: '1px solid var(--border-soft)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id || i}>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-sub)', borderBottom: '1px solid var(--border-soft)' }}>
                      {fmtDate(p.paid_at)}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-sub)', borderBottom: '1px solid var(--border-soft)' }}>
                      {p.subscription_plans?.name || 'Standard'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: 'var(--text-base)', borderBottom: '1px solid var(--border-soft)' }}>
                      {fmtAmount(p.amount, p.currency)}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-soft)' }}>
                      {fmtDate(p.period_start)} – {fmtDate(p.period_end)}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-soft)' }}>
                      <span style={{
                        display: 'inline-flex', padding: '2px 8px',
                        borderRadius: 99, fontSize: 11, fontWeight: 600,
                        background: p.status === 'success' ? 'var(--s-green-bg)' : 'var(--s-red-bg)',
                        color: p.status === 'success' ? 'var(--s-green-text)' : 'var(--s-red-text)',
                      }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {cancelling && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20,
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
            borderRadius: 12, padding: 28, maxWidth: 420, width: '100%',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-base)', margin: '0 0 10px' }}>
              Cancel subscription?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 20px' }}>
              Your subscription will remain active until the end of the current billing period.
              After that, your account will be locked and your data retained for 60 days.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setCancelling(false)}
                style={{
                  flex: 1, padding: '9px', background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-base)', borderRadius: 7,
                  color: 'var(--text-sub)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Keep Subscription
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isLoading}
                style={{
                  flex: 1, padding: '9px',
                  background: 'rgba(220,38,38,.15)',
                  border: '1px solid rgba(220,38,38,.3)',
                  borderRadius: 7, color: 'var(--s-red-text)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {cancelMutation.isLoading ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
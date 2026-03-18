// src/components/shared/TrialBanner.jsx
//
// Shown at the top of every page inside AppShell when the org is on trial
// or has expired. Disappears once status is 'active'.

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const daysBetween = (a, b) =>
  Math.ceil((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));

export default function TrialBanner() {
  const navigate = useNavigate();
  const org      = useAuthStore(s => s.org);

  if (!org) return null;

  const { subscription_status, trial_ends_at } = org;

  // Nothing to show for active subscriptions
  if (subscription_status === 'active') return null;

  const now      = new Date();
  const trialEnd = trial_ends_at ? new Date(trial_ends_at) : null;
  const daysLeft = trialEnd ? daysBetween(now, trialEnd) : null;

  // Config per status
  const configs = {
    trial: daysLeft !== null && daysLeft <= 4 ? {
      bg:    'rgba(234,108,10,.12)',
      border:'rgba(234,108,10,.25)',
      color: '#FDBA74',
      icon:  '⏳',
      text:  daysLeft <= 0
        ? 'Your free trial has ended.'
        : `Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`,
      cta:   'Subscribe Now',
    } : null, // don't show banner until 4 days left

    soft_locked: {
      bg:    'rgba(220,38,38,.1)',
      border:'rgba(220,38,38,.25)',
      color: '#FCA5A5',
      icon:  '🔒',
      text:  'Your trial has ended. You can view your data but cannot make changes.',
      cta:   'Subscribe to Unlock',
    },
    past_due: {
      bg:    'rgba(220,38,38,.1)',
      border:'rgba(220,38,38,.25)',
      color: '#FCA5A5',
      icon:  '⚠',
      text:  'Your last payment failed. Please update your payment method.',
      cta:   'Update Payment',
    },
    suspended: {
      bg:    'rgba(220,38,38,.15)',
      border:'rgba(220,38,38,.35)',
      color: '#FCA5A5',
      icon:  '⛔',
      text:  'Your account is suspended. Subscribe to restore full access.',
      cta:   'Reactivate Now',
    },
  };

  const config = configs[subscription_status];
  if (!config) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '8px 16px',
      background: config.bg,
      borderBottom: `1px solid ${config.border}`,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13 }}>{config.icon}</span>
        <span style={{ fontSize: 13, color: config.color, fontWeight: 500 }}>
          {config.text}
        </span>
      </div>
      <button
        onClick={() => navigate('/settings?tab=billing')}
        style={{
          flexShrink: 0,
          padding: '5px 14px',
          background: 'var(--brand)',
          border: 'none',
          borderRadius: 6,
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {config.cta}
      </button>
    </div>
  );
}
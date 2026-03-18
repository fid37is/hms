// src/components/shared/SubscriptionPaywall.jsx
//
// Full-page overlay shown when:
//   - subscription_status === 'soft_locked' and user attempts a write action
//   - subscription_status === 'suspended'
//
// Usage:
//   import { useSubscriptionGate } from '../hooks/useSubscriptionGate';
//   const { locked, PaywallOverlay } = useSubscriptionGate();
//   if (locked) return <PaywallOverlay />;

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function SubscriptionPaywall({ message }) {
  const navigate = useNavigate();
  const org      = useAuthStore(s => s.org);
  const status   = org?.subscription_status;

  const isSuspended = status === 'suspended' || status === 'inactive';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 400,
      padding: 40,
      textAlign: 'center',
    }}>
      {/* Icon */}
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: isSuspended ? 'rgba(220,38,38,.15)' : 'rgba(234,108,10,.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, marginBottom: 20,
      }}>
        {isSuspended ? '⛔' : '🔒'}
      </div>

      <h2 style={{
        fontSize: 18, fontWeight: 700, color: 'var(--text-base)',
        margin: '0 0 10px', letterSpacing: '-.3px',
      }}>
        {isSuspended ? 'Account Suspended' : 'Trial Ended'}
      </h2>

      <p style={{
        fontSize: 14, color: 'var(--text-muted)',
        maxWidth: 380, lineHeight: 1.6, margin: '0 0 24px',
      }}>
        {message || (isSuspended
          ? 'Your account has been suspended. Subscribe to restore full access to all your data and operations.'
          : 'Your free trial has ended. Subscribe to continue creating reservations, managing guests, and running your hotel.'
        )}
      </p>

      {/* Subscription features */}
      <div style={{
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border-soft)',
        borderRadius: 10,
        padding: '16px 24px',
        marginBottom: 24,
        textAlign: 'left',
        width: '100%',
        maxWidth: 340,
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.6px', margin: '0 0 10px' }}>
          Everything in your subscription
        </p>
        {[
          'Reservations & check-in/out',
          'Room management & billing',
          'Housekeeping & maintenance',
          'Staff & leave management',
          'Reports & night audit',
          'Events, F&B & inventory',
        ].map(feature => (
          <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ color: 'var(--s-green-text)', fontSize: 12 }}>✓</span>
            <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>{feature}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/settings?tab=billing')}
        style={{
          padding: '12px 32px',
          background: 'var(--brand)',
          border: 'none',
          borderRadius: 8,
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          width: '100%',
          maxWidth: 340,
        }}
      >
        {isSuspended ? 'Reactivate Account' : 'Subscribe Now'}
      </button>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
        Your data is safe and will be fully restored on subscription.
      </p>
    </div>
  );
}
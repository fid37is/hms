// src/pages/BillingCallbackPage.jsx
//
// Dodo redirects here after checkout (success or cancel).
// URL: /billing/callback?payment_id=xxx
//
// We verify the payment with the backend, update auth store org status,
// then redirect to dashboard with a success toast.

import { useEffect, useState }  from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast                     from 'react-hot-toast';
import { useAuthStore }          from '../store/authStore';
import * as subscriptionApi      from '../lib/api/subscriptionApi';

export default function BillingCallbackPage() {
  const navigate       = useNavigate();
  const [params]       = useSearchParams();
  const setAuth        = useAuthStore(s => s.setAuth);
  const user           = useAuthStore(s => s.user);
  const token          = useAuthStore(s => s.token);
  const permissions    = useAuthStore(s => s.permissions);
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const paymentId = params.get('payment_id') || params.get('reference');

    if (!paymentId) {
      // No payment_id — user may have cancelled
      setStatus('error');
      setMessage('Payment was cancelled or incomplete.');
      setTimeout(() => navigate('/settings?tab=billing'), 3000);
      return;
    }

    subscriptionApi.verifyPayment(paymentId)
      .then(res => {
        const data = res.data.data;

        if (data?.status === 'succeeded' || data?.status === 'success') {
          // Update org status in auth store so gate reflects new status immediately
          setAuth({
            user,
            token,
            permissions,
            org: { ...useAuthStore.getState().org, subscription_status: 'active' },
          });
          setStatus('success');
          toast.success('Subscription activated! Welcome aboard.');
          setTimeout(() => navigate('/dashboard'), 2500);
        } else {
          setStatus('error');
          setMessage('Payment is still processing. Your subscription will activate shortly.');
          setTimeout(() => navigate('/settings?tab=billing'), 4000);
        }
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Verification failed.';
        setStatus('error');
        setMessage(msg);
        setTimeout(() => navigate('/settings?tab=billing'), 4000);
      });
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-page)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{
          width: 52, height: 52, background: 'var(--brand)', borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="26" height="26" viewBox="0 0 18 18" fill="none">
            <path d="M3 14V8l6-5 6 5v6H11v-4H7v4H3Z" fill="white"/>
          </svg>
        </div>

        {status === 'verifying' && (
          <>
            <div style={{
              width: 32, height: 32, border: '3px solid var(--border-base)',
              borderTopColor: 'var(--brand)', borderRadius: '50%',
              animation: 'spin .7s linear infinite', margin: '0 auto 16px',
            }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-base)', margin: '0 0 8px' }}>
              Verifying your payment…
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Please wait while we confirm your subscription.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--s-green-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="var(--s-green-text)" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-base)', margin: '0 0 8px' }}>
              Subscription Activated!
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Welcome to Cierlo HMS. Redirecting to your dashboard…
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--s-yellow-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="var(--s-yellow-text)" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-base)', margin: '0 0 8px' }}>
              Payment Incomplete
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {message}
            </p>
            <button
              onClick={() => navigate('/settings?tab=billing')}
              style={{
                padding: '9px 24px', background: 'var(--brand)',
                border: 'none', borderRadius: 7, color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Back to Billing
            </button>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
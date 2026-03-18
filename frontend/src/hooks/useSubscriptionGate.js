// src/hooks/useSubscriptionGate.js
//
// Returns whether the current org is locked out of write operations.
// Use this in pages/forms to show paywall instead of forms.
//
// Usage:
//   const { isLocked, isSuspended, daysLeft, status } = useSubscriptionGate();

import { useAuthStore } from '../store/authStore';

const daysBetween = (a, b) =>
  Math.ceil((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));

export function useSubscriptionGate() {
  const org = useAuthStore(s => s.org);

  if (!org) return { isLocked: false, isSuspended: false, daysLeft: null, status: 'active' };

  const { subscription_status, trial_ends_at } = org;

  const now      = new Date();
  const trialEnd = trial_ends_at ? new Date(trial_ends_at) : null;
  const daysLeft = trialEnd ? daysBetween(now, trialEnd) : null;

  // Fully blocked — can't even read
  const isSuspended = subscription_status === 'suspended' || subscription_status === 'inactive';

  // Soft locked — reads work, writes don't
  const isLocked = isSuspended ||
    subscription_status === 'soft_locked' ||
    subscription_status === 'past_due';

  // On trial but days are running low (for banner display)
  const isTrialWarning = subscription_status === 'trial' && daysLeft !== null && daysLeft <= 4;

  return {
    status:          subscription_status,
    isLocked,
    isSuspended,
    isActive:        subscription_status === 'active',
    isTrial:         subscription_status === 'trial',
    isTrialWarning,
    daysLeft,
  };
}
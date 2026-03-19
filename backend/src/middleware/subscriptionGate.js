// src/middleware/subscriptionGate.js
//
// Applied AFTER authenticate middleware on all tenant routes.
// Checks the org's subscription_status and blocks write operations
// when trial has expired — read operations still work (soft lock).
//
// Status flow:
//   trial       → full access
//   active      → full access
//   soft_locked → GET allowed, POST/PUT/PATCH/DELETE blocked
//   past_due    → GET allowed, writes blocked
//   suspended   → all requests blocked (subscribe screen only)
//   inactive    → all requests blocked

import { supabase }     from '../config/supabase.js';
import { sendForbidden } from '../utils/response.js';

// Routes that are always allowed regardless of subscription status
// (billing, auth, logout, subscription management)
const ALWAYS_ALLOWED = [
  '/api/v1/auth',
  '/api/v1/subscriptions',
  '/api/v1/config',        // they need to see hotel config
  '/api/v1/notifications', // notifications still work
];

const isAlwaysAllowed = (path) =>
  ALWAYS_ALLOWED.some(prefix => path.startsWith(prefix));

// Cache subscription status per org to avoid DB hit on every request
// Cache for 5 minutes — job updates status daily so this is fine
const statusCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function getOrgStatus(orgId) {
  const cached = statusCache.get(orgId);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return cached.status;
  }

  const { data } = await supabase
    .from('organizations')
    .select('subscription_status, trial_ends_at')
    .eq('id', orgId)
    .single();

  const status = data?.subscription_status || 'trial';
  statusCache.set(orgId, { status, at: Date.now() });
  return status;
}

export function clearStatusCache(orgId) {
  statusCache.delete(orgId);
}

export const subscriptionGate = async (req, res, next) => {
  // Skip for super-admin routes — they have no org
  if (!req.orgId) return next();

  // Skip always-allowed routes
  if (isAlwaysAllowed(req.path)) return next();

  try {
    const status = await getOrgStatus(req.orgId);

    // Full access
    if (status === 'trial' || status === 'active') {
      return next();
    }

    // Soft locked / past due — reads only
    if (status === 'soft_locked' || status === 'past_due') {
      if (req.method === 'GET') return next();

      return sendForbidden(res,
        'Your free trial has ended. Please subscribe to continue using Cierlo HMS. ' +
        'Go to Settings → Billing to activate your subscription.'
      );
    }

    // Suspended / inactive — nothing works
    if (status === 'suspended' || status === 'inactive') {
      return sendForbidden(res,
        'Your account has been suspended. Please subscribe to reactivate your account.'
      );
    }

    // Unknown status — allow through (fail open, not closed)
    return next();

  } catch (err) {
    // If we can't check subscription status, fail open
    // (better to let a request through than block a paying customer)
    console.error('[SubscriptionGate] Error checking org status:', err.message);
    return next();
  }
};
// src/services/subscriptionService.js

import DodoPayments          from 'dodopayments';
import { Webhook }           from 'standardwebhooks';
import { supabase }          from '../config/supabase.js';
import { env }               from '../config/env.js';
import { AppError }          from '../middleware/errorHandler.js';

// Calculates period end based on the plan's billing interval.
// Falls back to monthly if the interval is unrecognised.
const calcPeriodEnd = (from, interval) => {
  const end = new Date(from);
  switch (interval) {
    case 'yearly':
    case 'annual':
      end.setFullYear(end.getFullYear() + 1);
      break;
    case 'weekly':
      end.setDate(end.getDate() + 7);
      break;
    case 'monthly':
    default:
      end.setMonth(end.getMonth() + 1);
      break;
  }
  return end;
};

const dodo = new DodoPayments({
  bearerToken: env.DODO_PAYMENTS_API_KEY,
  environment: env.DODO_PAYMENTS_ENVIRONMENT,
});

// ── Plans ──────────────────────────────────────────────────────

export const getPlans = async () => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('created_at');

  // Return empty array instead of throwing — frontend handles empty state
  if (error) throw new AppError('Failed to fetch subscription plans.', 500);
  return data || [];
};

export const getPlanById = async (planId) => {
  if (planId) {
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .maybeSingle();
    if (data) return data;
  }
  // Default to monthly
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .eq('interval', 'monthly')
    .single();
  if (error || !data) throw new AppError('No active subscription plan found.', 404);
  return data;
};

export const getActivePlan = () => getPlanById(null);

// ── Subscription status ────────────────────────────────────────

export const getOrgSubscription = async (orgId) => {
  const { data } = await supabase
    .from('org_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('org_id', orgId)
    .maybeSingle();

  const now = new Date();

  if (!data) {
    // No subscription record at all — org is in trial
    // Get trial end from the org itself
    const { data: org } = await supabase
      .from('organizations')
      .select('trial_ends_at, status')
      .eq('id', orgId)
      .single();

    const trialEnd  = org?.trial_ends_at ? new Date(org.trial_ends_at) : null;
    const isExpired = trialEnd ? now > trialEnd : false;

    return {
      status:        isExpired ? 'soft_locked' : 'trial',
      subscription_context: 'never_subscribed', // ← key for frontend messaging
      trial_end:     org?.trial_ends_at || null,
      is_expired:    isExpired,
      plan:          null,
    };
  }

  const trialEnd  = data.trial_end ? new Date(data.trial_end) : null;
  const isExpired = data.status === 'trial' && trialEnd && now > trialEnd;

  // Determine context for frontend messaging
  let subscription_context = 'never_subscribed';
  if (data.status === 'active')                subscription_context = 'active';
  else if (data.status === 'cancelled')        subscription_context = 'previously_subscribed';
  else if (data.status === 'past_due')         subscription_context = 'previously_subscribed';
  else if (data.status === 'trial' && isExpired) subscription_context = 'trial_expired';
  else if (data.status === 'trial')            subscription_context = 'in_trial';

  return {
    ...data,
    subscription_context,
    is_expired: isExpired,
  };
};

// ── Initialize checkout ────────────────────────────────────────

export const initializeSubscription = async (orgId, adminEmail, adminName, planId = null) => {
  if (!env.DODO_PAYMENTS_API_KEY) throw new AppError('Payment gateway not configured.', 503);

  // Use selected plan or default to monthly
  const plan = await getPlanById(planId);

  if (!plan.dodo_product_id) {
    throw new AppError(
      'Subscription product not configured. Set the Dodo product ID on the plan in the database.',
      503
    );
  }

  const session = await dodo.payments.create({
    payment_link: true,
    customer: { email: adminEmail, name: adminName || 'Admin' },
    product_cart: [{ product_id: plan.dodo_product_id, quantity: 1 }],
    metadata: { org_id: orgId, plan_id: plan.id },
    return_url: `${env.FRONTEND_URL}/billing/callback`,
  });

  if (!session?.payment_link) throw new AppError('Failed to create checkout session.', 500);

  return {
    checkout_url: session.payment_link,
    payment_id:   session.payment_id,
    plan: {
      name:     plan.name,
      amount:   plan.amount,
      currency: plan.currency,
      interval: plan.interval,
    },
  };
};

// ── Verify payment ─────────────────────────────────────────────

export const verifyPayment = async (paymentId) => {
  if (!paymentId) throw new AppError('Payment ID required.', 400);
  const payment = await dodo.payments.retrieve(paymentId);
  if (!payment) throw new AppError('Payment not found.', 404);

  const orgId  = payment.metadata?.org_id;
  const planId = payment.metadata?.plan_id;
  if (!orgId) throw new AppError('Invalid payment metadata.', 400);

  if (payment.status === 'succeeded') {
    await activateOrgSubscription({
      orgId, planId,
      dodoPaymentId:      payment.payment_id,
      dodoCustomerId:     payment.customer?.customer_id,
      dodoSubscriptionId: payment.subscription_id || null,
      amount:             payment.total_amount,
      currency:           payment.currency,
    });
  }
  return { status: payment.status, org_id: orgId };
};

// ── Webhook handler ────────────────────────────────────────────

export const handleWebhook = async (rawBody, webhookHeaders) => {
  if (!env.DODO_PAYMENTS_WEBHOOK_SECRET) throw new AppError('Webhook secret not configured.', 500);

  const wh = new Webhook(env.DODO_PAYMENTS_WEBHOOK_SECRET);
  let payload;
  try {
    payload = await wh.verify(rawBody, webhookHeaders);
  } catch {
    throw new AppError('Invalid webhook signature.', 401);
  }

  const { type, data } = payload;
  console.log(`[Dodo Webhook] ${type}`);

  switch (type) {
    case 'payment.succeeded':
      await handlePaymentSucceeded(data); break;
    case 'subscription.active':
    case 'subscription.created':
      await handleSubscriptionActive(data); break;
    case 'subscription.on_hold':
    case 'subscription.failed':
      await handleSubscriptionFailed(data); break;
    case 'subscription.cancelled':
    case 'subscription.expired':
      await handleSubscriptionCancelled(data); break;
    default: break;
  }
  return { received: true };
};

// ── Webhook handlers ───────────────────────────────────────────

async function handlePaymentSucceeded(data) {
  const orgId  = data.metadata?.org_id;
  const planId = data.metadata?.plan_id;
  if (!orgId) return;
  await activateOrgSubscription({
    orgId, planId,
    dodoPaymentId:      data.payment_id,
    dodoCustomerId:     data.customer?.customer_id,
    dodoSubscriptionId: data.subscription_id || null,
    amount:             data.total_amount,
    currency:           data.currency,
  });
}

async function handleSubscriptionActive(data) {
  const { data: sub } = await supabase
    .from('org_subscriptions')
    .select('org_id, plan_id, subscription_plans(interval)')
    .eq('dodo_subscription_id', data.subscription_id)
    .maybeSingle();
  if (!sub?.org_id) return;

  const now = new Date();
  const planInterval = sub.subscription_plans?.interval || 'monthly';
  const periodEnd = calcPeriodEnd(now, planInterval);

  await supabase.from('org_subscriptions').update({
    status:               'active',
    current_period_start: now.toISOString(),
    current_period_end:   periodEnd.toISOString(),
    updated_at:           now.toISOString(),
  }).eq('org_id', sub.org_id);

  await supabase.from('organizations').update({
    status:     'active',
    updated_at: now.toISOString(),
  }).eq('id', sub.org_id);
}

async function handleSubscriptionFailed(data) {
  const { data: sub } = await supabase
    .from('org_subscriptions')
    .select('org_id')
    .eq('dodo_subscription_id', data.subscription_id)
    .maybeSingle();
  if (!sub?.org_id) return;

  await supabase.from('org_subscriptions').update({
    status:     'past_due',
    updated_at: new Date().toISOString(),
  }).eq('org_id', sub.org_id);

  await supabase.from('organizations').update({
    status:     'suspended',
    updated_at: new Date().toISOString(),
  }).eq('id', sub.org_id);
}

async function handleSubscriptionCancelled(data) {
  const { data: sub } = await supabase
    .from('org_subscriptions')
    .select('org_id')
    .eq('dodo_subscription_id', data.subscription_id)
    .maybeSingle();
  if (!sub?.org_id) return;

  await supabase.from('org_subscriptions').update({
    status:       'cancelled',
    cancelled_at: new Date().toISOString(),
    updated_at:   new Date().toISOString(),
  }).eq('org_id', sub.org_id);

  await supabase.from('organizations').update({
    status:     'inactive',
    updated_at: new Date().toISOString(),
  }).eq('id', sub.org_id);
}

async function activateOrgSubscription({
  orgId, planId, dodoPaymentId, dodoCustomerId, dodoSubscriptionId, amount, currency,
}) {
  const now = new Date();

  // Resolve plan interval so period end is accurate for monthly, yearly, etc.
  let planInterval = 'monthly';
  if (planId) {
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('interval')
      .eq('id', planId)
      .maybeSingle();
    if (plan?.interval) planInterval = plan.interval;
  }

  const periodEnd = calcPeriodEnd(now, planInterval);

  await supabase.from('org_subscriptions').upsert({
    org_id:               orgId,
    plan_id:              planId || null,
    status:               'active',
    dodo_customer_id:     dodoCustomerId  || null,
    dodo_subscription_id: dodoSubscriptionId || null,
    current_period_start: now.toISOString(),
    current_period_end:   periodEnd.toISOString(),
    updated_at:           now.toISOString(),
  }, { onConflict: 'org_id' });

  if (dodoPaymentId) {
    await supabase.from('subscription_payments').upsert({
      org_id:          orgId,
      plan_id:         planId || null,
      amount:          amount   || 0,
      currency:        currency || 'USD',
      status:          'success',
      dodo_payment_id: dodoPaymentId,
      period_start:    now.toISOString(),
      period_end:      periodEnd.toISOString(),
      paid_at:         now.toISOString(),
    }, { onConflict: 'dodo_payment_id' });
  }

  await supabase.from('organizations').update({
    status:     'active',
    updated_at: now.toISOString(),
  }).eq('id', orgId);
}

// ── Cancel ─────────────────────────────────────────────────────

export const cancelSubscription = async (orgId, reason = '') => {
  const { data: sub } = await supabase
    .from('org_subscriptions')
    .select('dodo_subscription_id')
    .eq('org_id', orgId)
    .maybeSingle();

  if (!sub?.dodo_subscription_id) throw new AppError('No active subscription found.', 404);

  await dodo.subscriptions.update(sub.dodo_subscription_id, { status: 'cancelled' });

  await supabase.from('org_subscriptions').update({
    status:        'cancelled',
    cancelled_at:  new Date().toISOString(),
    cancel_reason: reason,
    updated_at:    new Date().toISOString(),
  }).eq('org_id', orgId);

  return { success: true };
};

// ── Customer portal ────────────────────────────────────────────

export const getCustomerPortalUrl = async (orgId) => {
  const { data: sub } = await supabase
    .from('org_subscriptions')
    .select('dodo_customer_id')
    .eq('org_id', orgId)
    .maybeSingle();

  if (!sub?.dodo_customer_id) throw new AppError('No subscription found. Please subscribe first.', 404);

  const portal = await dodo.customers.customerPortal.create(sub.dodo_customer_id);
  return { url: portal.link };
};

// ── Payment history ────────────────────────────────────────────

export const getPaymentHistory = async (orgId) => {
  const { data, error } = await supabase
    .from('subscription_payments')
    .select('*, subscription_plans(name, interval)')
    .eq('org_id', orgId)
    .order('paid_at', { ascending: false });

  if (error) throw new AppError('Failed to fetch payment history.', 500);
  return data || [];
};
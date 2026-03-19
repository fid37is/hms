// src/services/subscriptionService.js
//
// Subscription billing via Dodo Payments.
//
// Setup (one-time, in Dodo dashboard):
//   1. Create a Product → copy its product_id → set DODO_PRODUCT_ID in .env
//   2. Create a Webhook endpoint pointing to /api/v1/subscriptions/webhook/dodo
//      → copy the webhook secret → set DODO_PAYMENTS_WEBHOOK_SECRET in .env
//
// Flow:
//   Org admin clicks "Subscribe" → backend creates a checkout session
//   → frontend redirects to Dodo hosted checkout
//   → on payment, Dodo fires webhook → we activate the org subscription

import DodoPayments          from 'dodopayments';
import { Webhook }           from 'standardwebhooks';
import { supabase }          from '../config/supabase.js';
import { env }               from '../config/env.js';
import { AppError }          from '../middleware/errorHandler.js';

// Dodo client (singleton)
const dodo = new DodoPayments({
  bearerToken: env.DODO_PAYMENTS_API_KEY,
  environment: env.DODO_PAYMENTS_ENVIRONMENT, // 'test_mode' | 'live_mode'
});

// Get all active plans (monthly + annual)
export const getPlans = async () => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('created_at');
  if (error || !data?.length) throw new AppError('No subscription plans found.', 404);
  return data;
};

// Get a specific plan by id, or fall back to monthly
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
  // Default to monthly plan
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .eq('interval', 'monthly')
    .single();
  if (error || !data) throw new AppError('No active subscription plan found.', 404);
  return data;
};

// Kept for backward compatibility
export const getActivePlan = () => getPlanById(null);

// Get org subscription status
export const getOrgSubscription = async (orgId) => {
  const { data } = await supabase
    .from('org_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('org_id', orgId)
    .maybeSingle();

  if (!data) {
    const plan = await getPlanById(planId);
    return { status: 'trial', plan, is_expired: false };
  }
  const now      = new Date();
  const trialEnd = data.trial_end ? new Date(data.trial_end) : null;
  const isExpired = data.status === 'trial' && trialEnd && now > trialEnd;
  return { ...data, is_expired: isExpired };
};

// Create Dodo checkout session - returns checkout_url to redirect user to
export const initializeSubscription = async (orgId, adminEmail, adminName, planId = null) => {
  if (!env.DODO_PAYMENTS_API_KEY) throw new AppError('Payment gateway not configured.', 503);

  const plan = await getActivePlan();

  if (!plan.dodo_product_id) {
    throw new AppError('Subscription product not configured. Set the Dodo product ID on the plan in the database.', 503);
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
    plan: { name: plan.name, amount: plan.amount, currency: plan.currency, interval: plan.interval },
  };
};

// Verify payment after redirect (fallback — webhooks are primary)
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
      dodoPaymentId:     payment.payment_id,
      dodoCustomerId:    payment.customer?.customer_id,
      dodoSubscriptionId: payment.subscription_id || null,
      amount:   payment.total_amount,
      currency: payment.currency,
    });
  }
  return { status: payment.status, org_id: orgId };
};

// Handle Dodo webhook - uses Standard Webhooks spec for verification
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

async function handlePaymentSucceeded(data) {
  const orgId  = data.metadata?.org_id;
  const planId = data.metadata?.plan_id;
  if (!orgId) return;
  await activateOrgSubscription({
    orgId, planId,
    dodoPaymentId:     data.payment_id,
    dodoCustomerId:    data.customer?.customer_id,
    dodoSubscriptionId: data.subscription_id || null,
    amount:   data.total_amount,
    currency: data.currency,
  });
}

async function handleSubscriptionActive(data) {
  const { data: sub } = await supabase
    .from('org_subscriptions').select('org_id')
    .eq('dodo_subscription_id', data.subscription_id).maybeSingle();
  if (!sub?.org_id) return;

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await supabase.from('org_subscriptions').update({
    status: 'active', current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(), updated_at: now.toISOString(),
  }).eq('org_id', sub.org_id);
  await supabase.from('organizations').update({ status: 'active', updated_at: now.toISOString() }).eq('id', sub.org_id);
}

async function handleSubscriptionFailed(data) {
  const { data: sub } = await supabase
    .from('org_subscriptions').select('org_id')
    .eq('dodo_subscription_id', data.subscription_id).maybeSingle();
  if (!sub?.org_id) return;
  await supabase.from('org_subscriptions').update({ status: 'past_due', updated_at: new Date().toISOString() }).eq('org_id', sub.org_id);
  await supabase.from('organizations').update({ status: 'suspended', updated_at: new Date().toISOString() }).eq('id', sub.org_id);
}

async function handleSubscriptionCancelled(data) {
  const { data: sub } = await supabase
    .from('org_subscriptions').select('org_id')
    .eq('dodo_subscription_id', data.subscription_id).maybeSingle();
  if (!sub?.org_id) return;
  await supabase.from('org_subscriptions').update({
    status: 'cancelled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq('org_id', sub.org_id);
  await supabase.from('organizations').update({ status: 'inactive', updated_at: new Date().toISOString() }).eq('id', sub.org_id);
}

async function activateOrgSubscription({ orgId, planId, dodoPaymentId, dodoCustomerId, dodoSubscriptionId, amount, currency }) {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await supabase.from('org_subscriptions').upsert({
    org_id: orgId, plan_id: planId, status: 'active',
    dodo_customer_id: dodoCustomerId || null,
    dodo_subscription_id: dodoSubscriptionId || null,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    updated_at: now.toISOString(),
  }, { onConflict: 'org_id' });

  if (dodoPaymentId) {
    await supabase.from('subscription_payments').upsert({
      org_id: orgId, plan_id: planId, amount: amount || 0, currency: currency || 'USD',
      status: 'success', dodo_payment_id: dodoPaymentId,
      period_start: now.toISOString(), period_end: periodEnd.toISOString(), paid_at: now.toISOString(),
    }, { onConflict: 'dodo_payment_id' });
  }

  await supabase.from('organizations').update({ status: 'active', updated_at: now.toISOString() }).eq('id', orgId);
}

// Cancel subscription
export const cancelSubscription = async (orgId, reason = '') => {
  const { data: sub } = await supabase
    .from('org_subscriptions').select('dodo_subscription_id').eq('org_id', orgId).maybeSingle();
  if (!sub?.dodo_subscription_id) throw new AppError('No active subscription found.', 404);

  await dodo.subscriptions.update(sub.dodo_subscription_id, { status: 'cancelled' });
  await supabase.from('org_subscriptions').update({
    status: 'cancelled', cancelled_at: new Date().toISOString(),
    cancel_reason: reason, updated_at: new Date().toISOString(),
  }).eq('org_id', orgId);
  return { success: true };
};

// Customer portal - self-service subscription management
export const getCustomerPortalUrl = async (orgId) => {
  const { data: sub } = await supabase
    .from('org_subscriptions').select('dodo_customer_id').eq('org_id', orgId).maybeSingle();
  if (!sub?.dodo_customer_id) throw new AppError('No subscription found. Please subscribe first.', 404);
  const portal = await dodo.customers.customerPortal.create(sub.dodo_customer_id);
  return { url: portal.link };
};

// Payment history
export const getPaymentHistory = async (orgId) => {
  const { data, error } = await supabase
    .from('subscription_payments')
    .select('*, subscription_plans(name, interval)')
    .eq('org_id', orgId)
    .order('paid_at', { ascending: false });
  if (error) throw new AppError('Failed to fetch payment history.', 500);
  return data || [];
};
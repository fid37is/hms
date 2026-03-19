// src/controllers/subscriptionController.js

import * as subscriptionService from '../services/subscriptionService.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Tenant-facing -------------------------------------------

export const getPlan = async (req, res, next) => {
  try {
    return sendSuccess(res, await subscriptionService.getActivePlan());
  } catch (err) { next(err); }
};

export const getAllPlans = async (req, res, next) => {
  try {
    return sendSuccess(res, await subscriptionService.getPlans());
  } catch (err) { next(err); }
};

export const getMySubscription = async (req, res, next) => {
  try {
    return sendSuccess(res, await subscriptionService.getOrgSubscription(req.orgId));
  } catch (err) { next(err); }
};

export const initializePayment = async (req, res, next) => {
  try {
    const { email, name, plan_id } = req.body;
    if (!email) return sendError(res, 'Email is required.', 400);
    return sendSuccess(res, await subscriptionService.initializeSubscription(req.orgId, email, name, plan_id));
  } catch (err) { next(err); }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { payment_id } = req.query;
    if (!payment_id) return sendError(res, 'payment_id is required.', 400);
    return sendSuccess(res, await subscriptionService.verifyPayment(payment_id), 'Payment verified.');
  } catch (err) { next(err); }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    return sendSuccess(res, await subscriptionService.cancelSubscription(req.orgId, req.body.reason), 'Subscription cancelled.');
  } catch (err) { next(err); }
};

export const getCustomerPortal = async (req, res, next) => {
  try {
    return sendSuccess(res, await subscriptionService.getCustomerPortalUrl(req.orgId));
  } catch (err) { next(err); }
};

export const getPaymentHistory = async (req, res, next) => {
  try {
    return sendSuccess(res, await subscriptionService.getPaymentHistory(req.orgId));
  } catch (err) { next(err); }
};

// Dodo Webhook (public - no JWT) --------------------------
// Dodo uses Standard Webhooks: webhook-id, webhook-signature, webhook-timestamp headers
export const dodoWebhook = async (req, res) => {
  try {
    const webhookHeaders = {
      'webhook-id':        req.headers['webhook-id']        || '',
      'webhook-signature': req.headers['webhook-signature'] || '',
      'webhook-timestamp': req.headers['webhook-timestamp'] || '',
    };
    await subscriptionService.handleWebhook(req.rawBody, webhookHeaders);
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Dodo Webhook Error]', err.message);
    // Always return 200 to prevent Dodo from retrying indefinitely
    return res.status(200).json({ received: true });
  }
};
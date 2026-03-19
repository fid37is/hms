// src/lib/api/subscriptionApi.js
// Tenant-facing subscription endpoints

import api from '../axios';

export const getActivePlan     = ()          => api.get('/subscriptions/plan');
export const getAllPlans       = ()          => api.get('/subscriptions/plans');
export const getMySubscription = ()          => api.get('/subscriptions/my');
export const initializePayment = (data)      => api.post('/subscriptions/initialize', data);
export const verifyPayment     = (reference) => api.get(`/subscriptions/verify?reference=${reference}`);
export const cancelSubscription = (reason)  => api.post('/subscriptions/cancel', { reason });
export const getPaymentHistory   = ()        => api.get('/subscriptions/payments');
export const getCustomerPortal   = ()        => api.get('/subscriptions/portal');
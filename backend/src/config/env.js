// src/config/env.js

import 'dotenv/config';

const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key, defaultValue = '') => {
  return process.env[key] || defaultValue;
};

export const env = {
  PORT:     optional('PORT', '3000'),
  NODE_ENV: optional('NODE_ENV', 'development'),
  isDev:    optional('NODE_ENV', 'development') === 'development',
  isProd:   optional('NODE_ENV', 'development') === 'production',

  SUPABASE_URL:              required('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),
  SUPABASE_ANON_KEY:         required('SUPABASE_ANON_KEY'),

  JWT_SECRET:             required('JWT_SECRET'),
  JWT_EXPIRES_IN:         optional('JWT_EXPIRES_IN', '8h'),
  JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '30d'),

  PAYSTACK_SECRET_KEY:    optional('PAYSTACK_SECRET_KEY'),
  PAYSTACK_PUBLIC_KEY:    optional('PAYSTACK_PUBLIC_KEY'),
  FLUTTERWAVE_SECRET_KEY: optional('FLUTTERWAVE_SECRET_KEY'),

  // Dodo Payments
  DODO_PAYMENTS_API_KEY:      optional('DODO_PAYMENTS_API_KEY'),
  DODO_PAYMENTS_WEBHOOK_SECRET: optional('DODO_PAYMENTS_WEBHOOK_SECRET'),
  DODO_PAYMENTS_ENVIRONMENT:  optional('DODO_PAYMENTS_ENVIRONMENT', 'test_mode'),

  SMTP_HOST:  optional('SMTP_HOST'),
  SMTP_PORT:  optional('SMTP_PORT', '587'),
  SMTP_USER:  optional('SMTP_USER'),
  SMTP_PASS:  optional('SMTP_PASS'),
  EMAIL_FROM: optional('EMAIL_FROM', 'noreply@hms.com'),

  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:5173'),

  WEBSITE_BASE_DOMAIN: optional('WEBSITE_BASE_DOMAIN', 'miravance.io'),
  DEV_ORG_ID:          optional('DEV_ORG_ID', ''),
};
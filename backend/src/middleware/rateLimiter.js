// src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, message: 'Too many requests. Please try again later.' },
});

// Super-admin login: 5 attempts per 15 minutes per IP.
// Intentionally strict — this endpoint should never see legitimate
// high-frequency traffic. A lockout here is a feature, not a bug.
export const superAdminLoginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts toward the limit
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
});

export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, message: 'Too many booking attempts. Please try again in an hour.' },
});

export const availabilityLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, message: 'Too many availability requests. Please slow down.' },
});
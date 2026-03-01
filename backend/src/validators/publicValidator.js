// src/validators/publicValidator.js
//
// Public-facing validators for guest booking flow.
// Mirrors your Joi patterns from authValidator.js and reservationValidator.js.

import Joi from 'joi';

// ─── Availability search ──────────────────────────────────────────────────────
// GET /api/v1/public/rooms/availability?check_in=&check_out=&guests=&type_id=
export const publicAvailabilitySchema = Joi.object({
  check_in: Joi.string()
    .isoDate()
    .required()
    .messages({
      'string.isoDate': 'check_in must be a valid date (YYYY-MM-DD).',
      'any.required':   'check_in date is required.',
    }),

  check_out: Joi.string()
    .isoDate()
    .required()
    .messages({
      'string.isoDate': 'check_out must be a valid date (YYYY-MM-DD).',
      'any.required':   'check_out date is required.',
    }),

  guests: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .default(1),

  type_id: Joi.string()
    .uuid()
    .optional(),
});

// ─── Guest booking creation ───────────────────────────────────────────────────
// POST /api/v1/public/reservations
export const publicCreateReservationSchema = Joi.object({
  // Dates
  check_in:  Joi.string().isoDate().required().messages({
    'any.required': 'Check-in date is required.',
  }),
  check_out: Joi.string().isoDate().required().messages({
    'any.required': 'Check-out date is required.',
  }),

  // Room selection
  room_type_id: Joi.string().uuid().required().messages({
    'any.required': 'Please select a room type.',
  }),
  rate_plan_id: Joi.string().uuid().optional(),

  // Guest details (collected at booking — no account required)
  guest: Joi.object({
    first_name: Joi.string().trim().min(1).max(50).required().messages({
      'any.required': 'First name is required.',
    }),
    last_name: Joi.string().trim().min(1).max(50).required().messages({
      'any.required': 'Last name is required.',
    }),
    email: Joi.string().email().lowercase().trim().required().messages({
      'string.email':  'Please provide a valid email address.',
      'any.required':  'Email is required.',
    }),
    phone: Joi.string().trim().min(7).max(20).required().messages({
      'any.required': 'Phone number is required.',
    }),
  }).required(),

  // Optional
  adults:          Joi.number().integer().min(1).max(10).default(1),
  children:        Joi.number().integer().min(0).max(10).default(0),
  special_requests: Joi.string().trim().max(500).optional().allow(''),
});

// ─── Guest cancellation ───────────────────────────────────────────────────────
// PATCH /api/v1/public/reservations/:id/cancel
export const publicCancelReservationSchema = Joi.object({
  reason: Joi.string().trim().max(300).optional().allow(''),
});

// ─── Guest payment ────────────────────────────────────────────────────────────
// POST /api/v1/public/folio/:id/payments
export const publicAddPaymentSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required().messages({
    'any.required': 'Payment amount is required.',
    'number.positive': 'Payment amount must be greater than zero.',
  }),
  payment_method: Joi.string()
    .valid('card', 'bank_transfer', 'mobile_money')
    .required()
    .messages({
      'any.only':    'Payment method must be card, bank_transfer, or mobile_money.',
      'any.required': 'Payment method is required.',
    }),
  // Payment gateway transaction reference (e.g. Stripe/Paystack charge ID)
  transaction_ref: Joi.string().trim().required().messages({
    'any.required': 'Transaction reference is required.',
  }),
  currency: Joi.string().length(3).uppercase().default('NGN'),
});
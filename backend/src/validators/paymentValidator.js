// src/validators/paymentValidator.js

import Joi from 'joi';

export const addChargeSchema = Joi.object({
  description: Joi.string().trim().required(),
  quantity:    Joi.number().integer().min(1).default(1),
  unit_price:  Joi.number().integer().min(0).required(),
  department:  Joi.string()
    .valid('room', 'food', 'beverage', 'laundry', 'spa', 'transport', 'minibar', 'telephone', 'other')
    .default('other'),
  amount:      Joi.number().integer().min(0).optional(), // computed by service, accepted but not required
  tax_amount:  Joi.number().integer().min(0).optional(),
});

export const voidChargeSchema = Joi.object({
  reason: Joi.string().trim().required().messages({
    'any.required': 'Void reason is required.',
  }),
});

export const addPaymentSchema = Joi.object({
  amount:    Joi.number().integer().min(1).required(),
  method:    Joi.string()
    .valid('cash', 'card', 'bank_transfer', 'mobile_money', 'room_charge', 'complimentary', 'other')
    .required(),
  reference: Joi.string().trim().optional().allow('', null),
  notes:     Joi.string().trim().optional().allow('', null),
});

export const refundPaymentSchema = Joi.object({
  reason: Joi.string().trim().required().messages({
    'any.required': 'Refund reason is required.',
  }),
});

export const openShiftSchema = Joi.object({
  opening_balance: Joi.number().integer().min(0).default(0),
});

export const closeShiftSchema = Joi.object({
  closing_balance: Joi.number().integer().min(0).required(),
  notes:           Joi.string().trim().optional().allow('', null),
});
// src/validators/guestValidator.js

import Joi from 'joi';

export const createGuestSchema = Joi.object({
  full_name:    Joi.string().trim().required(),
  email:        Joi.string().email().lowercase().trim().optional().allow('', null),
  phone:        Joi.string().trim().optional().allow('', null),
  nationality:  Joi.string().trim().optional().allow('', null),
  id_type:      Joi.string()
    .valid('passport', 'national_id', 'nin', 'drivers_license', 'voters_card', 'residence_permit', 'other')
    .optional()
    .allow(null),
  id_number:      Joi.string().trim().optional().allow('', null),
  category:       Joi.string()
    .valid('regular', 'vip', 'corporate', 'blacklisted')
    .default('regular'),
  company_name:   Joi.string().trim().optional().allow('', null),
  preferences:    Joi.object().optional().default({}),
  notes:          Joi.string().trim().optional().allow('', null),
});

export const updateGuestSchema = Joi.object({
  full_name:      Joi.string().trim().optional(),
  email:          Joi.string().email().lowercase().trim().optional().allow('', null),
  phone:          Joi.string().trim().optional().allow('', null),
  nationality:    Joi.string().trim().optional().allow('', null),
  id_type:        Joi.string()
    .valid('passport', 'national_id', 'nin', 'drivers_license', 'voters_card', 'residence_permit', 'other')
    .optional()
    .allow(null),
  id_number:      Joi.string().trim().optional().allow('', null),
  category:       Joi.string()
    .valid('regular', 'vip', 'corporate', 'blacklisted')
    .optional(),
  company_name:   Joi.string().trim().optional().allow('', null),
  preferences:    Joi.object().optional(),
  notes:          Joi.string().trim().optional().allow('', null),
});

export const flagGuestSchema = Joi.object({
  category: Joi.string()
    .valid('regular', 'vip', 'corporate', 'blacklisted')
    .required(),
  notes: Joi.string().trim().optional().allow('', null),
});

export const loyaltyPointsSchema = Joi.object({
  points:    Joi.number().integer().min(1).required(),
  operation: Joi.string().valid('add', 'deduct').default('add'),
});
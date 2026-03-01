// src/validators/configValidator.js

import Joi from 'joi';

const configFields = {
  hotel_name:      Joi.string().trim(),
  address:         Joi.string().trim().allow('', null),
  phone:           Joi.string().trim().allow('', null),
  email:           Joi.string().email().lowercase().allow('', null),
  logo_url:        Joi.string().uri().allow('', null),
  primary_color:   Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow('', null),
  currency:        Joi.string().length(3).uppercase(),
  currency_symbol: Joi.string().trim(),
  tax_rate:        Joi.number().min(0).max(100),
  service_charge:  Joi.number().min(0).max(100),
  timezone:        Joi.string().trim(),
  check_in_time:   Joi.string().pattern(/^\d{2}:\d{2}$/),
  check_out_time:  Joi.string().pattern(/^\d{2}:\d{2}$/),
  receipt_footer:  Joi.string().trim().allow('', null),
};

export const initConfigSchema = Joi.object({
  hotel_name: Joi.string().trim().required(),
  ...Object.fromEntries(
    Object.entries(configFields).filter(([k]) => k !== 'hotel_name')
  ),
});

export const updateConfigSchema = Joi.object(configFields).min(1);
// src/validators/guestAccountValidator.js
import Joi from 'joi';

export const guestRegisterSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Full name is required.',
    'string.min':   'Name must be at least 2 characters.',
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email':  'Please enter a valid email address.',
    'any.required':  'Email is required.',
  }),
  phone: Joi.string().trim().min(7).max(20).optional().allow('', null),
  password: Joi.string().min(8).required().messages({
    'string.min':   'Password must be at least 8 characters.',
    'any.required': 'Password is required.',
  }),
  confirm_password: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only':     'Passwords do not match.',
    'any.required': 'Please confirm your password.',
  }),
});

export const guestLoginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'any.required': 'Email is required.',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required.',
  }),
});

export const guestRefreshSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    'any.required': 'Refresh token is required.',
  }),
});
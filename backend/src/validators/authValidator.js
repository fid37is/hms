// src/validators/authValidator.js

import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address.',
      'any.required': 'Email is required.',
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min':   'Password must be at least 6 characters.',
      'any.required': 'Password is required.',
    }),
});

export const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required.',
    }),
});

export const changePasswordSchema = Joi.object({
  current_password: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required.',
    }),

  new_password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min':   'New password must be at least 8 characters.',
      'any.required': 'New password is required.',
    }),

  confirm_password: Joi.string()
    .valid(Joi.ref('new_password'))
    .required()
    .messages({
      'any.only':     'Passwords do not match.',
      'any.required': 'Please confirm your new password.',
    }),
});

export const registerOrgSchema = Joi.object({
  org_name:       Joi.string().trim().min(2).max(100).required(),
  admin_name:     Joi.string().trim().min(2).max(100).required(),
  admin_email:    Joi.string().email().required(),
  admin_password: Joi.string().min(8).required(),
});
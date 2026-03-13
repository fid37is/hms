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

// Normal password change — user must prove they know their current password
export const changePasswordSchema = Joi.object({
  current_password: Joi.string()
    .required()
    .messages({ 'any.required': 'Current password is required.' }),

  new_password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min':   'New password must be at least 8 characters.',
      'any.required': 'New password is required.',
    }),

  confirm_password: Joi.string()
    .valid(Joi.ref('new_password'))
    .optional()
    .messages({ 'any.only': 'Passwords do not match.' }),
});

// Force change — user already proved identity at login, JWT is sufficient
// No current_password needed; the backend skips re-verification too
export const forceChangePasswordSchema = Joi.object({
  new_password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min':   'New password must be at least 8 characters.',
      'any.required': 'New password is required.',
    }),

  confirm_password: Joi.string()
    .valid(Joi.ref('new_password'))
    .optional()
    .messages({ 'any.only': 'Passwords do not match.' }),
});

export const registerOrgSchema = Joi.object({
  org_name:       Joi.string().trim().min(2).max(100).required(),
  admin_name:     Joi.string().trim().min(2).max(100).required(),
  admin_email:    Joi.string().email().required(),
  admin_password: Joi.string().min(8).required(),
});
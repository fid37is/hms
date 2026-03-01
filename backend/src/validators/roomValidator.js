// src/validators/roomValidator.js

import Joi from 'joi';

export const createRoomTypeSchema = Joi.object({
  name:          Joi.string().trim().required(),
  description:   Joi.string().trim().optional().allow(''),
  base_rate:     Joi.number().integer().min(0).required(), // in kobo
  max_occupancy: Joi.number().integer().min(1).default(2),
  amenities:     Joi.array().items(Joi.string()).default([]),
  images:        Joi.array().items(Joi.string()).default([]),
});

export const updateRoomTypeSchema = Joi.object({
  name:          Joi.string().trim().optional(),
  description:   Joi.string().trim().optional().allow(''),
  base_rate:     Joi.number().integer().min(0).optional(),
  max_occupancy: Joi.number().integer().min(1).optional(),
  amenities:     Joi.array().items(Joi.string()).optional(),
  images:        Joi.array().items(Joi.string()).optional(),
});

export const createRatePlanSchema = Joi.object({
  room_type_id:  Joi.string().uuid().required(),
  name:          Joi.string().trim().required(),
  rate:          Joi.number().integer().min(0).required(), // in kobo
  valid_from:    Joi.date().iso().optional().allow(null),
  valid_to:      Joi.date().iso().optional().allow(null),
  days_of_week:  Joi.array().items(Joi.number().integer().min(0).max(6)).default([0,1,2,3,4,5,6]),
});

export const updateRatePlanSchema = Joi.object({
  name:         Joi.string().trim().optional(),
  rate:         Joi.number().integer().min(0).optional(),
  valid_from:   Joi.date().iso().optional().allow(null),
  valid_to:     Joi.date().iso().optional().allow(null),
  days_of_week: Joi.array().items(Joi.number().integer().min(0).max(6)).optional(),
  is_active:    Joi.boolean().optional(),
});

export const createRoomSchema = Joi.object({
  number:  Joi.string().trim().required(),
  floor:   Joi.number().integer().min(0).optional().allow(null),
  type_id: Joi.string().uuid().required(),
  notes:   Joi.string().trim().optional().allow(''),
});

export const updateRoomSchema = Joi.object({
  number:  Joi.string().trim().optional(),
  floor:   Joi.number().integer().min(0).optional().allow(null),
  type_id: Joi.string().uuid().optional(),
  notes:   Joi.string().trim().optional().allow(''),
});

export const updateRoomStatusSchema = Joi.object({
  status: Joi.string()
    .valid('available', 'occupied', 'dirty', 'clean', 'out_of_order', 'maintenance')
    .required(),
  notes: Joi.string().trim().optional().allow(''),
});

export const blockRoomSchema = Joi.object({
  reason: Joi.string().trim().required(),
});

export const availabilitySchema = Joi.object({
  check_in:  Joi.date().iso().required(),
  check_out: Joi.date().iso().greater(Joi.ref('check_in')).required().messages({
    'date.greater': 'Check-out date must be after check-in date.',
  }),
  type_id: Joi.string().uuid().optional(),
});
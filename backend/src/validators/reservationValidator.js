// src/validators/reservationValidator.js

import Joi from 'joi';

export const createReservationSchema = Joi.object({
  guest_id:         Joi.string().uuid().required(),
  room_id:          Joi.string().uuid().optional().allow(null),
  room_type_id:     Joi.string().uuid().optional().allow(null),
  check_in_date:    Joi.date().iso().required(),
  check_out_date:   Joi.date().iso().greater(Joi.ref('check_in_date')).required().messages({
    'date.greater': 'Check-out date must be after check-in date.',
  }),
  adults:           Joi.number().integer().min(1).default(1),
  children:         Joi.number().integer().min(0).default(0),
  rate_per_night:   Joi.number().integer().min(0).required(),
  deposit_amount:   Joi.number().integer().min(0).default(0),
  booking_source:   Joi.string()
    .valid('walk_in', 'phone', 'online', 'ota_booking_com', 'ota_expedia', 'corporate', 'referral')
    .default('walk_in'),
  special_requests: Joi.string().trim().optional().allow('', null),
  notes:            Joi.string().trim().optional().allow('', null),
});

export const updateReservationSchema = Joi.object({
  room_id:          Joi.string().uuid().optional().allow(null),
  room_type_id:     Joi.string().uuid().optional().allow(null),
  check_in_date:    Joi.date().iso().optional(),
  check_out_date:   Joi.date().iso().optional(),
  adults:           Joi.number().integer().min(1).optional(),
  children:         Joi.number().integer().min(0).optional(),
  rate_per_night:   Joi.number().integer().min(0).optional(),
  deposit_amount:   Joi.number().integer().min(0).optional(),
  booking_source:   Joi.string()
    .valid('walk_in', 'phone', 'online', 'ota_booking_com', 'ota_expedia', 'corporate', 'referral')
    .optional(),
  special_requests: Joi.string().trim().optional().allow('', null),
  notes:            Joi.string().trim().optional().allow('', null),
});

export const cancelReservationSchema = Joi.object({
  reason: Joi.string().trim().required().messages({
    'any.required': 'Cancellation reason is required.',
  }),
});

export const assignRoomSchema = Joi.object({
  room_id: Joi.string().uuid().required(),
});
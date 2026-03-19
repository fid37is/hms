// src/validators/housekeepingValidator.js

import Joi from 'joi';

export const createTaskSchema = Joi.object({
  room_id:     Joi.string().uuid().required(),
  task_type:   Joi.string().valid('checkout_clean','stayover_clean','deep_clean','turndown','inspection','special_request','maintenance').default('checkout_clean'),
  priority:    Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  assigned_to: Joi.string().uuid().optional().allow(null),
  notes:       Joi.string().trim().optional().allow('', null),
});

export const updateTaskSchema = Joi.object({
  task_type:   Joi.string().valid('checkout_clean','stayover_clean','deep_clean','turndown','inspection','special_request','maintenance').optional(),
  priority:    Joi.string().valid('low', 'normal', 'high', 'urgent').optional(),
  notes:       Joi.string().trim().optional().allow('', null),
});

export const assignTaskSchema = Joi.object({
  assigned_to: Joi.string().uuid().required(),
});

export const completeTaskSchema = Joi.object({
  notes: Joi.string().trim().optional().allow('', null),
});

export const createLostAndFoundSchema = Joi.object({
  item_name:      Joi.string().trim().required(),
  description:    Joi.string().trim().optional().allow('', null),
  found_location: Joi.string().trim().optional().allow('', null),
  found_date:     Joi.date().iso().optional().allow(null),
  guest_id:       Joi.string().uuid().optional().allow(null),
  notes:          Joi.string().trim().optional().allow('', null),
});

export const updateLostAndFoundSchema = Joi.object({
  item_name:      Joi.string().trim().optional(),
  description:    Joi.string().trim().optional().allow('', null),
  found_location: Joi.string().trim().optional().allow('', null),
  status:         Joi.string().valid('in_custody', 'returned', 'disposed').optional(),
  notes:          Joi.string().trim().optional().allow('', null),
});

export const markReturnedSchema = Joi.object({
  guest_id: Joi.string().uuid().optional().allow(null),
  notes:    Joi.string().trim().optional().allow('', null),
});
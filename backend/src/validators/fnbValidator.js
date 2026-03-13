// src/validators/fnbValidator.js
import Joi from 'joi';

export const createOutletSchema = Joi.object({
  name:        Joi.string().trim().required(),
  type:        Joi.string().valid('restaurant','bar','room_service','cafe','other').required(),
  description: Joi.string().trim().optional().allow('', null),
});

export const createMenuItemSchema = Joi.object({
  outlet_id:   Joi.string().uuid().optional().allow(null, ''),
  category_id: Joi.string().uuid().optional().allow(null, ''),
  name:        Joi.string().trim().required(),
  description: Joi.string().trim().optional().allow('', null),
  price:       Joi.number().integer().min(0).required(),
  status:      Joi.string().valid('available','unavailable','seasonal').default('available'),
});

export const updateMenuItemSchema = Joi.object({
  name:        Joi.string().trim().optional(),
  description: Joi.string().trim().optional().allow('', null),
  price:       Joi.number().integer().min(0).optional(),
  status:      Joi.string().valid('available','unavailable','seasonal').optional(),
  category_id: Joi.string().uuid().optional().allow(null, ''),
});

export const createCategorySchema = Joi.object({
  outlet_id:  Joi.string().uuid().optional().allow(null, ''),
  name:       Joi.string().trim().required(),
  sort_order: Joi.number().integer().min(0).default(0),
});

export const createTableSchema = Joi.object({
  outlet_id: Joi.string().uuid().optional().allow(null, ''),
  number:    Joi.string().trim().required(),
  capacity:  Joi.number().integer().min(1).default(2),
});

export const createOrderSchema = Joi.object({
  outlet_id:      Joi.string().uuid().optional().allow(null, ''),
  table_id:       Joi.string().uuid().optional().allow(null, ''),
  reservation_id: Joi.string().uuid().optional().allow(null, ''),
  notes:          Joi.string().trim().optional().allow('', null),
});

export const addOrderItemsSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    menu_item_id: Joi.string().uuid().optional().allow(null, ''),
    name:         Joi.string().trim().required(),
    price:        Joi.number().integer().min(0).required(),
    quantity:     Joi.number().integer().min(1).default(1),
    notes:        Joi.string().trim().optional().allow('', null),
  })).min(1).required(),
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('open','sent','preparing','ready','served').required(),
});
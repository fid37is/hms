// src/validators/inventoryValidator.js

import Joi from 'joi';

export const createSupplierSchema = Joi.object({
  name:           Joi.string().trim().required(),
  contact_name:   Joi.string().trim().optional().allow('', null),
  contact_person: Joi.string().trim().optional().allow('', null),
  phone:          Joi.string().trim().optional().allow('', null),
  email:          Joi.string().email().lowercase().optional().allow('', null),
  address:        Joi.string().trim().optional().allow('', null),
  category:       Joi.string().trim().optional().allow('', null),
  payment_terms:  Joi.string().trim().optional().allow('', null),
  notes:          Joi.string().trim().optional().allow('', null),
});

export const updateSupplierSchema = Joi.object({
  name:           Joi.string().trim().optional(),
  contact_name:   Joi.string().trim().optional().allow('', null),
  contact_person: Joi.string().trim().optional().allow('', null),
  phone:          Joi.string().trim().optional().allow('', null),
  email:          Joi.string().email().lowercase().optional().allow('', null),
  address:        Joi.string().trim().optional().allow('', null),
  category:       Joi.string().trim().optional().allow('', null),
  payment_terms:  Joi.string().trim().optional().allow('', null),
  notes:          Joi.string().trim().optional().allow('', null),
});

export const createItemSchema = Joi.object({
  name:          Joi.string().trim().required(),
  category:      Joi.string().trim().optional().allow('', null),
  department:    Joi.string().trim().optional().allow('', null),
  unit:          Joi.string().trim().required(),
  current_stock: Joi.number().min(0).default(0),
  reorder_level: Joi.number().min(0).default(0),
  unit_cost:     Joi.number().min(0).default(0),
  supplier_id:   Joi.string().uuid().optional().allow(null),
  barcode:       Joi.string().trim().optional().allow('', null),
  notes:         Joi.string().trim().optional().allow('', null),
});

export const updateItemSchema = Joi.object({
  name:          Joi.string().trim().optional(),
  category:      Joi.string().trim().optional(),
  department:    Joi.string().trim().optional().allow('', null),
  unit:          Joi.string().trim().optional(),
  reorder_level: Joi.number().min(0).optional(),
  unit_cost:     Joi.number().min(0).optional(),
  supplier_id:   Joi.string().uuid().optional().allow(null),
  barcode:       Joi.string().trim().optional().allow('', null),
  notes:         Joi.string().trim().optional().allow('', null),
});

export const recordMovementSchema = Joi.object({
  type:      Joi.string().valid('purchase', 'usage', 'adjustment', 'wastage', 'return').required(),
  quantity:  Joi.number().positive().required(),
  unit_cost: Joi.number().integer().min(0).optional().allow(null),
  reference: Joi.string().trim().optional().allow('', null),
  notes:     Joi.string().trim().optional().allow('', null),
});

export const createPurchaseOrderSchema = Joi.object({
  supplier_id:   Joi.string().uuid().required(),
  items:         Joi.array().items(Joi.object({
    item_id:     Joi.string().uuid().optional().allow(null),
    name:        Joi.string().trim().required(),
    quantity:    Joi.number().positive().required(),
    unit_cost:   Joi.number().integer().min(0).required(),
  })).min(1).required(),
  tax_rate:      Joi.number().min(0).max(100).default(0),
  expected_date: Joi.date().iso().optional().allow(null),
  notes:         Joi.string().trim().optional().allow('', null),
});
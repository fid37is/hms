// src/validators/maintenanceValidator.js

import Joi from 'joi';

export const createWorkOrderSchema = Joi.object({
  location:    Joi.string().trim().required(),
  room_id:     Joi.string().uuid().optional().allow(null),
  category:    Joi.string().valid('electrical', 'plumbing', 'hvac', 'furniture', 'appliance', 'structural', 'other').optional().allow(null),
  description: Joi.string().trim().required(),
  priority:    Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  assigned_to: Joi.string().uuid().optional().allow(null),
  cost:        Joi.number().integer().min(0).default(0),
});

export const updateWorkOrderSchema = Joi.object({
  location:    Joi.string().trim().optional(),
  category:    Joi.string().valid('electrical', 'plumbing', 'hvac', 'furniture', 'appliance', 'structural', 'other').optional().allow(null),
  description: Joi.string().trim().optional(),
  priority:    Joi.string().valid('low', 'normal', 'high', 'urgent').optional(),
  cost:        Joi.number().integer().min(0).optional(),
  notes:       Joi.string().trim().optional().allow('', null),
});

export const assignWorkOrderSchema = Joi.object({
  assigned_to: Joi.string().uuid().required(),
});

export const resolveWorkOrderSchema = Joi.object({
  resolution: Joi.string().trim().required(),
  cost:       Joi.number().integer().min(0).optional(),
});

export const createAssetSchema = Joi.object({
  name:             Joi.string().trim().required(),
  category:         Joi.string().trim().optional().allow(null),
  location:         Joi.string().trim().optional().allow(null),
  serial_number:    Joi.string().trim().optional().allow(null),
  purchase_date:    Joi.date().iso().optional().allow(null),
  purchase_cost:    Joi.number().integer().min(0).default(0),
  warranty_expiry:  Joi.date().iso().optional().allow(null),
  next_service_due: Joi.date().iso().optional().allow(null),
  status:           Joi.string().valid('operational', 'under_repair', 'decommissioned').default('operational'),
  notes:            Joi.string().trim().optional().allow(null),
});

export const updateAssetSchema = Joi.object({
  name:             Joi.string().trim().optional(),
  category:         Joi.string().trim().optional().allow(null),
  location:         Joi.string().trim().optional().allow(null),
  serial_number:    Joi.string().trim().optional().allow(null),
  purchase_date:    Joi.date().iso().optional().allow(null),
  purchase_cost:    Joi.number().integer().min(0).optional(),
  warranty_expiry:  Joi.date().iso().optional().allow(null),
  last_serviced:    Joi.date().iso().optional().allow(null),
  next_service_due: Joi.date().iso().optional().allow(null),
  status:           Joi.string().valid('operational', 'under_repair', 'decommissioned').optional(),
  notes:            Joi.string().trim().optional().allow(null),
});
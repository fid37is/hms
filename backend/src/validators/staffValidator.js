// src/validators/staffValidator.js

import Joi from 'joi';

export const createDepartmentSchema = Joi.object({
  name:       Joi.string().trim().required(),
  manager_id: Joi.string().uuid().optional().allow(null),
});

export const updateDepartmentSchema = Joi.object({
  name:       Joi.string().trim().optional(),
  manager_id: Joi.string().uuid().optional().allow(null),
});

export const createStaffSchema = Joi.object({
  full_name:        Joi.string().trim().required(),
  email:            Joi.string().email().lowercase().optional().allow('', null),
  phone:            Joi.string().trim().required(),
  department_id:    Joi.string().uuid().optional().allow(null),
  job_title:        Joi.string().trim().optional().allow('', null),
  employment_type:  Joi.string().valid('full_time', 'part_time', 'contract', 'intern').default('full_time'),
  employment_date:  Joi.date().iso().optional().allow(null),
  salary:           Joi.number().integer().min(0).default(0),
  bank_name:        Joi.string().trim().optional().allow('', null),
  bank_account_no:  Joi.string().trim().optional().allow('', null),
  emergency_contact: Joi.object().optional().default({}),
  notes:            Joi.string().trim().optional().allow('', null),
});

export const updateStaffSchema = Joi.object({
  full_name:        Joi.string().trim().optional(),
  email:            Joi.string().email().lowercase().optional().allow('', null),
  phone:            Joi.string().trim().optional(),
  department_id:    Joi.string().uuid().optional().allow(null),
  job_title:        Joi.string().trim().optional().allow('', null),
  employment_type:  Joi.string().valid('full_time', 'part_time', 'contract', 'intern').optional(),
  salary:           Joi.number().integer().min(0).optional(),
  bank_name:        Joi.string().trim().optional().allow('', null),
  bank_account_no:  Joi.string().trim().optional().allow('', null),
  emergency_contact: Joi.object().optional(),
  status:           Joi.string().valid('active', 'on_leave', 'suspended', 'terminated').optional(),
  notes:            Joi.string().trim().optional().allow('', null),
});

export const createShiftSchema = Joi.object({
  staff_id:        Joi.string().uuid().required(),
  shift_date:      Joi.date().iso().required(),
  scheduled_start: Joi.string().pattern(/^\d{2}:\d{2}$/).optional().allow(null),
  scheduled_end:   Joi.string().pattern(/^\d{2}:\d{2}$/).optional().allow(null),
  notes:           Joi.string().trim().optional().allow('', null),
});

export const updateShiftSchema = Joi.object({
  shift_date:      Joi.date().iso().optional(),
  scheduled_start: Joi.string().pattern(/^\d{2}:\d{2}$/).optional().allow(null),
  scheduled_end:   Joi.string().pattern(/^\d{2}:\d{2}$/).optional().allow(null),
  status:          Joi.string().valid('scheduled', 'active', 'completed', 'absent').optional(),
  notes:           Joi.string().trim().optional().allow('', null),
});

export const createLeaveRequestSchema = Joi.object({
  leave_type: Joi.string().valid('annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other').required(),
  start_date: Joi.date().iso().required(),
  end_date:   Joi.date().iso().min(Joi.ref('start_date')).required().messages({
    'date.min': 'End date must be on or after start date.',
  }),
  reason: Joi.string().trim().optional().allow('', null),
});

export const reviewLeaveSchema = Joi.object({
  status:       Joi.string().valid('approved', 'rejected').required(),
  review_notes: Joi.string().trim().optional().allow('', null),
});
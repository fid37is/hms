// src/controllers/superAdminController.js

import * as superAdminService from '../services/superAdminService.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Auth ─────────────────────────────────────────────────

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 'Email and password are required.', 400);
    }
    const result = await superAdminService.superAdminLogin(email, password);
    return sendSuccess(res, result, 'Login successful.');
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, req.superAdmin, 'Profile retrieved.');
  } catch (err) {
    next(err);
  }
};

// ─── Platform Stats ───────────────────────────────────────

export const getPlatformStats = async (req, res, next) => {
  try {
    const data = await superAdminService.getPlatformStats();
    return sendSuccess(res, data, 'Platform stats retrieved.');
  } catch (err) {
    next(err);
  }
};

// ─── Organizations ─────────────────────────────────────────

export const listOrganizations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, plan } = req.query;
    const result = await superAdminService.listOrganizations({
      page:   Number(page),
      limit:  Number(limit),
      search,
      status,
      plan,
    });
    return sendSuccess(res, result.data, 'Organizations retrieved.', 200, {
      total:      result.total,
      page:       result.page,
      limit:      result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    });
  } catch (err) {
    next(err);
  }
};

export const getOrganization = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const data = await superAdminService.getOrganizationDetail(orgId);
    return sendSuccess(res, data, 'Organization detail retrieved.');
  } catch (err) {
    next(err);
  }
};

export const updateOrganization = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { status, plan, notes, trial_ends_at } = req.body;
    const data = await superAdminService.updateOrganization(orgId, { status, plan, notes, trial_ends_at });
    return sendSuccess(res, data, 'Organization updated.');
  } catch (err) {
    next(err);
  }
};

// ─── Activity & Health ─────────────────────────────────────

export const getPlatformActivity = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const data = await superAdminService.getPlatformActivity(Number(limit));
    return sendSuccess(res, data, 'Activity feed retrieved.');
  } catch (err) {
    next(err);
  }
};

export const getSystemHealth = async (req, res, next) => {
  try {
    const data = await superAdminService.getSystemHealth();
    return sendSuccess(res, data, 'System health retrieved.');
  } catch (err) {
    next(err);
  }
};

export const getPlatformFinancials = async (req, res, next) => {
  try {
    const data = await superAdminService.getPlatformFinancials();
    return sendSuccess(res, data, 'Platform financials retrieved.');
  } catch (err) {
    next(err);
  }
};
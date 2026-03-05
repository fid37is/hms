// src/controllers/authController.js

import * as authService from '../services/authService.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';

export const loginController = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    return sendSuccess(res, result, 'Login successful.');
  } catch (err) { next(err); }
};

export const refreshTokenController = async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.body.refresh_token);
    return sendSuccess(res, result, 'Token refreshed.');
  } catch (err) { next(err); }
};

export const getProfileController = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.sub);
    return sendSuccess(res, user, 'Profile retrieved.');
  } catch (err) { next(err); }
};

export const changePasswordController = async (req, res, next) => {
  try {
    const { current_password, new_password, force_change } = req.body;
    const data = await authService.changePassword(req.user.sub, current_password, new_password, force_change || false);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

export const logoutController = (req, res) =>
  sendSuccess(res, null, 'Logged out successfully.');

export const forgotPasswordController = async (req, res, next) => {
  try {
    const data = await authService.forgotPassword(req.body.email);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

// ─── SaaS: Register new organization ─────────────────────

export const registerOrgController = async (req, res, next) => {
  try {
    const { org_name, admin_email, admin_password, admin_name } = req.body;
    if (!org_name || !admin_email || !admin_password || !admin_name)
      return res.status(400).json({ success: false, message: 'org_name, admin_email, admin_password, admin_name are required.' });

    const result = await authService.registerOrg({ org_name, admin_email, admin_password, admin_name });
    return sendCreated(res, result, 'Organization created. You can now log in.');
  } catch (err) { next(err); }
};

// ─── API Keys (for guest website) ────────────────────────

export const generateApiKeyController = async (req, res, next) => {
  try {
    const { label } = req.body;
    const result = await authService.generateApiKey(req.user.org_id, label, req.user.sub); // ✅ was req.orgId
    return sendCreated(res, result, 'API key generated. Save this key — it will not be shown again.');
  } catch (err) { next(err); }
};

export const listApiKeysController = async (req, res, next) => {
  try {
    const data = await authService.listApiKeys(req.user.org_id); // ✅ was req.orgId
    return sendSuccess(res, data, 'API keys retrieved.');
  } catch (err) { next(err); }
};

export const revokeApiKeyController = async (req, res, next) => {
  try {
    const data = await authService.revokeApiKey(req.user.org_id, req.params.id); // ✅ was req.orgId
    return sendSuccess(res, data, 'API key revoked.');
  } catch (err) { next(err); }
};
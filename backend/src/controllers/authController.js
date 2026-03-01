// src/controllers/authController.js

import * as authService from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return sendSuccess(res, result, 'Login successful.');
  } catch (err) {
    next(err);
  }
};

export const refreshTokenController = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    const result = await authService.refreshToken(refresh_token);
    return sendSuccess(res, result, 'Token refreshed.');
  } catch (err) {
    next(err);
  }
};

export const getProfileController = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.sub);
    return sendSuccess(res, user, 'Profile retrieved.');
  } catch (err) {
    next(err);
  }
};

export const changePasswordController = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const result = await authService.changePassword(
      req.user.sub,
      current_password,
      new_password
    );
    return sendSuccess(res, result, 'Password changed successfully.');
  } catch (err) {
    next(err);
  }
};

export const logoutController = (req, res) => {
  // JWT is stateless — logout is handled client-side by deleting the token.
  // If refresh token blacklisting is needed in future, implement here.
  return sendSuccess(res, null, 'Logged out successfully.');
};

export const forgotPasswordController = async (req, res, next) => {
  try {
    const data = await authService.forgotPassword(req.body.email);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};
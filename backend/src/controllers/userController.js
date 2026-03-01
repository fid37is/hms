// src/controllers/userController.js

import * as userService from '../services/userService.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const getUsers = async (req, res, next) => {
  try {
    const data = await userService.getAllUsers();
    return sendSuccess(res, data, 'Users retrieved.');
  } catch (err) { next(err); }
};

export const getUserById = async (req, res, next) => {
  try {
    const data = await userService.getUserById(req.params.id);
    return sendSuccess(res, data, 'User retrieved.');
  } catch (err) { next(err); }
};

export const createUser = async (req, res, next) => {
  try {
    const data = await userService.createUser(req.body);
    return sendCreated(res, data, 'User created.');
  } catch (err) { next(err); }
};

export const updateUser = async (req, res, next) => {
  try {
    const data = await userService.updateUser(req.params.id, req.body);
    return sendSuccess(res, data, 'User updated.');
  } catch (err) { next(err); }
};

export const toggleUser = async (req, res, next) => {
  try {
    const data = await userService.toggleUserActive(req.params.id, req.body.is_active);
    return sendSuccess(res, data, 'User status updated.');
  } catch (err) { next(err); }
};

export const grantAccess = async (req, res, next) => {
  try {
    const data = await userService.grantStaffAccess(req.params.staffId, req.body);
    return sendCreated(res, data, 'System access granted.');
  } catch (err) { next(err); }
};

export const revokeAccess = async (req, res, next) => {
  try {
    const data = await userService.revokeStaffAccess(req.params.staffId);
    return sendSuccess(res, data, 'System access revoked.');
  } catch (err) { next(err); }
};

export const getRoles = async (req, res, next) => {
  try {
    const data = await userService.getAllRoles();
    return sendSuccess(res, data, 'Roles retrieved.');
  } catch (err) { next(err); }
};

export const createRole = async (req, res, next) => {
  try {
    const data = await userService.createRole(req.body);
    return sendCreated(res, data, 'Role created.');
  } catch (err) { next(err); }
};

export const deleteUser = async (req, res, next) => {
  try {
    const data = await userService.deleteUser(req.params.id);
    return sendSuccess(res, data, 'User deactivated.');
  } catch (err) { next(err); }
};

export const deleteRole = async (req, res, next) => {
  try {
    const data = await userService.deleteRole(req.params.id);
    return sendSuccess(res, data, 'Role deleted.');
  } catch (err) { next(err); }
};

export const adminResetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    const data = await (await import('../services/authService.js')).adminResetPassword(req.params.id, password);
    return sendSuccess(res, data, 'Password reset.');
  } catch (err) { next(err); }
};
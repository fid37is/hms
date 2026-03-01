// src/services/authService.js

import jwt          from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { env }      from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
};

export const login = async (email, password) => {
  // 1. Sign in via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    throw new AppError('Invalid email or password.', 401);
  }

  // 2. Fetch user profile
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (userError || !user) {
    throw new AppError('User profile not found. Contact administrator.', 404);
  }

  if (!user.is_active) {
    throw new AppError('Your account has been deactivated. Contact administrator.', 403);
  }

  if (!user.role_id) {
    throw new AppError('User role not assigned. Contact administrator.', 403);
  }

  // 3. Fetch role separately
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('*')
    .eq('id', user.role_id)
    .single();

  if (roleError || !role) {
    throw new AppError('User role not found. Contact administrator.', 404);
  }

  // 4. Fetch permissions for this role
  const { data: rolePermissions, error: permError } = await supabase
    .from('role_permissions')
    .select('permission_id')
    .eq('role_id', role.id);

  if (permError) {
    throw new AppError('Failed to load user permissions.', 500);
  }

  let permissions = [];

  if (rolePermissions && rolePermissions.length > 0) {
    const permissionIds = rolePermissions.map((rp) => rp.permission_id);

    const { data: permissionData } = await supabase
      .from('permissions')
      .select('module, action')
      .in('id', permissionIds);

    permissions = (permissionData || []).map((p) => `${p.module}:${p.action}`);
  }

  // 5. Update last_login
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.id);

  // 6. Generate tokens
  const tokenPayload = {
    sub:         user.id,
    email:       user.email,
    full_name:   user.full_name,
    role:        role.name,
    department:  user.department,
    permissions,
  };

  const accessToken  = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken({ sub: user.id });

  return {
    access_token:  accessToken,
    refresh_token: refreshToken,
    expires_in:    env.JWT_EXPIRES_IN,
    user: {
      id:          user.id,
      full_name:   user.full_name,
      email:       user.email,
      phone:       user.phone,
      department:  user.department,
      role:        role.name,
      permissions,
    },
  };
};

export const refreshToken = async (token) => {
  let decoded;

  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', decoded.sub)
    .single();

  if (error || !user) {
    throw new AppError('User not found.', 404);
  }

  if (!user.is_active) {
    throw new AppError('Account deactivated.', 403);
  }

  const { data: role } = await supabase
    .from('roles')
    .select('*')
    .eq('id', user.role_id)
    .single();

  const { data: rolePermissions } = await supabase
    .from('role_permissions')
    .select('permission_id')
    .eq('role_id', role.id);

  let permissions = [];

  if (rolePermissions && rolePermissions.length > 0) {
    const permissionIds = rolePermissions.map((rp) => rp.permission_id);
    const { data: permissionData } = await supabase
      .from('permissions')
      .select('module, action')
      .in('id', permissionIds);

    permissions = (permissionData || []).map((p) => `${p.module}:${p.action}`);
  }

  const tokenPayload = {
    sub:         user.id,
    email:       user.email,
    full_name:   user.full_name,
    role:        role.name,
    department:  user.department,
    permissions,
  };

  const accessToken = generateAccessToken(tokenPayload);

  return {
    access_token: accessToken,
    expires_in:   env.JWT_EXPIRES_IN,
  };
};

export const getProfile = async (userId) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new AppError('User not found.', 404);
  }

  const { data: role } = await supabase
    .from('roles')
    .select('id, name, description')
    .eq('id', user.role_id)
    .single();

  return { ...user, role };
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const { data: userData } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();

  if (!userData) {
    throw new AppError('User not found.', 404);
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email:    userData.email,
    password: currentPassword,
  });

  if (verifyError) {
    throw new AppError('Current password is incorrect.', 401);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (updateError) {
    throw new AppError('Failed to update password.', 500);
  }

  return { message: 'Password updated successfully.' };
};
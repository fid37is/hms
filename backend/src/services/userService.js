// src/services/userService.js
// Manages HMS system users — linked to staff records via staff.user_id
// Users = login accounts; Staff = HR/operational records
// A staff member may optionally have a linked user account (system access)

import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Users ────────────────────────────────────────────────

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, full_name, email, phone, department,
      is_active, last_login, created_at,
      roles ( id, name )
    `)
    .order('full_name');

  if (error) throw new AppError(`Failed to fetch users: ${error.message}`, 500);
  return data;
};

export const getUserById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, full_name, email, phone, department,
      is_active, last_login, created_at,
      roles ( id, name )
    `)
    .eq('id', id)
    .single();

  if (error || !data) throw new AppError('User not found.', 404);
  return data;
};

export const createUser = async ({ full_name, email, phone, role_id, department, password }) => {
  if (!password) throw new AppError('Password is required.', 400);

  // 1. Create Supabase Auth account
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) throw new AppError(`Failed to create auth account: ${authError.message}`, 500);

  const userId = authData.user.id;

  // 2. Insert into users table
  const { data, error } = await supabase
    .from('users')
    .insert({ id: userId, full_name, email, phone, role_id, department, is_active: true })
    .select(`id, full_name, email, phone, department, is_active, roles ( id, name )`)
    .single();

  if (error) {
    // Rollback auth user if profile insert fails
    await supabase.auth.admin.deleteUser(userId);
    throw new AppError(`Failed to create user profile: ${error.message}`, 500);
  }

  return data;
};

export const updateUser = async (id, { full_name, phone, role_id, department, is_active, password }) => {
  // Update profile
  const { data, error } = await supabase
    .from('users')
    .update({ full_name, phone, role_id, department, is_active })
    .eq('id', id)
    .select(`id, full_name, email, phone, department, is_active, roles ( id, name )`)
    .single();

  if (error || !data) throw new AppError(`Failed to update user: ${error?.message}`, 500);

  // Optionally reset password
  if (password) {
    const { error: pwError } = await supabase.auth.admin.updateUserById(id, { password });
    if (pwError) throw new AppError(`Failed to update password: ${pwError.message}`, 500);
  }

  return data;
};

export const toggleUserActive = async (id, is_active) => {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active })
    .eq('id', id)
    .select('id, full_name, email, is_active')
    .single();

  if (error || !data) throw new AppError('Failed to update user status.', 500);

  // Sync with Supabase Auth (ban/unban)
  await supabase.auth.admin.updateUserById(id, {
    ban_duration: is_active ? 'none' : '87600h', // 10 years = effectively permanent
  });

  return data;
};

// ─── Grant / Revoke system access for a staff member ──────

export const grantStaffAccess = async (staffId, { email, password, role_id }) => {
  // 1. Load staff record
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('id, full_name, phone, department_id, user_id')
    .eq('id', staffId)
    .eq('is_deleted', false)
    .single();

  if (staffError || !staff) throw new AppError('Staff member not found.', 404);
  if (staff.user_id) throw new AppError('This staff member already has system access.', 409);

  // 2. Get department name for the user profile
  let department = null;
  if (staff.department_id) {
    const { data: dept } = await supabase
      .from('departments')
      .select('name')
      .eq('id', staff.department_id)
      .single();
    department = dept?.name || null;
  }

  // 3. Create the user account
  const user = await createUser({
    full_name:  staff.full_name,
    email,
    phone:      staff.phone,
    role_id,
    department,
    password,
  });

  // 4. Link user_id back to staff record
  const { error: linkError } = await supabase
    .from('staff')
    .update({ user_id: user.id })
    .eq('id', staffId);

  if (linkError) {
    // Rollback: delete the user we just created
    await supabase.auth.admin.deleteUser(user.id);
    await supabase.from('users').delete().eq('id', user.id);
    throw new AppError(`Failed to link user to staff: ${linkError.message}`, 500);
  }

  return { user, staff_id: staffId };
};

export const revokeStaffAccess = async (staffId) => {
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('id, user_id')
    .eq('id', staffId)
    .single();

  if (staffError || !staff) throw new AppError('Staff member not found.', 404);
  if (!staff.user_id) throw new AppError('This staff member has no system access to revoke.', 404);

  // Deactivate the user (don't delete — preserve audit trail)
  await toggleUserActive(staff.user_id, false);

  // Unlink from staff
  await supabase.from('staff').update({ user_id: null }).eq('id', staffId);

  return { message: 'System access revoked.' };
};

// ─── Roles ────────────────────────────────────────────────

export const getAllRoles = async () => {
  // First get all roles
  const { data: roles, error } = await supabase
    .from('roles')
    .select('id, name, description, created_at')
    .order('name');

  if (error) throw new AppError(`Failed to fetch roles: ${error.message}`, 500);

  // Then get all role_permissions with permissions joined
  const { data: rolePerms } = await supabase
    .from('role_permissions')
    .select('role_id, permissions(module, action)');

  const permsMap = {};
  for (const rp of (rolePerms || [])) {
    if (!permsMap[rp.role_id]) permsMap[rp.role_id] = [];
    if (rp.permissions) {
      permsMap[rp.role_id].push(`${rp.permissions.module}:${rp.permissions.action}`);
    }
  }

  return roles.map(role => ({
    ...role,
    permissions: permsMap[role.id] || [],
  }));
};

export const createRole = async ({ name, description, permissions = [] }) => {
  // 1. Create role
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .insert({ name, description })
    .select()
    .single();

  if (roleError) throw new AppError(`Failed to create role: ${roleError.message}`, 500);

  // 2. Resolve permission strings to IDs
  if (permissions.length) {
    const permPairs = permissions.map(p => {
      const [module, action] = p.split(':');
      return { module, action };
    });

    // Fetch matching permission records
    const { data: permRecords } = await supabase
      .from('permissions')
      .select('id, module, action');

    const permIds = (permRecords || [])
      .filter(pr => permPairs.some(pp => pp.module === pr.module && pp.action === pr.action))
      .map(pr => ({ role_id: role.id, permission_id: pr.id }));

    if (permIds.length) {
      await supabase.from('role_permissions').insert(permIds);
    }
  }

  return getAllRoles().then(roles => roles.find(r => r.id === role.id));
};

// ─── Delete user (deactivate auth + remove profile) ───────
export const deleteUser = async (id) => {
  // Soft approach: deactivate rather than hard delete to preserve audit trail
  await supabase.auth.admin.updateUserById(id, { ban_duration: '87600h' });

  const { error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw new AppError(`Failed to deactivate user: ${error.message}`, 500);

  // Unlink from staff record if linked
  await supabase.from('staff').update({ user_id: null }).eq('user_id', id);

  return { message: 'User deactivated and unlinked from staff.' };
};

export const deleteRole = async (id) => {
  const { error } = await supabase.from('roles').delete().eq('id', id);
  if (error) throw new AppError(`Failed to delete role: ${error.message}`, 500);
  return { message: 'Role deleted.' };
};
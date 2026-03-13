// src/services/userService.js
// Users = login accounts (scoped to org). Roles = global (shared across all orgs).

import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Seed all permission rows on startup ─────────────────────────────────────
const ALL_PERMISSION_STRINGS = [
  // Billing
  'billing:approve','billing:charge','billing:discount','billing:export',
  'billing:payment','billing:read','billing:refund','billing:void',
  // Chat
  'chat:read','chat:reply',
  // F&B
  'fnb:billing','fnb:create','fnb:delete','fnb:menu','fnb:read','fnb:update',
  // Guests
  'guests:create','guests:delete','guests:merge','guests:read','guests:update',
  // Housekeeping
  'housekeeping:assign','housekeeping:read','housekeeping:update',
  // Inventory
  'inventory:approve','inventory:delete','inventory:orders','inventory:read','inventory:update',
  // Maintenance
  'maintenance:assign','maintenance:close','maintenance:create',
  'maintenance:read','maintenance:resolve','maintenance:update',
  // Night Audit
  'night_audit:read','night_audit:run',
  // Reports
  'reports:audit','reports:basic','reports:financial','reports:occupancy',
  // Reservations
  'reservations:cancel','reservations:checkin','reservations:checkout','reservations:create',
  'reservations:delete','reservations:read','reservations:update',
  // Rooms
  'rooms:create','rooms:delete','rooms:read','rooms:status','rooms:update',
  // Settings
  'settings:read','settings:roles','settings:update',
  // Staff
  'staff:create','staff:delete','staff:manage','staff:payroll','staff:read',
];

export const seedPermissions = async () => {
  const rows = ALL_PERMISSION_STRINGS.map(p => {
    const [module, action] = p.split(':');
    return { module, action };
  });
  const { error } = await supabase
    .from('permissions')
    .upsert(rows, { onConflict: 'module,action', ignoreDuplicates: true });
  if (error) throw new Error(`seedPermissions: ${error.message}`);
};


// ─── Users ────────────────────────────────────────────────

export const getAllUsers = async (orgId) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, phone, department, is_active, last_login, created_at, role_id, roles!role_id ( id, name )')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('full_name');

  if (error) throw new AppError(`Failed to fetch users: ${error.message}`, 500);
  return data;
};

export const getUserById = async (orgId, id) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, phone, department, is_active, last_login, created_at, role_id, roles!role_id ( id, name )')
    .eq('org_id', orgId).eq('id', id).single();

  if (error || !data) throw new AppError('User not found.', 404);
  return data;
};

export const createUser = async (orgId, { full_name, email, phone, role_id, department, password }) => {
  if (!password) throw new AppError('Password is required.', 400);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (authError) throw new AppError(`Failed to create auth account: ${authError.message}`, 500);

  const userId = authData.user.id;

  const { data, error } = await supabase
    .from('users')
    .insert({ id: userId, org_id: orgId, full_name, email, phone, role_id, department,
              is_active: true, must_change_password: true })
    .select('id, full_name, email, phone, department, is_active, role_id, roles!role_id ( id, name )')
    .single();

  if (error) {
    await supabase.auth.admin.deleteUser(userId);
    throw new AppError(`Failed to create user profile: ${error.message}`, 500);
  }
  return data;
};

export const updateUser = async (orgId, id, { full_name, phone, role_id, department, is_active, password }) => {
  const { data, error } = await supabase
    .from('users')
    .update({ full_name, phone, role_id, department, is_active })
    .eq('org_id', orgId).eq('id', id)
    .select('id, full_name, email, phone, department, is_active, role_id, roles!role_id ( id, name )')
    .single();

  if (error || !data) throw new AppError(`Failed to update user: ${error?.message}`, 500);

  if (password) {
    const { error: pwError } = await supabase.auth.admin.updateUserById(id, { password });
    if (pwError) throw new AppError(`Failed to update password: ${pwError.message}`, 500);
  }
  return data;
};

export const toggleUserActive = async (orgId, id, is_active) => {
  const { data, error } = await supabase
    .from('users').update({ is_active }).eq('org_id', orgId).eq('id', id)
    .select('id, full_name, email, is_active').single();

  if (error || !data) throw new AppError('Failed to update user status.', 500);

  await supabase.auth.admin.updateUserById(id, { ban_duration: is_active ? 'none' : '87600h' });
  return data;
};

export const deleteUser = async (orgId, id) => {
  await supabase.auth.admin.updateUserById(id, { ban_duration: '87600h' });

  const { error } = await supabase
    .from('users').update({ is_active: false }).eq('org_id', orgId).eq('id', id);

  if (error) throw new AppError(`Failed to deactivate user: ${error.message}`, 500);
  await supabase.from('staff').update({ user_id: null }).eq('org_id', orgId).eq('user_id', id);
  return { message: 'User deactivated.' };
};

// ─── Grant / Revoke staff access ──────────────────────────

export const grantStaffAccess = async (orgId, staffId, { email, password, role_id }) => {
  const { data: staff, error: staffErr } = await supabase
    .from('staff').select('id, full_name, phone, department_id, user_id')
    .eq('org_id', orgId).eq('id', staffId).eq('is_deleted', false).single();

  if (staffErr || !staff) throw new AppError('Staff member not found.', 404);
  if (staff.user_id) throw new AppError('Staff member already has system access.', 409);

  let department = null;
  if (staff.department_id) {
    const { data: dept } = await supabase
      .from('departments').select('name').eq('org_id', orgId).eq('id', staff.department_id).single();
    department = dept?.name || null;
  }

  const user = await createUser(orgId, {
    full_name: staff.full_name, email, phone: staff.phone, role_id, department, password,
  });

  const { error: linkErr } = await supabase
    .from('staff').update({ user_id: user.id }).eq('org_id', orgId).eq('id', staffId);

  if (linkErr) {
    await supabase.auth.admin.deleteUser(user.id);
    await supabase.from('users').delete().eq('org_id', orgId).eq('id', user.id);
    throw new AppError(`Failed to link user to staff: ${linkErr.message}`, 500);
  }

  return { user, staff_id: staffId };
};

export const revokeStaffAccess = async (orgId, staffId) => {
  const { data: staff } = await supabase
    .from('staff').select('id, user_id').eq('org_id', orgId).eq('id', staffId).single();

  if (!staff) throw new AppError('Staff member not found.', 404);
  if (!staff.user_id) throw new AppError('No system access to revoke.', 404);

  await toggleUserActive(orgId, staff.user_id, false);
  await supabase.from('staff').update({ user_id: null }).eq('org_id', orgId).eq('id', staffId);
  return { message: 'System access revoked.' };
};

// ─── Roles (org-scoped) ───────────────────────────────────

export const getAllRoles = async (orgId) => {
  const { data: roles, error } = await supabase
    .from('roles').select('id, name, description, created_at')
    .eq('org_id', orgId).order('name');

  if (error) throw new AppError(`Failed to fetch roles: ${error.message}`, 500);

  const roleIds = (roles || []).map(r => r.id);
  const { data: rolePerms } = roleIds.length
    ? await supabase.from('role_permissions').select('role_id, permissions(module, action)').in('role_id', roleIds)
    : { data: [] };

  const permsMap = {};
  for (const rp of (rolePerms || [])) {
    if (!permsMap[rp.role_id]) permsMap[rp.role_id] = [];
    if (rp.permissions) permsMap[rp.role_id].push(`${rp.permissions.module}:${rp.permissions.action}`);
  }

  return (roles || []).map(r => ({ ...r, permissions: permsMap[r.id] || [] }));
};

export const createRole = async (orgId, { name, description, permissions = [] }) => {
  const { data: role, error } = await supabase
    .from('roles').insert({ org_id: orgId, name, description }).select().single();

  if (error) throw new AppError(`Failed to create role: ${error.message}`, 500);

  if (permissions.length) {
    const permPairs = permissions.map(p => { const [module, action] = p.split(':'); return { module, action }; });
    const { data: permRecords } = await supabase.from('permissions').select('id, module, action');
    const permIds = (permRecords || [])
      .filter(pr => permPairs.some(pp => pp.module === pr.module && pp.action === pr.action))
      .map(pr => ({ role_id: role.id, permission_id: pr.id }));
    if (permIds.length) await supabase.from('role_permissions').insert(permIds);
  }

  return getAllRoles(orgId).then(roles => roles.find(r => r.id === role.id));
};

export const updateRole = async (orgId, id, { name, description, permissions = [] }) => {
  // Verify role belongs to this org
  const { data: existing } = await supabase
    .from('roles').select('id').eq('org_id', orgId).eq('id', id).single();
  if (!existing) throw new AppError('Role not found.', 404);

  const { error: roleErr } = await supabase.from('roles')
    .update({ name, description }).eq('org_id', orgId).eq('id', id);
  if (roleErr) throw new AppError(`Failed to update role: ${roleErr.message}`, 500);

  if (permissions.length) {
    const permRows = permissions.map(p => { const [module, action] = p.split(':'); return { module, action }; });
    await supabase.from('permissions').upsert(permRows, { onConflict: 'module,action', ignoreDuplicates: true });
  }

  await supabase.from('role_permissions').delete().eq('role_id', id);

  if (permissions.length) {
    const permPairs = permissions.map(p => { const [module, action] = p.split(':'); return { module, action }; });
    const { data: permRecords } = await supabase.from('permissions').select('id, module, action');
    const permIds = (permRecords || [])
      .filter(pr => permPairs.some(pp => pp.module === pr.module && pp.action === pr.action))
      .map(pr => ({ role_id: id, permission_id: pr.id }));
    if (permIds.length) await supabase.from('role_permissions').insert(permIds);
  }

  return getAllRoles(orgId).then(roles => roles.find(r => r.id === id));
};

export const deleteRole = async (orgId, id) => {
  const { data: existing } = await supabase
    .from('roles').select('id').eq('org_id', orgId).eq('id', id).single();
  if (!existing) throw new AppError('Role not found.', 404);

  const { error } = await supabase.from('roles').delete().eq('org_id', orgId).eq('id', id);
  if (error) throw new AppError(`Failed to delete role: ${error.message}`, 500);
  return { message: 'Role deleted.' };
};
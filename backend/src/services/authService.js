// src/services/authService.js

import jwt          from 'jsonwebtoken';
import bcrypt       from 'bcryptjs';
import crypto       from 'crypto';
import { supabase } from '../config/supabase.js';
import { env }      from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { auditLogin } from './auditService.js';

const generateAccessToken  = (payload) => jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
const generateRefreshToken = (payload) => jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });

// ─── Login ────────────────────────────────────────────────

export const login = async (email, password) => {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError || !authData.user) throw new AppError('Invalid email or password.', 401);

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, org_id, email, full_name, department, role_id, is_active, must_change_password')
    .eq('id', authData.user.id).single();

  if (userError || !user)  throw new AppError('User profile not found. Contact administrator.', 404);
  if (!user.is_active)     throw new AppError('Your account has been deactivated. Contact administrator.', 403);
  if (!user.role_id)       throw new AppError('User role not assigned. Contact administrator.', 403);
  if (!user.org_id)        throw new AppError('No organization assigned. Contact administrator.', 403);

  // org_id must be a plain UUID string — explicit select prevents FK auto-expansion
  const orgId = String(user.org_id);

  const { data: role } = await supabase.from('roles').select('*').eq('id', user.role_id).single();
  if (!role) throw new AppError('User role not found. Contact administrator.', 404);

  let permissions = [];
  if (role.name.toLowerCase() === 'admin') {
    permissions = ['*'];
  } else {
    const { data: rolePermissions } = await supabase
      .from('role_permissions').select('permission_id').eq('role_id', role.id);

    if (rolePermissions?.length) {
      const ids = rolePermissions.map(rp => rp.permission_id);
      const { data: permData } = await supabase.from('permissions').select('module, action').in('id', ids);
      permissions = (permData || []).map(p => `${p.module}:${p.action}`);
    }
  }

  await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);
  auditLogin(orgId, user.id, `Login: ${user.email}`);

  const tokenPayload = {
    sub:        user.id,
    org_id:     orgId,
    email:      user.email,
    full_name:  user.full_name,
    role:       role.name,
    department: user.department,
    permissions,
  };

  // Fetch org subscription status for frontend gate
  const { data: orgData } = await supabase
    .from('organizations')
    .select('subscription_status, trial_ends_at, name')
    .eq('id', orgId)
    .maybeSingle();

  // Fetch all orgs this user belongs to (for org switcher)
  const { data: memberships } = await supabase
    .from('org_memberships')
    .select('org_id, organizations ( id, name, slug, subscription_status, trial_ends_at, status )')
    .eq('user_id', user.id).eq('is_active', true);
  const orgs = (memberships || []).map(m => ({
    org_id: m.organizations.id, name: m.organizations.name,
    slug: m.organizations.slug, subscription_status: m.organizations.subscription_status,
    trial_ends_at: m.organizations.trial_ends_at, status: m.organizations.status,
  }));

  return {
    access_token:  generateAccessToken(tokenPayload),
    refresh_token: generateRefreshToken({ sub: user.id, org_id: orgId }),
    expires_in:    env.JWT_EXPIRES_IN,
    must_change_password: user.must_change_password || false,
    user: {
      id:          user.id,
      org_id:      orgId,
      full_name:   user.full_name,
      email:       user.email,
      role:        role.name,
      department:  user.department,
      permissions,
      must_change_password: user.must_change_password || false,
    },
    org: {
      id:                  orgId,
      name:                orgData?.name,
      subscription_status: orgData?.subscription_status || 'trial',
      trial_ends_at:       orgData?.trial_ends_at || null,
    },
    orgs, // all orgs user belongs to
  };
};

// ─── Refresh Token ────────────────────────────────────────

export const refreshToken = async (token) => {
  let decoded;
  try { decoded = jwt.verify(token, env.JWT_SECRET); }
  catch { throw new AppError('Invalid or expired refresh token.', 401); }

  const { data: user } = await supabase.from('users').select('id, org_id, email, full_name, department, role_id, is_active, must_change_password').eq('id', decoded.sub).single();
  if (!user)         throw new AppError('User not found.', 404);
  if (!user.is_active) throw new AppError('Account deactivated.', 403);

  const { data: role } = await supabase.from('roles').select('*').eq('id', user.role_id).single();
  let permissions = [];
  if (role?.name.toLowerCase() === 'admin') {
    permissions = ['*'];
  } else if (role) {
    const { data: rp } = await supabase.from('role_permissions').select('permission_id').eq('role_id', role.id);
    if (rp?.length) {
      const ids = rp.map(r => r.permission_id);
      const { data: pd } = await supabase.from('permissions').select('module, action').in('id', ids);
      permissions = (pd || []).map(p => `${p.module}:${p.action}`);
    }
  }

  const tokenPayload = {
    sub: user.id, org_id: user.org_id, email: user.email,
    full_name: user.full_name, role: role?.name, department: user.department, permissions,
  };

  return { access_token: generateAccessToken(tokenPayload), expires_in: env.JWT_EXPIRES_IN };
};

// ─── Register Organization (SaaS signup) ─────────────────

export const registerOrg = async ({ org_name, admin_email, admin_password, admin_name }) => {
  // 1. Check email not already taken
  const { data: existingUser } = await supabase
    .from('users').select('id').eq('email', admin_email).maybeSingle();
  if (existingUser) throw new AppError('An account with this email already exists.', 409);

  // 2. Generate slug from org name
  const slug = org_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const { data: existingSlug } = await supabase
    .from('organizations').select('id').eq('slug', slug).maybeSingle();
  if (existingSlug) throw new AppError('Organization name already taken.', 409);

  // 3. Create organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name:                org_name,
      slug,
      plan:                'trial',
      status:              'active',
      subscription_status: 'trial',
      trial_ends_at:       new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select().single();
  if (orgError) throw new AppError('Failed to create organization.', 500);

  // 4. Create Supabase Auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: admin_email, password: admin_password, email_confirm: true,
  });
  if (authError) {
    await supabase.from('organizations').delete().eq('id', org.id);
    throw new AppError(`Failed to create user account: ${authError.message}`, 500);
  }

  // 5. Create Admin role for this org with all permissions
  const { data: adminRole } = await supabase
    .from('roles').insert({ org_id: org.id, name: 'Admin', description: 'Full system access' })
    .select('id').single();

  // Assign all permissions to Admin role
  if (adminRole) {
    const { data: allPerms } = await supabase.from('permissions').select('id');
    if (allPerms?.length) {
      await supabase.from('role_permissions').insert(
        allPerms.map(p => ({ role_id: adminRole.id, permission_id: p.id }))
      );
    }
  }

  // 6. Create user profile
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      id:        authUser.user.id,
      org_id:    org.id,
      email:     admin_email,
      full_name: admin_name,
      role_id:   adminRole?.id || null,
      is_active: true,
      must_change_password: false,
    })
    .select().single();

  if (userError) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    await supabase.from('organizations').delete().eq('id', org.id);
    throw new AppError('Failed to create user profile.', 500);
  }

  // 6b. Add admin to org_memberships
  await supabase.from('org_memberships').insert({
    user_id: authUser.user.id, org_id: org.id,
    role_id: adminRole?.id || null, is_active: true,
  });

  // 7. Seed hotel_config for this org
  const { error: configError } = await supabase.from('hotel_config').insert({
    org_id:          org.id,
    hotel_name:      org_name,
    currency:        'NGN',
    currency_symbol: '₦',
    tax_rate:        7.5,
    service_charge:  10,
    timezone:        'Africa/Lagos',
    check_in_time:   '14:00',
    check_out_time:  '11:00',
  });
  if (configError) console.error('hotel_config seed failed:', configError.message);

  return { org, user: { id: user.id, email: user.email, full_name: user.full_name, org_id: org.id } };
};

// ─── Generate API Key (for guest website) ────────────────

export const generateApiKey = async (orgId, label, createdBy) => {
  // Generate a secure random key
  const rawKey  = `pk_live_${crypto.randomBytes(24).toString('hex')}`;
  const prefix  = rawKey.slice(0, 15);
  const keyHash = await bcrypt.hash(rawKey, 10);

  const { data, error } = await supabase
    .from('api_keys')
    .insert({ org_id: orgId, key_hash: keyHash, key_prefix: prefix, label, created_by: createdBy })
    .select('id, key_prefix, label, created_at').single();

  if (error) throw new AppError('Failed to generate API key.', 500);

  // Return the raw key ONCE — it cannot be retrieved again
  return { ...data, key: rawKey };
};

export const listApiKeys = async (orgId) => {
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, key_prefix, label, is_active, last_used_at, expires_at, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw new AppError('Failed to fetch API keys.', 500);
  return data;
};

export const revokeApiKey = async (orgId, keyId) => {
  const { error } = await supabase
    .from('api_keys').update({ is_active: false }).eq('id', keyId).eq('org_id', orgId);
  if (error) throw new AppError('Failed to revoke API key.', 500);
  return { message: 'API key revoked.' };
};

// ─── Profile / Password ───────────────────────────────────

export const getProfile = async (userId) => {
  const { data: user } = await supabase.from('users').select('id, org_id, email, full_name, department, role_id, is_active, must_change_password, last_login').eq('id', userId).single();
  if (!user) throw new AppError('User not found.', 404);
  const { data: role } = await supabase.from('roles').select('id, name, description').eq('id', user.role_id).single();
  return { ...user, role };
};

export const changePassword = async (userId, currentPassword, newPassword, forceChange = false) => {
  const { data: userData } = await supabase.from('users').select('email').eq('id', userId).single();
  if (!userData) throw new AppError('User not found.', 404);

  if (!forceChange) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email, password: currentPassword,
    });
    if (signInError) throw new AppError('Current password is incorrect.', 401);
  }

  // Update password and force-invalidate all existing Supabase Auth sessions
  const { data: updatedUser, error: pwError } = await supabase.auth.admin.updateUserById(userId, {
    password:      newPassword,
    email_confirm: true,
  });

  if (pwError || !updatedUser) {
    throw new AppError(`Failed to update password: ${pwError?.message || 'unknown error'}`, 500);
  }

  await supabase.from('users').update({ must_change_password: false }).eq('id', userId);
  return { message: 'Password updated successfully.' };
};

export const forgotPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
  });
  if (error) console.error('Password reset error:', error.message);
  return { message: 'If that email exists, a reset link has been sent.' };
};

export const adminResetPassword = async (userId, newPassword) => {
  const { data: updatedUser, error } = await supabase.auth.admin.updateUserById(userId, {
    password:      newPassword,
    email_confirm: true,
  });
  if (error || !updatedUser) throw new AppError(`Failed to reset password: ${error?.message || 'unknown error'}`, 500);
  // Mark must_change_password so user is prompted to set a personal password on next login
  await supabase.from('users').update({ must_change_password: true }).eq('id', userId);
  return { message: 'Password reset successfully.' };
};

// ─── Org profile (slug, custom domain, plan) ─────────────────────────────────
export const getOrgProfile = async (orgId) => {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, custom_domain, plan, status, created_at')
    .eq('id', orgId)
    .single();
  if (error) throw new AppError('Failed to fetch organisation profile.', 500);
  return data;
};

export const updateOrgProfile = async (orgId, { custom_domain }) => {
  // Normalise: strip protocol, trailing slashes, lowercase
  const domain = custom_domain
    ? custom_domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase()
    : null;

  // Check no other org already owns this domain
  if (domain) {
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('custom_domain', domain)
      .neq('id', orgId)
      .maybeSingle();
    if (existing) throw new AppError('This domain is already linked to another account.', 409);
  }

  const { data, error } = await supabase
    .from('organizations')
    .update({ custom_domain: domain })
    .eq('id', orgId)
    .select('id, name, slug, custom_domain, plan, status')
    .single();

  if (error) throw new AppError('Failed to update organisation profile.', 500);
  return data;
};
// ─── Get all orgs a user belongs to ──────────────────────
export const getUserOrgs = async (userId) => {
  const { data, error } = await supabase
    .from('org_memberships')
    .select(`
      org_id,
      role_id,
      is_active,
      organizations ( id, name, slug, subscription_status, trial_ends_at, status )
    `)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) throw new AppError('Failed to fetch organisations.', 500);
  return (data || []).map(m => ({
    org_id:              m.organizations.id,
    name:                m.organizations.name,
    slug:                m.organizations.slug,
    subscription_status: m.organizations.subscription_status,
    trial_ends_at:       m.organizations.trial_ends_at,
    status:              m.organizations.status,
    role_id:             m.role_id,
  }));
};

// ─── Switch active organisation ───────────────────────────
export const switchOrg = async (userId, targetOrgId) => {
  // Verify user is a member of the target org
  const { data: membership } = await supabase
    .from('org_memberships')
    .select('role_id, is_active')
    .eq('user_id', userId)
    .eq('org_id', targetOrgId)
    .single();

  if (!membership || !membership.is_active)
    throw new AppError('You do not have access to this organisation.', 403);

  const { data: user } = await supabase
    .from('users')
    .select('id, email, full_name, department, is_active, must_change_password')
    .eq('id', userId).single();
  if (!user || !user.is_active) throw new AppError('Account not found or deactivated.', 403);

  const { data: role } = await supabase
    .from('roles').select('*').eq('id', membership.role_id).single();

  let permissions = [];
  if (role?.name?.toLowerCase() === 'admin') {
    permissions = ['*'];
  } else if (role) {
    const { data: rp } = await supabase
      .from('role_permissions').select('permission_id').eq('role_id', role.id);
    if (rp?.length) {
      const ids = rp.map(r => r.permission_id);
      const { data: pd } = await supabase.from('permissions').select('module, action').in('id', ids);
      permissions = (pd || []).map(p => `${p.module}:${p.action}`);
    }
  }

  const { data: orgData } = await supabase
    .from('organizations')
    .select('subscription_status, trial_ends_at, name')
    .eq('id', targetOrgId).maybeSingle();

  const tokenPayload = {
    sub:        user.id,
    org_id:     targetOrgId,
    email:      user.email,
    full_name:  user.full_name,
    role:       role?.name,
    department: user.department,
    permissions,
  };

  return {
    access_token:  generateAccessToken(tokenPayload),
    refresh_token: generateRefreshToken({ sub: user.id, org_id: targetOrgId }),
    expires_in:    env.JWT_EXPIRES_IN,
    user: {
      id:          user.id,
      org_id:      targetOrgId,
      full_name:   user.full_name,
      email:       user.email,
      role:        role?.name,
      department:  user.department,
      permissions,
      must_change_password: user.must_change_password || false,
    },
    org: {
      id:                  targetOrgId,
      name:                orgData?.name,
      subscription_status: orgData?.subscription_status || 'trial',
      trial_ends_at:       orgData?.trial_ends_at || null,
    },
  };
};

// ─── Create additional org for existing user ──────────────────
// Called when a logged-in user wants to add a second/third property.
// No new Auth user is created — we just create the org + membership.
export const createAdditionalOrg = async (userId, orgName) => {
  // 1. Generate slug
  const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/, '');
  const { data: existingSlug } = await supabase
    .from('organizations').select('id').eq('slug', slug).maybeSingle();
  if (existingSlug) throw new AppError('Organization name already taken. Try a different name.', 409);

  // 2. Create organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: orgName, slug, plan: 'trial', status: 'active',
      subscription_status: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    }).select().single();
  if (orgError) throw new AppError('Failed to create organization.', 500);

  // 3. Create Admin role for the new org
  const { data: adminRole } = await supabase
    .from('roles').insert({ org_id: org.id, name: 'Admin', description: 'Full system access' })
    .select('id').single();

  if (adminRole) {
    const { data: allPerms } = await supabase.from('permissions').select('id');
    if (allPerms?.length) {
      await supabase.from('role_permissions').insert(
        allPerms.map(p => ({ role_id: adminRole.id, permission_id: p.id }))
      );
    }
  }

  // 4. Link existing user to new org via membership
  const { error: memberError } = await supabase.from('org_memberships').insert({
    user_id: userId, org_id: org.id,
    role_id: adminRole?.id || null, is_active: true,
  });
  if (memberError) {
    // Clean up org if membership failed (likely table missing — run migration 013)
    await supabase.from('organizations').delete().eq('id', org.id);
    throw new AppError(`Failed to link user to new organisation: ${memberError.message}. Ensure migration 013 has been run.`, 500);
  }

  // 5. Seed hotel_config
  await supabase.from('hotel_config').insert({
    org_id: org.id, hotel_name: orgName,
    currency: 'NGN', currency_symbol: '₦',
    tax_rate: 7.5, service_charge: 10,
    timezone: 'Africa/Lagos',
    check_in_time: '14:00', check_out_time: '11:00',
  });

  return {
    org_id: org.id, name: org.name, slug: org.slug,
    subscription_status: org.subscription_status,
    trial_ends_at: org.trial_ends_at, status: org.status,
    role_id: adminRole?.id,
  };
};
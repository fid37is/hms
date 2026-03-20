// src/middleware/superAdmin.js
//
// Guards all /api/v1/super-admin/* routes.
// Super-admin tokens carry { is_super_admin: true } — no org_id.
// The regular `authenticate` middleware rejects them, so they need this.

import jwt                        from 'jsonwebtoken';
import { env }                    from '../config/env.js';
import { supabase }               from '../config/supabase.js';
import { sendUnauthorized, sendForbidden } from '../utils/response.js';

export const requireSuperAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return sendUnauthorized(res, 'No token provided.');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Token expired. Please log in again.');
    }
    return sendUnauthorized(res, 'Invalid token.');
  }

  if (!decoded.is_super_admin) {
    return sendForbidden(res, 'Super-admin access required.');
  }

  // Verify the admin still exists and is active in the DB
  const { data: admin, error } = await supabase
    .from('platform_admins')
    .select('id, email, full_name, is_active, role')
    .eq('id', decoded.sub)
    .maybeSingle();

  if (error || !admin) {
    return sendUnauthorized(res, 'Admin account not found.');
  }
  if (!admin.is_active) {
    return sendForbidden(res, 'Admin account has been deactivated.');
  }

  req.superAdmin = { id: admin.id, email: admin.email, full_name: admin.full_name, role: admin.role || 'admin' };
  next();
};

// Only the super_admin role can manage other admins
export const requireSuperAdminRole = (req, res, next) => {
  if (req.superAdmin?.role !== 'super_admin') {
    return sendForbidden(res, 'Only the primary super admin can manage other admin accounts.');
  }
  next();
};
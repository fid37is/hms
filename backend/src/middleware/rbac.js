// src/middleware/rbac.js

import { sendForbidden } from '../utils/response.js';
import { ROLES }         from '../config/constants.js';

// Check if user has a specific permission
// Usage: requirePermission('reservations:create')
export const requirePermission = (permission) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return sendForbidden(res, 'Authentication required.');
    }

    // Admins bypass all permission checks
    if (user.role?.toLowerCase() === ROLES.ADMIN) {
      return next();
    }

    const userPermissions = user.permissions || [];

    // Wildcard permission grants full access
    if (userPermissions.includes('*')) {
      return next();
    }

    if (!userPermissions.includes(permission)) {
      return sendForbidden(
        res,
        `You do not have permission to perform this action. Required: ${permission}`
      );
    }

    next();
  };
};

// Check if user has one of multiple permissions (OR logic)
// Usage: requireAnyPermission(['billing:void', 'billing:approve'])
export const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return sendForbidden(res, 'Authentication required.');
    }

    if (user.role?.toLowerCase() === ROLES.ADMIN) {
      return next();
    }

    const userPermissions = user.permissions || [];

    if (userPermissions.includes('*')) {
      return next();
    }
    const hasAny = permissions.some((p) => userPermissions.includes(p));

    if (!hasAny) {
      return sendForbidden(
        res,
        `You do not have permission to perform this action.`
      );
    }

    next();
  };
};

// Check if user has a specific role
// Usage: requireRole('manager')
export const requireRole = (...roles) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return sendForbidden(res, 'Authentication required.');
    }

    if (!roles.includes(user.role)) {
      return sendForbidden(res, 'You do not have access to this resource.');
    }

    next();
  };
};
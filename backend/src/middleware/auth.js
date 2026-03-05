// src/middleware/auth.js

import jwt           from 'jsonwebtoken';
import { env }       from '../config/env.js';
import { sendUnauthorized, sendForbidden } from '../utils/response.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendUnauthorized(res, 'No token provided.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!decoded.org_id) {
      return sendUnauthorized(res, 'Session expired. Please log in again.');
    }
    // Ensure org_id is always a plain string, never an object
    const orgId = typeof decoded.org_id === 'string'
      ? decoded.org_id
      : String(decoded.org_id?.id || decoded.org_id);
    if (!orgId || orgId === 'undefined' || orgId === '[object Object]') {
      return sendUnauthorized(res, 'Session expired. Please log in again.');
    }
    req.user  = decoded;
    req.orgId = orgId;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Token expired. Please log in again.');
    }
    return sendUnauthorized(res, 'Invalid token.');
  }
};

// Middleware: authenticate requests using a public API key (for guest website)
export const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return sendUnauthorized(res, 'API key required.');

  try {
    const { supabase } = await import('../config/supabase.js');
    const bcrypt       = (await import('bcryptjs')).default;

    const prefix = apiKey.slice(0, 15);
    const { data: keys } = await supabase
      .from('api_keys')
      .select('id, org_id, key_hash, is_active, expires_at')
      .eq('key_prefix', prefix)
      .eq('is_active', true);

    if (!keys?.length) return sendUnauthorized(res, 'Invalid API key.');

    // Find matching key by comparing hash
    let matched = null;
    for (const k of keys) {
      if (await bcrypt.compare(apiKey, k.key_hash)) { matched = k; break; }
    }

    if (!matched) return sendUnauthorized(res, 'Invalid API key.');
    if (matched.expires_at && new Date(matched.expires_at) < new Date())
      return sendForbidden(res, 'API key expired.');

    // Fire-and-forget last_used_at update
    supabase.from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', matched.id).then(() => {});

    req.orgId    = matched.org_id;
    req.isApiKey = true;
    next();
  } catch (err) {
    return sendUnauthorized(res, 'API key validation failed.');
  }
};
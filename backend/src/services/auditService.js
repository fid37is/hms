// src/services/auditService.js
// Schema ref:
// audit_log: id, user_id, action NN, table_name, record_id,
//   old_values jsonb, new_values jsonb, ip_address, user_agent, notes, created_at

import { supabase } from '../config/supabase.js';

/**
 * Log an auditable action. Fire-and-forget — never throws,
 * so a logging failure never breaks the main request.
 */
export const audit = async ({
  userId,
  action,
  tableName = null,
  recordId  = null,
  oldValues = null,
  newValues = null,
  notes     = null,
  req       = null,
}) => {
  try {
    await supabase.from('audit_log').insert({
      user_id:    userId    || null,
      action,
      table_name: tableName || null,
      record_id:  recordId  || null,
      old_values: oldValues || null,
      new_values: newValues || null,
      ip_address: req?.ip   || null,
      user_agent: req?.headers?.['user-agent'] || null,
      notes:      notes     || null,
    });
  } catch (_) {
    // Silent fail — audit log must never break business logic
  }
};

/**
 * Convenience wrappers
 */
export const auditCreate = (userId, tableName, recordId, newValues, req) =>
  audit({ userId, action: 'CREATE', tableName, recordId, newValues, req });

export const auditUpdate = (userId, tableName, recordId, oldValues, newValues, req) =>
  audit({ userId, action: 'UPDATE', tableName, recordId, oldValues, newValues, req });

export const auditDelete = (userId, tableName, recordId, oldValues, req) =>
  audit({ userId, action: 'DELETE', tableName, recordId, oldValues, req });

export const auditLogin = (userId, notes, req) =>
  audit({ userId, action: 'LOGIN', notes, req });

export const auditLogout = (userId, req) =>
  audit({ userId, action: 'LOGOUT', req });

/**
 * Query the audit log (admin only)
 */
export const getAuditLog = async (filters = {}, page = 1, limit = 50) => {
  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters.user_id)    query = query.eq('user_id', filters.user_id);
  if (filters.table_name) query = query.eq('table_name', filters.table_name);
  if (filters.action)     query = query.eq('action', filters.action);
  if (filters.date_from)  query = query.gte('created_at', filters.date_from);
  if (filters.date_to)    query = query.lte('created_at', filters.date_to);

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(`Failed to fetch audit log: ${error.message}`);
  return { data, total: count };
};
// src/controllers/reportController.js

import * as reportService from '../services/reportService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { supabase } from '../config/supabase.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const data = await reportService.getDashboardStats(req.orgId);
    return sendSuccess(res, data, 'Dashboard stats retrieved.');
  } catch (err) { next(err); }
};

export const getOccupancyReport = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    if (!date_from || !date_to) return res.status(400).json({ success: false, message: 'date_from and date_to required.' });
    const data = await reportService.getOccupancyReport(req.orgId, date_from, date_to);
    return sendSuccess(res, data, 'Occupancy report retrieved.');
  } catch (err) { next(err); }
};

export const getRevenueReport = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    if (!date_from || !date_to) return res.status(400).json({ success: false, message: 'date_from and date_to required.' });
    const data = await reportService.getRevenueReport(req.orgId, date_from, date_to);
    return sendSuccess(res, data, 'Revenue report retrieved.');
  } catch (err) { next(err); }
};

export const getGuestReport = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    if (!date_from || !date_to) return res.status(400).json({ success: false, message: 'date_from and date_to required.' });
    const data = await reportService.getGuestReport(req.orgId, date_from, date_to);
    return sendSuccess(res, data, 'Guest report retrieved.');
  } catch (err) { next(err); }
};

export const getHousekeepingReport = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    if (!date_from || !date_to) return res.status(400).json({ success: false, message: 'date_from and date_to required.' });
    const data = await reportService.getHousekeepingReport(req.orgId, date_from, date_to);
    return sendSuccess(res, data, 'Housekeeping report retrieved.');
  } catch (err) { next(err); }
};

export const getAuditLog = async (req, res, next) => {
  try {
    const { user_id, table_name, action, date_from, date_to, page = 1, limit = 50 } = req.query;
    const { getAuditLog } = await import('../services/auditService.js');
    const { data, total } = await getAuditLog(req.orgId, { user_id, table_name, action, date_from, date_to }, Number(page), Number(limit));
    return res.json({ success: true, data, total, meta: { page: Number(page), totalPages: Math.ceil((total || 0) / Number(limit)), hasPrev: Number(page) > 1, hasNext: Number(page) * Number(limit) < (total || 0) } });
  } catch (err) { next(err); }
};

export const getNightAudit = async (req, res, next) => {
  try {
    const { date } = req.query;
    const auditDate = date || new Date().toISOString().split('T')[0];
    const data = await reportService.getNightAudit(req.orgId, auditDate);
    return sendSuccess(res, data, 'Night audit retrieved.');
  } catch (err) { next(err); }
};
export const getGroupSummaryStats = async (req, res, next) => {
  try {
    // org_ids must be passed as comma-separated query param or array
    // Verify user has membership in each requested org
    const requestedIds = (req.query.org_ids || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!requestedIds.length) return sendError(res, 'org_ids query param required.', 400);

    // Get all orgs this user actually belongs to
    const { data: memberships } = await supabase.from('org_memberships')
      .select('org_id').eq('user_id', req.user.sub).eq('is_active', true);

    const allowedIds = (memberships || []).map(m => m.org_id);
    const verifiedIds = requestedIds.filter(id => allowedIds.includes(id));

    if (!verifiedIds.length) return sendError(res, 'No accessible orgs found.', 403);

    const data = await reportService.getGroupSummary(verifiedIds);
    return sendSuccess(res, data, 'Group summary retrieved.');
  } catch (e) { next(e); }
};
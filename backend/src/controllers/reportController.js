// src/controllers/reportController.js

import * as reportService from '../services/reportService.js';
import { sendSuccess }    from '../utils/response.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const data = await reportService.getDashboardStats(req.orgId);
    return sendSuccess(res, data, 'Dashboard stats retrieved.');
  } catch (err) { next(err); }
};

export const getOccupancyReport = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    if (!date_from || !date_to)
      return res.status(400).json({ success: false, message: 'date_from and date_to are required.' });
    const data = await reportService.getOccupancyReport(req.orgId, date_from, date_to);
    return sendSuccess(res, data, 'Occupancy report retrieved.');
  } catch (err) { next(err); }
};

export const getRevenueReport = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    if (!date_from || !date_to)
      return res.status(400).json({ success: false, message: 'date_from and date_to are required.' });
    const data = await reportService.getRevenueReport(req.orgId, date_from, date_to);
    return sendSuccess(res, data, 'Revenue report retrieved.');
  } catch (err) { next(err); }
};

export const getNightAudit = async (req, res, next) => {
  try {
    const data = await reportService.getNightAudit(req.orgId, req.query.date);
    return sendSuccess(res, data, 'Night audit retrieved.');
  } catch (err) { next(err); }
};

export const getGuestReport = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    if (!date_from || !date_to)
      return res.status(400).json({ success: false, message: 'date_from and date_to are required.' });
    const data = await reportService.getGuestReport(req.orgId, date_from, date_to);
    return sendSuccess(res, data, 'Guest report retrieved.');
  } catch (err) { next(err); }
};

export const getAuditLog = async (req, res, next) => {
  try {
    const { user_id, table_name, action, date_from, date_to, page = 1, limit = 50 } = req.query;
    const { getAuditLog } = await import('../services/auditService.js');
    const { data, total } = await getAuditLog(
      req.orgId,
      { user_id, table_name, action, date_from, date_to },
      Number(page), Number(limit)
    );
    return sendSuccess(res, { data, total }, 'Audit log retrieved.');
  } catch (err) { next(err); }
};
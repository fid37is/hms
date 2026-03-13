// src/controllers/nightAuditController.js

import * as nightAuditService from '../services/nightAuditService.js';
import { notify }             from '../services/notificationService.js';
import { sendSuccess }        from '../utils/response.js';

const today = () => new Date().toISOString().split('T')[0];

// GET /night-audit/preview?date=
export const getPreview = async (req, res, next) => {
  try {
    const date = req.query.date || today();
    const [preview, status] = await Promise.all([
      nightAuditService.getAuditPreview(req.orgId, date),
      nightAuditService.getAuditStatus(req.orgId, date),
    ]);
    return sendSuccess(res, { ...preview, run: status }, 'Audit preview loaded.');
  } catch (err) { next(err); }
};

// POST /night-audit/run
export const runAudit = async (req, res, next) => {
  try {
    const date = req.body.date || today();
    const result = await nightAuditService.runNightAudit(req.orgId, date, req.user.sub);

    notify(req.app, {
      orgId:  req.orgId,
      type:   'reservation',
      title:  'Night Audit Completed',
      body:   `${date} — ${result.summary.charges_posted} charges posted · ${result.summary.no_shows} no-shows · Revenue: posted`,
      link:   '/night-audit',
    });

    return sendSuccess(res, result, 'Night audit completed successfully.');
  } catch (err) { next(err); }
};

// GET /night-audit/history
export const getHistory = async (req, res, next) => {
  try {
    const data = await nightAuditService.getAuditHistory(req.orgId, Number(req.query.limit || 30));
    return sendSuccess(res, data, 'Audit history retrieved.');
  } catch (err) { next(err); }
};

// GET /night-audit/status?date=
export const getStatus = async (req, res, next) => {
  try {
    const date = req.query.date || today();
    const data = await nightAuditService.getAuditStatus(req.orgId, date);
    return sendSuccess(res, data, 'Audit status retrieved.');
  } catch (err) { next(err); }
};
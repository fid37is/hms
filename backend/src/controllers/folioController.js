// src/controllers/folioController.js

import * as folioService from '../services/folioService.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const getFolioByReservation = async (req, res, next) => {
  try {
    const data = await folioService.getFolioByReservation(req.orgId, req.params.reservationId);
    return sendSuccess(res, data, 'Folio retrieved.');
  } catch (err) { next(err); }
};

export const getFolioById = async (req, res, next) => {
  try {
    const data = await folioService.getFolioById(req.orgId, req.params.id);
    return sendSuccess(res, data, 'Folio retrieved.');
  } catch (err) { next(err); }
};

export const getFolioSummary = async (req, res, next) => {
  try {
    const data = await folioService.getFolioSummary(req.orgId, req.params.id);
    return sendSuccess(res, data, 'Folio summary retrieved.');
  } catch (err) { next(err); }
};

export const addCharge = async (req, res, next) => {
  try {
    const data = await folioService.addCharge(req.orgId, req.params.id, req.body, req.user.sub);
    return sendCreated(res, data, 'Charge added.');
  } catch (err) { next(err); }
};

export const voidCharge = async (req, res, next) => {
  try {
    const data = await folioService.voidCharge(req.orgId, req.params.id, req.params.itemId, req.body.reason, req.user.sub);
    return sendSuccess(res, data, 'Charge voided.');
  } catch (err) { next(err); }
};

export const addPayment = async (req, res, next) => {
  try {
    const data = await folioService.addPayment(req.orgId, req.params.id, req.body, req.user.sub);
    return sendCreated(res, data, 'Payment recorded.');
  } catch (err) { next(err); }
};

export const refundPayment = async (req, res, next) => {
  try {
    const data = await folioService.refundPayment(req.orgId, req.params.id, req.params.paymentId, req.body.reason);
    return sendSuccess(res, data, 'Payment refunded.');
  } catch (err) { next(err); }
};

export const openShift = async (req, res, next) => {
  try {
    const data = await folioService.openShift(req.orgId, req.user.sub, req.body.opening_balance || 0);
    return sendCreated(res, data, 'Shift opened.');
  } catch (err) { next(err); }
};

export const closeShift = async (req, res, next) => {
  try {
    const data = await folioService.closeShift(req.orgId, req.user.sub, req.body.closing_balance, req.body.notes);
    return sendSuccess(res, data, 'Shift closed.');
  } catch (err) { next(err); }
};

export const getOpenFolios = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 25;
    const data = await folioService.getOpenFolios(req.orgId, page, limit);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
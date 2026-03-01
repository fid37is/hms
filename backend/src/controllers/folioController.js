// src/controllers/folioController.js

import * as folioService from '../services/folioService.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const getFolioByReservation = async (req, res, next) => {
  try {
    const data = await folioService.getFolioByReservation(req.params.reservationId);
    return sendSuccess(res, data, 'Folio retrieved.');
  } catch (err) { next(err); }
};

export const getFolioById = async (req, res, next) => {
  try {
    const data = await folioService.getFolioById(req.params.id);
    return sendSuccess(res, data, 'Folio retrieved.');
  } catch (err) { next(err); }
};

export const getFolioSummary = async (req, res, next) => {
  try {
    const data = await folioService.getFolioSummary(req.params.id);
    return sendSuccess(res, data, 'Folio summary retrieved.');
  } catch (err) { next(err); }
};

export const addCharge = async (req, res, next) => {
  try {
    const data = await folioService.addCharge(req.params.id, req.body, req.user.sub);
    return sendCreated(res, data, 'Charge added.');
  } catch (err) { next(err); }
};

export const voidCharge = async (req, res, next) => {
  try {
    const data = await folioService.voidCharge(
      req.params.id,
      req.params.itemId,
      req.body.reason,
      req.user.sub
    );
    return sendSuccess(res, data, 'Charge voided.');
  } catch (err) { next(err); }
};

export const addPayment = async (req, res, next) => {
  try {
    const data = await folioService.addPayment(req.params.id, req.body, req.user.sub);
    return sendCreated(res, data, 'Payment recorded.');
  } catch (err) { next(err); }
};

export const refundPayment = async (req, res, next) => {
  try {
    const data = await folioService.refundPayment(
      req.params.id,
      req.params.paymentId,
      req.body.reason,
      req.user.sub
    );
    return sendSuccess(res, data, 'Payment refunded.');
  } catch (err) { next(err); }
};

export const openShift = async (req, res, next) => {
  try {
    const data = await folioService.openShift(req.user.sub, req.body.opening_balance || 0);
    return sendCreated(res, data, 'Shift opened.');
  } catch (err) { next(err); }
};

export const closeShift = async (req, res, next) => {
  try {
    const data = await folioService.closeShift(
      req.user.sub,
      req.body.closing_balance,
      req.body.notes
    );
    return sendSuccess(res, data, 'Shift closed.');
  } catch (err) { next(err); }
};
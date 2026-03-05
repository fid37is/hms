// src/controllers/guestController.js

import * as guestService from '../services/guestService.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const getAllGuests = async (req, res, next) => {
  try {
    const orgId   = req.orgId;
    const { search, category, page = 1, limit = 20 } = req.query;
    const data = await guestService.getAllGuests(
      orgId, { search, category }, Number(page), Number(limit)
    );
    return sendSuccess(res, data, 'Guests retrieved.');
  } catch (err) { next(err); }
};

export const getGuestById = async (req, res, next) => {
  try {
    const data = await guestService.getGuestById(req.orgId, req.params.id);
    return sendSuccess(res, data, 'Guest retrieved.');
  } catch (err) { next(err); }
};

export const searchGuests = async (req, res, next) => {
  try {
    const data = await guestService.searchGuests(req.orgId, req.query.q || '');
    return sendSuccess(res, data, 'Guests found.');
  } catch (err) { next(err); }
};

export const createGuest = async (req, res, next) => {
  try {
    const data = await guestService.createGuest(req.orgId, req.body);
    return sendCreated(res, data, 'Guest created.');
  } catch (err) { next(err); }
};

export const updateGuest = async (req, res, next) => {
  try {
    const data = await guestService.updateGuest(req.orgId, req.params.id, req.body);
    return sendSuccess(res, data, 'Guest updated.');
  } catch (err) { next(err); }
};

export const deleteGuest = async (req, res, next) => {
  try {
    const data = await guestService.deleteGuest(req.orgId, req.params.id);
    return sendSuccess(res, data, 'Guest deleted.');
  } catch (err) { next(err); }
};

export const getGuestStayHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const data = await guestService.getGuestStayHistory(
      req.orgId, req.params.id, Number(page), Number(limit)
    );
    return sendSuccess(res, data, 'Stay history retrieved.');
  } catch (err) { next(err); }
};

export const updateLoyaltyPoints = async (req, res, next) => {
  try {
    const { points, operation } = req.body;
    const data = await guestService.updateLoyaltyPoints(
      req.orgId, req.params.id, points, operation
    );
    return sendSuccess(res, data, 'Loyalty points updated.');
  } catch (err) { next(err); }
};

export const flagGuest = async (req, res, next) => {
  try {
    const { category, notes } = req.body;
    const data = await guestService.flagGuest(req.orgId, req.params.id, category, notes);
    return sendSuccess(res, data, 'Guest flagged.');
  } catch (err) { next(err); }
};
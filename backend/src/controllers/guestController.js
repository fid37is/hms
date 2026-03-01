// src/controllers/guestController.js

import * as guestService from '../services/guestService.js';
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
} from '../utils/response.js';

export const getAllGuests = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const { data, total } = await guestService.getAllGuests(
      { search, category },
      Number(page),
      Number(limit)
    );
    return sendPaginated(res, data, total, page, limit, 'Guests retrieved.');
  } catch (err) { next(err); }
};

export const getGuestById = async (req, res, next) => {
  try {
    const data = await guestService.getGuestById(req.params.id);
    return sendSuccess(res, data, 'Guest retrieved.');
  } catch (err) { next(err); }
};

export const searchGuests = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return sendSuccess(res, [], 'Enter at least 2 characters to search.');
    }
    const data = await guestService.searchGuests(q.trim());
    return sendSuccess(res, data, 'Search results retrieved.');
  } catch (err) { next(err); }
};

export const createGuest = async (req, res, next) => {
  try {
    const data = await guestService.createGuest(req.body);
    return sendCreated(res, data, 'Guest created.');
  } catch (err) { next(err); }
};

export const updateGuest = async (req, res, next) => {
  try {
    const data = await guestService.updateGuest(req.params.id, req.body);
    return sendSuccess(res, data, 'Guest updated.');
  } catch (err) { next(err); }
};

export const deleteGuest = async (req, res, next) => {
  try {
    const data = await guestService.deleteGuest(req.params.id);
    return sendSuccess(res, data, 'Guest deleted.');
  } catch (err) { next(err); }
};

export const getGuestStayHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { data, total } = await guestService.getGuestStayHistory(
      req.params.id,
      Number(page),
      Number(limit)
    );
    return sendPaginated(res, data, total, page, limit, 'Stay history retrieved.');
  } catch (err) { next(err); }
};

export const updateLoyaltyPoints = async (req, res, next) => {
  try {
    const { points, operation } = req.body;
    const data = await guestService.updateLoyaltyPoints(req.params.id, points, operation);
    return sendSuccess(res, data, 'Loyalty points updated.');
  } catch (err) { next(err); }
};

export const flagGuest = async (req, res, next) => {
  try {
    const { category, notes } = req.body;
    const data = await guestService.flagGuest(req.params.id, category, notes);
    return sendSuccess(res, data, 'Guest category updated.');
  } catch (err) { next(err); }
};
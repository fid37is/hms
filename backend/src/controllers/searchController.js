// src/controllers/searchController.js

import { globalSearch } from '../services/searchService.js';
import { sendSuccess }  from '../utils/response.js';

export const search = async (req, res, next) => {
  try {
    const q = req.query.q || req.query.query || '';
    const results = await globalSearch(req.orgId, q);
    sendSuccess(res, results);
  } catch (err) {
    next(err);
  }
};
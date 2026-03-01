// src/controllers/configController.js

import * as configService from '../services/configService.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const getConfig = async (req, res, next) => {
  try {
    const data = await configService.getConfig();
    return sendSuccess(res, data, 'Hotel configuration retrieved.');
  } catch (err) { next(err); }
};

export const initConfig = async (req, res, next) => {
  try {
    const data = await configService.initConfig(req.body);
    return sendCreated(res, data, 'Hotel configuration created.');
  } catch (err) { next(err); }
};

export const updateConfig = async (req, res, next) => {
  try {
    const data = await configService.updateConfig(req.body);
    return sendSuccess(res, data, 'Hotel configuration updated.');
  } catch (err) { next(err); }
};
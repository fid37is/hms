// src/controllers/configController.js

import * as configService from '../services/configService.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const getConfig = async (req, res, next) => {
  try {
    const data = await configService.getConfig(req.user.org_id);
    return sendSuccess(res, data, 'Hotel configuration retrieved.');
  } catch (err) { next(err); }
};

export const initConfig = async (req, res, next) => {
  try {
    const data = await configService.initConfig(req.user.org_id, req.body);
    return sendCreated(res, data, 'Hotel configuration created.');
  } catch (err) { next(err); }
};

export const updateConfig = async (req, res, next) => {
  try {
    const data = await configService.updateConfig(req.user.org_id, req.body);
    return sendSuccess(res, data, 'Hotel configuration updated.');
  } catch (err) { next(err); }
};

// Public — org resolved by resolveOrg middleware via subdomain / API key / DEV_ORG_ID
export const getPublicConfig = async (req, res, next) => {
  try {
    const data = await configService.getConfig(req.orgId);
    const { id, created_at, updated_at, receipt_footer, ...publicData } = data;
    return sendSuccess(res, publicData, 'Hotel configuration retrieved.');
  } catch (err) { next(err); }
};
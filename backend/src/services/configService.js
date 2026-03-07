// src/services/configService.js

import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

export const getConfig = async (orgId) => {
  const { data, error } = await supabase
    .from('hotel_config').select('*').eq('org_id', orgId).maybeSingle();

  if (error) throw new AppError(`Failed to fetch configuration: ${error.message}`, 500);
  if (!data) throw new AppError('Hotel configuration not found. Please complete setup in Settings.', 404);
  return data;
};

export const updateConfig = async (orgId, payload) => {
  const config = await getConfig(orgId);

  const { data, error } = await supabase
    .from('hotel_config').update(payload).eq('org_id', orgId).eq('id', config.id).select().single();

  if (error) throw new AppError(`Failed to update configuration: ${error.message}`, 500);
  return data;
};

export const initConfig = async (orgId, payload) => {
  const { data: existing } = await supabase
    .from('hotel_config').select('id').eq('org_id', orgId).maybeSingle();

  if (existing) throw new AppError('Configuration already exists. Use PATCH to update.', 409);

  const { data, error } = await supabase
    .from('hotel_config').insert({ ...payload, org_id: orgId }).select().single();

  if (error) throw new AppError(`Failed to create configuration: ${error.message}`, 500);
  return data;
};
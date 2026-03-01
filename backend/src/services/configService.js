// src/services/configService.js
// Schema ref:
// hotel_config: id, hotel_name NN, address, phone, email, logo_url,
//   primary_color('#1F4E8C'), currency('NGN'), currency_symbol('₦'),
//   tax_rate(7.50), service_charge(10.00), timezone('Africa/Lagos'),
//   check_in_time(14:00), check_out_time(12:00), receipt_footer,
//   created_at, updated_at

import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

export const getConfig = async () => {
  const { data, error } = await supabase
    .from('hotel_config')
    .select('*')
    .single();

  if (error || !data) throw new AppError('Hotel configuration not found.', 404);
  return data;
};

export const updateConfig = async (payload) => {
  const config = await getConfig();

  const { data, error } = await supabase
    .from('hotel_config')
    .update(payload)
    .eq('id', config.id)
    .select()
    .single();

  if (error) throw new AppError(`Failed to update configuration: ${error.message}`, 500);
  return data;
};

export const initConfig = async (payload) => {
  // Check if config already exists
  const { data: existing } = await supabase
    .from('hotel_config')
    .select('id')
    .single();

  if (existing) throw new AppError('Hotel configuration already exists. Use PATCH to update.', 409);

  const { data, error } = await supabase
    .from('hotel_config')
    .insert(payload)
    .select()
    .single();

  if (error) throw new AppError(`Failed to create configuration: ${error.message}`, 500);
  return data;
};
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

const UPDATABLE_FIELDS = new Set([
  'hotel_name', 'tagline', 'description', 'logo_url', 'hero_image_url',
  'address', 'city', 'state', 'country', 'phone', 'email',
  'whatsapp_number', 'google_maps_url',
  'check_in_time', 'check_out_time', 'timezone',
  'primary_color', 'accent_color', 'nav_color', 'btn_color',
  'footer_color', 'surface_color', 'bg_color',
  'nav_text_color', 'btn_text_color', 'footer_text_color',
  'instagram_url', 'facebook_url', 'twitter_url',
  'currency', 'currency_symbol',
  'pay_on_arrival', 'bank_transfer', 'paystack_enabled',
  'paystack_public_key', 'bank_name', 'bank_account_number', 'bank_account_name',
  'tax_rate', 'service_charge',
  'cancellation_policy', 'pets_policy', 'smoking_policy',
  'receipt_footer',
  'layout',
  'content',
  'seo_title',
  'seo_description',
  'seo_keywords',
  'og_image',
  'canonical_url',
  'robots',
]);

export const updateConfig = async (orgId, payload) => {
  const config = await getConfig(orgId);

  const safe = Object.fromEntries(
    Object.entries(payload).filter(([key]) => UPDATABLE_FIELDS.has(key))
  );

  // If content is missing from payload (frontend bug), preserve existing DB value
  if (!('content' in safe) || safe.content === undefined) {
    delete safe.content;
  }

  if (Object.keys(safe).length === 0) {
    throw new AppError('No valid fields to update.', 400);
  }

  console.log('[updateConfig] saving keys:', Object.keys(safe));
  console.log('[updateConfig] content value:', safe.content !== undefined ? JSON.stringify(safe.content).slice(0, 100) : 'NOT INCLUDED (preserving existing)');

  const { data, error } = await supabase
    .from('hotel_config')
    .update(safe)
    .eq('org_id', orgId)
    .eq('id', config.id)
    .select()
    .single();

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
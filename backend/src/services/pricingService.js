// src/services/pricingService.js
// Schema ref:
// rate_plans: id, room_type_id, name, rate(bigint), valid_from date,
//   valid_to date, days_of_week int[](all 0-6), is_active bool(true)
// room_types: id, base_rate bigint NN

import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Get the applicable nightly rate for a room type on a specific date.
 * Priority: active rate_plan matching date + day-of-week > base_rate fallback.
 */
export const getRateForDate = async (roomTypeId, date) => {
  const d          = new Date(date);
  const dayOfWeek  = d.getDay(); // 0=Sun, 6=Sat
  const dateStr    = d.toISOString().split('T')[0];

  // Fetch all active rate plans for this room type
  const { data: plans, error } = await supabase
    .from('rate_plans')
    .select('id, name, rate, valid_from, valid_to, days_of_week')
    .eq('room_type_id', roomTypeId)
    .eq('is_active', true);

  if (error) throw new AppError(`Failed to fetch rate plans: ${error.message}`, 500);

  // Filter plans matching date range and day of week
  const matching = (plans || []).filter((plan) => {
    const afterFrom  = !plan.valid_from || dateStr >= plan.valid_from;
    const beforeTo   = !plan.valid_to   || dateStr <= plan.valid_to;
    const dayMatches = !plan.days_of_week || plan.days_of_week.includes(dayOfWeek);
    return afterFrom && beforeTo && dayMatches;
  });

  // Use the most specific plan (highest rate — typically seasonal/weekend)
  if (matching.length > 0) {
    const best = matching.reduce((a, b) => (a.base_rate > b.base_rate ? a : b));
    return { rate: best.base_rate, source: 'rate_plan', plan_name: best.name };
  }

  // Fall back to room type base rate
  const { data: roomType } = await supabase
    .from('room_types')
    .select('base_rate')
    .eq('id', roomTypeId)
    .single();

  return {
    rate:       roomType?.base_rate || 0,
    source:     'base_rate',
    plan_name:  null,
  };
};

/**
 * Calculate the total cost for a stay.
 * Returns per-night breakdown and total.
 */
export const calculateStayCost = async (roomTypeId, checkInDate, checkOutDate) => {
  const checkIn  = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const nights   = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

  if (nights <= 0) throw new AppError('Check-out must be after check-in.', 400);

  const breakdown = [];
  let total = 0;

  for (let i = 0; i < nights; i++) {
    const date    = new Date(checkIn);
    date.setDate(date.getDate() + i);
    const { rate, source, plan_name } = await getRateForDate(roomTypeId, date);
    breakdown.push({
      date:      date.toISOString().split('T')[0],
      rate,
      source,
      plan_name,
    });
    total += rate;
  }

  // Use first night rate as the "rate_per_night" on the reservation
  const ratePerNight = breakdown[0]?.rate || 0;

  return { nights, rate_per_night: ratePerNight, total_amount: total, breakdown };
};

/**
 * Get the base rate for a room type (no date logic).
 */
export const getBaseRate = async (roomTypeId) => {
  const { data, error } = await supabase
    .from('room_types')
    .select('base_rate')
    .eq('id', roomTypeId)
    .single();

  if (error || !data) throw new AppError('Room type not found.', 404);
  return data.base_rate;
};
// src/services/reportService.js
// Reads from: reservations, rooms, folios, folio_items, payments, guests, housekeeping_tasks

import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

const toDate = (d) => new Date(d).toISOString().split('T')[0];

// ─── Dashboard Stats ──────────────────────────────────────

export const getDashboardStats = async () => {
  const today = toDate(new Date());

  const [
    roomStats,
    todayArrivals,
    todayDepartures,
    inHouseGuests,
    openFoliosBalance,
    pendingHKTasks,
    monthRevenue,
  ] = await Promise.all([

    // Room status breakdown
    supabase.from('rooms')
      .select('status')
      .eq('is_deleted', false),

    // Today arrivals
    supabase.from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('check_in_date', today)
      .in('status', ['confirmed', 'checked_in']),

    // Today departures
    supabase.from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('check_out_date', today)
      .eq('status', 'checked_in'),

    // In-house guests
    supabase.from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'checked_in'),

    // Sum of all open folio balances
    supabase.from('folios')
      .select('balance')
      .eq('status', 'open'),

    // Pending housekeeping tasks
    supabase.from('housekeeping_tasks')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress']),

    // This month's revenue (completed payments)
    supabase.from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  // Process room stats
  const rooms = roomStats.data || [];
  const roomBreakdown = rooms.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const totalRooms    = rooms.length;
  const occupiedRooms = roomBreakdown.occupied || 0;
  const occupancyRate = totalRooms ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;

  const totalOpenBalance = (openFoliosBalance.data || []).reduce((sum, f) => sum + f.balance, 0);
  const monthlyRevenue   = (monthRevenue.data || []).reduce((sum, p) => sum + p.amount, 0);

  return {
    rooms: {
      total:        totalRooms,
      breakdown:    roomBreakdown,
      occupancy_rate: `${occupancyRate}%`,
    },
    today: {
      arrivals:    todayArrivals.count   || 0,
      departures:  todayDepartures.count || 0,
      in_house:    inHouseGuests.count   || 0,
    },
    financials: {
      open_balance:    totalOpenBalance,
      monthly_revenue: monthlyRevenue,
    },
    housekeeping: {
      pending_tasks: pendingHKTasks.count || 0,
    },
  };
};

// ─── Occupancy Report ─────────────────────────────────────

export const getOccupancyReport = async (dateFrom, dateTo) => {
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select(`
      id, check_in_date, check_out_date, status,
      rooms ( id, number, floor, room_types ( name ) )
    `)
    .in('status', ['confirmed', 'checked_in', 'checked_out'])
    .gte('check_in_date', dateFrom)
    .lte('check_out_date', dateTo)
    .order('check_in_date');

  if (error) throw new AppError(`Failed to fetch occupancy data: ${error.message}`, 500);

  const { data: totalRooms } = await supabase
    .from('rooms')
    .select('id', { count: 'exact', head: true })
    .eq('is_deleted', false);

  const nights = Math.ceil(
    (new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24)
  );

  const totalRoomNights = (totalRooms?.length || 0) * nights;
  const occupiedNights  = (reservations || []).reduce((sum, r) => {
    const ci = new Date(r.check_in_date);
    const co = new Date(r.check_out_date);
    return sum + Math.ceil((co - ci) / (1000 * 60 * 60 * 24));
  }, 0);

  return {
    date_from:          dateFrom,
    date_to:            dateTo,
    total_rooms:        totalRooms?.length || 0,
    total_room_nights:  totalRoomNights,
    occupied_nights:    occupiedNights,
    occupancy_rate:     totalRoomNights ? ((occupiedNights / totalRoomNights) * 100).toFixed(1) + '%' : '0%',
    reservations:       reservations || [],
  };
};

// ─── Revenue Report ───────────────────────────────────────

export const getRevenueReport = async (dateFrom, dateTo) => {
  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount, method, created_at')
    .eq('status', 'completed')
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo + 'T23:59:59Z')
    .order('created_at');

  if (error) throw new AppError(`Failed to fetch revenue data: ${error.message}`, 500);

  const { data: charges } = await supabase
    .from('folio_items')
    .select('amount, department, posted_at')
    .eq('is_voided', false)
    .gte('posted_at', dateFrom)
    .lte('posted_at', dateTo + 'T23:59:59Z');

  const p = payments || [];
  const c = charges  || [];

  const totalRevenue = p.reduce((sum, pay) => sum + pay.amount, 0);

  // Revenue by payment method
  const byMethod = p.reduce((acc, pay) => {
    acc[pay.method] = (acc[pay.method] || 0) + pay.amount;
    return acc;
  }, {});

  // Revenue by department (charges)
  const byDepartment = c.reduce((acc, ch) => {
    acc[ch.department] = (acc[ch.department] || 0) + ch.amount;
    return acc;
  }, {});

  return {
    date_from:     dateFrom,
    date_to:       dateTo,
    total_revenue: totalRevenue,
    by_method:     byMethod,
    by_department: byDepartment,
    payment_count: p.length,
  };
};

// ─── Night Audit ──────────────────────────────────────────

export const getNightAudit = async (date) => {
  const dateStr    = toDate(date || new Date());
  const dateStart  = dateStr + 'T00:00:00Z';
  const dateEnd    = dateStr + 'T23:59:59Z';

  const [arrivals, departures, inHouse, payments, charges] = await Promise.all([
    supabase.from('reservations')
      .select('id, reservation_no, guests(full_name, phone), rooms(number), actual_check_in')
      .eq('check_in_date', dateStr)
      .eq('status', 'checked_in'),

    supabase.from('reservations')
      .select('id, reservation_no, guests(full_name), rooms(number), actual_check_out')
      .eq('check_out_date', dateStr)
      .eq('status', 'checked_out'),

    supabase.from('reservations')
      .select('id, reservation_no, guests(full_name), rooms(number), check_out_date')
      .eq('status', 'checked_in'),

    supabase.from('payments')
      .select('payment_no, amount, method, received_at')
      .eq('status', 'completed')
      .gte('created_at', dateStart)
      .lte('created_at', dateEnd),

    supabase.from('folio_items')
      .select('description, department, amount, posted_at')
      .eq('is_voided', false)
      .gte('posted_at', dateStart)
      .lte('posted_at', dateEnd),
  ]);

  const totalPayments = (payments.data || []).reduce((sum, p) => sum + p.amount, 0);
  const totalCharges  = (charges.data  || []).reduce((sum, c) => sum + c.amount, 0);

  return {
    date:             dateStr,
    arrivals:         arrivals.data    || [],
    arrivals_count:   arrivals.data?.length || 0,
    departures:       departures.data  || [],
    departures_count: departures.data?.length || 0,
    in_house:         inHouse.data     || [],
    in_house_count:   inHouse.data?.length || 0,
    payments:         payments.data    || [],
    total_payments:   totalPayments,
    charges:          charges.data     || [],
    total_charges:    totalCharges,
  };
};

// ─── Guest Report ─────────────────────────────────────────

export const getGuestReport = async (dateFrom, dateTo) => {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id, reservation_no, check_in_date, check_out_date,
      total_amount, booking_source, status,
      guests ( id, full_name, nationality, category )
    `)
    .gte('check_in_date', dateFrom)
    .lte('check_in_date', dateTo)
    .order('check_in_date', { ascending: false });

  if (error) throw new AppError(`Failed to fetch guest data: ${error.message}`, 500);

  const reservations = data || [];
  const bySource     = reservations.reduce((acc, r) => {
    acc[r.booking_source] = (acc[r.booking_source] || 0) + 1;
    return acc;
  }, {});

  const byNationality = reservations.reduce((acc, r) => {
    const nat = r.guests?.nationality || 'Unknown';
    acc[nat] = (acc[nat] || 0) + 1;
    return acc;
  }, {});

  return {
    date_from:       dateFrom,
    date_to:         dateTo,
    total_guests:    reservations.length,
    by_source:       bySource,
    by_nationality:  byNationality,
    reservations,
  };
};
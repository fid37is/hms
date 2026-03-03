// src/services/reportService.js
// Reads from: reservations, rooms, folios, folio_items, payments, guests, housekeeping_tasks

import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

const toDate = (d) => new Date(d).toISOString().split('T')[0];

// ─── Dashboard Stats ──────────────────────────────────────

export const getDashboardStats = async () => {
  const now        = new Date();
  const today      = toDate(now);
  const tomorrow   = toDate(new Date(now.getTime() + 86400000));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekAgo    = new Date(now.getTime() - 6 * 86400000);

  // Build last-7-days date array
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAgo.getTime() + i * 86400000);
    return toDate(d);
  });

  const [
    roomStats,
    todayArrivals,
    todayDepartures,
    inHouseGuests,
    openFoliosBalance,
    pendingHKTasks,
    monthRevenue,
    recentReservations,
    upcomingArrivals,
    lowStockItems,
    weekPayments,
    maintenanceOpen,
    newGuestsMonth,
  ] = await Promise.all([

    supabase.from('rooms').select('status').eq('is_deleted', false),

    supabase.from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('check_in_date', today).in('status', ['confirmed', 'checked_in']),

    supabase.from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('check_out_date', today).eq('status', 'checked_in'),

    supabase.from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'checked_in'),

    supabase.from('folios').select('balance').eq('status', 'open'),

    supabase.from('housekeeping_tasks')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress']),

    supabase.from('payments')
      .select('amount').eq('status', 'completed')
      .gte('created_at', monthStart),

    // Recent reservations — last 5
    supabase.from('reservations')
      .select('id, reference_number, status, check_in_date, check_out_date, guests(name), rooms(number)')
      .order('created_at', { ascending: false })
      .limit(5),

    // Upcoming arrivals next 7 days
    supabase.from('reservations')
      .select('id, reference_number, check_in_date, guests(name), rooms(number)')
      .eq('status', 'confirmed')
      .gte('check_in_date', today)
      .lte('check_in_date', toDate(new Date(now.getTime() + 7 * 86400000)))
      .order('check_in_date')
      .limit(5),

    // Low stock items
    supabase.from('inventory_items')
      .select('id, name, category, current_stock, reorder_level')
      .eq('is_active', true)
      .filter('current_stock', 'lte', supabase.raw('reorder_level'))
      .limit(5),

    // Revenue per day last 7 days
    supabase.from('payments')
      .select('amount, created_at').eq('status', 'completed')
      .gte('created_at', weekAgo.toISOString()),

    // Open maintenance orders
    supabase.from('maintenance_orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress']),

    // New guests this month
    supabase.from('guests')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthStart),
  ]);

  // Room breakdown
  const rooms = roomStats.data || [];
  const roomBreakdown = rooms.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  const totalRooms    = rooms.length;
  const occupiedRooms = (roomBreakdown.occupied || 0) + (roomBreakdown.clean || 0);
  const occupancyRate = totalRooms ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;

  const totalOpenBalance = (openFoliosBalance.data || []).reduce((sum, f) => sum + (f.balance || 0), 0);
  const monthlyRevenue   = (monthRevenue.data || []).reduce((sum, p) => sum + (p.amount || 0), 0);

  // Revenue chart — group payments by day
  const revenueByDay = last7Days.map(date => {
    const total = (weekPayments.data || [])
      .filter(p => p.created_at.startsWith(date))
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    return { date, amount: total };
  });

  // Low stock — use raw filter fallback since .raw may not work
  const lowStock = (lowStockItems.data || []).filter(
    item => Number(item.current_stock) <= Number(item.reorder_level)
  );

  return {
    rooms: {
      total:          totalRooms,
      breakdown:      roomBreakdown,
      occupancy_rate: `${occupancyRate}%`,
    },
    today: {
      arrivals:   todayArrivals.count   || 0,
      departures: todayDepartures.count || 0,
      in_house:   inHouseGuests.count   || 0,
    },
    financials: {
      open_balance:    totalOpenBalance,
      monthly_revenue: monthlyRevenue,
      revenue_chart:   revenueByDay,
    },
    housekeeping: {
      pending_tasks: pendingHKTasks.count || 0,
    },
    maintenance: {
      open_orders: maintenanceOpen.count || 0,
    },
    guests: {
      new_this_month: newGuestsMonth.count || 0,
    },
    recent_reservations: recentReservations.data || [],
    upcoming_arrivals:   upcomingArrivals.data   || [],
    low_stock_alerts:    lowStock,
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
    by_method:     Object.entries(byMethod).map(([method, total]) => ({ method, total })),
    by_department: Object.entries(byDepartment).map(([department, total]) => ({ department, total })),
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
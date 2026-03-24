// src/services/reportService.js

import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

const toDate = (d) => new Date(d).toISOString().split('T')[0];

// ─── Dashboard Stats ──────────────────────────────────────

export const getDashboardStats = async (orgId) => {
  const now        = new Date();
  const today      = toDate(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekAgo    = new Date(now.getTime() - 6 * 86400000);

  const last7Days = Array.from({ length: 7 }, (_, i) =>
    toDate(new Date(weekAgo.getTime() + i * 86400000)));

  const [
    roomStats, todayArrivals, todayDepartures, inHouse,
    openFolios, pendingHK, monthRevenue, recentRes,
    upcomingArrivals, lowStock, weekPayments, maintenanceOpen, newGuests,
  ] = await Promise.all([
    supabase.from('rooms').select('status').eq('org_id', orgId),

    supabase.from('reservations').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('check_in_date', today).in('status', ['confirmed', 'checked_in']),

    supabase.from('reservations').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('check_out_date', today).eq('status', 'checked_in'),

    supabase.from('reservations').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'checked_in'),

    supabase.from('folios').select('balance').eq('org_id', orgId).eq('status', 'open'),

    supabase.from('housekeeping_tasks').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).in('status', ['pending', 'in_progress']),

    supabase.from('payments').select('amount')
      .eq('org_id', orgId).eq('status', 'completed').gte('created_at', monthStart),

    supabase.from('reservations')
      .select('id, reservation_no, status, check_in_date, check_out_date, guests(full_name), rooms(number)')
      .eq('org_id', orgId).order('created_at', { ascending: false }).limit(5),

    supabase.from('reservations')
      .select('id, reservation_no, check_in_date, guests(full_name), rooms(number)')
      .eq('org_id', orgId).eq('status', 'confirmed')
      .gte('check_in_date', today)
      .lte('check_in_date', toDate(new Date(now.getTime() + 7 * 86400000)))
      .order('check_in_date').limit(5),

    supabase.from('inventory_items')
      .select('id, name, category, current_stock, reorder_level')
      .eq('org_id', orgId).eq('is_active', true).limit(20),

    supabase.from('payments').select('amount, created_at')
      .eq('org_id', orgId).eq('status', 'completed').gte('created_at', weekAgo.toISOString()),

    supabase.from('maintenance_orders').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).in('status', ['open', 'in_progress']),

    supabase.from('guests').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).gte('created_at', monthStart),
  ]);

  const rooms = roomStats.data || [];
  const roomBreakdown = rooms.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1; return acc;
  }, {});
  const totalRooms    = rooms.length;
  const occupiedRooms = (roomBreakdown.occupied || 0) + (roomBreakdown.clean || 0);
  const occupancyRate = totalRooms ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;

  const totalOpenBalance = (openFolios.data || []).reduce((s, f) => s + (f.balance || 0), 0);
  const monthlyRevenue   = (monthRevenue.data || []).reduce((s, p) => s + (p.amount || 0), 0);

  const revenueByDay = last7Days.map(date => ({
    date,
    amount: (weekPayments.data || [])
      .filter(p => p.created_at.startsWith(date))
      .reduce((s, p) => s + (p.amount || 0), 0),
  }));

  const lowStockFiltered = (lowStock.data || []).filter(
    i => Number(i.current_stock) <= Number(i.reorder_level));

  // ── Critical alerts ───────────────────────────────────────
  const yesterday = toDate(new Date(now.getTime() - 86400000));
  const tomorrow  = toDate(new Date(now.getTime() + 86400000));

  const [overdueCheckouts, outstandingFolios, checkoutsToday, checkinsToday] = await Promise.all([
    // Guests still checked_in past their checkout date
    supabase.from('reservations')
      .select('id, reservation_no, check_out_date, guests(full_name), rooms(number)')
      .eq('org_id', orgId).eq('status', 'checked_in')
      .lt('check_out_date', today)
      .order('check_out_date'),

    // Checked-in guests with outstanding folio balance
    supabase.from('folios')
      .select('id, balance, reservation_id, reservations(reservation_no, guests(full_name), rooms(number))')
      .eq('org_id', orgId).eq('status', 'open').gt('balance', 0),

    // Checkouts due today not yet done
    supabase.from('reservations')
      .select('id, reservation_no, check_out_date, guests(full_name), rooms(number)')
      .eq('org_id', orgId).eq('status', 'checked_in').eq('check_out_date', today)
      .order('check_out_date'),

    // Confirmed arrivals today not yet checked in
    supabase.from('reservations')
      .select('id, reservation_no, check_in_date, guests(full_name), rooms(number)')
      .eq('org_id', orgId).eq('status', 'confirmed').eq('check_in_date', today)
      .order('check_in_date'),
  ]);

  const criticalAlerts = {
    overdue_checkouts:   overdueCheckouts.data  || [],
    outstanding_balances: (outstandingFolios.data || []).filter(f => f.reservations),
    checkouts_due_today: checkoutsToday.data    || [],
    checkins_due_today:  checkinsToday.data     || [],
  };

  return {
    rooms:       { total: totalRooms, breakdown: roomBreakdown, occupancy_rate: `${occupancyRate}%` },
    today:       { arrivals: todayArrivals.count || 0, departures: todayDepartures.count || 0, in_house: inHouse.count || 0 },
    financials:  { open_balance: totalOpenBalance, monthly_revenue: monthlyRevenue, revenue_chart: revenueByDay },
    housekeeping:{ pending_tasks: pendingHK.count || 0 },
    maintenance: { open_orders: maintenanceOpen.count || 0 },
    guests:      { new_this_month: newGuests.count || 0 },
    recent_reservations: recentRes.data   || [],
    upcoming_arrivals:   upcomingArrivals.data || [],
    low_stock_alerts:    lowStockFiltered,
    critical_alerts:     criticalAlerts,
  };
};

// ─── Occupancy Report ─────────────────────────────────────

export const getOccupancyReport = async (orgId, dateFrom, dateTo) => {
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select(`id, reservation_no, check_in_date, check_out_date, status,
      guests!guest_id ( id, full_name ),
      rooms!room_id ( id, number, floor, room_types ( name ) )`)
    .eq('org_id', orgId)
    .in('status', ['confirmed', 'checked_in', 'checked_out'])
    .lt('check_in_date', dateTo)    // check-in before range ends
    .gt('check_out_date', dateFrom) // check-out after range starts
    .order('check_in_date');

  if (error) throw new AppError(`Failed to fetch occupancy data: ${error.message}`, 500);

  const { count: totalRooms } = await supabase
    .from('rooms').select('id', { count: 'exact', head: true })
    .eq('org_id', orgId);

  const nights = Math.ceil((new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24));
  const totalRoomNights = (totalRooms || 0) * nights;

  const occupiedNights = (reservations || []).reduce((sum, r) => {
    const start = new Date(Math.max(new Date(r.check_in_date), new Date(dateFrom)));
    const end   = new Date(Math.min(new Date(r.check_out_date), new Date(dateTo)));
    return sum + Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  }, 0);

  return {
    date_from:    dateFrom,
    date_to:      dateTo,
    summary: {
      total_rooms:       totalRooms || 0,
      total_room_nights: totalRoomNights,
      occupied_nights:   occupiedNights,
      occupancy_rate:    totalRoomNights > 0
        ? `${((occupiedNights / totalRoomNights) * 100).toFixed(1)}%` : '0%',
    },
    reservations: reservations || [],
  };
};

// ─── Revenue Report ───────────────────────────────────────

export const getRevenueReport = async (orgId, dateFrom, dateTo) => {
  const dateTo23 = dateTo + 'T23:59:59';

  const [paymentsRes, chargesRes] = await Promise.all([
    supabase
      .from('payments')
      .select('amount, method, created_at')
      .eq('org_id', orgId).eq('status', 'completed')
      .gte('created_at', dateFrom).lte('created_at', dateTo23),

    supabase
      .from('folio_items')
      .select('amount, department, posted_at')
      .eq('org_id', orgId).eq('is_voided', false)
      .gte('posted_at', dateFrom).lte('posted_at', dateTo23),
  ]);

  if (paymentsRes.error) throw new AppError(`Failed to fetch revenue data: ${paymentsRes.error.message}`, 500);

  const payments = paymentsRes.data || [];
  const charges  = chargesRes.data  || [];

  // Total revenue = sum of all non-voided charges posted in the period
  // (reflects what was billed, not just what was explicitly recorded as a payment)
  const totalRevenue = charges.reduce((s, c) => s + (c.amount || 0), 0);
  const paymentCount = payments.length;

  // Payments collected by method
  const byMethod = Object.entries(
    payments.reduce((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + (p.amount || 0); return acc;
    }, {})
  ).map(([method, total]) => ({ method, total }))
   .sort((a, b) => b.total - a.total);

  // Charges by department
  const byDepartment = Object.entries(
    charges.reduce((acc, c) => {
      acc[c.department] = (acc[c.department] || 0) + (c.amount || 0); return acc;
    }, {})
  ).map(([department, total]) => ({ department, total }))
   .sort((a, b) => b.total - a.total);

  // Total collected vs total billed
  const totalCollected = payments.reduce((s, p) => s + (p.amount || 0), 0);

  return {
    date_from:      dateFrom,
    date_to:        dateTo,
    total_revenue:  totalRevenue,
    total_collected: totalCollected,
    outstanding:    totalRevenue - totalCollected,
    payment_count:  paymentCount,
    by_method:      byMethod,
    by_department:  byDepartment,
  };
};

// ─── Guest Report ─────────────────────────────────────────

export const getGuestReport = async (orgId, dateFrom, dateTo) => {
  const { data, error } = await supabase
    .from('guests')
    .select('id, full_name, email, nationality, category, total_visits, loyalty_points, created_at')
    .eq('org_id', orgId)
    .gte('created_at', dateFrom).lte('created_at', dateTo + 'T23:59:59')
    .order('created_at', { ascending: false });

  if (error) throw new AppError(`Failed to fetch guest report: ${error.message}`, 500);

  const byCategory = (data || []).reduce((acc, g) => {
    acc[g.category] = (acc[g.category] || 0) + 1; return acc;
  }, {});

  return { date_from: dateFrom, date_to: dateTo, total_new_guests: (data || []).length, by_category: byCategory, guests: data || [] };
};

// ─── Housekeeping Report ──────────────────────────────────

export const getHousekeepingReport = async (orgId, dateFrom, dateTo) => {
  const { data, error } = await supabase
    .from('housekeeping_tasks')
    .select(`id, task_type, priority, status, started_at, completed_at,
      rooms!room_id ( number, floor ), assigned:assigned_to!assigned_to ( full_name )`)
    .eq('org_id', orgId)
    .gte('created_at', dateFrom).lte('created_at', dateTo + 'T23:59:59')
    .order('created_at', { ascending: false });

  if (error) throw new AppError(`Failed to fetch housekeeping report: ${error.message}`, 500);

  const byStatus = (data || []).reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1; return acc;
  }, {});

  const completed = (data || []).filter(t => t.completed_at && t.started_at);
  const avgMinutes = completed.length
    ? completed.reduce((s, t) =>
        s + (new Date(t.completed_at) - new Date(t.started_at)) / 60000, 0) / completed.length
    : 0;

  return {
    date_from: dateFrom, date_to: dateTo,
    total_tasks: (data || []).length, by_status: byStatus,
    avg_completion_minutes: Math.round(avgMinutes), tasks: data || [],
  };
};

// ─── Night Audit ──────────────────────────────────────────

export const getNightAudit = async (orgId, date) => {
  const dateStart = date + 'T00:00:00';
  const dateEnd   = date + 'T23:59:59';

  const [arrivalsRes, departuresRes, inHouseRes, paymentsRes, chargesRes] = await Promise.all([
    // Checked in on this date
    supabase.from('reservations')
      .select('id, reservation_no, check_in_date, check_out_date, rate_per_night, total_amount, guests!guest_id ( full_name ), rooms!room_id ( number )')
      .eq('org_id', orgId).eq('status', 'checked_in').eq('check_in_date', date),

    // Checked out on this date
    supabase.from('reservations')
      .select('id, reservation_no, check_in_date, check_out_date, rate_per_night, total_amount, guests!guest_id ( full_name ), rooms!room_id ( number )')
      .eq('org_id', orgId).eq('status', 'checked_out').eq('check_out_date', date),

    // Still in house (checked in before today, checking out after today)
    supabase.from('reservations')
      .select('id, reservation_no, check_in_date, check_out_date, rate_per_night, guests!guest_id ( full_name ), rooms!room_id ( number )')
      .eq('org_id', orgId).eq('status', 'checked_in')
      .lte('check_in_date', date).gt('check_out_date', date),

    // Payments received on this date
    supabase.from('payments')
      .select('id, payment_no, amount, method, notes, received_at')
      .eq('org_id', orgId).eq('status', 'completed')
      .gte('received_at', dateStart).lte('received_at', dateEnd),

    // Charges posted on this date
    supabase.from('folio_items')
      .select('id, department, description, amount')
      .eq('org_id', orgId).eq('is_voided', false)
      .gte('posted_at', dateStart).lte('posted_at', dateEnd),
  ]);

  const payments = paymentsRes.data || [];
  const charges  = chargesRes.data  || [];

  const totalPayments = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalCharges  = charges.reduce((s, c)  => s + (c.amount || 0), 0);

  const byDepartment = Object.entries(
    charges.reduce((acc, c) => {
      acc[c.department] = (acc[c.department] || 0) + (c.amount || 0); return acc;
    }, {})
  ).map(([department, total]) => ({ department, total })).sort((a, b) => b.total - a.total);

  return {
    date,
    arrivals:    arrivalsRes.data   || [],
    departures:  departuresRes.data || [],
    in_house:    inHouseRes.data    || [],
    payments,
    charges,
    by_department: byDepartment,
    totals: {
      arrivals:   (arrivalsRes.data   || []).length,
      departures: (departuresRes.data || []).length,
      in_house:   (inHouseRes.data    || []).length,
      payments:   totalPayments,
      charges:    totalCharges,
    },
  };
};

// ─── Group Summary (multi-property) ───────────────────────
// Returns lightweight stats for each org the user belongs to.
// orgIds must all be verified as belonging to the requesting user
// before calling this — that check happens in the controller.

export const getGroupSummary = async (orgIds) => {
  const now        = new Date();
  const today      = toDate(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const results = await Promise.all(orgIds.map(async (orgId) => {
    const [
      orgData, roomStats, inHouse,
      arrivalsToday, departurestoday,
      monthRevenue, pendingHK, maintenanceOpen,
    ] = await Promise.all([
      supabase.from('organizations')
        .select('id, name, slug, subscription_status, trial_ends_at')
        .eq('id', orgId).single(),

      supabase.from('rooms')
        .select('status').eq('org_id', orgId),

      supabase.from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId).eq('status', 'checked_in'),

      supabase.from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId).eq('check_in_date', today)
        .in('status', ['confirmed', 'checked_in']),

      supabase.from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId).eq('check_out_date', today)
        .eq('status', 'checked_in'),

      supabase.from('payments')
        .select('amount').eq('org_id', orgId)
        .eq('status', 'completed').gte('created_at', monthStart),

      supabase.from('housekeeping_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId).in('status', ['pending', 'in_progress']),

      supabase.from('maintenance_orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId).in('status', ['open', 'in_progress']),
    ]);

    const rooms         = roomStats.data || [];
    const totalRooms    = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'occupied' || r.status === 'clean').length;
    const occupancyRate = totalRooms ? +((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;
    const monthlyRevenue = (monthRevenue.data || []).reduce((s, p) => s + (p.amount || 0), 0);

    return {
      org_id:           orgId,
      name:             orgData.data?.name             || 'Unknown',
      slug:             orgData.data?.slug             || '',
      subscription_status: orgData.data?.subscription_status || 'trial',
      trial_ends_at:    orgData.data?.trial_ends_at    || null,
      stats: {
        occupancy_rate:    occupancyRate,
        total_rooms:       totalRooms,
        occupied_rooms:    occupiedRooms,
        in_house:          inHouse.count          || 0,
        arrivals_today:    arrivalsToday.count    || 0,
        departures_today:  departurestoday.count  || 0,
        monthly_revenue:   monthlyRevenue,
        hk_pending:        pendingHK.count        || 0,
        maintenance_open:  maintenanceOpen.count  || 0,
      },
    };
  }));

  return results;
};
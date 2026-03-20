// src/services/superAdminService.js

import crypto from 'crypto';
import jwt          from 'jsonwebtoken';
import bcrypt       from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { env }      from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

const SA_TOKEN_TTL = '12h';

// --- Auth ---------------------------------------------------
// Password is bcrypt-hashed and stored in platform_admins.password_hash.
// No GoTrue / Supabase Auth dependency — bypasses all the broken hash issues.

export const superAdminLogin = async (email, password) => {
  // 1. Fetch admin by email
  const { data: admin, error } = await supabase
    .from('platform_admins')
    .select('id, email, full_name, is_active, role, password_hash')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error || !admin || !admin.password_hash) {
    throw new AppError('Invalid email or password.', 401);
  }
  if (!admin.is_active) {
    throw new AppError('Your super-admin account has been deactivated.', 403);
  }

  // 2. Verify password with bcrypt
  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    throw new AppError('Invalid email or password.', 401);
  }

  // 3. Update last_login
  await supabase
    .from('platform_admins')
    .update({ last_login: new Date().toISOString() })
    .eq('id', admin.id);

  // 4. Issue super-admin JWT — no org_id, is_super_admin: true
  const token = jwt.sign(
    { sub: admin.id, email: admin.email, full_name: admin.full_name, role: admin.role || 'admin', is_super_admin: true },
    env.JWT_SECRET,
    { expiresIn: SA_TOKEN_TTL }
  );

  return {
    access_token: token,
    expires_in:   SA_TOKEN_TTL,
    admin: { id: admin.id, email: admin.email, full_name: admin.full_name, role: admin.role || 'admin' },
  };
};

// ─── Platform Overview Stats ──────────────────────────────

export const getPlatformStats = async () => {
  const now       = new Date();
  const today     = now.toISOString().split('T')[0];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekAgo   = new Date(now.getTime() - 7 * 86400000).toISOString();

  const [
    allOrgs,
    totalUsers,
    newOrgsThisMonth,
    newOrgsThisWeek,
    activeReservations,
    totalRooms,
    recentOrgs,
  ] = await Promise.all([
    supabase.from('organizations').select('id, status, plan, created_at'),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('organizations')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthStart),
    supabase.from('organizations')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo),
    supabase.from('reservations')
      .select('id', { count: 'exact', head: true })
      .in('status', ['confirmed', 'checked_in']),
    supabase.from('rooms')
      .select('id', { count: 'exact', head: true }),
    supabase.from('organizations')
      .select('id, name, slug, plan, status, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const orgs = allOrgs.data || [];
  const byStatus = orgs.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  const byPlan = orgs.reduce((acc, o) => {
    acc[o.plan] = (acc[o.plan] || 0) + 1;
    return acc;
  }, {});

  // Signups per day — last 30 days
  const thirtyDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });
  const signupChart = thirtyDays.map(date => ({
    date,
    count: orgs.filter(o => o.created_at?.startsWith(date)).length,
  }));

  return {
    totals: {
      organizations:       orgs.length,
      active_orgs:         byStatus.active    || 0,
      trial_orgs:          byStatus.trial      || 0,
      suspended_orgs:      byStatus.suspended  || 0,
      inactive_orgs:       byStatus.inactive   || 0,
      total_users:         totalUsers.count    || 0,
      total_rooms:         totalRooms.count    || 0,
      active_reservations: activeReservations.count || 0,
      new_orgs_this_month: newOrgsThisMonth.count || 0,
      new_orgs_this_week:  newOrgsThisWeek.count  || 0,
    },
    by_plan:       byPlan,
    by_status:     byStatus,
    signup_chart:  signupChart,
    recent_signups: recentOrgs.data || [],
  };
};

// ─── Organizations List ────────────────────────────────────

export const listOrganizations = async ({ page = 1, limit = 20, search, status, plan } = {}) => {
  let query = supabase
    .from('organizations')
    .select('id, name, slug, plan, status, custom_domain, created_at, updated_at, trial_ends_at, notes', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,custom_domain.ilike.%${search}%`);
  }
  if (status) query = query.eq('status', status);
  if (plan)   query = query.eq('plan', plan);

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data: orgs, count, error } = await query;
  if (error) throw new AppError('Failed to fetch organizations.', 500);

  // Enrich each org with quick counts
  const enriched = await Promise.all((orgs || []).map(async (org) => {
    const [usersRes, roomsRes, reservationsRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('org_id', org.id),
      supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('org_id', org.id),
      supabase.from('reservations').select('id', { count: 'exact', head: true })
        .eq('org_id', org.id).in('status', ['confirmed', 'checked_in']),
    ]);
    return {
      ...org,
      _counts: {
        users:               usersRes.count  || 0,
        rooms:               roomsRes.count  || 0,
        active_reservations: reservationsRes.count || 0,
      },
    };
  }));

  return { data: enriched, total: count || 0, page, limit };
};

// ─── Single Organization Detail ────────────────────────────

export const getOrganizationDetail = async (orgId) => {
  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .maybeSingle();

  if (error || !org) throw new AppError('Organization not found.', 404);

  const [
    config,
    usersRes,
    roomsRes,
    reservationsRes,
    staffRes,
    paymentsRes,
    recentReservations,
    recentUsers,
  ] = await Promise.all([
    supabase.from('hotel_config').select('hotel_name, city, country, currency, timezone, logo_url, check_in_time, check_out_time').eq('org_id', orgId).maybeSingle(),
    supabase.from('users').select('id, full_name, email, role_id, is_active, last_login, created_at').eq('org_id', orgId).order('created_at', { ascending: false }).limit(10),
    supabase.from('rooms').select('id, status').eq('org_id', orgId),
    supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('staff').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('payments').select('amount').eq('org_id', orgId).eq('status', 'completed'),
    supabase.from('reservations')
      .select('id, reservation_no, status, check_in_date, check_out_date, created_at, guests(full_name)')
      .eq('org_id', orgId).order('created_at', { ascending: false }).limit(5),
    supabase.from('users').select('id, full_name, email, created_at').eq('org_id', orgId).order('created_at', { ascending: false }).limit(5),
  ]);

  const rooms = roomsRes.data || [];
  const roomBreakdown = rooms.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  const totalRevenue = (paymentsRes.data || []).reduce((s, p) => s + (p.amount || 0), 0);
  const occupiedRooms = (roomBreakdown.occupied || 0) + (roomBreakdown.clean || 0);
  const occupancyRate = rooms.length ? ((occupiedRooms / rooms.length) * 100).toFixed(1) : 0;

  return {
    organization:   org,
    hotel_config:   config.data,
    stats: {
      total_users:         usersRes.data?.length || 0,
      total_rooms:         rooms.length,
      total_reservations:  reservationsRes.count || 0,
      total_staff:         staffRes.count || 0,
      total_revenue:       totalRevenue,
      occupancy_rate:      `${occupancyRate}%`,
      room_breakdown:      roomBreakdown,
    },
    recent_reservations: recentReservations.data || [],
    users:               usersRes.data || [],
    recent_users:        recentUsers.data || [],
  };
};

// ─── Update Organization Status / Plan ────────────────────

export const updateOrganization = async (orgId, { status, plan, notes, trial_ends_at } = {}) => {
  const updates = { updated_at: new Date().toISOString() };
  if (status !== undefined) {
    updates.status = status;
    if (status === 'suspended') updates.suspended_at = new Date().toISOString();
    if (status === 'active')    updates.suspended_at = null;
  }
  if (plan            !== undefined) updates.plan            = plan;
  if (notes           !== undefined) updates.notes           = notes;
  if (trial_ends_at   !== undefined) updates.trial_ends_at   = trial_ends_at;

  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', orgId)
    .select()
    .single();

  if (error) throw new AppError('Failed to update organization.', 500);
  return data;
};

// ─── Platform Activity Feed ────────────────────────────────

export const getPlatformActivity = async (limit = 20) => {
  // Pull recent org signups + recent reservations as a combined feed
  const [orgsRes, reservationsRes] = await Promise.all([
    supabase.from('organizations')
      .select('id, name, slug, plan, created_at')
      .order('created_at', { ascending: false })
      .limit(limit / 2),
    supabase.from('reservations')
      .select('id, reservation_no, status, created_at, org_id, guests(full_name)')
      .order('created_at', { ascending: false })
      .limit(limit / 2),
  ]);

  const events = [
    ...(orgsRes.data || []).map(o => ({
      type: 'org_signup',
      id:   o.id,
      label: `New organization signed up: ${o.name}`,
      meta:  `Plan: ${o.plan}`,
      created_at: o.created_at,
    })),
    ...(reservationsRes.data || []).map(r => ({
      type: 'reservation',
      id:   r.id,
      label: `Reservation ${r.reservation_no} — ${r.guests?.full_name || 'Guest'}`,
      meta:  r.status,
      org_id: r.org_id,
      created_at: r.created_at,
    })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);

  return events;
};

// ─── System Health ─────────────────────────────────────────

export const getSystemHealth = async () => {
  const start = Date.now();
  let dbStatus = 'ok';
  let dbLatency = 0;

  try {
    await supabase.from('organizations').select('id', { count: 'exact', head: true });
    dbLatency = Date.now() - start;
  } catch {
    dbStatus = 'error';
  }

  // Count recent login events from audit log — wrapped in try/catch
  // so a missing table or schema change never breaks the health endpoint
  let recentLogins = 0;
  try {
    const hourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await supabase
      .from('audit_log')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', hourAgo)
      .eq('action', 'LOGIN');
    recentLogins = count || 0;
  } catch {
    // audit_log may not exist yet — not a fatal error
  }

  return {
    database:             { status: dbStatus, latency_ms: dbLatency },
    api:                  { status: 'ok', uptime: process.uptime() },
    logins_last_hour:     recentLogins,
    checked_at:           new Date().toISOString(),
  };
};

// ─── Platform Financial Stats (YOUR revenue from orgs) ────────

export const getPlatformFinancials = async () => {
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const yearStart  = new Date(now.getFullYear(), 0, 1).toISOString();

  const [
    allPayments,
    thisMonthPayments,
    lastMonthPayments,
    activeSubscriptions,
    trialSubscriptions,
    cancelledSubscriptions,
    recentPayments,
    plan,
  ] = await Promise.all([
    supabase.from('subscription_payments').select('amount, paid_at').eq('status', 'success'),
    supabase.from('subscription_payments').select('amount').eq('status', 'success').gte('paid_at', monthStart),
    supabase.from('subscription_payments').select('amount').eq('status', 'success').gte('paid_at', lastMonthStart).lt('paid_at', monthStart),
    supabase.from('org_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('org_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'trial'),
    supabase.from('org_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
    supabase.from('subscription_payments')
      .select('id, amount, currency, paid_at, org_id, dodo_payment_id, organizations(name, slug)')
      .eq('status', 'success')
      .order('paid_at', { ascending: false })
      .limit(10),
    supabase.from('subscription_plans').select('amount, interval').eq('is_active', true).limit(1).maybeSingle(),
  ]);

  const totalRevenue   = (allPayments.data || []).reduce((s, p) => s + (p.amount || 0), 0);
  const mrr            = (thisMonthPayments.data || []).reduce((s, p) => s + (p.amount || 0), 0);
  const lastMonthRev   = (lastMonthPayments.data || []).reduce((s, p) => s + (p.amount || 0), 0);
  const mrrGrowth      = lastMonthRev > 0 ? (((mrr - lastMonthRev) / lastMonthRev) * 100).toFixed(1) : null;
  const activeCount    = activeSubscriptions.count || 0;
  const planAmount     = plan.data?.amount || 0;
  const arr            = activeCount * planAmount * 12;

  // Monthly revenue chart — last 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return {
      label: d.toLocaleDateString('en-NG', { month: 'short', year: '2-digit' }),
      start: d.toISOString(),
      end:   new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString(),
    };
  });

  const revenueChart = months.map(m => ({
    label: m.label,
    value: (allPayments.data || [])
      .filter(p => p.paid_at >= m.start && p.paid_at < m.end)
      .reduce((s, p) => s + (p.amount || 0), 0),
  }));

  // Trial conversion rate
  const totalTrialOrgs = (trialSubscriptions.count || 0) + activeCount;
  const conversionRate = totalTrialOrgs > 0
    ? ((activeCount / totalTrialOrgs) * 100).toFixed(1)
    : 0;

  return {
    summary: {
      total_revenue:    totalRevenue,
      mrr,
      arr,
      mrr_growth:       mrrGrowth,
      active_paying:    activeCount,
      on_trial:         trialSubscriptions.count || 0,
      cancelled:        cancelledSubscriptions.count || 0,
      conversion_rate:  `${conversionRate}%`,
      last_month_rev:   lastMonthRev,
    },
    revenue_chart:    revenueChart,
    recent_payments:  recentPayments.data || [],
  };
};

// --- Admin Management -------------------------------------------------------

export const listAdmins = async () => {
  const { data, error } = await supabase
    .from('platform_admins')
    .select('id, email, full_name, is_active, role, last_login, created_at')
    .order('created_at', { ascending: true });
  if (error) throw new AppError(`Failed to fetch admins: ${error.message}`, 500);
  return data || [];
};

export const createAdmin = async (email, fullName, password) => {
  const existing = await supabase
    .from('platform_admins').select('id').eq('email', email.toLowerCase().trim()).maybeSingle();
  if (existing.data) throw new AppError('An admin with this email already exists.', 409);

  const password_hash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase
    .from('platform_admins')
    .insert({ id: crypto.randomUUID(), email: email.toLowerCase().trim(), full_name: fullName, password_hash, is_active: true, role: 'admin' })
    .select('id, email, full_name, is_active, role, created_at').single();
  if (error) throw new AppError(`Failed to create admin: ${error.message}`, 500);
  return data;
};


export const getSeededAdminId = async () => {
  const { data } = await supabase
    .from('platform_admins').select('id').order('created_at', { ascending: true }).limit(1).single();
  return data?.id || null;
};
export const toggleAdmin = async (id) => {
  // Role check handled at route level by requireSuperAdminRole
  const { data: admin } = await supabase.from('platform_admins').select('is_active').eq('id', id).single();
  if (!admin) throw new AppError('Admin not found.', 404);
  const { data, error } = await supabase
    .from('platform_admins').update({ is_active: !admin.is_active }).eq('id', id)
    .select('id, email, full_name, is_active').single();
  if (error) throw new AppError('Failed to update admin.', 500);
  return data;
};

export const deleteAdmin = async (id, requesterId) => {
  if (id === requesterId) throw new AppError('You cannot delete your own account.', 400);
  const { error } = await supabase.from('platform_admins').delete().eq('id', id);
  if (error) throw new AppError('Failed to delete admin.', 500);
};

export const resetAdminPassword = async (id, newPassword) => {
  const password_hash = await bcrypt.hash(newPassword, 12);
  const { error } = await supabase.from('platform_admins').update({ password_hash }).eq('id', id);
  if (error) throw new AppError('Failed to reset password.', 500);
};
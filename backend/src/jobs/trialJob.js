// src/jobs/trialJob.js
//
// Runs daily at 08:00 (Africa/Lagos).
// Handles the full trial lifecycle:
//
//   Day 10: Reminder email — "4 days left"
//   Day 13: Reminder email — "1 day left"
//   Day 14: Final email    — "Trial ended"
//   Day 15: Soft lock      — login allowed, all writes blocked
//   Day 30: Suspended      — read-only removed, subscribe screen only
//   Day 90: Marked inactive + final deletion warning email
//   Day 97: Hard delete
//
// Install node-cron: npm install node-cron

import cron        from 'node-cron';
import { supabase } from '../config/supabase.js';
import * as emailService from '../services/emailService.js';

// ─── Helpers ──────────────────────────────────────────────────

const daysBetween = (a, b) =>
  Math.floor((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));

const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

// ─── Fetch orgs that need processing ──────────────────────────

async function getTrialOrgs() {
  const { data, error } = await supabase
    .from('organizations')
    .select(`
      id, name, slug, trial_ends_at, subscription_status, created_at,
      users!inner (id, email, full_name, role_id,
        roles!inner (name)
      )
    `)
    .eq('subscription_status', 'trial')
    .not('trial_ends_at', 'is', null);

  if (error) {
    console.error('[TrialJob] Failed to fetch trial orgs:', error.message);
    return [];
  }
  return data || [];
}

// Get the admin user (role = Admin) for an org to send emails to
function getAdminUser(org) {
  const users = org.users || [];
  return users.find(u => u.roles?.name?.toLowerCase() === 'admin') || users[0];
}

// ─── Main job function ────────────────────────────────────────

async function runTrialJob() {
  console.log('[TrialJob] Starting trial lifecycle check...');
  const now  = new Date();
  const orgs = await getTrialOrgs();

  console.log(`[TrialJob] Processing ${orgs.length} trial org(s)`);

  for (const org of orgs) {
    try {
      await processOrg(org, now);
    } catch (err) {
      console.error(`[TrialJob] Error processing org ${org.id}:`, err.message);
    }
  }

  // Also handle soft_locked → suspended → inactive transitions
  await processSoftLocked(now);
  await processSuspended(now);

  console.log('[TrialJob] Done.');
}

async function processOrg(org, now) {
  const trialEnd    = new Date(org.trial_ends_at);
  const daysLeft    = daysBetween(now, trialEnd);   // negative = overdue
  const daysSince   = daysBetween(trialEnd, now);   // days since trial ended
  const admin       = getAdminUser(org);

  if (!admin?.email) return;

  // Get or create subscription reminder tracking row
  const { data: sub } = await supabase
    .from('org_subscriptions')
    .select('reminder_10_sent, reminder_13_sent, reminder_14_sent')
    .eq('org_id', org.id)
    .maybeSingle();

  const reminders = sub || { reminder_10_sent: false, reminder_13_sent: false, reminder_14_sent: false };

  // ── Day 10 reminder: 4 days left ──────────────────────────
  if (daysLeft <= 4 && daysLeft > 1 && !reminders.reminder_10_sent) {
    await emailService.sendTrialReminder({
      email:     admin.email,
      name:      admin.full_name,
      hotelName: org.name,
      daysLeft:  daysLeft,
      type:      'reminder',
    });
    await upsertSubscriptionReminder(org.id, { reminder_10_sent: true });
    console.log(`[TrialJob] Sent 4-day reminder to ${org.name}`);
  }

  // ── Day 13 reminder: 1 day left ───────────────────────────
  if (daysLeft === 1 && !reminders.reminder_13_sent) {
    await emailService.sendTrialReminder({
      email:     admin.email,
      name:      admin.full_name,
      hotelName: org.name,
      daysLeft:  1,
      type:      'urgent',
    });
    await upsertSubscriptionReminder(org.id, { reminder_13_sent: true });
    console.log(`[TrialJob] Sent 1-day reminder to ${org.name}`);
  }

  // ── Day 14: trial ended today ─────────────────────────────
  if (daysLeft <= 0 && daysLeft > -2 && !reminders.reminder_14_sent) {
    await emailService.sendTrialReminder({
      email:     admin.email,
      name:      admin.full_name,
      hotelName: org.name,
      daysLeft:  0,
      type:      'ended',
    });
    await upsertSubscriptionReminder(org.id, { reminder_14_sent: true });
    console.log(`[TrialJob] Sent trial-ended email to ${org.name}`);
  }

  // ── Day 15+: soft lock ────────────────────────────────────
  if (daysLeft <= -1) {
    await supabase
      .from('organizations')
      .update({
        subscription_status: 'soft_locked',
        updated_at: now.toISOString(),
      })
      .eq('id', org.id);
    console.log(`[TrialJob] Soft locked: ${org.name}`);
  }
}

// ── soft_locked → suspended (day 30 after trial end) ─────────
async function processSoftLocked(now) {
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, trial_ends_at, users!inner(email, full_name, roles!inner(name))')
    .eq('subscription_status', 'soft_locked')
    .not('trial_ends_at', 'is', null)
    .lt('trial_ends_at', addDays(now, -16)); // 16+ days after trial end = 30 days from day 14

  for (const org of (orgs || [])) {
    await supabase
      .from('organizations')
      .update({ subscription_status: 'suspended', updated_at: now.toISOString() })
      .eq('id', org.id);

    const admin = getAdminUser(org);
    if (admin?.email) {
      await emailService.sendTrialReminder({
        email:     admin.email,
        name:      admin.full_name,
        hotelName: org.name,
        daysLeft:  0,
        type:      'suspended',
      });
    }
    console.log(`[TrialJob] Suspended: ${org.name}`);
  }
}

// ── suspended → inactive → delete warning (day 60+) ──────────
async function processSuspended(now) {
  // Day 60: mark inactive
  const { data: toInactive } = await supabase
    .from('organizations')
    .select('id, name, trial_ends_at, users!inner(email, full_name, roles!inner(name))')
    .eq('subscription_status', 'suspended')
    .not('trial_ends_at', 'is', null)
    .lt('trial_ends_at', addDays(now, -46)); // 46 days after trial end ≈ 60 days total

  for (const org of (toInactive || [])) {
    await supabase
      .from('organizations')
      .update({ subscription_status: 'inactive', updated_at: now.toISOString() })
      .eq('id', org.id);

    const admin = getAdminUser(org);
    if (admin?.email) {
      await emailService.sendTrialReminder({
        email:     admin.email,
        name:      admin.full_name,
        hotelName: org.name,
        daysLeft:  0,
        type:      'deletion_warning', // "Your data will be deleted in 7 days"
      });
    }
    console.log(`[TrialJob] Marked inactive: ${org.name}`);
  }

  // Day 97: hard delete (76 days after trial end)
  const { data: toDelete } = await supabase
    .from('organizations')
    .select('id, name, trial_ends_at')
    .eq('subscription_status', 'inactive')
    .not('trial_ends_at', 'is', null)
    .lt('trial_ends_at', addDays(now, -83)); // 83 days after trial end ≈ 97 days total

  for (const org of (toDelete || [])) {
    // Delete the org — cascade deletes everything via FK constraints
    await supabase.from('organizations').delete().eq('id', org.id);
    console.log(`[TrialJob] Hard deleted: ${org.name} (${org.id})`);
  }
}

// ─── Upsert subscription reminder flags ───────────────────────

async function upsertSubscriptionReminder(orgId, flags) {
  // Check if subscription row exists
  const { data: existing } = await supabase
    .from('org_subscriptions')
    .select('id')
    .eq('org_id', orgId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('org_subscriptions')
      .update({ ...flags, updated_at: new Date().toISOString() })
      .eq('org_id', orgId);
  } else {
    // Get active plan to create a stub row
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (plan) {
      await supabase.from('org_subscriptions').insert({
        org_id:   orgId,
        plan_id:  plan.id,
        status:   'trial',
        ...flags,
      });
    }
  }
}

// ─── Register the cron schedule ───────────────────────────────

export function initTrialJob() {
  // Run daily at 08:00 Lagos time
  cron.schedule('0 8 * * *', runTrialJob, {
    timezone: 'Africa/Lagos',
  });

  console.log('[TrialJob] Scheduled — daily at 08:00 Africa/Lagos');
}

// Export for manual trigger (testing / admin panel)
export { runTrialJob };
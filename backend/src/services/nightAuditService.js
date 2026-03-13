// src/services/nightAuditService.js
//
// Night Audit — the end-of-day closing procedure.
//
// runNightAudit(orgId, date, runBy):
//   1. Guard: already run today? reject.
//   2. Fetch all in-house guests (status = 'checked_in', check_out_date > date)
//   3. For each → post one 'room' charge to their open folio
//   4. Mark no-shows (confirmed reservations with check_in_date = date still not checked in)
//   5. Save audit run record with summary
//   6. Return full summary

import { supabase }   from '../config/supabase.js';
import { AppError }   from '../middleware/errorHandler.js';

// ── helpers ─────────────────────────────────────────────────────────────────

const updateFolioTotals = async (folioId) => {
  const { data: items } = await supabase
    .from('folio_items')
    .select('amount')
    .eq('folio_id', folioId)
    .eq('is_voided', false);

  const totalCharges = (items || []).reduce((s, i) => s + (i.amount || 0), 0);

  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .eq('folio_id', folioId)
    .eq('status', 'completed');

  const totalPayments = (payments || []).reduce((s, p) => s + (p.amount || 0), 0);

  await supabase
    .from('folios')
    .update({
      total_charges:  totalCharges,
      total_payments: totalPayments,
      balance:        totalCharges - totalPayments,
      updated_at:     new Date().toISOString(),
    })
    .eq('id', folioId);
};

// ── getAuditStatus ───────────────────────────────────────────────────────────
// Was the audit already run for this date?
export const getAuditStatus = async (orgId, date) => {
  const { data } = await supabase
    .from('night_audit_runs')
    .select('*')
    .eq('org_id', orgId)
    .eq('audit_date', date)
    .maybeSingle();
  return data || null;
};

// ── getAuditHistory ──────────────────────────────────────────────────────────
export const getAuditHistory = async (orgId, limit = 30) => {
  const { data, error } = await supabase
    .from('night_audit_runs')
    .select('*, users!run_by(full_name)')
    .eq('org_id', orgId)
    .order('audit_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

// ── getAuditPreview ──────────────────────────────────────────────────────────
// Returns what WILL happen when the audit runs — safe to call anytime
export const getAuditPreview = async (orgId, date) => {
  const [inHouseRes, arrivalsRes, departuresRes, noShowRes] = await Promise.all([
    // In house on audit date — include checked_out for backdates
    supabase.from('reservations')
      .select('id, reservation_no, rate_per_night, check_in_date, check_out_date, guests!guest_id(full_name), rooms!room_id(number)')
      .eq('org_id', orgId)
      .in('status', ['checked_in', 'checked_out'])
      .lte('check_in_date', date)
      .gt('check_out_date', date),

    // Expected arrivals on this date (confirmed or already checked in)
    supabase.from('reservations')
      .select('id, reservation_no, rate_per_night, check_in_date, check_out_date, guests!guest_id(full_name)')
      .eq('org_id', orgId)
      .in('status', ['confirmed', 'checked_in'])
      .eq('check_in_date', date),

    // Departures on audit date (checked_out or still checked_in checking out today)
    supabase.from('reservations')
      .select('id, reservation_no, rate_per_night, check_in_date, check_out_date, guests!guest_id(full_name), rooms!room_id(number)')
      .eq('org_id', orgId)
      .in('status', ['checked_in', 'checked_out'])
      .eq('check_out_date', date),

    // No-shows: confirmed reservations whose check_in_date <= audit date (never showed up)
    supabase.from('reservations')
      .select('id, reservation_no, guests!guest_id(full_name)')
      .eq('org_id', orgId)
      .eq('status', 'confirmed')
      .lte('check_in_date', date),
  ]);

  const inHouse    = inHouseRes.data    || [];
  const arrivals   = arrivalsRes.data   || [];
  const departures = departuresRes.data || [];
  const noShows    = noShowRes.data     || [];

  const totalRoomRevenue = inHouse.reduce((s, r) => s + (r.rate_per_night || 0), 0);

  return {
    date,
    in_house:       inHouse,
    arrivals,
    departures,
    pending_no_shows: noShows,
    totals: {
      in_house:      inHouse.length,
      arrivals:      arrivals.length,
      departures:    departures.length,
      no_shows:      noShows.length,
      room_revenue:  totalRoomRevenue,
    },
  };
};

// ── runNightAudit ────────────────────────────────────────────────────────────
export const runNightAudit = async (orgId, date, runBy) => {
  // 1. Guard: already completed?
  const existing = await getAuditStatus(orgId, date);
  if (existing?.status === 'completed') {
    throw new AppError(`Night audit for ${date} has already been completed.`, 409);
  }

  // 2. Create/update run record — status: running
  let runId;
  if (existing?.status === 'failed') {
    // Retry a failed audit
    const { data } = await supabase
      .from('night_audit_runs')
      .update({ status: 'running', started_at: new Date().toISOString(), run_by: runBy })
      .eq('id', existing.id)
      .select().single();
    runId = data.id;
  } else {
    const { data, error } = await supabase
      .from('night_audit_runs')
      .insert({ org_id: orgId, audit_date: date, status: 'running', run_by: runBy })
      .select().single();
    if (error) throw new AppError(`Failed to start audit: ${error.message}`, 500);
    runId = data.id;
  }

  try {
    // 3. Get all guests who were in-house on the audit date.
    //    For today: status = checked_in, check_out > date
    //    For backdates: also include checked_out guests whose stay covered the date
    //    (check_in_date <= date AND check_out_date > date covers the night of `date`)
    const { data: inHouse, error: ihErr } = await supabase
      .from('reservations')
      .select('id, reservation_no, rate_per_night, guest_id, room_id, guests!guest_id(full_name), rooms!room_id(number)')
      .eq('org_id', orgId)
      .in('status', ['checked_in', 'checked_out'])
      .lte('check_in_date', date)
      .gt('check_out_date', date);

    if (ihErr) throw new AppError(ihErr.message, 500);

    // 4. Post nightly room charges for each in-house guest
    let chargesPosted  = 0;
    let totalRoomRevenue = 0;
    const chargeResults = [];

    for (const res of inHouse || []) {
      if (!res.rate_per_night || res.rate_per_night <= 0) continue;

      // Get open folio for this reservation
      const { data: folio } = await supabase
        .from('folios')
        .select('id, status')
        .eq('org_id', orgId)
        .eq('reservation_id', res.id)
        .eq('status', 'open')
        .maybeSingle();

      if (!folio) continue; // no open folio — skip

      // Check if a room charge was already posted for this audit date (idempotency guard)
      // Match on description containing the date so backdated audits are safe too
      const { data: existing } = await supabase
        .from('folio_items')
        .select('id')
        .eq('folio_id', folio.id)
        .eq('department', 'room')
        .ilike('description', `%Room charge — ${date}%`)
        .eq('is_voided', false)
        .maybeSingle();

      if (existing) continue; // charge for this date already posted — skip

      // Post the charge — use audit date noon as posted_at so it sorts correctly on backdates
      const postedAt = new Date(`${date}T23:59:00`).toISOString();
      const { data: item, error: chargeErr } = await supabase
        .from('folio_items')
        .insert({
          org_id:      orgId,
          folio_id:    folio.id,
          department:  'room',
          description: `Room charge — ${date} (Night Audit)`,
          quantity:    1,
          unit_price:  res.rate_per_night,
          amount:      res.rate_per_night,
          tax_amount:  0,
          is_voided:   false,
          posted_by:   runBy,
          posted_at:   postedAt,
        })
        .select().single();

      if (chargeErr) {
        console.error(`[night-audit] charge failed for res ${res.id}:`, chargeErr.message);
        continue;
      }

      await updateFolioTotals(folio.id);
      chargesPosted++;
      totalRoomRevenue += res.rate_per_night;
      chargeResults.push({ reservation_id: res.id, guest: res.guests?.full_name, room: res.rooms?.number, amount: res.rate_per_night });
    }

    // 5. Handle no-shows: confirmed reservations whose check-in date has passed
    // Use lte so backdated audits also catch guests who never showed up
    const { data: noShows } = await supabase
      .from('reservations')
      .select('id, reservation_no, guest_id, guests!guest_id(full_name)')
      .eq('org_id', orgId)
      .eq('status', 'confirmed')
      .lte('check_in_date', date);

    let noShowCount = 0;
    for (const res of noShows || []) {
      await supabase
        .from('reservations')
        .update({ status: 'no_show', updated_at: new Date().toISOString() })
        .eq('id', res.id);
      noShowCount++;
    }

    // 6. Get arrival/departure counts for summary
    const { data: arrivals }   = await supabase.from('reservations').select('id').eq('org_id', orgId).eq('status', 'checked_in').eq('check_in_date', date);
    const { data: departures } = await supabase.from('reservations').select('id').eq('org_id', orgId).eq('status', 'checked_out').eq('check_out_date', date);

    // 7. Mark run as completed
    const { data: completedRun } = await supabase
      .from('night_audit_runs')
      .update({
        status:            'completed',
        in_house_count:    (inHouse || []).length,
        arrivals_count:    (arrivals || []).length,
        departures_count:  (departures || []).length,
        no_show_count:     noShowCount,
        charges_posted:    chargesPosted,
        total_room_revenue: totalRoomRevenue,
        completed_at:      new Date().toISOString(),
      })
      .eq('id', runId)
      .select().single();

    return {
      run: completedRun,
      charges: chargeResults,
      no_shows: (noShows || []).map(r => ({ id: r.id, guest: r.guests?.full_name })),
      summary: {
        in_house:      (inHouse || []).length,
        arrivals:      (arrivals || []).length,
        departures:    (departures || []).length,
        no_shows:      noShowCount,
        charges_posted: chargesPosted,
        room_revenue:  totalRoomRevenue,
      },
    };
  } catch (err) {
    // Mark run as failed
    await supabase
      .from('night_audit_runs')
      .update({ status: 'failed', notes: err.message })
      .eq('id', runId);
    throw err;
  }
};
// src/services/searchService.js
//
// Global cross-module search for the front-desk quick-search bar.
// Searches guests, reservations, and folios in parallel and returns
// a unified ranked result list.

import { supabase }  from '../config/supabase.js';
import { AppError }  from '../middleware/errorHandler.js';

const MAX_PER_TYPE = 5;

/**
 * @param {string} orgId
 * @param {string} query  - raw search string from the user
 * @returns {Promise<{ guests, reservations, folios, total }>}
 */
export const globalSearch = async (orgId, query) => {
  if (!query || query.trim().length < 2) {
    throw new AppError('Search query must be at least 2 characters.', 400);
  }

  const q = query.trim();
  const pattern = `%${q}%`;

  const [guestRes, reservationRes, folioRes] = await Promise.all([

    // ── Guests ──────────────────────────────────────────────
    supabase
      .from('guests')
      .select('id, full_name, email, phone, category, nationality')
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .or(`full_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
      .limit(MAX_PER_TYPE),

    // ── Reservations ─────────────────────────────────────────
    supabase
      .from('reservations')
      .select(`
        id, reservation_no, status, check_in_date, check_out_date,
        guests!guest_id ( id, full_name, phone ),
        rooms!room_id  ( number, room_types ( name ) )
      `)
      .eq('org_id', orgId)
      .or(`reservation_no.ilike.${pattern},guests.full_name.ilike.${pattern}`)
      .not('status', 'in', '("cancelled","no_show")')
      .limit(MAX_PER_TYPE),

    // ── Folios ───────────────────────────────────────────────
    supabase
      .from('folios')
      .select(`
        id, folio_no, status, total_charges, total_payments,
        reservations!reservation_id (
          reservation_no,
          guests!guest_id ( full_name )
        )
      `)
      .eq('org_id', orgId)
      .ilike('folio_no', pattern)
      .limit(MAX_PER_TYPE),

  ]);

  if (guestRes.error)      throw new AppError(`Guest search failed: ${guestRes.error.message}`, 500);
  if (reservationRes.error) throw new AppError(`Reservation search failed: ${reservationRes.error.message}`, 500);
  if (folioRes.error)      throw new AppError(`Folio search failed: ${folioRes.error.message}`, 500);

  const guests = (guestRes.data || []).map(g => ({
    type:     'guest',
    id:       g.id,
    label:    g.full_name,
    sublabel: [g.email, g.phone].filter(Boolean).join(' · '),
    meta:     { category: g.category, nationality: g.nationality },
    url:      `/guests/${g.id}`,
  }));

  const reservations = (reservationRes.data || []).map(r => ({
    type:     'reservation',
    id:       r.id,
    label:    r.reservation_no,
    sublabel: [
      r.guests?.full_name,
      r.rooms?.number ? `Room ${r.rooms.number}` : null,
      r.check_in_date ? `${r.check_in_date} → ${r.check_out_date}` : null,
    ].filter(Boolean).join(' · '),
    meta:     { status: r.status },
    url:      `/reservations/${r.id}`,
  }));

  const folios = (folioRes.data || []).map(f => ({
    type:     'folio',
    id:       f.id,
    label:    f.folio_no,
    sublabel: [
      f.reservations?.guests?.full_name,
      f.reservations?.reservation_no,
    ].filter(Boolean).join(' · '),
    meta:     { status: f.status },
    url:      `/billing/${f.id}`,
  }));

  const total = guests.length + reservations.length + folios.length;

  return { guests, reservations, folios, total };
};
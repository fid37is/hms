// src/services/folioService.js

import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { CURRENCY } from '../config/constants.js';

const assembleFolio = async (orgId, folio) => {
  const [resResult, itemsResult, paymentsResult] = await Promise.all([
    supabase.from('reservations')
      .select('id, reservation_no, check_in_date, check_out_date, rate_per_night, total_amount, guest_id')
      .eq('org_id', orgId).eq('id', folio.reservation_id).single(),
    supabase.from('folio_items')
      .select('id, department, description, quantity, unit_price, amount, tax_amount, is_voided, void_reason, voided_at, posted_by, posted_at')
      .eq('org_id', orgId).eq('folio_id', folio.id).order('posted_at'),
    supabase.from('payments')
      .select('id, payment_no, amount, method, gateway, gateway_ref, status, received_by, notes, received_at, created_at')
      .eq('org_id', orgId).eq('folio_id', folio.id).order('created_at'),
  ]);

  let guest = null;
  if (resResult.data?.guest_id) {
    const { data: guestData } = await supabase
      .from('guests').select('id, full_name, email, phone')
      .eq('org_id', orgId).eq('id', resResult.data.guest_id).single();
    guest = guestData;
  }

  return {
    ...folio,
    reservation: resResult.data ? { ...resResult.data, guest } : null,
    folio_items: itemsResult.data  || [],
    payments:    paymentsResult.data || [],
  };
};

export const getFolioByReservation = async (orgId, reservationId) => {
  const { data: folio, error } = await supabase
    .from('folios')
    .select('id, folio_no, status, total_charges, total_payments, balance, notes, closed_at, closed_by, created_at, reservation_id, guest_id')
    .eq('org_id', orgId).eq('reservation_id', reservationId).single();

  if (error || !folio) throw new AppError('Folio not found.', 404);
  return assembleFolio(orgId, folio);
};

export const getFolioById = async (orgId, id) => {
  const { data: folio, error } = await supabase
    .from('folios')
    .select('id, folio_no, status, total_charges, total_payments, balance, notes, closed_at, closed_by, created_at, reservation_id, guest_id')
    .eq('org_id', orgId).eq('id', id).single();

  if (error || !folio) throw new AppError('Folio not found.', 404);
  return assembleFolio(orgId, folio);
};

export const addCharge = async (orgId, folioId, payload, postedBy) => {
  const folio = await getFolioById(orgId, folioId);
  if (folio.status !== 'open') throw new AppError('Cannot add charges to a closed folio.', 409);

  const { description, department, quantity, unit_price } = payload;
  const amount = quantity * unit_price;

  const { data, error } = await supabase
    .from('folio_items')
    .insert({ org_id: orgId, folio_id: folioId, description, department: department || 'other',
              quantity, unit_price, amount, tax_amount: 0, is_voided: false,
              posted_by: postedBy, posted_at: new Date().toISOString() })
    .select().single();

  if (error) throw new AppError(`Failed to add charge: ${error.message}`, 500);
  return data;
};

export const voidCharge = async (orgId, folioId, itemId, reason, voidedBy) => {
  const folio = await getFolioById(orgId, folioId);
  if (folio.status !== 'open') throw new AppError('Cannot void charges on a closed folio.', 409);

  const item = folio.folio_items.find(i => i.id === itemId);
  if (!item) throw new AppError('Charge not found.', 404);
  if (item.is_voided) throw new AppError('Charge already voided.', 409);

  const { data, error } = await supabase
    .from('folio_items')
    .update({ is_voided: true, void_reason: reason, voided_by: voidedBy, voided_at: new Date().toISOString() })
    .eq('org_id', orgId).eq('id', itemId).select().single();

  if (error) throw new AppError(`Failed to void charge: ${error.message}`, 500);
  return data;
};

export const addPayment = async (orgId, folioId, payload, receivedBy) => {
  const folio = await getFolioById(orgId, folioId);
  if (folio.status !== 'open') throw new AppError('Cannot add payment to a closed folio.', 409);

  const { amount, method, gateway, gateway_ref, notes } = payload;
  if (amount > folio.balance)
    throw new AppError(`Payment exceeds outstanding balance.`, 409);

  const { data, error } = await supabase
    .from('payments')
    .insert({ org_id: orgId, folio_id: folioId, amount, method,
              gateway: gateway || null, gateway_ref: gateway_ref || null,
              status: 'completed', received_by: receivedBy,
              notes: notes || null, received_at: new Date().toISOString() })
    .select().single();

  if (error) throw new AppError(`Failed to record payment: ${error.message}`, 500);
  return data;
};

export const refundPayment = async (orgId, folioId, paymentId, reason) => {
  const folio = await getFolioById(orgId, folioId);
  const payment = folio.payments.find(p => p.id === paymentId);
  if (!payment) throw new AppError('Payment not found.', 404);
  if (payment.status === 'refunded') throw new AppError('Payment already refunded.', 409);

  const { data, error } = await supabase
    .from('payments').update({ status: 'refunded', notes: reason })
    .eq('org_id', orgId).eq('id', paymentId).select().single();

  if (error) throw new AppError(`Failed to refund: ${error.message}`, 500);
  return data;
};

export const getFolioSummary = async (orgId, folioId) => {
  const folio = await getFolioById(orgId, folioId);
  const activeCharges     = folio.folio_items.filter(i => !i.is_voided);
  const completedPayments = folio.payments.filter(p => p.status === 'completed');
  const totalCharges      = activeCharges.reduce((s, i) => s + i.amount, 0);
  const totalPayments     = completedPayments.reduce((s, p) => s + p.amount, 0);
  const balance           = totalCharges - totalPayments;

  return {
    folio_id: folio.id, folio_no: folio.folio_no,
    reservation_no: folio.reservation?.reservation_no,
    guest: folio.reservation?.guest, status: folio.status,
    total_charges: totalCharges, total_payments: totalPayments,
    balance, balance_display: CURRENCY.format(balance),
    charges: activeCharges, payments: completedPayments,
  };
};

export const openShift = async (orgId, staffId, openingBalance) => {
  const { data: existing } = await supabase
    .from('shift_reports').select('id')
    .eq('org_id', orgId).eq('staff_id', staffId).is('closed_at', null).single();

  if (existing) throw new AppError('Open shift already exists.', 409);

  const { data, error } = await supabase
    .from('shift_reports')
    .insert({ org_id: orgId, staff_id: staffId, opening_balance: openingBalance || 0,
              opened_at: new Date().toISOString(), status: 'open' })
    .select().single();

  if (error) throw new AppError(`Failed to open shift: ${error.message}`, 500);
  return data;
};

export const closeShift = async (orgId, staffId, closingBalance, notes) => {
  const { data: shift } = await supabase
    .from('shift_reports').select('*')
    .eq('org_id', orgId).eq('staff_id', staffId).is('closed_at', null).single();

  if (!shift) throw new AppError('No open shift found.', 404);

  const { data: shiftPayments } = await supabase
    .from('payments').select('amount, method')
    .eq('org_id', orgId).eq('received_by', staffId).eq('status', 'completed')
    .gte('received_at', shift.opened_at);

  const payments    = shiftPayments || [];
  const totalCash   = payments.filter(p => p.method === 'cash').reduce((s, p) => s + p.amount, 0);
  const totalCard   = payments.filter(p => p.method === 'card').reduce((s, p) => s + p.amount, 0);
  const totalXfer   = payments.filter(p => p.method === 'bank_transfer').reduce((s, p) => s + p.amount, 0);
  const variance    = closingBalance - (shift.opening_balance + totalCash);

  const { data, error } = await supabase
    .from('shift_reports')
    .update({ closing_balance: closingBalance, total_cash: totalCash, total_card: totalCard,
              total_transfer: totalXfer, variance, notes: notes || null,
              closed_at: new Date().toISOString(), status: 'closed' })
    .eq('org_id', orgId).eq('id', shift.id).select().single();

  if (error) throw new AppError(`Failed to close shift: ${error.message}`, 500);
  return data;
};
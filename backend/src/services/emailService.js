// src/services/emailService.js
// Requires: nodemailer (already in package.json)
// Env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM

import nodemailer from 'nodemailer';
import { env }    from '../config/env.js';

// ─── Transporter ──────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host:   env.SMTP_HOST,
  port:   Number(env.SMTP_PORT) || 587,
  secure: Number(env.SMTP_PORT) === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

// ─── Base sender ──────────────────────────────────────────

const sendMail = async ({ to, subject, html, attachments = [] }) => {
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    console.warn('[EMAIL] SMTP not configured — skipping email to:', to);
    return null;
  }

  try {
    const info = await transporter.sendMail({
      from:        env.EMAIL_FROM || env.SMTP_USER,
      to,
      subject,
      html,
      attachments,
    });
    console.log('[EMAIL] Sent:', info.messageId, '→', to);
    return info;
  } catch (err) {
    // Silent fail — email must never break business logic
    console.error('[EMAIL] Failed to send to', to, ':', err.message);
    return null;
  }
};

// ─── Formatters ───────────────────────────────────────────

const formatKobo = (kobo) =>
  `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

// ─── Templates ────────────────────────────────────────────

export const sendBookingConfirmation = async ({ guest, reservation, room }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1F4E8C;">Booking Confirmation</h2>
      <p>Dear ${guest.full_name},</p>
      <p>Your reservation has been confirmed. Here are the details:</p>
      <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Reservation No.</strong></td>
            <td style="padding:8px; border:1px solid #ddd;">${reservation.reservation_no}</td></tr>
        <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Room</strong></td>
            <td style="padding:8px; border:1px solid #ddd;">${room?.number || 'To be assigned'}</td></tr>
        <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Check-in</strong></td>
            <td style="padding:8px; border:1px solid #ddd;">${reservation.check_in_date}</td></tr>
        <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Check-out</strong></td>
            <td style="padding:8px; border:1px solid #ddd;">${reservation.check_out_date}</td></tr>
        <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Total Amount</strong></td>
            <td style="padding:8px; border:1px solid #ddd;">${formatKobo(reservation.total_amount)}</td></tr>
      </table>
      <p>We look forward to hosting you.</p>
    </div>
  `;

  return sendMail({
    to:      guest.email,
    subject: `Booking Confirmed — ${reservation.reservation_no}`,
    html,
  });
};

export const sendCheckInReceipt = async ({ guest, reservation, folio }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1F4E8C;">Check-in Receipt</h2>
      <p>Dear ${guest.full_name}, welcome! You have successfully checked in.</p>
      <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Folio No.</strong></td>
            <td style="padding:8px; border:1px solid #ddd;">${folio.folio_no}</td></tr>
        <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Check-in</strong></td>
            <td style="padding:8px; border:1px solid #ddd;">${reservation.check_in_date}</td></tr>
        <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Check-out</strong></td>
            <td style="padding:8px; border:1px solid #ddd;">${reservation.check_out_date}</td></tr>
        <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Balance Due</strong></td>
            <td style="padding:8px; border:1px solid #ddd;">${formatKobo(folio.balance)}</td></tr>
      </table>
      <p>Enjoy your stay!</p>
    </div>
  `;

  return sendMail({
    to:      guest.email,
    subject: `Check-in Confirmed — ${folio.folio_no}`,
    html,
  });
};

export const sendCheckOutReceipt = async ({ guest, folio, items, payments, pdfBuffer = null }) => {
  const chargeRows = items
    .filter((i) => !i.is_voided)
    .map((i) => `
      <tr>
        <td style="padding:6px; border:1px solid #ddd;">${i.description}</td>
        <td style="padding:6px; border:1px solid #ddd; text-align:right;">${formatKobo(i.amount)}</td>
      </tr>`)
    .join('');

  const paymentRows = payments
    .filter((p) => p.status === 'completed')
    .map((p) => `
      <tr>
        <td style="padding:6px; border:1px solid #ddd;">${p.method} — ${p.payment_no}</td>
        <td style="padding:6px; border:1px solid #ddd; text-align:right; color:green;">-${formatKobo(p.amount)}</td>
      </tr>`)
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1F4E8C;">Final Receipt — ${folio.folio_no}</h2>
      <p>Dear ${guest.full_name}, thank you for staying with us.</p>
      <h4>Charges</h4>
      <table style="width:100%; border-collapse: collapse; margin-bottom: 10px;">
        ${chargeRows}
      </table>
      <h4>Payments</h4>
      <table style="width:100%; border-collapse: collapse; margin-bottom: 10px;">
        ${paymentRows}
      </table>
      <p><strong>Balance: ${formatKobo(folio.balance)}</strong></p>
      <p>We hope to see you again!</p>
    </div>
  `;

  const attachments = pdfBuffer
    ? [{ filename: `receipt-${folio.folio_no}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
    : [];

  return sendMail({
    to:      guest.email,
    subject: `Receipt — ${folio.folio_no}`,
    html,
    attachments,
  });
};

export const sendPasswordReset = async ({ email, resetLink }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1F4E8C;">Password Reset</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetLink}" style="background:#1F4E8C; color:#fff; padding:12px 24px;
         text-decoration:none; border-radius:4px; display:inline-block; margin:20px 0;">
        Reset Password
      </a>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;

  return sendMail({
    to:      email,
    subject: 'Password Reset Request',
    html,
  });
};
// src/services/emailService.js
// Requires: nodemailer (already in package.json)
// Env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_FROM_NAME, WEBSITE_URL

import nodemailer from 'nodemailer';
import { env }    from '../config/env.js';

// ─── Transporter ──────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host:   env.SMTP_HOST,
  port:   Number(env.SMTP_PORT) || 587,
  secure: Number(env.SMTP_PORT) === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

// ─── Core sender ──────────────────────────────────────────────────────────────

const sendMail = async ({ to, subject, html, attachments = [] }) => {
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    console.warn('[EMAIL] SMTP not configured - skipping email to:', to);
    console.warn('[EMAIL] Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env to enable emails.');
    return null;
  }
  try {
    const info = await transporter.sendMail({
      from:        `${env.EMAIL_FROM_NAME || 'Meridian Hotel'} <${env.EMAIL_FROM || env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments,
    });
    console.log('[EMAIL] Sent:', info.messageId, '->', to);
    return info;
  } catch (err) {
    // Silent fail - email must never break business logic
    console.error('[EMAIL] Failed to send to', to, ':', err.message);
    return null;
  }
};

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatNaira = (amount) => {
  if (amount == null) return '-';
  // Handle both kobo (large numbers) and naira
  const value = amount > 100000 ? amount / 100 : amount;
  return `N${Number(value).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
};

// ─── Base HTML template ───────────────────────────────────────────────────────

const hotelName = () => env.EMAIL_FROM_NAME || 'Meridian Hotel';

const baseHtml = (bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border:1px solid #e5e0d8;">

        <tr>
          <td style="background:#1a1a1a;padding:28px 40px;text-align:center;">
            <p style="margin:0;color:#c9a96e;font-size:22px;font-weight:400;letter-spacing:0.14em;text-transform:uppercase;">
              ${hotelName()}
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 32px;">
            ${bodyContent}
          </td>
        </tr>

        <tr>
          <td style="background:#f5f4f0;padding:20px 40px;text-align:center;border-top:1px solid #e5e0d8;">
            <p style="margin:0;color:#9a8c7a;font-size:12px;line-height:1.8;">
              ${hotelName()} &nbsp;·&nbsp; Questions? Reply to this email or call us.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

const detailRow = (label, value) => `
  <tr>
    <td style="padding:10px 14px;font-size:13px;color:#9a8c7a;border-bottom:1px solid #f0ece4;width:40%;">${label}</td>
    <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1a1a1a;border-bottom:1px solid #f0ece4;text-align:right;">${value}</td>
  </tr>`;

// ─── 1. Online booking confirmation (from website) ────────────────────────────
// Called by publicReservationController after a guest books on the website.
// Room is not yet assigned — shows room type name instead.

export const sendBookingConfirmation = async ({ guest, reservation, roomTypeName, ratePlanName }) => {
  const { check_in_date, check_out_date, adults, children, reservation_no, total_amount, special_requests } = reservation;

  const nights = Math.max(0, Math.round(
    (new Date(check_out_date) - new Date(check_in_date)) / 86400000
  ));

  const html = baseHtml(`
    <h2 style="margin:0 0 6px;font-size:26px;font-weight:400;color:#1a1a1a;">Booking Confirmed</h2>
    <p style="margin:0 0 28px;color:#6b5f52;font-size:14px;line-height:1.7;">
      Dear <strong>${guest.full_name}</strong>, your reservation at
      <strong>${hotelName()}</strong> is confirmed.
    </p>

    <div style="background:#f5f4f0;border:1px solid #e5e0d8;padding:20px;text-align:center;margin-bottom:28px;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9a8c7a;">Booking Reference</p>
      <p style="margin:0;font-family:'Courier New',monospace;font-size:28px;font-weight:700;color:#c9a96e;letter-spacing:0.1em;">${reservation_no}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e0d8;margin-bottom:28px;">
      ${detailRow('Room Type', roomTypeName || 'Room (to be assigned)')}
      ${ratePlanName ? detailRow('Rate Plan', ratePlanName) : ''}
      ${detailRow('Check-in', check_in_date)}
      ${detailRow('Check-out', check_out_date)}
      ${detailRow('Nights', `${nights} night${nights !== 1 ? 's' : ''}`)}
      ${detailRow('Guests', `${adults} adult${adults !== 1 ? 's' : ''}${children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}`)}
      ${total_amount ? detailRow('Total Amount', formatNaira(total_amount)) : ''}
    </table>

    ${special_requests ? `
    <div style="background:#fffdf7;border-left:3px solid #c9a96e;padding:12px 16px;margin-bottom:28px;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9a8c7a;">Special Requests</p>
      <p style="margin:0;font-size:13px;color:#1a1a1a;">${special_requests}</p>
    </div>` : ''}

    <div style="background:#f5f4f0;padding:14px 16px;font-size:13px;color:#6b5f52;line-height:1.8;margin-bottom:28px;">
      <strong>Check-in:</strong> ${env.HOTEL_CHECKIN_TIME || '2:00 PM'}
      &nbsp;&nbsp;|&nbsp;&nbsp;
      <strong>Check-out:</strong> ${env.HOTEL_CHECKOUT_TIME || '11:00 AM'}
    </div>

    <p style="margin:0;font-size:13px;color:#9a8c7a;line-height:1.7;">
      Please present this reference number on arrival.
      For changes or cancellations, contact us directly.
    </p>
  `);

  return sendMail({
    to:      guest.email,
    subject: `Booking Confirmed - ${reservation_no} | ${hotelName()}`,
    html,
  });
};

// ─── 2. Check-in receipt ──────────────────────────────────────────────────────

export const sendCheckInReceipt = async ({ guest, reservation, folio }) => {
  const html = baseHtml(`
    <h2 style="margin:0 0 6px;font-size:26px;font-weight:400;color:#1a1a1a;">Welcome, ${guest.full_name}!</h2>
    <p style="margin:0 0 28px;color:#6b5f52;font-size:14px;line-height:1.7;">
      You have successfully checked in. Here is your receipt.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e0d8;margin-bottom:28px;">
      ${detailRow('Folio No.', folio.folio_no)}
      ${detailRow('Check-in', reservation.check_in_date)}
      ${detailRow('Check-out', reservation.check_out_date)}
      ${detailRow('Balance Due', formatNaira(folio.balance))}
    </table>

    <p style="margin:0;font-size:13px;color:#9a8c7a;">Enjoy your stay!</p>
  `);

  return sendMail({
    to:      guest.email,
    subject: `Check-in Confirmed - ${folio.folio_no} | ${hotelName()}`,
    html,
  });
};

// ─── 3. Check-out receipt ─────────────────────────────────────────────────────

export const sendCheckOutReceipt = async ({ guest, folio, items, payments, pdfBuffer = null }) => {
  const chargeRows = items
    .filter((i) => !i.is_voided)
    .map((i) => `
      <tr>
        <td style="padding:8px 14px;font-size:13px;color:#1a1a1a;border-bottom:1px solid #f0ece4;">${i.description}</td>
        <td style="padding:8px 14px;font-size:13px;color:#1a1a1a;border-bottom:1px solid #f0ece4;text-align:right;">${formatNaira(i.amount)}</td>
      </tr>`)
    .join('');

  const paymentRows = payments
    .filter((p) => p.status === 'completed')
    .map((p) => `
      <tr>
        <td style="padding:8px 14px;font-size:13px;color:#6b5f52;border-bottom:1px solid #f0ece4;">${p.method} - ${p.payment_no}</td>
        <td style="padding:8px 14px;font-size:13px;color:#16a34a;border-bottom:1px solid #f0ece4;text-align:right;">-${formatNaira(p.amount)}</td>
      </tr>`)
    .join('');

  const html = baseHtml(`
    <h2 style="margin:0 0 6px;font-size:26px;font-weight:400;color:#1a1a1a;">Thank You, ${guest.full_name}</h2>
    <p style="margin:0 0 28px;color:#6b5f52;font-size:14px;line-height:1.7;">
      We hope you enjoyed your stay. Here is your final receipt.
    </p>

    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#9a8c7a;">Charges</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e0d8;margin-bottom:20px;">
      ${chargeRows}
    </table>

    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#9a8c7a;">Payments</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e0d8;margin-bottom:20px;">
      ${paymentRows}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e0d8;margin-bottom:28px;">
      ${detailRow('Balance', formatNaira(folio.balance))}
    </table>

    <p style="margin:0;font-size:13px;color:#9a8c7a;">We look forward to welcoming you back.</p>
  `);

  const attachments = pdfBuffer
    ? [{ filename: `receipt-${folio.folio_no}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
    : [];

  return sendMail({
    to:      guest.email,
    subject: `Final Receipt - ${folio.folio_no} | ${hotelName()}`,
    html,
    attachments,
  });
};

// ─── 4. Password reset ────────────────────────────────────────────────────────

export const sendPasswordReset = async ({ email, fullName, resetLink }) => {
  const html = baseHtml(`
    <h2 style="margin:0 0 6px;font-size:24px;font-weight:400;color:#1a1a1a;">Reset Your Password</h2>
    <p style="margin:0 0 28px;color:#6b5f52;font-size:14px;line-height:1.7;">
      Hi <strong>${fullName || 'there'}</strong>, we received a request to reset the password
      for your account. Click the button below to set a new password.
    </p>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${resetLink}"
         style="display:inline-block;background:#1a1a1a;color:#ffffff;padding:14px 36px;
                font-size:13px;letter-spacing:0.1em;text-decoration:none;text-transform:uppercase;">
        Reset Password
      </a>
    </div>

    <p style="margin:0 0 12px;font-size:13px;color:#9a8c7a;line-height:1.7;">
      This link expires in <strong>1 hour</strong>.
      If you did not request this, you can safely ignore this email.
    </p>

    <p style="margin:0;font-size:11px;color:#bbb;word-break:break-all;">
      Or copy this link: ${resetLink}
    </p>
  `);

  return sendMail({
    to:      email,
    subject: `Reset your password - ${hotelName()}`,
    html,
  });
};

// ─── 5. Account welcome ───────────────────────────────────────────────────────

export const sendWelcome = async ({ email, fullName }) => {
  const accountUrl = `${env.WEBSITE_URL || 'http://localhost:5174'}/account`;

  const html = baseHtml(`
    <h2 style="margin:0 0 6px;font-size:24px;font-weight:400;color:#1a1a1a;">Welcome, ${fullName}!</h2>
    <p style="margin:0 0 28px;color:#6b5f52;font-size:14px;line-height:1.7;">
      Your account has been created. You can now view and manage your reservations,
      track your booking history, and enjoy a faster checkout next time.
    </p>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${accountUrl}"
         style="display:inline-block;background:#1a1a1a;color:#ffffff;padding:14px 36px;
                font-size:13px;letter-spacing:0.1em;text-decoration:none;text-transform:uppercase;">
        View My Account
      </a>
    </div>

    <p style="margin:0;font-size:13px;color:#9a8c7a;line-height:1.7;">
      We look forward to welcoming you soon.
    </p>
  `);

  return sendMail({
    to:      email,
    subject: `Welcome to ${hotelName()}`,
    html,
  });
};
// ─── 6. Trial lifecycle emails ────────────────────────────────
// type: 'reminder' | 'urgent' | 'ended' | 'suspended' | 'deletion_warning'

export const sendTrialReminder = async ({ email, name, hotelName, daysLeft, type }) => {
  const subscribeUrl = `${env.FRONTEND_URL}/settings?tab=billing`;

  const configs = {
    reminder: {
      subject: `Your Cierlo HMS trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
      heading: `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left on your trial`,
      message: `Your 14-day free trial for <strong>${hotelName}</strong> ends in <strong>${daysLeft} days</strong>. Subscribe now to keep full access to all modules — reservations, housekeeping, billing, reports, and more.`,
      ctaText: 'Subscribe Now',
      ctaColor: '#EA6C0A',
      urgency: false,
    },
    urgent: {
      subject: `Last day of your Cierlo HMS trial — ${hotelName}`,
      heading: 'Your trial ends tomorrow',
      message: `This is your final reminder. Your free trial for <strong>${hotelName}</strong> ends <strong>tomorrow</strong>. After that, you will only be able to view your data — no new reservations, check-ins, or operations until you subscribe.`,
      ctaText: 'Subscribe Before It Ends',
      ctaColor: '#dc2626',
      urgency: true,
    },
    ended: {
      subject: `Your Cierlo HMS trial has ended — ${hotelName}`,
      heading: 'Your trial has ended',
      message: `Your free trial for <strong>${hotelName}</strong> has ended. Your data is safe and your account is still accessible, but you will not be able to take new reservations or perform operations until you subscribe. Subscribe now to restore full access immediately.`,
      ctaText: 'Subscribe to Restore Access',
      ctaColor: '#dc2626',
      urgency: true,
    },
    suspended: {
      subject: `Action required — ${hotelName} account suspended`,
      heading: 'Your account has been suspended',
      message: `Your Cierlo HMS account for <strong>${hotelName}</strong> has been suspended due to an expired trial with no active subscription. Your data is still retained. Subscribe now to reactivate your account and restore full access.`,
      ctaText: 'Reactivate Account',
      ctaColor: '#dc2626',
      urgency: true,
    },
    deletion_warning: {
      subject: `Important: ${hotelName} data will be deleted in 7 days`,
      heading: 'Your data will be deleted in 7 days',
      message: `Your Cierlo HMS account for <strong>${hotelName}</strong> has been inactive for 60 days. <strong>All your data — guests, reservations, reports — will be permanently deleted in 7 days.</strong> Subscribe now to prevent deletion and restore your account.`,
      ctaText: 'Subscribe and Save My Data',
      ctaColor: '#dc2626',
      urgency: true,
    },
  };

  const config = configs[type] || configs.reminder;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0E0805;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0E0805;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1C1208;border:1px solid #2C1E0F;border-radius:12px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#EA6C0A;padding:20px 32px;text-align:center;">
            <p style="margin:0;color:#fff;font-size:18px;font-weight:700;letter-spacing:-.3px;">Cierlo HMS</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,.7);font-size:11px;text-transform:uppercase;letter-spacing:.8px;">Hotel Management System</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${config.urgency ? `<div style="background:rgba(220,38,38,.15);border:1px solid rgba(220,38,38,.3);border-radius:8px;padding:10px 14px;margin-bottom:20px;font-size:12px;color:#FCA5A5;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">⚠ Action Required</div>` : ''}

            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#FFE8CC;letter-spacing:-.3px;">${config.heading}</h1>

            <p style="margin:0 0 8px;font-size:14px;color:#C49060;">Hi ${name || 'there'},</p>
            <p style="margin:0 0 24px;font-size:14px;color:#C49060;line-height:1.6;">${config.message}</p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="border-radius:8px;background:${config.ctaColor};">
                  <a href="${subscribeUrl}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:-.2px;">${config.ctaText}</a>
                </td>
              </tr>
            </table>

            <!-- What's included -->
            <div style="background:#261809;border:1px solid #2C1E0F;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0 0 10px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:#7A5535;">Everything included in your subscription</p>
              <div style="display:grid;font-size:13px;color:#C49060;line-height:1.8;">
                ✓ Reservations & check-in/out &nbsp;·&nbsp; ✓ Room management<br/>
                ✓ Billing & payments &nbsp;·&nbsp; ✓ Housekeeping<br/>
                ✓ Staff management &nbsp;·&nbsp; ✓ Reports & night audit<br/>
                ✓ Inventory &nbsp;·&nbsp; ✓ Events & F&B
              </div>
            </div>

            <p style="margin:0;font-size:12px;color:#7A5535;line-height:1.6;">
              Questions? Reply to this email and we'll get back to you.<br/>
              Or visit <a href="${env.FRONTEND_URL}" style="color:#EA6C0A;text-decoration:none;">${env.FRONTEND_URL}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0E0805;padding:16px 32px;border-top:1px solid #2C1E0F;text-align:center;">
            <p style="margin:0;font-size:11px;color:#7A5535;">© Cierlo HMS &nbsp;·&nbsp; You're receiving this because you signed up for a trial.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendMail({ to: email, subject: config.subject, html });
};
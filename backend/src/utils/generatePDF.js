// src/utils/generatePDF.js
//
// Generates PDF receipts / invoices for hotel folios.
// Uses pdfkit (pure Node.js, no headless browser required).
//
// Usage:
//   import { generateFolioReceipt } from '../utils/generatePDF.js';
//
//   // Stream directly to HTTP response:
//   const doc = await generateFolioReceipt(folio, hotelConfig);
//   res.setHeader('Content-Type', 'application/pdf');
//   res.setHeader('Content-Disposition', `attachment; filename="receipt-${folio.folio_no}.pdf"`);
//   doc.pipe(res);
//   doc.end();
//
//   // Buffer to memory (e.g. for email attachment):
//   const buffer = await folioReceiptBuffer(folio, hotelConfig);

import PDFDocument from 'pdfkit';
import { CURRENCY } from '../config/constants.js';

// ── Constants ────────────────────────────────────────────────
const MARGIN = 50;
const WIDTH  = 595.28; // A4 portrait
const COL    = WIDTH - MARGIN * 2;

const COLORS = {
  primary:  '#1a1a2e',
  accent:   '#4f46e5',
  muted:    '#6b7280',
  border:   '#e5e7eb',
  lightBg:  '#f9fafb',
  white:    '#ffffff',
  danger:   '#dc2626',
  success:  '#16a34a',
};

const FONTS = {
  regular: 'Helvetica',
  bold:    'Helvetica-Bold',
};

// ── Helpers ──────────────────────────────────────────────────

const fmt = (kobo) => CURRENCY.format(kobo ?? 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ') : '—';

const rule = (doc, y, color = COLORS.border, thickness = 0.5) => {
  doc.save()
    .moveTo(MARGIN, y).lineTo(WIDTH - MARGIN, y)
    .lineWidth(thickness).strokeColor(color).stroke()
    .restore();
};

const fillRect = (doc, x, y, w, h, fill) => {
  doc.save().rect(x, y, w, h).fill(fill).restore();
};

// ── Header ───────────────────────────────────────────────────

const drawHeader = (doc, config) => {
  const startY = MARGIN;

  doc.font(FONTS.bold).fontSize(20).fillColor(COLORS.primary)
    .text(config.hotel_name || 'Hotel', MARGIN, startY, { width: COL * 0.6 });

  if (config.tagline) {
    doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.muted)
      .text(config.tagline, MARGIN, doc.y, { width: COL * 0.6 });
  }

  const contactLines = [
    config.address,
    [config.city, config.state, config.country].filter(Boolean).join(', '),
    config.phone,
    config.email,
  ].filter(Boolean);

  let contactY = startY;
  contactLines.forEach((line) => {
    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.muted)
      .text(line, MARGIN + COL * 0.55, contactY, { width: COL * 0.45, align: 'right' });
    contactY = doc.y;
  });

  const titleY = Math.max(doc.y, contactY) + 16;
  fillRect(doc, MARGIN, titleY, COL, 28, COLORS.primary);
  doc.font(FONTS.bold).fontSize(13).fillColor(COLORS.white)
    .text('FOLIO / RECEIPT', MARGIN + 10, titleY + 7, { width: COL - 20, align: 'left' });

  return titleY + 28 + 16;
};

// ── Folio Meta ───────────────────────────────────────────────

const drawFolioMeta = (doc, folio, startY) => {
  const res   = folio.reservation || {};
  const guest = res.guest || {};

  const leftPairs = [
    ['Folio No',    folio.folio_no || '—'],
    ['Reservation', res.reservation_no || '—'],
    ['Guest',       guest.full_name || '—'],
    ['Phone',       guest.phone || '—'],
    ['Email',       guest.email || '—'],
  ];

  const rightPairs = [
    ['Room',      res.room?.number ? `Room ${res.room.number}` : '—'],
    ['Check-In',  formatDate(res.check_in_date)],
    ['Check-Out', formatDate(res.check_out_date)],
    ['Nights',    res.check_in_date && res.check_out_date
      ? Math.ceil((new Date(res.check_out_date) - new Date(res.check_in_date)) / 86400000)
      : '—'],
    ['Status', capitalize(folio.status)],
  ];

  const colW  = COL / 2 - 10;
  const lineH = 16;

  leftPairs.forEach(([label, value], i) => {
    const y = startY + i * lineH;
    doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.muted)
      .text(label, MARGIN, y, { width: 70 });
    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.primary)
      .text(String(value), MARGIN + 72, y, { width: colW - 72 });
  });

  rightPairs.forEach(([label, value], i) => {
    const y = startY + i * lineH;
    const x = MARGIN + colW + 20;
    doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.muted)
      .text(label, x, y, { width: 65 });
    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.primary)
      .text(String(value), x + 67, y, { width: colW - 67 });
  });

  return startY + Math.max(leftPairs.length, rightPairs.length) * lineH + 12;
};

// ── Charges Table ────────────────────────────────────────────

const drawChargesTable = (doc, items, startY) => {
  fillRect(doc, MARGIN, startY, COL, 20, COLORS.lightBg);
  rule(doc, startY, COLORS.border);
  rule(doc, startY + 20, COLORS.border);

  const cols = {
    date:   { x: MARGIN + 4,   w: 72  },
    dept:   { x: MARGIN + 80,  w: 70  },
    desc:   { x: MARGIN + 154, w: 168 },
    qty:    { x: MARGIN + 326, w: 36  },
    unit:   { x: MARGIN + 366, w: 72  },
    amount: { x: MARGIN + 440, w: 54  },
  };

  [
    ['Date',        cols.date,   'left'],
    ['Department',  cols.dept,   'left'],
    ['Description', cols.desc,   'left'],
    ['Qty',         cols.qty,    'right'],
    ['Unit Price',  cols.unit,   'right'],
    ['Amount',      cols.amount, 'right'],
  ].forEach(([label, col, align]) => {
    doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.primary)
      .text(label, col.x, startY + 5, { width: col.w, align });
  });

  let y = startY + 22;

  items.forEach((item, idx) => {
    const rowH = 15;
    if (idx % 2 === 0) fillRect(doc, MARGIN, y, COL, rowH, '#f9fafb');

    const textY = y + 3;
    const color = item.is_voided ? COLORS.muted : COLORS.primary;

    doc.font(FONTS.regular).fontSize(7.5).fillColor(color);
    doc.text(formatDate(item.posted_at),                             cols.date.x,   textY, { width: cols.date.w });
    doc.text(capitalize(item.department || '—'),                     cols.dept.x,   textY, { width: cols.dept.w });
    doc.text(item.is_voided ? `[VOIDED] ${item.description}` : item.description,
                                                                     cols.desc.x,   textY, { width: cols.desc.w });
    doc.text(String(item.quantity ?? 1),                             cols.qty.x,    textY, { width: cols.qty.w,    align: 'right' });
    doc.text(fmt(item.unit_price),                                   cols.unit.x,   textY, { width: cols.unit.w,   align: 'right' });
    doc.text(fmt(item.amount),                                       cols.amount.x, textY, { width: cols.amount.w, align: 'right' });

    y += rowH;
  });

  rule(doc, y, COLORS.border);
  return y + 8;
};

// ── Payments Table ───────────────────────────────────────────

const drawPaymentsTable = (doc, payments, startY) => {
  if (!payments.length) return startY;

  doc.font(FONTS.bold).fontSize(9).fillColor(COLORS.primary)
    .text('PAYMENTS RECEIVED', MARGIN, startY);
  startY = doc.y + 4;

  fillRect(doc, MARGIN, startY, COL, 18, COLORS.lightBg);
  rule(doc, startY, COLORS.border);
  rule(doc, startY + 18, COLORS.border);

  const cols = {
    date:   { x: MARGIN + 4,   w: 100 },
    ref:    { x: MARGIN + 108, w: 140 },
    method: { x: MARGIN + 252, w: 100 },
    status: { x: MARGIN + 356, w: 70  },
    amount: { x: MARGIN + 430, w: 64  },
  };

  [
    ['Date/Time', cols.date,   'left'],
    ['Reference', cols.ref,    'left'],
    ['Method',    cols.method, 'left'],
    ['Status',    cols.status, 'left'],
    ['Amount',    cols.amount, 'right'],
  ].forEach(([label, col, align]) => {
    doc.font(FONTS.bold).fontSize(7.5).fillColor(COLORS.primary)
      .text(label, col.x, startY + 4, { width: col.w, align });
  });

  let y = startY + 20;

  payments.forEach((p, idx) => {
    const rowH      = 15;
    const isRefunded = p.status === 'refunded';
    const color     = isRefunded ? COLORS.muted : COLORS.primary;
    if (idx % 2 === 0) fillRect(doc, MARGIN, y, COL, rowH, '#f9fafb');

    const textY = y + 3;
    doc.font(FONTS.regular).fontSize(7.5).fillColor(color);
    doc.text(formatDateTime(p.received_at),                               cols.date.x,   textY, { width: cols.date.w });
    doc.text(p.payment_no || p.gateway_ref || p.id?.slice(0, 8) || '—',  cols.ref.x,    textY, { width: cols.ref.w });
    doc.text(capitalize(p.method),                                        cols.method.x, textY, { width: cols.method.w });
    doc.fillColor(isRefunded ? COLORS.danger : COLORS.success)
      .text(capitalize(p.status),                                         cols.status.x, textY, { width: cols.status.w });
    doc.fillColor(color)
      .text(fmt(p.amount),                                                cols.amount.x, textY, { width: cols.amount.w, align: 'right' });

    y += rowH;
  });

  rule(doc, y, COLORS.border);
  return y + 8;
};

// ── Summary ──────────────────────────────────────────────────

const drawSummary = (doc, folio, startY) => {
  const activeCharges     = (folio.folio_items || []).filter(i => !i.is_voided);
  const completedPayments = (folio.payments    || []).filter(p => p.status === 'completed');

  const totalCharges  = activeCharges.reduce((s, i) => s + (i.amount || 0), 0);
  const totalPayments = completedPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const balance       = totalCharges - totalPayments;

  const boxW  = 200;
  const boxX  = WIDTH - MARGIN - boxW;
  const lineH = 18;

  const rows = [
    ['Subtotal',       fmt(totalCharges),  false],
    ['Total Payments', fmt(totalPayments), false],
    ['Balance Due',    fmt(balance),       true ],
  ];

  let y = startY;
  rows.forEach(([label, value, isBold]) => {
    if (isBold) fillRect(doc, boxX - 8, y - 2, boxW + 8, lineH + 2, COLORS.primary);
    doc.font(isBold ? FONTS.bold : FONTS.regular)
      .fontSize(isBold ? 9 : 8)
      .fillColor(isBold ? COLORS.white : COLORS.primary)
      .text(label, boxX, y + 2, { width: boxW * 0.55 });
    doc.font(isBold ? FONTS.bold : FONTS.regular)
      .fontSize(isBold ? 9 : 8)
      .fillColor(isBold ? COLORS.white : COLORS.primary)
      .text(value, boxX, y + 2, { width: boxW, align: 'right' });
    y += lineH;
  });

  return y + 12;
};

// ── Footer ───────────────────────────────────────────────────

const drawFooter = (doc, config, printedAt) => {
  const footerY = doc.page.height - MARGIN - 40;
  rule(doc, footerY, COLORS.border);

  if (config.receipt_footer) {
    doc.font(FONTS.regular).fontSize(7.5).fillColor(COLORS.muted)
      .text(config.receipt_footer, MARGIN, footerY + 6, { width: COL, align: 'center' });
  }

  doc.font(FONTS.regular).fontSize(7).fillColor(COLORS.muted)
    .text(
      `Generated on ${formatDateTime(printedAt)}  ·  ${config.hotel_name || ''}`,
      MARGIN, footerY + 20, { width: COL, align: 'center' }
    );
};

// ── Public API ───────────────────────────────────────────────

/**
 * Generates a folio receipt PDF and returns the PDFDocument stream.
 * The caller must pipe the doc and call doc.end().
 *
 * @param {object} folio       - Full folio from folioService.assembleFolio
 * @param {object} hotelConfig - Hotel config from configService.getConfig
 * @returns {PDFDocument}
 */
export const generateFolioReceipt = (folio, hotelConfig) => {
  const config = hotelConfig || {};

  const doc = new PDFDocument({
    size:    'A4',
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    info: {
      Title:   `Receipt - ${folio.folio_no || 'Folio'}`,
      Author:  config.hotel_name || 'Hotel',
      Subject: 'Folio Receipt',
    },
  });

  const printedAt = new Date().toISOString();

  let y = drawHeader(doc, config);
  rule(doc, y - 8, COLORS.border);
  y = drawFolioMeta(doc, folio, y);
  rule(doc, y, COLORS.border);
  y += 12;

  doc.font(FONTS.bold).fontSize(9).fillColor(COLORS.primary)
    .text('CHARGES', MARGIN, y);
  y = doc.y + 4;

  y = drawChargesTable(doc, folio.folio_items || [], y);
  y += 8;
  y = drawSummary(doc, folio, y);
  y += 16;
  drawPaymentsTable(doc, folio.payments || [], y);
  drawFooter(doc, config, printedAt);

  return doc;
};

/**
 * Buffers the full PDF into memory. Useful for email attachments.
 *
 * @param {object} folio
 * @param {object} hotelConfig
 * @returns {Promise<Buffer>}
 */
export const folioReceiptBuffer = (folio, hotelConfig) =>
  new Promise((resolve, reject) => {
    const doc    = generateFolioReceipt(folio, hotelConfig);
    const chunks = [];
    doc.on('data',  (chunk) => chunks.push(chunk));
    doc.on('end',   ()      => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
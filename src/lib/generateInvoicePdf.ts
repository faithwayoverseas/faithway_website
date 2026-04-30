// generateInvoicePdf.ts — Branded PDF builder for FaithWay Overseas
// Client-side only (uses jsPDF browser API).

import { Invoice, InvoiceSettings } from '@/lib/types';
import { formatAmount, getCurrencySymbol } from '@/lib/invoiceHelpers';

// ── Colours ───────────────────────────────────────────────────────────────────
const NAVY  = [15,  40,  87]  as [number, number, number];
const GOLD  = [197, 160, 89]  as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];
const LIGHT = [245, 247, 252] as [number, number, number];
const DARK  = [30,  30,  40]  as [number, number, number];

const PAGE_W = 210;
const MARGIN = 15;
const COL_W  = PAGE_W - MARGIN * 2; // 180

// ── Helper: fetch image URL → base64 data URL ─────────────────────────────────
async function urlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateInvoicePdf(
  invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'pdf_url'>,
  settings: InvoiceSettings | null,
): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const company = {
    name:    settings?.company_name    || 'FaithWay Overseas',
    address: settings?.company_address || 'Bairamalguda Rd, Sri Venkateshwara Colony, Hyderabad - 500079',
    phone:   settings?.company_phone   || '+971 50 888 1754 | +91 72075 89444',
    email:   settings?.company_email   || 'faithwayoverseas@gmail.com',
    website: settings?.company_website || 'https://faithwayoverseas.com',
  };

  // ── HEADER BAND (navy, 0–52 mm) ───────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, 52, 'F');

  // Logo or text
  let logoLoaded = false;
  if (settings?.logo_url) {
    const b64 = await urlToBase64(settings.logo_url);
    if (b64) {
      doc.addImage(b64, 'PNG', MARGIN, 8, 44, 18);
      logoLoaded = true;
    }
  }
  if (!logoLoaded) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...WHITE);
    doc.text('FaithWay', MARGIN, 20);
    doc.setTextColor(...GOLD);
    doc.text('Overseas', MARGIN + 30, 20);
  }

  // Company details (right side of header)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  const rightX = PAGE_W - MARGIN;
  doc.text(company.address, rightX, 10, { align: 'right', maxWidth: 85 });
  doc.text(company.phone,   rightX, 19, { align: 'right' });
  doc.text(company.email,   rightX, 24, { align: 'right' });
  doc.text(company.website, rightX, 29, { align: 'right' });

  // ── GOLD ACCENT LINE ─────────────────────────────────────────────────────
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(0, 52, PAGE_W, 52);

  // ── INVOICE TITLE + NUMBER/DATE BLOCK ────────────────────────────────────
  let y = 62;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...NAVY);
  doc.text('INVOICE', MARGIN, y);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  doc.text('Invoice No:', rightX - 40, y - 8);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoice_number, rightX, y - 8, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', rightX - 40, y - 2);
  doc.text(
    new Date(invoice.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    rightX, y - 2, { align: 'right' },
  );
  doc.text('Currency:', rightX - 40, y + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.currency, rightX, y + 4, { align: 'right' });

  // ── DIVIDER ──────────────────────────────────────────────────────────────
  y += 12;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);

  // ── BILL TO ───────────────────────────────────────────────────────────────
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...NAVY);
  doc.text('BILL TO', MARGIN, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(invoice.client_name, MARGIN, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 100);
  if (invoice.client_address) {
    const addrLines = doc.splitTextToSize(invoice.client_address, 90);
    doc.text(addrLines, MARGIN, y);
    y += addrLines.length * 4.5;
  }
  if (invoice.client_email) {
    doc.text(invoice.client_email, MARGIN, y);
    y += 5;
  }
  if (invoice.country) {
    doc.text(invoice.country, MARGIN, y);
    y += 5;
  }

  // ── SERVICE TABLE ─────────────────────────────────────────────────────────
  y += 6;
  const colWidths = [10, 38, 30, 74, 28]; // #, Service, Country, Description, Amount
  const headers   = ['#', 'Service', 'Country', 'Description', 'Amount'];

  // Header row
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN, y, COL_W, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  let cx = MARGIN + 3;
  headers.forEach((h, i) => {
    if (i === headers.length - 1) {
      doc.text(h, MARGIN + COL_W - 3, y + 5.5, { align: 'right' });
    } else {
      doc.text(h, cx, y + 5.5);
    }
    cx += colWidths[i];
  });
  y += 8;

  // Data row
  doc.setFillColor(...LIGHT);
  doc.rect(MARGIN, y, COL_W, 12, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...DARK);

  const sym   = getCurrencySymbol(invoice.currency);
  const cells = [
    '1',
    invoice.service_name,
    invoice.country || '—',
    doc.splitTextToSize(invoice.description || '—', colWidths[3] - 4).slice(0, 2).join(' '),
    sym + Number(invoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
  ];

  cx = MARGIN + 3;
  cells.forEach((cell, i) => {
    if (i === cells.length - 1) {
      doc.text(cell, MARGIN + COL_W - 3, y + 7.5, { align: 'right' });
    } else {
      doc.text(cell, cx, y + 7.5);
    }
    cx += colWidths[i];
  });
  y += 12;

  // Bottom border of table
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);

  // ── TOTAL ROW ─────────────────────────────────────────────────────────────
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('GRAND TOTAL', MARGIN, y);
  doc.setFontSize(11);
  doc.text(formatAmount(invoice.amount, invoice.currency), PAGE_W - MARGIN, y, { align: 'right' });

  // Amount in words
  y += 7;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 120);
  const wordsLines = doc.splitTextToSize(`In Words: ${invoice.amount_in_words || ''}`, COL_W);
  doc.text(wordsLines, MARGIN, y);
  y += wordsLines.length * 4 + 6;

  // ── GOLD DIVIDER ─────────────────────────────────────────────────────────
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 8;

  // ── NOTES / TERMS ────────────────────────────────────────────────────────
  if (invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text('NOTES / TERMS', MARGIN, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 100);
    const noteLines = doc.splitTextToSize(invoice.notes, 100);
    doc.text(noteLines, MARGIN, y);
  }

  // ── SIGNATURE / STAMP AREA (bottom-right) ────────────────────────────────
  const sigY = 240;
  const sigX = PAGE_W - MARGIN - 55;
  doc.setDrawColor(200, 200, 215);
  doc.setLineWidth(0.3);
  doc.rect(sigX, sigY, 55, 30, 'S');

  // Stamp
  if (settings?.stamp_url) {
    const sb64 = await urlToBase64(settings.stamp_url);
    if (sb64) doc.addImage(sb64, 'PNG', sigX + 5, sigY + 2, 20, 20);
  }
  // Signature
  if (settings?.signature_url) {
    const sb64 = await urlToBase64(settings.signature_url);
    if (sb64) doc.addImage(sb64, 'PNG', sigX + 25, sigY + 2, 25, 18);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...NAVY);
  doc.text('Authorized Signatory', sigX + 27.5, sigY + 26, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 120);
  doc.text(company.name, sigX + 27.5, sigY + 30, { align: 'center' });

  // ── FOOTER ───────────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 280, PAGE_W, 17, 'F');
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(0, 280, PAGE_W, 280);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.text('This is a System Generated Invoice.', PAGE_W / 2, 287, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 180, 220);
  doc.text(company.website, PAGE_W / 2, 292, { align: 'center' });

  return doc.output('blob');
}

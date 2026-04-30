// generateInvoicePdf.ts — Final Luxury Branded Invoice PDF Template
// FaithWay Overseas — Ultimate Financial Document Rebuild

import { Invoice, InvoiceSettings } from '@/lib/types';

// ── DESIGN TOKENS ──────────────────────────────────────────────────────────
const NAVY: [number, number, number] = [16, 45, 98];   // #102d62
const GOLD: [number, number, number] = [212, 164, 55]; // #d4a437
const CREAM: [number, number, number] = [252, 248, 240]; // Light gold/cream background
const LIGHT_GRAY: [number, number, number] = [248, 249, 251]; 
const BORDER_GRAY: [number, number, number] = [230, 232, 236];
const DARK: [number, number, number] = [25, 25, 25];
const GREY: [number, number, number] = [80, 80, 80];
const WHITE: [number, number, number] = [255, 255, 255];

const MARGIN = 15;
const PAGE_W = 210;
const PAGE_H = 297;
const COL_W = PAGE_W - (MARGIN * 2);

// ── HELPERS ──────────────────────────────────────────────────────────────────

interface LoadedImage {
  data: string;
  width: number;
  height: number;
}

/** Safely fetch image and get its dimensions */
async function safeImageLoader(url: string): Promise<LoadedImage | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ data: dataUrl, width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  } catch {
    return null;
  }
}

/** Format currency with symbol fallback for Rs. */
function currencyFormat(amount: number, currency: string): string {
  const symMap: Record<string, string> = {
    'INR': 'Rs.',
    'AED': 'AED',
    'USD': '$',
  };
  const sym = symMap[currency] || currency;
  const val = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${sym} ${val}`;
}

/** Draw a small icon dot */
function drawIcon(doc: any, x: number, y: number, color: [number, number, number] = NAVY) {
  doc.setFillColor(...color);
  doc.circle(x, y, 0.6, 'F');
}

// ── MAIN EXPORT ──────────────────────────────────────────────────────────────

export async function generateInvoicePdf(
  invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'pdf_url'>,
  settings: InvoiceSettings | null,
): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Load Images
  const logo = settings?.logo_url ? await safeImageLoader(settings.logo_url) : null;
  const stamp = settings?.stamp_url ? await safeImageLoader(settings.stamp_url) : null;
  const signature = settings?.signature_url ? await safeImageLoader(settings.signature_url) : null;

  const company = {
    name: settings?.company_name || 'FaithWay Overseas',
    address: settings?.company_address || 'Bairamalguda Rd, Sri Venkateshwara Colony, Hyderabad - 500079',
    phone: settings?.company_phone || '+971 50 888 1754 | +91 72075 89444',
    email: settings?.company_email || 'faithwayoverseas@gmail.com',
    website: settings?.company_website || 'https://faithwayoverseas.com',
  };

  let y = MARGIN;

  // ── HEADER SECTION (REBALANCED) ───────────────────────────────────────────

  // LEFT BLOCK: Logo & Subtext
  const logoBoxW = 60; // Slightly wider
  const logoBoxH = 30; 
  
  if (logo) {
    const imgRatio = logo.width / logo.height;
    const boxRatio = logoBoxW / logoBoxH;
    let renderW, renderH;
    if (imgRatio > boxRatio) {
      renderW = logoBoxW;
      renderH = logoBoxW / imgRatio;
    } else {
      renderH = logoBoxH;
      renderW = logoBoxH * imgRatio;
    }
    const offsetX = (logoBoxW - renderW) / 2;
    const offsetY = (logoBoxH - renderH) / 2;
    doc.addImage(logo.data, 'PNG', MARGIN + offsetX, y + offsetY, renderW, renderH);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...NAVY);
    doc.text('FaithWay', MARGIN, y + 10);
    doc.setTextColor(...GOLD);
    doc.text('Overseas', MARGIN + 32, y + 10);
  }

  y += logoBoxH + 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...NAVY);
  doc.text('FAITHWAY OVERSEAS & IMMIGRATION', MARGIN, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD); // Premium accent
  doc.text('Your Trusted Partner For Global Opportunities', MARGIN, y);

  // CENTER BLOCK: Contact (drawn at fixed X)
  const centerX = MARGIN + 65;
  const centerYStart = MARGIN;
  doc.setDrawColor(...BORDER_GRAY);
  doc.setLineWidth(0.2);
  doc.line(centerX - 4, centerYStart, centerX - 4, centerYStart + 40); // Taller separator

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...DARK);
  const contactLines = doc.splitTextToSize(company.address, 62);
  
  let cy = centerYStart + 4;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('Head Office:', centerX, cy);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY);
  cy += 4;
  doc.text(contactLines, centerX, cy);
  cy += (contactLines.length * 3.5) + 1;
  
  // Contact details with icon dots
  drawIcon(doc, centerX + 1, cy + 1.2);
  doc.text(`+971 50 888 1754 | +91 72075 89444`, centerX + 4, cy + 2);
  cy += 4.5;
  drawIcon(doc, centerX + 1, cy + 1.2);
  doc.text(company.email, centerX + 4, cy + 2);
  cy += 4.5;
  drawIcon(doc, centerX + 1, cy + 1.2);
  doc.text(company.website.replace('https://', ''), centerX + 4, cy + 2);

  // RIGHT BLOCK: Invoice Header
  const rightX = PAGE_W - MARGIN;
  const rightYStart = MARGIN;
  doc.line(rightX - 70, centerYStart, rightX - 70, centerYStart + 40); // separator

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...NAVY);
  doc.text('INVOICE', rightX, rightYStart + 10, { align: 'right' });

  // Gold divider
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(rightX - 50, rightYStart + 14, rightX, rightYStart + 14);

  // Invoice No Box
  doc.setFillColor(...NAVY);
  doc.roundedRect(rightX - 55, rightYStart + 18, 55, 7, 1.5, 1.5, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text(`INVOICE NO: ${invoice.invoice_number}`, rightX - 4, rightYStart + 22.8, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE DATE', rightX, rightYStart + 31, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  doc.text(new Date(invoice.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(), rightX, rightYStart + 36, { align: 'right' });

  y = MARGIN + 48; // Rebalanced spacing

  // ── BILL TO + CURRENCY SECTION (UPGRADED) ────────────────────────────────

  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(MARGIN, y, COL_W, 38, 'F');
  doc.setDrawColor(...BORDER_GRAY);
  doc.setLineWidth(0.2);
  doc.rect(MARGIN, y, COL_W, 38, 'S');
  
  // Bill To Tab (Navy Pill)
  doc.setFillColor(...NAVY);
  doc.roundedRect(MARGIN, y - 2, 35, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...WHITE);
  doc.text('BILL TO', MARGIN + 6, y + 3.5);

  // Client Details
  let by = y + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.text(invoice.client_name, MARGIN + 6, by);
  by += 6.5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  const clientAddrLines = doc.splitTextToSize(invoice.client_address || '', 110);
  doc.text(clientAddrLines, MARGIN + 6, by);
  by += (clientAddrLines.length * 4.5);
  
  if (invoice.client_email) {
    doc.setTextColor(...NAVY);
    doc.text(invoice.client_email, MARGIN + 6, by);
    by += 4.5;
  }
  if (invoice.country) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(invoice.country.toUpperCase(), MARGIN + 6, by);
  }

  // Currency Info Summary Card
  const cardW = 50;
  const cardX = PAGE_W - MARGIN - cardW - 6;
  const cardY = y + 8;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(cardX, cardY, cardW, 22, 1, 1, 'FD');
  
  doc.setFillColor(...NAVY);
  doc.rect(cardX, cardY, 15, 22, 'F'); // Navy sidebar for card
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text('CURR', cardX + 7.5, cardY + 11, { align: 'center', angle: 90 });
  
  doc.setTextColor(...NAVY);
  doc.setFontSize(8);
  doc.text('CURRENCY INFO', cardX + 18, cardY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  doc.text(`Currency:`, cardX + 18, cardY + 10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.currency, cardX + 46, cardY + 10.5, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Exchange Rate:`, cardX + 18, cardY + 14.5);
  doc.text(`1.00`, cardX + 46, cardY + 14.5, { align: 'right' });
  
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text(`(All amounts in ${invoice.currency})`, cardX + 18, cardY + 18.5);

  y += 48;

  // ── SERVICE TABLE (PROFESSIONAL) ──────────────────────────────────────────

  const colWidths = [12, 48, 32, 60, 28];
  const colHeaders = ['#', 'SERVICE NAME', 'COUNTRY', 'DESCRIPTION', 'AMOUNT'];

  // Navy Table Header (Taller)
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN, y, COL_W, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...WHITE);
  
  let tx = MARGIN;
  colHeaders.forEach((h, i) => {
    let align: 'left' | 'center' | 'right' = 'left';
    let ox = 4;
    if (i === 2) { align = 'center'; ox = colWidths[i] / 2; }
    if (i === 4) { align = 'right'; ox = colWidths[i] - 4; }
    doc.text(h, tx + ox, y + 6.5, { align });
    tx += colWidths[i];
  });

  y += 10;

  // Subtle gray alternate background for row
  doc.setFillColor(...LIGHT_GRAY);
  const descLines = doc.splitTextToSize(invoice.description || '—', colWidths[3] - 8);
  const rowH = Math.max(16, (descLines.length * 4.5) + 8);
  doc.rect(MARGIN, y, COL_W, rowH, 'F');

  doc.setDrawColor(...BORDER_GRAY);
  doc.setLineWidth(0.15);
  doc.rect(MARGIN, y, COL_W, rowH, 'S');
  
  let lx = MARGIN;
  for (let i = 0; i < colWidths.length - 1; i++) {
    lx += colWidths[i];
    doc.line(lx, y, lx, y + rowH);
  }

  // Row Data
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  
  const rowY = y + 7.5;
  doc.text('1', MARGIN + 6, rowY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text(invoice.service_name, MARGIN + colWidths[0] + 4, rowY);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  doc.text(invoice.country || '—', MARGIN + colWidths[0] + colWidths[1] + (colWidths[2] / 2), rowY, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  doc.text(descLines, MARGIN + colWidths[0] + colWidths[1] + colWidths[2] + 4, y + 6.5);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...NAVY);
  doc.text(currencyFormat(invoice.amount, invoice.currency), PAGE_W - MARGIN - 4, rowY, { align: 'right' });

  y += rowH + 8;

  // ── TOTAL PANEL (STRONGER) ──────────────────────────────────────────────

  // Amount Chargeable in Words Strip
  const wordsW = 115;
  doc.setFillColor(...CREAM);
  doc.rect(MARGIN, y, wordsW, 14, 'F');
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, y, wordsW, 14, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...NAVY);
  doc.text('AMOUNT CHARGEABLE (IN WORDS)', MARGIN + 3, y + 4.5);
  
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  const wordsLines = doc.splitTextToSize(invoice.amount_in_words || 'Zero Only', wordsW - 6);
  doc.text(wordsLines, MARGIN + 3, y + 9.5);

  // Total Summary
  const totalW = 60;
  const totalX = PAGE_W - MARGIN - totalW;
  doc.setDrawColor(...BORDER_GRAY);
  doc.setLineWidth(0.2);
  doc.rect(totalX, y, totalW, 11, 'S');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text('SUBTOTAL', totalX + 4, y + 7);
  doc.text(currencyFormat(invoice.amount, invoice.currency), rightX - 4, y + 7, { align: 'right' });
  
  // Grand Total Dominant Box
  y += 11.5;
  doc.setFillColor(...NAVY);
  doc.rect(totalX, y, totalW, 10, 'F');
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(totalX, y, totalX + totalW, y); // Gold highlight line

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...WHITE);
  doc.text('GRAND TOTAL', totalX + 4, y + 6.5);
  doc.text(currencyFormat(invoice.amount, invoice.currency), rightX - 4, y + 6.5, { align: 'right' });

  y += 24;

  // ── NOTES / TERMS + REMARKS + PAN (POLISHED) ─────────────────────────────

  const notesW = 100;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...BORDER_GRAY);
  doc.rect(MARGIN, y, notesW, 55, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text('NOTES / TERMS', MARGIN + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GREY);
  let ny = y + 11;
  if (invoice.notes) {
    const rawNotes = invoice.notes.split('\n').filter(n => n.trim());
    rawNotes.forEach(note => {
      const wrappedNote = doc.splitTextToSize(`• ${note.trim()}`, notesW - 10);
      doc.text(wrappedNote, MARGIN + 6, ny);
      ny += (wrappedNote.length * 3.8);
    });
  }

  // Remarks & PAN
  ny = y + 40;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('REMARKS:', MARGIN + 4, ny);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  const remarkText = `Being sale made to ${invoice.client_name} for ${invoice.service_name} services.`;
  doc.text(doc.splitTextToSize(remarkText, notesW - 8), MARGIN + 4, ny + 4);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('COMPANY PAN:', MARGIN + 4, y + 50);
  doc.setTextColor(...DARK);
  doc.text('AAGCK5647J', MARGIN + 28, y + 50);

  // ── SIGNATURE AREA (RECTANGULAR PANEL) ───────────────────────────────────

  const sigW = 75;
  const sigX = PAGE_W - MARGIN - sigW;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  doc.rect(sigX, y, sigW, 55, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text('FOR FAITHWAY OVERSEAS & IMMIGRATION', sigX + (sigW / 2), y + 7, { align: 'center' });

  // Stamp & Signature Alignment
  if (stamp) {
    const sRatio = stamp.width / stamp.height;
    const maxSW = 30;
    const maxSH = 30;
    let sw = maxSW, sh = maxSH;
    if (sRatio > 1) sh = maxSW / sRatio; else sw = maxSH * sRatio;
    doc.addImage(stamp.data, 'PNG', sigX + 5 + (maxSW - sw)/2, y + 12 + (maxSH - sh)/2, sw, sh);
  }
  if (signature) {
    const sigRatio = signature.width / signature.height;
    const maxSigW = 32;
    const maxSigH = 22;
    let sigW_r = maxSigW, sigH_r = maxSigH;
    if (sigRatio > (maxSigW / maxSigH)) {
      sigH_r = maxSigW / sigRatio;
    } else {
      sigW_r = maxSigH * sigRatio;
    }
    doc.addImage(signature.data, 'PNG', sigX + 38 + (maxSigW - sigW_r)/2, y + 15 + (maxSigH - sigH_r)/2, sigW_r, sigH_r);
  }

  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.1);
  doc.line(sigX + 10, y + 48, sigX + sigW - 10, y + 48); // Sign line

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Authorised Signatory', sigX + (sigW / 2), y + 52, { align: 'center' });

  // ── BOTTOM CORPORATE STRIP (THICKER) ─────────────────────────────────────

  const footerY = 274;
  doc.setFillColor(...NAVY);
  doc.rect(0, footerY, PAGE_W, 23, 'F');
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(0, footerY, PAGE_W, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  
  const footColW = PAGE_W / 3;
  doc.text('UAE Consultation', footColW / 2, footerY + 7, { align: 'center' });
  doc.text('India Contact', (footColW * 1.5), footerY + 7, { align: 'center' });
  doc.text('Global Website', (footColW * 2.5), footerY + 7, { align: 'center' });

  doc.setTextColor(...WHITE);
  doc.setFontSize(8.5);
  doc.text('+971 50 888 1754', footColW / 2, footerY + 12.5, { align: 'center' });
  doc.text('+91 72075 89444', (footColW * 1.5), footerY + 12.5, { align: 'center' });
  doc.text(company.website.replace('https://', ''), (footColW * 2.5), footerY + 12.5, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(170, 180, 210);
  doc.text('This is a System Generated Invoice.', PAGE_W / 2, footerY + 19, { align: 'center' });

  return doc.output('blob');
}

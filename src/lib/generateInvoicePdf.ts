// generateInvoicePdf.ts — Premium Branded Invoice PDF Template
// FaithWay Overseas — Professional Rebuild

import { Invoice, InvoiceSettings } from '@/lib/types';

// ── DESIGN TOKENS ──────────────────────────────────────────────────────────
const NAVY: [number, number, number] = [16, 45, 98];   // #102d62
const GOLD: [number, number, number] = [212, 164, 55]; // #d4a437
const DARK: [number, number, number] = [30, 30, 30];
const GREY: [number, number, number] = [100, 100, 100];
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

/** Draw a bordered box */
function drawBox(doc: any, x: number, y: number, w: number, h: number, color: [number, number, number] = NAVY) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.2);
  doc.rect(x, y, w, h, 'S');
}

/** Draw a filled header for sections */
function drawFilledHeader(doc: any, x: number, y: number, w: number, h: number, text: string, color: [number, number, number] = NAVY) {
  doc.setFillColor(...color);
  doc.rect(x, y, w, h, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text(text.toUpperCase(), x + 3, y + (h / 2) + 1);
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

  // ── HEADER SECTION ───────────────────────────────────────────────────────

  // LEFT BLOCK: Logo & Subtext
  // Logo Box: 55mm x 28mm
  const logoBoxW = 55;
  const logoBoxH = 28;
  
  if (logo) {
    // object-fit: contain logic
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
    
    // Center inside the 55x28 box
    const offsetX = (logoBoxW - renderW) / 2;
    const offsetY = (logoBoxH - renderH) / 2;
    
    doc.addImage(logo.data, 'PNG', MARGIN + offsetX, y + offsetY, renderW, renderH);
  } else {
    // Fallback text logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...NAVY);
    doc.text('FaithWay', MARGIN, y + 10);
    doc.setTextColor(...GOLD);
    doc.text('Overseas', MARGIN + 26, y + 10);
  }

  y += logoBoxH + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text('FAITHWAY OVERSEAS & IMMIGRATION', MARGIN, y);
  y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text('Your Trusted Partner For Global Opportunities', MARGIN, y);

  // CENTER BLOCK: Contact
  const centerX = MARGIN + 60;
  const centerYStart = MARGIN;
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.1);
  doc.line(centerX - 5, centerYStart, centerX - 5, centerYStart + 35); // Left separator

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...DARK);
  const contactLines = doc.splitTextToSize(company.address, 65);
  doc.text(contactLines, centerX, centerYStart + 4);
  let cy = centerYStart + 4 + (contactLines.length * 3.5);
  doc.text(`Phone: ${company.phone}`, centerX, cy);
  cy += 3.5;
  doc.text(`Email: ${company.email}`, centerX, cy);
  cy += 3.5;
  doc.text(`Web: ${company.website}`, centerX, cy);

  // RIGHT BLOCK: Invoice Header
  const rightX = PAGE_W - MARGIN;
  const rightYStart = MARGIN;
  doc.line(rightX - 75, centerYStart, rightX - 75, centerYStart + 35); // Right separator

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...NAVY);
  doc.text('INVOICE', rightX, rightYStart + 8, { align: 'right' });

  // Invoice No Box
  doc.setFillColor(...NAVY);
  doc.roundedRect(rightX - 50, rightYStart + 12, 50, 6, 1, 1, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text(`INVOICE NO: ${invoice.invoice_number}`, rightX - 3, rightYStart + 16, { align: 'right' });

  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text(`DATE: ${new Date(invoice.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}`, rightX - 3, rightYStart + 22, { align: 'right' });

  y = MARGIN + 40; // Advance Y past header (increased slightly)

  // ── BILL TO + CURRENCY SECTION ──────────────────────────────────────────

  drawBox(doc, MARGIN, y, COL_W, 35, [230, 230, 230]);
  
  // Bill To Tab
  doc.setFillColor(...NAVY);
  doc.roundedRect(MARGIN, y, 30, 6, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text('BILL TO', MARGIN + 4, y + 4.5);

  // Client Details
  let by = y + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(invoice.client_name, MARGIN + 5, by);
  by += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  const clientAddrLines = doc.splitTextToSize(invoice.client_address || '', 100);
  doc.text(clientAddrLines, MARGIN + 5, by);
  by += clientAddrLines.length * 4;
  if (invoice.client_email) {
    doc.text(invoice.client_email, MARGIN + 5, by);
    by += 4;
  }
  if (invoice.country) {
    doc.text(invoice.country.toUpperCase(), MARGIN + 5, by);
  }

  // Currency Card (Right side of Bill To area)
  const cardW = 45;
  const cardX = PAGE_W - MARGIN - cardW - 5;
  const cardY = y + 10;
  doc.setDrawColor(200, 200, 200);
  doc.rect(cardX, cardY, cardW, 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('CURRENCY INFO', cardX + 3, cardY + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(`Currency: ${invoice.currency}`, cardX + 3, cardY + 8);
  doc.text(`Exchange Rate: 1.00`, cardX + 3, cardY + 12);
  doc.setFontSize(6);
  doc.text(`(All amounts in ${invoice.currency})`, cardX + 3, cardY + 14.2);

  y += 42;

  // ── SERVICE TABLE ─────────────────────────────────────────────────────────

  const colWidths = [12, 45, 30, 65, 28];
  const colHeaders = ['#', 'SERVICE NAME', 'COUNTRY', 'DESCRIPTION', 'AMOUNT'];

  // Draw Navy Table Header
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN, y, COL_W, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  
  let tx = MARGIN;
  colHeaders.forEach((h, i) => {
    let align: 'left' | 'center' | 'right' = 'left';
    let ox = 3;
    if (i === 2) { align = 'center'; ox = colWidths[i] / 2; }
    if (i === 4) { align = 'right'; ox = colWidths[i] - 3; }
    doc.text(h, tx + ox, y + 5.5, { align });
    tx += colWidths[i];
  });

  y += 8;

  // Single Row Implementation
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.2);

  const descLines = doc.splitTextToSize(invoice.description || '—', colWidths[3] - 6);
  const rowH = Math.max(12, (descLines.length * 4) + 6);

  // Borders for row
  doc.rect(MARGIN, y, COL_W, rowH, 'S');
  let lx = MARGIN;
  for (let i = 0; i < colWidths.length - 1; i++) {
    lx += colWidths[i];
    doc.line(lx, y, lx, y + rowH);
  }

  // Row Data
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  
  const midY = y + 6;
  doc.text('1', MARGIN + 6, midY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.service_name, MARGIN + colWidths[0] + 3, midY);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.country || '—', MARGIN + colWidths[0] + colWidths[1] + (colWidths[2] / 2), midY, { align: 'center' });
  doc.text(descLines, MARGIN + colWidths[0] + colWidths[1] + colWidths[2] + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(currencyFormat(invoice.amount, invoice.currency), PAGE_W - MARGIN - 3, midY, { align: 'right' });

  y += rowH + 8;

  // ── AMOUNT IN WORDS + TOTAL PANEL ─────────────────────────────────────────

  // LEFT: Amount in Words
  const wordsW = 110;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.rect(MARGIN, y, wordsW, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...NAVY);
  doc.text('AMOUNT CHARGEABLE (IN WORDS)', MARGIN + 2, y + 4);
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  const wordsLines = doc.splitTextToSize(invoice.amount_in_words || 'Zero Only', wordsW - 6);
  doc.text(wordsLines, MARGIN + 3, y + 8);

  // RIGHT: Total Box
  const totalW = 60;
  const totalX = PAGE_W - MARGIN - totalW;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.2);
  doc.rect(totalX, y, totalW, 18, 'S');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('SUBTOTAL', totalX + 3, y + 6);
  doc.text(currencyFormat(invoice.amount, invoice.currency), rightX - 3, y + 6, { align: 'right' });
  
  doc.setFillColor(...NAVY);
  doc.rect(totalX, y + 10, totalW, 8, 'F');
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(totalX, y + 10, totalX + totalW, y + 10); // Gold accent on total

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text('GRAND TOTAL', totalX + 3, y + 15.2);
  doc.text(currencyFormat(invoice.amount, invoice.currency), rightX - 3, y + 15.2, { align: 'right' });

  y += 28;

  // ── NOTES / TERMS + REMARKS + PAN ────────────────────────────────────────

  const notesW = 100;
  drawBox(doc, MARGIN, y, notesW, 40, [220, 220, 220]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...NAVY);
  doc.text('NOTES / TERMS', MARGIN + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  let ny = y + 9;
  if (invoice.notes) {
    const rawNotes = invoice.notes.split('\n').filter(n => n.trim());
    rawNotes.forEach(note => {
      const wrappedNote = doc.splitTextToSize(`• ${note.trim()}`, notesW - 10);
      doc.text(wrappedNote, MARGIN + 5, ny);
      ny += wrappedNote.length * 3.5;
    });
  }

  // Remarks
  ny = y + 28;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('REMARKS:', MARGIN + 3, ny);
  doc.setFont('helvetica', 'normal');
  const remarkText = `Being sale made to ${invoice.client_name} for ${invoice.service_name} services.`;
  doc.text(doc.splitTextToSize(remarkText, notesW - 6), MARGIN + 3, ny + 3.5);

  // PAN
  doc.setFont('helvetica', 'bold');
  doc.text('COMPANY PAN: AAGCK5647J', MARGIN + 3, y + 37);

  // ── SIGNATURE / STAMP SECTION ─────────────────────────────────────────────

  const sigW = 65;
  const sigX = PAGE_W - MARGIN - sigW;
  doc.setDrawColor(...NAVY);
  doc.rect(sigX, y, sigW, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...NAVY);
  doc.text('FOR FAITHWAY OVERSEAS & IMMIGRATION', sigX + (sigW / 2), y + 5, { align: 'center' });

  // Stamp & Signature Images
  if (stamp) {
    // object-fit: contain for stamp
    const sRatio = stamp.width / stamp.height;
    const maxSW = 25;
    const maxSH = 25;
    let sw = maxSW, sh = maxSH;
    if (sRatio > 1) sh = maxSW / sRatio; else sw = maxSH * sRatio;
    doc.addImage(stamp.data, 'PNG', sigX + 5 + (maxSW - sw)/2, y + 8 + (maxSH - sh)/2, sw, sh);
  }
  if (signature) {
    // object-fit: contain for signature
    const sigRatio = signature.width / signature.height;
    const maxSigW = 30;
    const maxSigH = 20;
    let sigW_r = maxSigW, sigH_r = maxSigH;
    if (sigRatio > (maxSigW / maxSigH)) {
      sigH_r = maxSigW / sigRatio;
    } else {
      sigW_r = maxSigH * sigRatio;
    }
    doc.addImage(signature.data, 'PNG', sigX + 32 + (maxSigW - sigW_r)/2, y + 10 + (maxSigH - sigH_r)/2, sigW_r, sigH_r);
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Authorised Signatory', sigX + (sigW / 2), y + 36, { align: 'center' });

  // ── BOTTOM CONTACT STRIP ──────────────────────────────────────────────────

  const footerY = 275;
  doc.setFillColor(...NAVY);
  doc.rect(0, footerY, PAGE_W, 22, 'F');
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(0, footerY, PAGE_W, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...GOLD);
  
  const footColW = PAGE_W / 3;
  doc.text('UAE (WhatsApp / Consultation)', footColW / 2, footerY + 6, { align: 'center' });
  doc.text('India (Contact)', (footColW * 1.5), footerY + 6, { align: 'center' });
  doc.text("Let's Connect For Your Global Future!", (footColW * 2.5), footerY + 6, { align: 'center' });

  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('+971 50 888 1754', footColW / 2, footerY + 11, { align: 'center' });
  doc.text('+91 72075 89444', (footColW * 1.5), footerY + 11, { align: 'center' });
  doc.text(company.website.replace('https://', ''), (footColW * 2.5), footerY + 11, { align: 'center' });

  doc.setFontSize(6);
  doc.setTextColor(180, 180, 200);
  doc.text('This is a System Generated Invoice.', PAGE_W / 2, footerY + 18, { align: 'center' });

  return doc.output('blob');
}

// generateInvoicePdf.ts — Professional Commercial Grade PDF Engine
// FaithWay Overseas — Content-Responsive Grid Reconstruction

import { Invoice, InvoiceSettings } from '@/lib/types';

// ── DESIGN TOKENS ──────────────────────────────────────────────────────────
const NAVY: [number, number, number] = [16, 45, 98];   // #102d62
const GOLD: [number, number, number] = [212, 164, 55]; // #d4a437
const CREAM: [number, number, number] = [252, 248, 240]; 
const LIGHT_GRAY: [number, number, number] = [248, 249, 251]; 
const BORDER_GRAY: [number, number, number] = [230, 232, 236];
const DARK: [number, number, number] = [25, 25, 25];
const GREY: [number, number, number] = [80, 80, 80];
const WHITE: [number, number, number] = [255, 255, 255];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - (MARGIN * 2);

// ── HELPERS ──────────────────────────────────────────────────────────────────

interface LoadedImage {
  data: string;
  width: number;
  height: number;
}

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
  } catch { return null; }
}

function currencyFormat(amount: number, currency: string): string {
  const symMap: Record<string, string> = { 'INR': 'Rs.', 'AED': 'AED', 'USD': '$' };
  const sym = symMap[currency] || currency;
  return `${sym} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Layout Utility Class
class LayoutEngine {
  doc: any;
  y: number;

  constructor(doc: any) {
    this.doc = doc;
    this.y = MARGIN;
  }

  setY(val: number) { this.y = val; }
  addY(val: number) { this.y += val; }

  drawText(text: string | string[], x: number, y: number, options: any = {}) {
    const { 
      fontSize = 9, 
      fontStyle = 'normal', 
      color = DARK, 
      align = 'left',
      maxWidth = 0
    } = options;
    
    this.doc.setFont('helvetica', fontStyle);
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(...color);

    let output = text;
    if (maxWidth > 0) {
      output = this.doc.splitTextToSize(text, maxWidth);
    }

    this.doc.text(output, x, y, { align });
    return Array.isArray(output) ? output.length : 1;
  }

  getWrappedHeight(text: string, width: number, fontSize: number, lineHeight: number = 1.2) {
    this.doc.setFontSize(fontSize);
    const lines = this.doc.splitTextToSize(text, width);
    return lines.length * (fontSize * 0.3527) * lineHeight;
  }

  drawBox(x: number, y: number, w: number, h: number, options: any = {}) {
    const { bgColor = null, borderColor = BORDER_GRAY, borderWidth = 0.2, radius = 0 } = options;
    if (bgColor) {
      this.doc.setFillColor(...bgColor);
      if (radius > 0) this.doc.roundedRect(x, y, w, h, radius, radius, 'F');
      else this.doc.rect(x, y, w, h, 'F');
    }
    if (borderColor) {
      this.doc.setDrawColor(...borderColor);
      this.doc.setLineWidth(borderWidth);
      if (radius > 0) this.doc.roundedRect(x, y, w, h, radius, radius, 'S');
      else this.doc.rect(x, y, w, h, 'S');
    }
  }

  drawPill(x: number, y: number, w: number, h: number, text: string, options: any = {}) {
    const { bgColor = NAVY, textColor = WHITE, fontSize = 7, radius = 1 } = options;
    this.doc.setFillColor(...bgColor);
    this.doc.roundedRect(x, y, w, h, radius, radius, 'F');
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...textColor);
    this.doc.text(text.toUpperCase(), x + w/2, y + (h/2) + (fontSize * 0.3527 / 2) - 0.2, { align: 'center' });
  }

  drawImageContain(img: LoadedImage, x: number, y: number, maxW: number, maxH: number) {
    const ratio = img.width / img.height;
    let w = maxW, h = maxH;
    if (ratio > (maxW/maxH)) h = maxW / ratio;
    else w = maxH * ratio;
    const dx = x + (maxW - w) / 2;
    const dy = y + (maxH - h) / 2;
    this.doc.addImage(img.data, 'PNG', dx, dy, w, h);
  }
}

// ── MAIN EXPORT ──────────────────────────────────────────────────────────────

export async function generateInvoicePdf(
  invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'pdf_url'>,
  settings: InvoiceSettings | null,
): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const L = new LayoutEngine(doc);

  // Load Assets
  const logo = settings?.logo_url ? await safeImageLoader(settings.logo_url) : null;
  const stamp = settings?.stamp_url ? await safeImageLoader(settings.stamp_url) : null;
  const signature = settings?.signature_url ? await safeImageLoader(settings.signature_url) : null;

  const company = {
    name: settings?.company_name || 'FaithWay Overseas',
    address: settings?.company_address || 'Office No. 101, 1st Floor, Al Hilal Bank Building, Al Qusais, Dubai, UAE',
    phone: settings?.company_phone || '+971 54 582 9795',
    email: settings?.company_email || 'info@faithwayoverseas.com',
    website: settings?.company_website || 'www.faithwayoverseas.com',
  };

  const col1_w = 65; 
  const col2_w = 60;
  const col3_w = CONTENT_W - col1_w - col2_w; // 57mm

  // ── HEADER ─────────────────────────────────────────────────────────────────

  const headerStartY = MARGIN;
  const headerH = 45;

  // Column 1: Branding
  if (logo) {
    L.drawImageContain(logo, MARGIN, headerStartY, col1_w - 5, 25);
  } else {
    L.drawText('FAITHWAY', MARGIN + (col1_w - 5)/2, headerStartY + 15, { fontSize: 22, fontStyle: 'bold', color: NAVY, align: 'center' });
  }
  const brandingY = headerStartY + 28;
  L.drawText('FAITHWAY OVERSEAS & IMMIGRATION', MARGIN + (col1_w - 5)/2, brandingY, { fontSize: 10, fontStyle: 'bold', color: NAVY, align: 'center' });
  L.drawText('Your Trusted Partner For Global Opportunities', MARGIN + (col1_w - 5)/2, brandingY + 4, { fontSize: 7, color: GREY, align: 'center' });

  // Column 2: Contact
  const midX = MARGIN + col1_w;
  doc.setDrawColor(...BORDER_GRAY); doc.setLineWidth(0.2);
  doc.line(midX - 2, headerStartY, midX - 2, headerStartY + headerH); // Divider

  let cy = headerStartY + 2;
  const addrHeight = L.drawText(company.address, midX + 4, cy, { fontSize: 7.5, maxWidth: col2_w - 8 });
  cy += (addrHeight * 3.8) + 3;
  L.drawText(`Phone: ${company.phone}`, midX + 4, cy, { fontSize: 7.5 });
  cy += 4;
  L.drawText(`Email: ${company.email}`, midX + 4, cy, { fontSize: 7.5 });
  cy += 4;
  L.drawText(`Web: ${company.website}`, midX + 4, cy, { fontSize: 7.5 });

  // Column 3: Meta
  const rightX = MARGIN + col1_w + col2_w;
  doc.line(rightX - 2, headerStartY, rightX - 2, headerStartY + headerH); // Divider

  const metaCenterX = rightX + (col3_w / 2);
  L.drawText('INVOICE', metaCenterX, headerStartY + 8, { fontSize: 24, fontStyle: 'bold', color: NAVY, align: 'center' });
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.5); doc.line(metaCenterX - 20, headerStartY + 11, metaCenterX + 20, headerStartY + 11);

  let metaY = headerStartY + 15;
  if (invoice.payment_type && invoice.payment_type !== 'Full Payment') {
    const badgeText = invoice.payment_type.toUpperCase();
    const badgeW = doc.getTextWidth(badgeText) + 6;
    L.drawPill(metaCenterX - (badgeW/2), metaY, badgeW, 5, badgeText, { fontSize: 6.5 });
    metaY += 7;
  } else {
    metaY += 2;
  }

  const invNoText = `INVOICE NO: ${invoice.invoice_number}`;
  const invNoW = doc.getTextWidth(invNoText) + 8;
  L.drawPill(metaCenterX - (invNoW/2), metaY, invNoW, 7, invNoText, { fontSize: 8.5, radius: 1.5 });
  
  metaY += 11;
  L.drawText('INVOICE DATE', metaCenterX, metaY, { fontSize: 8, fontStyle: 'bold', color: GREY, align: 'center' });
  L.drawText(new Date(invoice.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(), metaCenterX, metaY + 5, { fontSize: 8.5, color: DARK, align: 'center' });

  L.setY(headerStartY + headerH + 8);

  // ── BILL TO ────────────────────────────────────────────────────────────────

  const billToY = L.y;
  const clientNameLines = doc.splitTextToSize(invoice.client_name, 110);
  const clientAddrLines = doc.splitTextToSize(invoice.client_address || '', 110);
  const billToContentH = (clientNameLines.length * 5) + (clientAddrLines.length * 4.2) + (invoice.client_email ? 6 : 0);
  const billToBoxH = Math.max(32, billToContentH + 16);

  L.drawBox(MARGIN, billToY, CONTENT_W, billToBoxH, { bgColor: LIGHT_GRAY });
  L.drawPill(MARGIN, billToY - 2, 30, 8, 'BILL TO', { radius: 2 });

  let bty = billToY + 11;
  L.drawText(clientNameLines, MARGIN + 6, bty, { fontSize: 13, fontStyle: 'bold', color: NAVY });
  bty += (clientNameLines.length * 5);
  L.drawText(clientAddrLines, MARGIN + 6, bty, { fontSize: 9, color: GREY });
  bty += (clientAddrLines.length * 4.2);
  if (invoice.client_email) {
    L.drawText(invoice.client_email, MARGIN + 6, bty, { fontSize: 9, color: NAVY });
  }

  // Currency Card (Vertically Centered)
  const cardW = 52; const cardX = PAGE_W - MARGIN - cardW - 4;
  const cardH = 22;
  const cardY = billToY + (billToBoxH - cardH) / 2;
  
  L.drawBox(cardX, cardY, cardW, cardH, { bgColor: WHITE, radius: 1 });
  doc.setFillColor(...NAVY); doc.rect(cardX, cardY, 14, cardH, 'F');
  L.drawText('CURR', cardX + 7, cardY + cardH/2, { fontSize: 7, fontStyle: 'bold', color: WHITE, align: 'center', angle: 90 });
  
  L.drawText('CURRENCY INFO', cardX + 18, cardY + 6, { fontSize: 8, fontStyle: 'bold', color: NAVY });
  L.drawText('Currency:', cardX + 18, cardY + 11, { fontSize: 8, color: DARK });
  L.drawText(invoice.currency, cardX + 48, cardY + 11, { fontSize: 8, fontStyle: 'bold', color: NAVY, align: 'right' });
  L.drawText('Exchange Rate:', cardX + 18, cardY + 15, { fontSize: 8, color: DARK });
  L.drawText('1.00', cardX + 48, cardY + 15, { fontSize: 8, fontStyle: 'bold', color: NAVY, align: 'right' });
  L.drawText(`(Amounts in ${invoice.currency})`, cardX + 18, cardY + 19, { fontSize: 6.5, color: GREY });

  L.setY(billToY + billToBoxH + 10);

  // ── SERVICE TABLE ──────────────────────────────────────────────────────────

  const tableY = L.y;
  const tCols = [10, 45, 28, 67, 32];
  const tHeaders = ['#', 'SERVICE NAME', 'COUNTRY', 'DESCRIPTION', 'AMOUNT'];
  
  L.drawBox(MARGIN, tableY, CONTENT_W, 10, { bgColor: NAVY, borderColor: null });
  let tx = MARGIN;
  tHeaders.forEach((h, i) => {
    let align: any = 'left'; let ox = 4;
    if (i === 2) { align = 'center'; ox = tCols[i]/2; }
    if (i === 4) { align = 'right'; ox = tCols[i]-4; }
    L.drawText(h, tx + ox, tableY + 6.5, { fontSize: 8.5, fontStyle: 'bold', color: WHITE, align });
    tx += tCols[i];
  });
  L.addY(10);

  const sNameLines = doc.splitTextToSize(invoice.service_name, tCols[1] - 8);
  const sDescLines = doc.splitTextToSize(invoice.description || '—', tCols[3] - 8);
  const rowH = Math.max(16, (sNameLines.length * 4.5) + 8, (sDescLines.length * 4.5) + 8);

  L.drawBox(MARGIN, L.y, CONTENT_W, rowH, { bgColor: LIGHT_GRAY });
  let lx = MARGIN;
  for (let i = 0; i < tCols.length - 1; i++) { 
    lx += tCols[i]; doc.line(lx, L.y, lx, L.y + rowH); 
  }

  const finalAmt = invoice.invoice_charge_amount || invoice.amount;
  const ry = L.y + 8;
  L.drawText('1', MARGIN + 5, ry, { fontSize: 9, align: 'center' });
  L.drawText(sNameLines, MARGIN + tCols[0] + 4, ry, { fontSize: 9, fontStyle: 'bold', color: NAVY });
  L.drawText(invoice.country || '—', MARGIN + tCols[0] + tCols[1] + (tCols[2]/2), ry, { fontSize: 9, align: 'center' });
  L.drawText(sDescLines, MARGIN + tCols[0] + tCols[1] + tCols[2] + 4, L.y + 6.5, { fontSize: 8.5, color: GREY });
  L.drawText(currencyFormat(finalAmt, invoice.currency), PAGE_W - MARGIN - 4, ry, { fontSize: 9.5, fontStyle: 'bold', color: NAVY, align: 'right' });

  L.addY(rowH + 8);

  // ── TOTALS ─────────────────────────────────────────────────────────────────

  const totalBlockY = L.y;
  const wordLines = doc.splitTextToSize(invoice.amount_in_words || 'Zero Only', 110);
  const wordsH = Math.max(14, 6 + (wordLines.length * 4.5));

  L.drawBox(MARGIN, totalBlockY, 115, wordsH, { bgColor: CREAM, borderColor: GOLD, borderWidth: 0.3 });
  L.drawText('AMOUNT CHARGEABLE (IN WORDS)', MARGIN + 3, totalBlockY + 4.5, { fontSize: 7, fontStyle: 'bold', color: NAVY });
  L.drawText(wordLines, MARGIN + 3, totalBlockY + 9.5, { fontSize: 9 });

  const summaryX = PAGE_W - MARGIN - 60;
  L.drawBox(summaryX, totalBlockY, 60, 11, { borderColor: BORDER_GRAY });
  L.drawText('SUBTOTAL', summaryX + 4, totalBlockY + 7, { fontSize: 9, color: GREY });
  L.drawText(currencyFormat(finalAmt, invoice.currency), PAGE_W - MARGIN - 4, totalBlockY + 7, { fontSize: 9, align: 'right' });

  const grandY = totalBlockY + 11.5;
  L.drawBox(summaryX, grandY, 60, 10, { bgColor: NAVY, borderColor: GOLD, borderWidth: 0.5 });
  L.drawText('GRAND TOTAL', summaryX + 4, grandY + 6.5, { fontSize: 10.5, fontStyle: 'bold', color: WHITE });
  L.drawText(currencyFormat(finalAmt, invoice.currency), PAGE_W - MARGIN - 4, grandY + 6.5, { fontSize: 10.5, fontStyle: 'bold', color: WHITE, align: 'right' });

  L.setY(Math.max(totalBlockY + wordsH + 12, grandY + 18));

  // ── NOTES & SIGNATURE ──────────────────────────────────────────────────────

  const bottomY = L.y;
  let notesLines: string[][] = [];
  let notesH = 12;
  if (invoice.notes) {
    invoice.notes.split('\n').filter(n => n.trim()).forEach(n => {
      const w = doc.splitTextToSize(`• ${n.trim()}`, 92);
      notesLines.push(w);
      notesH += (w.length * 3.8);
    });
  }
  const bottomCardH = Math.max(50, notesH + 15);

  L.drawBox(MARGIN, bottomY, 105, bottomCardH, { borderColor: BORDER_GRAY, radius: 1 });
  L.drawText('NOTES / TERMS', MARGIN + 4, bottomY + 6, { fontSize: 8.5, fontStyle: 'bold', color: NAVY });
  let ny = bottomY + 11;
  notesLines.forEach(lns => {
    L.drawText(lns, MARGIN + 6, ny, { fontSize: 7.5, color: GREY });
    ny += (lns.length * 3.8);
  });

  const sigW = 72; const sigX = PAGE_W - MARGIN - sigW;
  L.drawBox(sigX, bottomY, sigW, bottomCardH, { borderColor: NAVY, borderWidth: 0.3, radius: 1 });
  L.drawText('FOR FAITHWAY OVERSEAS & IMMIGRATION', sigX + sigW/2, bottomY + 7, { fontSize: 8, fontStyle: 'bold', align: 'center' });
  
  const sigSpaceH = bottomCardH - 20;
  if (stamp) L.drawImageContain(stamp, sigX + 4, bottomY + 10, 28, sigSpaceH);
  if (signature) L.drawImageContain(signature, sigX + 38, bottomY + 10, 30, sigSpaceH);

  L.doc.setDrawColor(...NAVY); L.doc.setLineWidth(0.2);
  L.doc.line(sigX + 10, bottomY + bottomCardH - 8, sigX + sigW - 10, bottomY + bottomCardH - 8);
  L.drawText('Authorised Signatory', sigX + sigW/2, bottomY + bottomCardH - 4, { fontSize: 8, fontStyle: 'bold', align: 'center' });

  L.addY(bottomCardH + 5);
  L.drawText('REMARKS:', MARGIN, L.y, { fontSize: 8, fontStyle: 'bold', color: NAVY });
  L.drawText(`Being sale made to ${invoice.client_name} for ${invoice.service_name} services.`, MARGIN + 18, L.y, { fontSize: 8, color: DARK });

  // ── FOOTER ─────────────────────────────────────────────────────────────────

  const fY = 274;
  L.doc.setFillColor(...NAVY); L.doc.rect(0, fY, PAGE_W, 23, 'F');
  L.doc.setDrawColor(...GOLD); L.doc.setLineWidth(0.8); L.doc.line(0, fY, PAGE_W, fY);
  
  L.doc.setFont('helvetica', 'bold'); L.doc.setFontSize(9); L.doc.setTextColor(...GOLD);
  const fw = PAGE_W / 3;
  L.doc.text('UAE Consultation', fw/2, fY + 7, { align: 'center' });
  L.doc.text('India Contact', (fw * 1.5), fY + 7, { align: 'center' });
  L.doc.text('Global Website', (fw * 2.5), fY + 7, { align: 'center' });
  
  L.doc.setTextColor(...WHITE); L.doc.setFontSize(8.5);
  L.doc.text(company.phone, fw/2, fY + 12.5, { align: 'center' });
  L.doc.text('+91 72075 89444', (fw * 1.5), fY + 12.5, { align: 'center' });
  L.doc.text(company.website, (fw * 2.5), fY + 12.5, { align: 'center' });
  
  L.doc.setFontSize(7); L.doc.setTextColor(170, 180, 210);
  L.doc.text('This is a System Generated Invoice.', PAGE_W/2, fY + 19, { align: 'center' });

  return doc.output('blob');
}

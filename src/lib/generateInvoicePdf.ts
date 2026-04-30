// generateInvoicePdf.ts — Hardened Professional PDF Engine
// FaithWay Overseas — Ultimate Alignment & Overflow Protection

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
const CONTENT_W = 182; 

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

class HardenedLayout {
  doc: any;
  y: number;

  constructor(doc: any) {
    this.doc = doc;
    this.y = MARGIN;
  }

  // Draw text centered in a box with auto-font-shrinking
  drawCenteredTextInBox(text: string, boxX: number, y: number, boxW: number, options: any = {}) {
    const { initialSize = 9, minSize = 6.5, fontStyle = 'normal', color = DARK, padding = 4 } = options;
    const maxW = boxW - (padding * 2);
    
    this.doc.setFont('helvetica', fontStyle);
    let size = initialSize;
    this.doc.setFontSize(size);
    
    while (this.doc.getTextWidth(text) > maxW && size > minSize) {
      size -= 0.2;
      this.doc.setFontSize(size);
    }
    
    this.doc.setTextColor(...color);
    this.doc.text(text, boxX + boxW / 2, y, { align: 'center' });
    return size;
  }

  // Draw wrapped text and return total height
  drawWrappedText(text: string | string[], x: number, y: number, maxWidth: number, options: any = {}) {
    const { fontSize = 9, fontStyle = 'normal', color = DARK, align = 'left', lineHeight = 1.2 } = options;
    this.doc.setFont('helvetica', fontStyle);
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(...color);

    const lines = this.doc.splitTextToSize(text, maxWidth);
    this.doc.text(lines, x, y, { align });
    return lines.length * (fontSize * 0.3527) * lineHeight;
  }

  // Calculate wrapped text height without drawing
  getWrappedHeight(text: string, maxWidth: number, fontSize: number, lineHeight: number = 1.2) {
    this.doc.setFontSize(fontSize);
    const lines = this.doc.splitTextToSize(text, maxWidth);
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

  drawPill(text: string, colX: number, colW: number, y: number, h: number, options: any = {}) {
    const { bgColor = NAVY, textColor = WHITE, fontSize = 7.5, maxW = 52 } = options;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(fontSize);
    
    const textW = this.doc.getTextWidth(text.toUpperCase());
    const pillW = Math.min(textW + 6, maxW);
    const pillX = colX + (colW - pillW) / 2;

    this.doc.setFillColor(...bgColor);
    this.doc.roundedRect(pillX, y, pillW, h, 1, 1, 'F');
    this.doc.setTextColor(...textColor);
    this.doc.text(text.toUpperCase(), pillX + pillW/2, y + (h/2) + (fontSize * 0.3527 / 2) - 0.2, { align: 'center' });
  }

  fitImage(img: LoadedImage, x: number, y: number, maxW: number, maxH: number) {
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
  const L = new HardenedLayout(doc);

  // Load Assets
  const logo = settings?.logo_url ? await safeImageLoader(settings.logo_url) : null;
  const stamp = settings?.stamp_url ? await safeImageLoader(settings.stamp_url) : null;
  const signature = settings?.signature_url ? await safeImageLoader(settings.signature_url) : null;

  const company = {
    name: settings?.company_name || 'FaithWay Overseas',
    address: settings?.company_address || 'Office No. 101, 1st Floor, Al Hilal Bank Building, Al Qusais, Dubai, UAE',
    phone: settings?.company_phone || '+971 50 888 1754',
    email: settings?.company_email || 'info@faithwayoverseas.com',
    website: settings?.company_website || 'www.faithwayoverseas.com',
  };

  // ── HEADER ─────────────────────────────────────────────────────────────────

  const hY = MARGIN;
  const hH = 42;
  const LX = 14, LW = 62;
  const MX = 80, MW = 54;
  const RX = 140, RW = 56;

  // Branding
  if (logo) L.fitImage(logo, LX, hY, LW - 4, 24);
  L.drawCenteredTextInBox('FAITHWAY OVERSEAS & IMMIGRATION', LX, hY + 30, LW, { initialSize: 10, fontStyle: 'bold', color: NAVY, padding: 2 });
  L.drawCenteredTextInBox('Your Trusted Partner For Global Opportunities', LX, hY + 34, LW, { initialSize: 7.5, color: GREY, padding: 1 });

  // Contact
  doc.setDrawColor(...BORDER_GRAY); doc.setLineWidth(0.2);
  doc.line(MX - 3, hY, MX - 3, hY + hH);
  L.drawWrappedText(company.address, MX, hY + 2, MW - 4, { fontSize: 7.5 });
  L.drawWrappedText(`Phone: ${company.phone}\nEmail: ${company.email}\nWeb: ${company.website}`, MX, hY + 14, MW - 4, { fontSize: 7.5 });

  // Meta
  doc.line(RX - 2, hY, RX - 2, hY + hH);
  L.drawCenteredTextInBox('INVOICE', RX, hY + 8, RW, { initialSize: 24, fontStyle: 'bold', color: NAVY });
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.5); doc.line(RX + (RW/2) - 20, hY + 11, RX + (RW/2) + 20, hY + 11);

  let ry = hY + 14;
  if (invoice.payment_type && invoice.payment_type !== 'Full Payment') {
    L.drawPill(invoice.payment_type, RX, RW, ry, 4.5, { fontSize: 6, maxW: 42 });
    ry += 6.5;
  } else { ry += 2; }

  L.drawPill(`INVOICE NO: ${invoice.invoice_number}`, RX, RW, ry, 6.5, { fontSize: 8.5, maxW: 52 });
  L.drawCenteredTextInBox('INVOICE DATE', RX, ry + 11, RW, { initialSize: 8, fontStyle: 'bold', color: GREY });
  L.drawCenteredTextInBox(new Date(invoice.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(), RX, ry + 15.5, RW, { initialSize: 8.5 });

  L.y = hY + hH + 8;

  // ── BILL TO ────────────────────────────────────────────────────────────────

  const bY = L.y;
  const bW = 112;
  const bNameH = L.getWrappedHeight(invoice.client_name, bW - 12, 13);
  const bAddrH = L.getWrappedHeight(invoice.client_address || '', bW - 12, 9);
  const bBoxH = Math.max(30, bNameH + bAddrH + 18);

  L.drawBox(MARGIN, bY, CONTENT_W, bBoxH, { bgColor: LIGHT_GRAY });
  L.drawPill('BILL TO', MARGIN, 32, bY - 2, 8);

  let bty = bY + 10;
  L.drawWrappedText(invoice.client_name, MARGIN + 6, bty, bW - 12, { fontSize: 13, fontStyle: 'bold', color: NAVY });
  bty += bNameH + 1;
  L.drawWrappedText(invoice.client_address || '', MARGIN + 6, bty, bW - 12, { fontSize: 9, color: GREY });
  if (invoice.client_email) {
    L.drawWrappedText(invoice.client_email, MARGIN + 6, bty + bAddrH + 2, bW - 12, { fontSize: 9, color: NAVY });
  }

  // Currency
  const cW = 50, cH = 20, cX = PAGE_W - MARGIN - cW - 5;
  L.drawBox(cX, bY + (bBoxH - cH) / 2, cW, cH, { bgColor: WHITE, radius: 1 });
  doc.setFillColor(...NAVY); doc.rect(cX, bY + (bBoxH - cH) / 2, 14, cH, 'F');
  L.drawCenteredTextInBox('CURR', cX, bY + bBoxH/2 + 2, 14, { initialSize: 7, fontStyle: 'bold', color: WHITE, padding: 0 }); // Note: Simplified centering
  L.drawWrappedText('CURRENCY INFO', cX + 18, bY + (bBoxH - cH) / 2 + 5, cW - 20, { fontSize: 8, fontStyle: 'bold', color: NAVY });
  L.drawWrappedText(`Currency: ${invoice.currency}\nRate: 1.00`, cX + 18, bY + (bBoxH - cH) / 2 + 10, cW - 20, { fontSize: 8 });

  L.y = bY + bBoxH + 10;

  // ── TABLE ──────────────────────────────────────────────────────────────────

  const tCols = [10, 43, 28, 65, 36];
  const tHeaders = ['#', 'SERVICE NAME', 'COUNTRY', 'DESCRIPTION', 'AMOUNT'];
  L.drawBox(MARGIN, L.y, CONTENT_W, 10, { bgColor: NAVY });
  
  let tx = MARGIN;
  tHeaders.forEach((h, i) => {
    let align: any = 'left', ox = 4;
    if (i === 2) { align = 'center'; ox = tCols[i]/2; }
    if (i === 4) { align = 'right'; ox = tCols[i]-4; }
    L.drawWrappedText(h, tx + ox, L.y + 6.5, tCols[i] - 8, { fontSize: 8, fontStyle: 'bold', color: WHITE, align });
    tx += tCols[i];
  });
  L.y += 10;

  const cpX = 4, cpY = 5;
  const sH = L.getWrappedHeight(invoice.service_name, tCols[1] - 8, 9);
  const dH = L.getWrappedHeight(invoice.description || '—', tCols[3] - 8, 8.5);
  const rowH = Math.max(16, sH + 10, dH + 10);

  L.drawBox(MARGIN, L.y, CONTENT_W, rowH, { bgColor: LIGHT_GRAY });
  let ltx = MARGIN;
  for (let i = 0; i < tCols.length - 1; i++) { ltx += tCols[i]; doc.line(ltx, L.y, ltx, L.y + rowH); }

  const fAmt = invoice.invoice_charge_amount || invoice.amount;
  L.drawWrappedText('1', MARGIN + 5, L.y + 7.5, 5, { fontSize: 9, align: 'center' });
  L.drawWrappedText(invoice.service_name, MARGIN + tCols[0] + cpX, L.y + 7.5, tCols[1] - 8, { fontSize: 9, fontStyle: 'bold', color: NAVY });
  L.drawWrappedText(invoice.country || '—', MARGIN + tCols[0] + tCols[1] + (tCols[2]/2), L.y + 7.5, tCols[2] - 8, { fontSize: 9, align: 'center' });
  L.drawWrappedText(invoice.description || '—', MARGIN + tCols[0] + tCols[1] + tCols[2] + cpX, L.y + 7.5, tCols[3] - 8, { fontSize: 8.5, color: GREY });
  L.drawCenteredTextInBox(currencyFormat(fAmt, invoice.currency), PAGE_W - MARGIN - tCols[4], L.y + 7.5, tCols[4], { initialSize: 9.5, fontStyle: 'bold', color: NAVY, align: 'right', padding: 4 });

  L.y += rowH + 8;

  // ── TOTALS ─────────────────────────────────────────────────────────────────

  const wordH = L.getWrappedHeight(invoice.amount_in_words || 'Zero Only', 95, 9);
  const wordsBoxH = Math.max(14, wordH + 8);
  L.drawBox(MARGIN, L.y, 105, wordsBoxH, { bgColor: CREAM, borderColor: GOLD, borderWidth: 0.3 });
  L.drawWrappedText('AMOUNT CHARGEABLE (IN WORDS)', MARGIN + 4, L.y + 4.5, 95, { fontSize: 7, fontStyle: 'bold', color: NAVY });
  L.drawWrappedText(invoice.amount_in_words || 'Zero Only', MARGIN + 4, L.y + 9.5, 95, { fontSize: 9 });

  const smX = PAGE_W - MARGIN - 65;
  L.drawBox(smX, L.y, 65, 11, { borderColor: BORDER_GRAY });
  L.drawWrappedText('SUBTOTAL', smX + 4, L.y + 7, 30, { fontSize: 9, color: GREY });
  L.drawCenteredTextInBox(currencyFormat(fAmt, invoice.currency), PAGE_W - MARGIN - 30, L.y + 7, 26, { initialSize: 9, align: 'right', padding: 0 });

  const gy = L.y + 11.5;
  L.drawBox(smX, gy, 65, 10, { bgColor: NAVY, borderColor: GOLD, borderWidth: 0.5 });
  L.drawWrappedText('GRAND TOTAL', smX + 4, gy + 6.5, 30, { fontSize: 10, fontStyle: 'bold', color: WHITE });
  L.drawCenteredTextInBox(currencyFormat(fAmt, invoice.currency), PAGE_W - MARGIN - 30, gy + 6.5, 26, { initialSize: 10, fontStyle: 'bold', color: WHITE, align: 'right', padding: 0 });

  L.y = Math.max(L.y + wordsBoxH + 12, gy + 18);

  // ── NOTES & SIGNATURE ──────────────────────────────────────────────────────

  const nLines: string[] = [];
  let nH = 12;
  if (invoice.notes) {
    invoice.notes.split('\n').filter(n => n.trim()).forEach(n => {
      nLines.push(`• ${n.trim()}`);
      nH += L.getWrappedHeight(`• ${n.trim()}`, 83, 7.5);
    });
  }
  const bH = Math.max(50, nH + 10);

  // Notes Box
  L.drawBox(MARGIN, L.y, 95, bH, { borderColor: BORDER_GRAY, radius: 1 });
  L.drawWrappedText('NOTES / TERMS', MARGIN + 6, L.y + 6, 83, { fontSize: 8.5, fontStyle: 'bold', color: NAVY });
  let ny = L.y + 11;
  nLines.forEach(ln => { ny += L.drawWrappedText(ln, MARGIN + 6, ny, 83, { fontSize: 7.5, color: GREY }); });

  // Signature Box
  const sW = 65, sX = PAGE_W - MARGIN - sW;
  L.drawBox(sX, L.y, sW, bH, { borderColor: NAVY, borderWidth: 0.3 });
  L.drawCenteredTextInBox('FOR FAITHWAY OVERSEAS & IMMIGRATION', sX, L.y + 9, sW, { initialSize: 9, fontStyle: 'bold', color: NAVY, padding: 4 });
  
  if (stamp) L.fitImage(stamp, sX + 9, L.y + 22, 24, bH - 35);
  if (signature) L.fitImage(signature, sX + sW - 40, L.y + 25, 32, bH - 35);

  doc.setDrawColor(...NAVY); doc.setLineWidth(0.2);
  doc.line(sX + sW - 40, L.y + bH - 16, sX + sW - 8, L.y + bH - 16);
  L.drawCenteredTextInBox('Authorised Signatory', sX + sW - 40, L.y + bH - 10, 32, { initialSize: 8, fontStyle: 'bold', color: NAVY, padding: 0 });

  L.y += bH + 6;
  L.drawWrappedText('REMARKS:', MARGIN, L.y, 25, { fontSize: 8, fontStyle: 'bold', color: NAVY });
  L.drawWrappedText(`Being sale made to ${invoice.client_name} for ${invoice.service_name} services.`, MARGIN + 18, L.y, 160, { fontSize: 8 });

  // ── FOOTER ─────────────────────────────────────────────────────────────────

  const fY = 270;
  doc.setFillColor(...NAVY); doc.rect(0, fY, PAGE_W, 20, 'F');
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.8); doc.line(0, fY, PAGE_W, fY);
  
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...GOLD);
  const fw = PAGE_W / 3;
  doc.text('UAE Consultation', fw/2, fY + 6.5, { align: 'center' });
  doc.text('India Contact', fw*1.5, fY + 6.5, { align: 'center' });
  doc.text('Global Website', fw*2.5, fY + 6.5, { align: 'center' });
  
  doc.setTextColor(...WHITE); doc.setFontSize(8);
  doc.text('+971 50 888 1754', fw/2, fY + 11.5, { align: 'center' });
  doc.text('+91 72075 89444', fw*1.5, fY + 11.5, { align: 'center' });
  doc.text('https://faithway-website.vercel.app/', fw*2.5, fY + 11.5, { align: 'center' });
  
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(120, 120, 120);
  doc.text('This is a System Generated Invoice.', PAGE_W/2, fY + 26, { align: 'center' });

  return doc.output('blob');
}

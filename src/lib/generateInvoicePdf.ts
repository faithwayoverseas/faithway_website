// generateInvoicePdf.ts — Strict A4 Grid Professional Invoice Engine
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
const CONTENT_W = 182; // PAGE_W - 2 * MARGIN

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

class InvoiceLayout {
  doc: any;
  y: number;

  constructor(doc: any) {
    this.doc = doc;
    this.y = MARGIN;
  }

  // Draw Pill Centered in a column
  drawPill(text: string, colX: number, colW: number, y: number, h: number, options: any = {}) {
    const { bgColor = NAVY, textColor = WHITE, fontSize = 7, maxW = 50 } = options;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(fontSize);
    
    const textW = this.doc.getTextWidth(text.toUpperCase());
    const pillW = Math.min(textW + 6, maxW);
    const pillX = colX + (colW - pillW) / 2;

    this.doc.setFillColor(...bgColor);
    this.doc.roundedRect(pillX, y, pillW, h, 1, 1, 'F');
    this.doc.setTextColor(...textColor);
    this.doc.text(text.toUpperCase(), pillX + pillW/2, y + (h/2) + (fontSize * 0.3527 / 2) - 0.2, { align: 'center' });
    return h;
  }

  // Draw text that shrinks font size to fit width
  drawAutoFitText(text: string, centerX: number, y: number, maxW: number, initialSize: number, options: any = {}) {
    const { fontStyle = 'normal', color = DARK } = options;
    this.doc.setFont('helvetica', fontStyle);
    let size = initialSize;
    this.doc.setFontSize(size);
    while (this.doc.getTextWidth(text) > maxW && size > 5) {
      size -= 0.2;
      this.doc.setFontSize(size);
    }
    this.doc.setTextColor(...color);
    this.doc.text(text, centerX, y, { align: 'center' });
    return size;
  }

  drawWrappedText(text: string | string[], x: number, y: number, maxWidth: number, options: any = {}) {
    const { fontSize = 9, fontStyle = 'normal', color = DARK, align = 'left', lineHeight = 1.2 } = options;
    this.doc.setFont('helvetica', fontStyle);
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(...color);

    const lines = this.doc.splitTextToSize(text, maxWidth);
    this.doc.text(lines, x, y, { align });
    return lines.length * (fontSize * 0.3527) * lineHeight;
  }

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

  fitImage(img: LoadedImage, x: number, y: number, maxW: number, maxH: number) {
    const ratio = img.width / img.height;
    let w = maxW, h = maxH;
    if (ratio > (maxW/maxH)) h = maxW / ratio;
    else w = maxH * ratio;
    const dx = x + (maxW - w) / 2;
    const dy = y + (maxH - h) / 2;
    this.doc.addImage(img.data, 'PNG', dx, dy, w, h);
  }

  checkPageBreak(height: number) {
    if (this.y + height > 265) {
      this.doc.addPage();
      this.y = MARGIN;
      return true;
    }
    return false;
  }
}

// ── MAIN EXPORT ──────────────────────────────────────────────────────────────

export async function generateInvoicePdf(
  invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'pdf_url'>,
  settings: InvoiceSettings | null,
): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const L = new InvoiceLayout(doc);

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

  // Grid Config
  const LX = 14, LW = 62;
  const MX = 80, MW = 54;
  const RX = 140, RW = 56;

  // ── HEADER ─────────────────────────────────────────────────────────────────

  const hY = MARGIN;
  const hH = 42;

  // Left: Branding
  const brandTextW = LW - 8;
  const brandCenterX = LX + LW/2;

  if (logo) L.fitImage(logo, LX, hY, LW - 4, 24);
  else {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(...NAVY);
    doc.text('FAITHWAY', brandCenterX, hY + 12, { align: 'center' });
  }

  L.drawAutoFitText('FAITHWAY OVERSEAS & IMMIGRATION', brandCenterX, hY + 30, brandTextW, 10, { fontStyle: 'bold', color: NAVY });
  L.drawAutoFitText('Your Trusted Partner For Global Opportunities', brandCenterX, hY + 34, brandTextW, 7.5, { color: GREY });

  // Middle: Contact
  doc.setDrawColor(...BORDER_GRAY); doc.setLineWidth(0.2);
  doc.line(MX - 3, hY, MX - 3, hY + hH); // Left Divider

  let mY = hY + 2;
  const cAddrLines = doc.splitTextToSize(company.address, MW - 4);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...DARK);
  doc.text(cAddrLines, MX, mY);
  mY += (cAddrLines.length * 3.8) + 2;
  doc.text(`Phone: ${company.phone}`, MX, mY);
  mY += 4;
  doc.text(`Email: ${company.email}`, MX, mY);
  mY += 4;
  doc.text(`Web: ${company.website}`, MX, mY);

  // Right: Meta
  doc.line(RX - 2, hY, RX - 2, hY + hH); // Right Divider
  const rCenterX = RX + (RW / 2);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(24); doc.setTextColor(...NAVY);
  doc.text('INVOICE', rCenterX, hY + 8, { align: 'center' });
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.5); doc.line(rCenterX - 20, hY + 11, rCenterX + 20, hY + 11);

  let ry = hY + 14;
  if (invoice.payment_type && invoice.payment_type !== 'Full Payment') {
    L.drawPill(invoice.payment_type, RX, RW, ry, 4.5, { fontSize: 6, maxW: 42 });
    ry += 6.5;
  } else {
    ry += 2;
  }

  L.drawPill(`INVOICE NO: ${invoice.invoice_number}`, RX, RW, ry, 6.5, { fontSize: 8.5, maxW: 52, radius: 1 });
  
  ry += 10.5;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...GREY);
  doc.text('INVOICE DATE', rCenterX, ry, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...DARK);
  doc.text(new Date(invoice.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(), rCenterX, ry + 4.5, { align: 'center' });

  L.y = hY + hH + 8;

  // ── BILL TO ────────────────────────────────────────────────────────────────

  const bY = L.y;
  const bClientNameLines = doc.splitTextToSize(invoice.client_name, 112);
  const bClientAddrLines = doc.splitTextToSize(invoice.client_address || '', 112);
  const bHeight = Math.max(30, (bClientNameLines.length * 5) + (bClientAddrLines.length * 4.2) + (invoice.client_email ? 12 : 6) + 12);

  L.drawBox(MARGIN, bY, CONTENT_W, bHeight, { bgColor: LIGHT_GRAY });
  L.drawPill('BILL TO', MARGIN, 32, bY - 2, 8, { radius: 1.5 });

  let bty = bY + 10;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...NAVY);
  doc.text(bClientNameLines, MARGIN + 6, bty);
  bty += (bClientNameLines.length * 5.2);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GREY);
  doc.text(bClientAddrLines, MARGIN + 6, bty);
  bty += (bClientAddrLines.length * 4.2);
  if (invoice.client_email) {
    doc.setTextColor(...NAVY); doc.text(invoice.client_email, MARGIN + 6, bty);
  }

  // Currency Card
  const cCardW = 50, cCardH = 20, cCardX = PAGE_W - MARGIN - cCardW - 5;
  const cCardY = bY + (bHeight - cCardH) / 2;
  L.drawBox(cCardX, cCardY, cCardW, cCardH, { bgColor: WHITE, radius: 1 });
  doc.setFillColor(...NAVY); doc.rect(cCardX, cCardY, 14, cCardH, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...WHITE);
  doc.text('CURR', cCardX + 7, cCardY + (cCardH/2) + 1.2, { align: 'center', angle: 90 });
  
  doc.setFontSize(8); doc.setTextColor(...NAVY); doc.text('CURRENCY INFO', cCardX + 18, cCardY + 5);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK);
  doc.text('Currency:', cCardX + 18, cCardY + 10);
  doc.setFont('helvetica', 'bold'); doc.text(invoice.currency, cCardX + 46, cCardY + 10, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.text('Rate:', cCardX + 18, cCardY + 14.5);
  doc.setFont('helvetica', 'bold'); doc.text('1.00', cCardX + 46, cCardY + 14.5, { align: 'right' });

  L.y = bY + bHeight + 10;

  // ── TABLE ──────────────────────────────────────────────────────────────────

  const tCols = [10, 43, 28, 65, 36];
  const tHeaders = ['#', 'SERVICE NAME', 'COUNTRY', 'DESCRIPTION', 'AMOUNT'];
  
  L.drawBox(MARGIN, L.y, CONTENT_W, 10, { bgColor: NAVY });
  let tx = MARGIN;
  tHeaders.forEach((h, i) => {
    let align: any = 'left', ox = 4;
    if (i === 2) { align = 'center'; ox = tCols[i]/2; }
    if (i === 4) { align = 'right'; ox = tCols[i]-4; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...WHITE);
    doc.text(h, tx + ox, L.y + 6.5, { align });
    tx += tCols[i];
  });
  L.y += 10;

  const rowSNLines = doc.splitTextToSize(invoice.service_name, tCols[1] - 6);
  const rowDescLines = doc.splitTextToSize(invoice.description || '—', tCols[3] - 6);
  const rowH = Math.max(15, (rowSNLines.length * 4.5) + 6, (rowDescLines.length * 4.5) + 6);

  L.drawBox(MARGIN, L.y, CONTENT_W, rowH, { bgColor: LIGHT_GRAY });
  let ltx = MARGIN;
  for (let i = 0; i < tCols.length - 1; i++) { ltx += tCols[i]; doc.line(ltx, L.y, ltx, L.y + rowH); }

  const fAmt = invoice.invoice_charge_amount || invoice.amount;
  const ry_base = L.y + 7.5;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...DARK);
  doc.text('1', MARGIN + 5, ry_base, { align: 'center' });
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY); doc.text(rowSNLines, MARGIN + tCols[0] + 3, ry_base);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK); doc.text(invoice.country || '—', MARGIN + tCols[0] + tCols[1] + (tCols[2]/2), ry_base, { align: 'center' });
  doc.setFontSize(8.5); doc.setTextColor(...GREY); doc.text(rowDescLines, MARGIN + tCols[0] + tCols[1] + tCols[2] + 3, L.y + 6.5);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...NAVY);
  doc.text(currencyFormat(fAmt, invoice.currency), PAGE_W - MARGIN - 4, ry_base, { align: 'right' });

  L.y += rowH + 8;

  // ── TOTALS ─────────────────────────────────────────────────────────────────

  const wordsLines = doc.splitTextToSize(invoice.amount_in_words || 'Zero Only', 100);
  const wordsH = Math.max(14, 6 + (wordsLines.length * 4.5));

  L.drawBox(MARGIN, L.y, 105, wordsH, { bgColor: CREAM, borderColor: GOLD, borderWidth: 0.3 });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...NAVY);
  doc.text('AMOUNT CHARGEABLE (IN WORDS)', MARGIN + 3, L.y + 4.5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...DARK);
  doc.text(wordsLines, MARGIN + 3, L.y + 9.5);

  const smX = PAGE_W - MARGIN - 65;
  L.drawBox(smX, L.y, 65, 11, { borderColor: BORDER_GRAY });
  doc.setFontSize(9); doc.setTextColor(...GREY);
  doc.text('SUBTOTAL', smX + 4, L.y + 7);
  doc.text(currencyFormat(fAmt, invoice.currency), PAGE_W - MARGIN - 4, L.y + 7, { align: 'right' });

  const gy = L.y + 11.5;
  L.drawBox(smX, gy, 65, 10, { bgColor: NAVY, borderColor: GOLD, borderWidth: 0.5 });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...WHITE);
  doc.text('GRAND TOTAL', smX + 4, gy + 6.5);
  doc.text(currencyFormat(fAmt, invoice.currency), PAGE_W - MARGIN - 4, gy + 6.5, { align: 'right' });

  L.y = Math.max(L.y + wordsH + 12, gy + 18);

  // ── NOTES & SIGNATURE ──────────────────────────────────────────────────────

  const nLines: string[][] = [];
  let nH = 12;
  if (invoice.notes) {
    invoice.notes.split('\n').filter(n => n.trim()).forEach(n => {
      const w = doc.splitTextToSize(`• ${n.trim()}`, 88);
      nLines.push(w); nH += (w.length * 3.8);
    });
  }
  const bBoxH = Math.max(50, nH + 10);

  L.drawBox(MARGIN, L.y, 95, bBoxH, { borderColor: BORDER_GRAY, radius: 1 });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...NAVY);
  doc.text('NOTES / TERMS', MARGIN + 4, L.y + 6);
  let n_y = L.y + 11;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GREY);
  nLines.forEach(lns => { doc.text(lns, MARGIN + 6, n_y); n_y += (lns.length * 3.8); });

  const sW = 65, sX = PAGE_W - MARGIN - sW;
  L.drawBox(sX, L.y, sW, bBoxH, { borderColor: NAVY, borderWidth: 0.3 });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
  doc.text('FOR FAITHWAY OVERSEAS', sX + sW/2, L.y + 7, { align: 'center' });
  
  const sSpH = bBoxH - 22;
  if (stamp) L.fitImage(stamp, sX + 4, L.y + 10, 26, sSpH);
  if (signature) L.fitImage(signature, sX + 34, L.y + 10, 27, sSpH);

  doc.setDrawColor(...NAVY); doc.setLineWidth(0.2);
  doc.line(sX + 8, L.y + bBoxH - 8, sX + sW - 8, L.y + bBoxH - 8);
  doc.text('Authorised Signatory', sX + sW/2, L.y + bBoxH - 4, { align: 'center' });

  L.y += bBoxH + 4;
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY);
  doc.text('REMARKS:', MARGIN, L.y);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK);
  doc.text(`Being sale made to ${invoice.client_name} for ${invoice.service_name} services.`, MARGIN + 18, L.y);

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
  
  // System Generated Text (Bottom White Margin)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(120, 120, 120);
  doc.text('This is a System Generated Invoice.', PAGE_W/2, fY + 26, { align: 'center' });

  return doc.output('blob');
}

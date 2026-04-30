// generateInvoicePdf.ts — Content-Responsive Premium Invoice Engine
// FaithWay Overseas — Production Grade Update

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

const MARGIN = 15;
const PAGE_W = 210;
const PAGE_H = 297;
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

// ── MAIN EXPORT ──────────────────────────────────────────────────────────────

export async function generateInvoicePdf(
  invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'pdf_url'>,
  settings: InvoiceSettings | null,
): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

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

  let y = MARGIN;

  // ── HEADER RECONSTRUCTION (3 COLUMNS) ────────────────────────────────────

  const col1_w = 70; // Branding
  const col2_w = 60; // Contact
  const col3_w = CONTENT_W - col1_w - col2_w; 

  // 1. Branding
  const logoMaxW = 55;
  const logoMaxH = 28;
  if (logo) {
    const ratio = logo.width / logo.height;
    let rW = logoMaxW, rH = logoMaxH;
    if (ratio > (logoMaxW/logoMaxH)) rH = logoMaxW / ratio; else rW = logoMaxH * ratio;
    doc.addImage(logo.data, 'PNG', MARGIN + (col1_w - rW)/2, y, rW, rH);
  } else {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(...NAVY);
    doc.text('FAITHWAY', MARGIN + col1_w/2, y + 15, { align: 'center' });
  }

  const brandingY = y + logoMaxH + 4;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...NAVY);
  doc.text('FAITHWAY OVERSEAS & IMMIGRATION', MARGIN + col1_w/2, brandingY, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GREY);
  doc.text('Your Trusted Partner For Global Opportunities', MARGIN + col1_w/2, brandingY + 4, { align: 'center' });

  // 2. Middle Contact
  const midX = MARGIN + col1_w + 5;
  doc.setDrawColor(...BORDER_GRAY); doc.setLineWidth(0.2);
  doc.line(MARGIN + col1_w, y, MARGIN + col1_w, y + 42); 

  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...DARK);
  const addrLines = doc.splitTextToSize(company.address, col2_w - 10);
  let cy = y + 4;
  doc.text(addrLines, midX, cy);
  cy += (addrLines.length * 3.8) + 2;
  doc.text(`Phone: ${company.phone}`, midX, cy);
  cy += 4;
  doc.text(`Email: ${company.email}`, midX, cy);
  cy += 4;
  doc.text(`Web: ${company.website}`, midX, cy);

  // 3. Right Meta
  const rightX = PAGE_W - MARGIN;
  doc.line(MARGIN + col1_w + col2_w, y, MARGIN + col1_w + col2_w, y + 42); 

  doc.setFont('helvetica', 'bold'); doc.setFontSize(26); doc.setTextColor(...NAVY);
  doc.text('INVOICE', rightX, y + 8, { align: 'right' });
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.5); doc.line(rightX - 45, y + 12, rightX, y + 12);

  // Status Badge
  if (invoice.payment_type && invoice.payment_type !== 'Full Payment') {
    doc.setFillColor(...NAVY);
    const badgeText = invoice.payment_type.toUpperCase();
    doc.setFontSize(7); // Set font size BEFORE measuring
    const badgeW = doc.getTextWidth(badgeText) + 6;
    doc.roundedRect(rightX - badgeW, y + 13.5, badgeW, 5, 1, 1, 'F');
    doc.setTextColor(...WHITE);
    doc.text(badgeText, rightX - (badgeW/2), y + 17, { align: 'center' });
  }

  doc.setFillColor(...NAVY); doc.roundedRect(rightX - 52, y + 20, 52, 7, 1.5, 1.5, 'F');
  doc.setFontSize(9); doc.setTextColor(...WHITE);
  doc.text(`INVOICE NO: ${invoice.invoice_number}`, rightX - 3, y + 24.8, { align: 'right' });

  doc.setFontSize(8.5); doc.setTextColor(...GREY); doc.setFont('helvetica', 'bold');
  doc.text('INVOICE DATE', rightX, y + 33, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK);
  doc.text(new Date(invoice.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(), rightX, y + 38, { align: 'right' });

  y = MARGIN + 50;

  // ── BILL TO SECTION (DYNAMIC) ───────────────────────────────────────────

  // Calculate wrap for Bill To
  const clientNameLines = doc.splitTextToSize(invoice.client_name, 110);
  const clientAddrLines = doc.splitTextToSize(invoice.client_address || '', 110);
  
  // Height calculation for Bill To box
  const billToH = Math.max(35, 14 + (clientNameLines.length * 5) + (clientAddrLines.length * 4.2) + (invoice.client_email ? 6 : 0));

  doc.setFillColor(...LIGHT_GRAY); doc.rect(MARGIN, y, CONTENT_W, billToH, 'F');
  doc.setDrawColor(...BORDER_GRAY); doc.setLineWidth(0.2); doc.rect(MARGIN, y, CONTENT_W, billToH, 'S');
  
  doc.setFillColor(...NAVY); doc.roundedRect(MARGIN, y - 2, 32, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...WHITE);
  doc.text('BILL TO', MARGIN + 6, y + 3.5);

  let by = y + 12;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...NAVY);
  doc.text(clientNameLines, MARGIN + 6, by);
  by += (clientNameLines.length * 5);
  
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GREY);
  doc.text(clientAddrLines, MARGIN + 6, by);
  by += (clientAddrLines.length * 4.2);
  
  if (invoice.client_email) {
    doc.setTextColor(...NAVY); doc.text(invoice.client_email, MARGIN + 6, by);
  }

  // Currency Card (Fixed position relative to start of box)
  const cardW = 50; const cardX = PAGE_W - MARGIN - cardW - 6; const cardY = y + 7;
  doc.setFillColor(255, 255, 255); doc.roundedRect(cardX, cardY, cardW, 22, 1, 1, 'FD');
  doc.setFillColor(...NAVY); doc.rect(cardX, cardY, 15, 22, 'F'); 
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...WHITE);
  doc.text('CURR', cardX + 7.5, cardY + 11, { align: 'center', angle: 90 });
  doc.setTextColor(...NAVY); doc.setFontSize(8); doc.text('CURRENCY INFO', cardX + 18, cardY + 5.5);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK);
  doc.text(`Currency:`, cardX + 18, cardY + 10.5); doc.setFont('helvetica', 'bold'); doc.text(invoice.currency, cardX + 46, cardY + 10.5, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.text(`Exchange Rate:`, cardX + 18, cardY + 14.5); doc.text(`1.00`, cardX + 46, cardY + 14.5, { align: 'right' });
  doc.setFontSize(6.5); doc.setTextColor(...GREY); doc.text(`(All amounts in ${invoice.currency})`, cardX + 18, cardY + 18.5);

  y += billToH + 10;

  // ── TABLE (DYNAMIC) ───────────────────────────────────────────────────────

  const cols = [12, 48, 32, 60, 28];
  const headers = ['#', 'SERVICE NAME', 'COUNTRY', 'DESCRIPTION', 'AMOUNT'];
  doc.setFillColor(...NAVY); doc.rect(MARGIN, y, CONTENT_W, 10, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...WHITE);
  let tx = MARGIN;
  headers.forEach((h, i) => {
    let align: 'left' | 'center' | 'right' = 'left'; let ox = 4;
    if (i === 2) { align = 'center'; ox = cols[i] / 2; }
    if (i === 4) { align = 'right'; ox = cols[i] - 4; }
    doc.text(h, tx + ox, y + 6.5, { align });
    tx += cols[i];
  });
  y += 10;

  // Wrapped rows for service table
  const serviceNameLines = doc.splitTextToSize(invoice.service_name, cols[1] - 8);
  const dLines = doc.splitTextToSize(invoice.description || '—', cols[3] - 8);
  const rowH = Math.max(16, (serviceNameLines.length * 4.5) + 8, (dLines.length * 4.5) + 8);
  
  doc.setFillColor(...LIGHT_GRAY); doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');
  doc.setDrawColor(...BORDER_GRAY); doc.setLineWidth(0.15); doc.rect(MARGIN, y, CONTENT_W, rowH, 'S');
  let lx = MARGIN;
  for (let i = 0; i < cols.length - 1; i++) { lx += cols[i]; doc.line(lx, y, lx, y + rowH); }

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...DARK);
  doc.text('1', MARGIN + 6, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY); doc.text(serviceNameLines, MARGIN + cols[0] + 4, y + 8);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK); doc.text(invoice.country || '—', MARGIN + cols[0] + cols[1] + (cols[2] / 2), y + 8, { align: 'center' });
  doc.setFontSize(8.5); doc.setTextColor(...GREY); doc.text(dLines, MARGIN + cols[0] + cols[1] + cols[2] + 4, y + 6.5);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...NAVY); 
  // Use invoice_charge_amount if available, fallback to amount
  const finalAmt = invoice.invoice_charge_amount || invoice.amount;
  doc.text(currencyFormat(finalAmt, invoice.currency), PAGE_W - MARGIN - 4, y + 8, { align: 'right' });

  y += rowH + 8;

  // ── TOTALS (DYNAMIC) ──────────────────────────────────────────────────────

  const wordsLines = doc.splitTextToSize(invoice.amount_in_words || 'Zero Only', 110);
  const wordsH = Math.max(14, 6 + (wordsLines.length * 4.5));
  
  doc.setFillColor(...CREAM); doc.rect(MARGIN, y, 115, wordsH, 'F');
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.3); doc.rect(MARGIN, y, 115, wordsH, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...NAVY); doc.text('AMOUNT CHARGEABLE (IN WORDS)', MARGIN + 3, y + 4.5);
  doc.setFontSize(9); doc.setTextColor(...DARK);
  doc.text(wordsLines, MARGIN + 3, y + 9.5);

  const tX = PAGE_W - MARGIN - 60;
  doc.setDrawColor(...BORDER_GRAY); doc.setLineWidth(0.2); doc.rect(tX, y, 60, 11, 'S');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GREY);
  doc.text('SUBTOTAL', tX + 4, y + 7); doc.text(currencyFormat(finalAmt, invoice.currency), rightX - 4, y + 7, { align: 'right' });
  
  const grandY = y + 11.5;
  doc.setFillColor(...NAVY); doc.rect(tX, grandY, 60, 10, 'F');
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.5); doc.line(tX, grandY, tX + 60, grandY);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...WHITE);
  doc.text('GRAND TOTAL', tX + 4, grandY + 6.5); doc.text(currencyFormat(finalAmt, invoice.currency), rightX - 4, grandY + 6.5, { align: 'right' });

  y = Math.max(y + wordsH + 15, grandY + 20);

  // ── BOTTOM (DYNAMIC) ──────────────────────────────────────────────────────

  const bottomYStart = y;
  
  // Calculate notes height
  let notesHeight = 11;
  const noteItems: string[][] = [];
  if (invoice.notes) {
    invoice.notes.split('\n').filter(n => n.trim()).forEach(note => {
      const wrapped = doc.splitTextToSize(`• ${note.trim()}`, 90);
      noteItems.push(wrapped);
      notesHeight += (wrapped.length * 3.8);
    });
  }
  
  const remarkTextLines = doc.splitTextToSize(`Being sale made to ${invoice.client_name} for ${invoice.service_name} services.`, 90);
  const bottomBoxH = Math.max(55, notesHeight + (remarkTextLines.length * 4.2) + 20);

  doc.setDrawColor(...BORDER_GRAY); doc.rect(MARGIN, y, 100, bottomBoxH, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...NAVY); doc.text('NOTES / TERMS', MARGIN + 4, y + 6);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GREY);
  let ny = y + 11;
  noteItems.forEach(wrapped => {
    doc.text(wrapped, MARGIN + 6, ny); ny += (wrapped.length * 3.8);
  });
  
  const remarksY = Math.max(ny + 4, y + bottomBoxH - 15);
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY); doc.text('REMARKS:', MARGIN + 4, remarksY);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK);
  doc.text(remarkTextLines, MARGIN + 4, remarksY + 4);

  doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY); doc.text('COMPANY PAN:', MARGIN + 4, y + bottomBoxH - 4);
  doc.setTextColor(...DARK); doc.text('AAGCK5647J', MARGIN + 28, y + bottomBoxH - 4);

  const sW = 75; const sX = PAGE_W - MARGIN - sW;
  doc.setDrawColor(...NAVY); doc.setLineWidth(0.3); doc.rect(sX, y, sW, bottomBoxH, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text('FOR FAITHWAY OVERSEAS & IMMIGRATION', sX + sW/2, y + 7, { align: 'center' });
  
  const signatureSpaceY = y + 12;
  const signatureSpaceH = bottomBoxH - 22;
  
  if (stamp) {
    const sR = stamp.width / stamp.height; let sw = 28, sh = 28;
    if (sR > 1) sh = 28/sR; else sw = 28*sR;
    doc.addImage(stamp.data, 'PNG', sX + 5 + (28-sw)/2, signatureSpaceY + (signatureSpaceH - sh)/2, sw, sh);
  }
  if (signature) {
    const siR = signature.width / signature.height; let siw = 32, sih = 20;
    if (siR > (32/20)) sih = 32/siR; else siw = 20*siR;
    doc.addImage(signature.data, 'PNG', sX + 38 + (32-siw)/2, signatureSpaceY + (signatureSpaceH - sih)/2, siw, sih);
  }
  
  doc.line(sX + 10, y + bottomBoxH - 8, sX + sW - 10, y + bottomBoxH - 8);
  doc.text('Authorised Signatory', sX + sW/2, y + bottomBoxH - 4, { align: 'center' });

  // FOOTER
  const fY = 274; doc.setFillColor(...NAVY); doc.rect(0, fY, PAGE_W, 23, 'F');
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.8); doc.line(0, fY, PAGE_W, fY);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...GOLD);
  const fW = PAGE_W / 3;
  doc.text('UAE Consultation', fW/2, fY + 7, { align: 'center' });
  doc.text('India Contact', (fW*1.5), fY + 7, { align: 'center' });
  doc.text('Global Website', (fW*2.5), fY + 7, { align: 'center' });
  doc.setTextColor(...WHITE); doc.setFontSize(8.5);
  doc.text(company.phone, fW/2, fY + 12.5, { align: 'center' });
  doc.text('+91 72075 89444', (fW*1.5), fY + 12.5, { align: 'center' });
  doc.text(company.website, (fW*2.5), fY + 12.5, { align: 'center' });
  doc.setFontSize(7); doc.setTextColor(170, 180, 210);
  doc.text('This is a System Generated Invoice.', PAGE_W/2, fY + 19, { align: 'center' });

  return doc.output('blob');
}

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, CheckCircle2, AlertCircle, Loader2, Calculator } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { InvoiceSettings, InvoiceCurrency } from "@/lib/types";
import { amountInWords } from "@/lib/invoiceHelpers";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";

const CURRENCIES: InvoiceCurrency[] = ["INR", "AED", "USD"];
const PAYMENT_TYPES = ["Full Payment", "Advance Payment", "Partial Payment", "Final Settlement"];

interface FormState {
  client_name:           string;
  client_address:        string;
  client_email:          string;
  service_name:          string;
  country:               string;
  description:           string;
  currency:              InvoiceCurrency;
  payment_type:          string;
  service_total_amount:  string;
  advance_received:      string;
  invoice_charge_amount: string;
  notes:                 string;
}

const EMPTY: FormState = {
  client_name: "", client_address: "", client_email: "",
  service_name: "", country: "", description: "",
  currency: "INR", payment_type: "Full Payment",
  service_total_amount: "", advance_received: "0", invoice_charge_amount: "",
  notes: "",
};

const inputCls = "w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-royal outline-none transition-all placeholder:text-white/10 text-sm";
const labelCls = "text-[10px] uppercase tracking-widest font-bold text-white/40";

type Step = "idle" | "numbering" | "pdf" | "uploading" | "saving" | "done";

const STEP_LABELS: Record<Step, string> = {
  idle:      "Generate Invoice",
  numbering: "Getting invoice number…",
  pdf:       "Generating PDF…",
  uploading: "Uploading PDF…",
  saving:    "Saving to database…",
  done:      "Generate Invoice",
};

export function CreateInvoiceTab({ onInvoiceCreated }: { onInvoiceCreated?: () => void }) {
  const supabase = createClient();

  const [form,     setForm]     = useState<FormState>(EMPTY);
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [step,     setStep]     = useState<Step>("idle");
  const [success,  setSuccess]  = useState<{ number: string; downloadUrl: string } | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  const generating = step !== "idle" && step !== "done";

  // Auto-calculate pending due
  const totalAmt   = parseFloat(form.service_total_amount) || 0;
  const advance    = parseFloat(form.advance_received) || 0;
  const charge     = parseFloat(form.invoice_charge_amount) || 0;
  const pendingDue = totalAmt - advance - charge;

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("invoice_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (alive && data) {
        setSettings(data as InvoiceSettings);
        setForm(prev => ({
          ...prev,
          notes: prev.notes || (data.notes_terms || "")
        }));
      }
    })();
    return () => { alive = false; };
  }, []);

  function set(k: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));
  }

  async function handleGenerate() {
    if (!form.client_name.trim()) { setError("Client Name is required."); return; }
    if (!form.service_name.trim()) { setError("Service Name is required."); return; }
    if (!form.invoice_charge_amount.trim()) { setError("Charge Amount is required."); return; }
    
    if (isNaN(charge) || charge <= 0) { setError("Please enter a valid positive charge amount."); return; }

    setError(null);
    setSuccess(null);

    try {
      setStep("numbering");
      const { data: invNumber, error: rpcErr } = await supabase.rpc("generate_invoice_number");
      if (rpcErr) throw new Error(`Invoice number generation failed: ${rpcErr.message}`);
      if (!invNumber) throw new Error("Could not get invoice number.");

      const today = new Date().toISOString().split("T")[0];
      const words = amountInWords(charge, form.currency);

      const invoicePayload = {
        invoice_number:         invNumber,
        invoice_date:           today,
        client_name:            form.client_name.trim(),
        client_address:         form.client_address.trim()  || null,
        client_email:           form.client_email.trim()    || null,
        service_name:           form.service_name.trim(),
        country:                form.country.trim()         || null,
        description:            form.description.trim()     || null,
        currency:               form.currency,
        amount:                 charge, // Still save as 'amount' for backward compatibility in history list if needed
        amount_in_words:        words,
        notes:                  form.notes.trim()           || null,
        payment_type:           form.payment_type,
        service_total_amount:   totalAmt,
        advance_received:       advance,
        invoice_charge_amount:  charge,
        pending_due:            pendingDue,
        pdf_url:                null as string | null,
      };

      setStep("pdf");
      const pdfBlob = await generateInvoicePdf(invoicePayload, settings);

      setStep("uploading");
      const timestamp = Date.now();
      const fileName  = `${invNumber}_${timestamp}.pdf`;
      const { error: uploadErr } = await supabase.storage
        .from("invoices")
        .upload(fileName, pdfBlob, { contentType: "application/pdf", upsert: false });
      if (uploadErr) throw new Error(`PDF upload failed: ${uploadErr.message}`);

      const { data: urlData } = supabase.storage.from("invoices").getPublicUrl(fileName);
      invoicePayload.pdf_url = urlData.publicUrl;

      setStep("saving");
      const { error: insErr } = await supabase.from("invoices").insert([invoicePayload]);
      if (insErr) throw new Error(`Database save failed: ${insErr.message}`);

      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${invNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 8000);

      setStep("done");
      setSuccess({ number: invNumber, downloadUrl: urlData.publicUrl });
      setForm(EMPTY);
      onInvoiceCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setStep("idle");
    }
  }

  const showWords = charge > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-4xl pb-20">
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center justify-between p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle2 size={20} />
              <div>
                <p className="font-bold text-sm">Invoice {success.number} generated!</p>
                <p className="text-xs text-emerald-400/60">Accounting data synced to Supabase.</p>
              </div>
            </div>
            <a href={success.downloadUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-400 text-xs font-bold uppercase tracking-widest transition-all">
              <Download size={14} /> Download PDF
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="break-all">{error}</span>
        </div>
      )}

      <div className="glass-premium p-8 rounded-3xl border border-white/5">
        <h3 className="text-lg font-bold mb-8 flex items-center gap-3 text-white">
          <FileText size={18} className="text-gold" /> Create New Invoice
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className={labelCls}>Client Name <span className="text-rose-400">*</span></label>
              <input value={form.client_name} onChange={set("client_name")} className={inputCls} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Client Address</label>
              <textarea value={form.client_address} onChange={set("client_address")} rows={2} className={inputCls + " resize-none"} placeholder="Billing address" />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Client Email</label>
              <input value={form.client_email} onChange={set("client_email")} type="email" className={inputCls} placeholder="client@example.com" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className={labelCls}>Service Name <span className="text-rose-400">*</span></label>
              <input value={form.service_name} onChange={set("service_name")} className={inputCls} placeholder="e.g. Visa Consultancy" />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Country</label>
              <input value={form.country} onChange={set("country")} className={inputCls} placeholder="Destination country" />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Service Description</label>
              <textarea value={form.description} onChange={set("description")} rows={2} className={inputCls + " resize-none"} placeholder="Scope of service" />
            </div>
          </div>

          {/* INTERNAL ACCOUNTING SECTION */}
          <div className="md:col-span-2 p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-6">
            <h4 className="text-xs font-bold text-royal uppercase tracking-widest flex items-center gap-2">
              <Calculator size={14} /> Internal Accounting Control
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className={labelCls}>Payment Type</label>
                <select value={form.payment_type} onChange={set("payment_type")} className={inputCls + " cursor-pointer"}>
                  {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Currency</label>
                <select value={form.currency} onChange={set("currency")} className={inputCls + " cursor-pointer"}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Total Package Value</label>
                <input value={form.service_total_amount} onChange={set("service_total_amount")} type="number" className={inputCls} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Advance Received</label>
                <input value={form.advance_received} onChange={set("advance_received")} type="number" className={inputCls} placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
              <div className="space-y-2">
                <label className={labelCls}>Invoice Charge Amount (PDF) <span className="text-rose-400">*</span></label>
                <input value={form.invoice_charge_amount} onChange={set("invoice_charge_amount")} type="number" className={inputCls + " border-royal/30 text-lg font-bold"} placeholder="0.00" />
              </div>
              <div className="flex flex-col justify-end">
                <div className="p-4 bg-midnight rounded-xl border border-white/5 flex justify-between items-center">
                  <span className={labelCls}>Final Pending Due:</span>
                  <span className={`text-lg font-bold ${pendingDue > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {form.currency} {pendingDue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            {showWords && (
              <p className="text-[10px] text-white/30 italic">PDF Amount in Words: {amountInWords(charge, form.currency)}</p>
            )}
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className={labelCls}>Public Notes / Terms (Shown on PDF)</label>
            <textarea value={form.notes} onChange={set("notes")} rows={4} className={inputCls + " resize-none h-32"} placeholder="Payment instructions..." />
          </div>
        </div>

        <div className="mt-10 flex items-center gap-6">
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-3 px-10 py-5 bg-royal hover:bg-royal/80 rounded-2xl text-white font-bold text-sm uppercase tracking-widest transition-all shadow-xl shadow-royal/20 disabled:opacity-50">
            {generating ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            {generating ? STEP_LABELS[step] : "Generate & Save Invoice"}
          </button>
          <div className="hidden md:block text-white/20 text-[10px] max-w-xs uppercase tracking-tighter">
            Invoice engine will auto-wrap text, calculate accounting math, and sync with your records.
          </div>
        </div>
      </div>
    </motion.div>
  );
}

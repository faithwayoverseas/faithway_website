"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { InvoiceSettings, InvoiceCurrency } from "@/lib/types";
import { amountInWords } from "@/lib/invoiceHelpers";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";

const CURRENCIES: InvoiceCurrency[] = ["INR", "AED", "USD"];

interface FormState {
  client_name:    string;
  client_address: string;
  client_email:   string;
  service_name:   string;
  country:        string;
  description:    string;
  currency:       InvoiceCurrency;
  amount:         string;
  notes:          string;
}

const EMPTY: FormState = {
  client_name: "", client_address: "", client_email: "",
  service_name: "", country: "", description: "",
  currency: "INR", amount: "", notes: "",
};

const inputCls = "w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-royal outline-none transition-all placeholder:text-white/10 text-sm";
const labelCls = "text-[10px] uppercase tracking-widest font-bold text-white/40";

export function CreateInvoiceTab({ onInvoiceCreated }: { onInvoiceCreated?: () => void }) {
  const supabase  = createClient();
  const [form,    setForm]    = useState<FormState>(EMPTY);
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState<{ number: string; downloadUrl: string } | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.from("invoice_settings").select("*").limit(1).single();
      if (alive && data) setSettings(data as InvoiceSettings);
    })();
    return () => { alive = false; };
  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  function set(k: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));
  }

  async function handleGenerate() {
    if (!form.client_name || !form.service_name || !form.amount) {
      setError("Client Name, Service Name, and Amount are required."); return;
    }
    const amtNum = parseFloat(form.amount);
    if (isNaN(amtNum) || amtNum <= 0) { setError("Please enter a valid positive amount."); return; }

    setGenerating(true); setError(null); setSuccess(null);
    try {
      // 1. Get transaction-safe invoice number from Supabase RPC
      const { data: invNumber, error: rpcErr } = await supabase.rpc("generate_invoice_number");
      if (rpcErr || !invNumber) throw new Error(rpcErr?.message || "Failed to generate invoice number.");

      const today        = new Date().toISOString().split("T")[0];
      const words        = amountInWords(amtNum, form.currency);
      const invoicePayload = {
        invoice_number:  invNumber as string,
        invoice_date:    today,
        client_name:     form.client_name,
        client_address:  form.client_address || null,
        client_email:    form.client_email   || null,
        service_name:    form.service_name,
        country:         form.country        || null,
        description:     form.description    || null,
        currency:        form.currency,
        amount:          amtNum,
        amount_in_words: words,
        notes:           form.notes          || null,
        pdf_url:         null as string | null,
      };

      // 2. Generate PDF (client-side)
      const pdfBlob = await generateInvoicePdf(invoicePayload, settings);

      // 3. Upload PDF to Supabase Storage
      const fileName = `${invNumber}.pdf`;
      const { error: uploadErr } = await supabase.storage
        .from("invoices")
        .upload(fileName, pdfBlob, { contentType: "application/pdf", upsert: true });
      if (uploadErr) throw new Error("PDF upload failed: " + uploadErr.message);

      const { data: urlData } = supabase.storage.from("invoices").getPublicUrl(fileName);
      invoicePayload.pdf_url = urlData.publicUrl;

      // 4. Save invoice record to Supabase
      const { error: insErr } = await supabase.from("invoices").insert([invoicePayload]);
      if (insErr) throw new Error("Database insert failed: " + insErr.message);

      // 5. Trigger browser download
      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = fileName; a.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

      setSuccess({ number: invNumber as string, downloadUrl: urlData.publicUrl });
      setForm(EMPTY);
      onInvoiceCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-4xl">

      {/* Success banner */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center justify-between p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle2 size={20} />
              <div>
                <p className="font-bold text-sm">Invoice {success.number} generated & saved!</p>
                <p className="text-xs text-emerald-400/60">PDF downloaded automatically. Re-download from Invoice History.</p>
              </div>
            </div>
            <a href={success.downloadUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-400 text-xs font-bold uppercase tracking-widest transition-all">
              <Download size={14} /> Download Again
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="glass-premium p-8 rounded-3xl border border-white/5">
        <h3 className="text-lg font-bold mb-8 flex items-center gap-3">
          <FileText size={18} className="text-gold" /> Invoice Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Info */}
          <div className="space-y-2">
            <label className={labelCls}>Client Name <span className="text-rose-400">*</span></label>
            <input value={form.client_name} onChange={set("client_name")} className={inputCls} placeholder="Full name or company" />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Client Email</label>
            <input value={form.client_email} onChange={set("client_email")} type="email" className={inputCls} placeholder="client@example.com" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelCls}>Client Address</label>
            <input value={form.client_address} onChange={set("client_address")} className={inputCls} placeholder="Full billing address" />
          </div>

          {/* Service Info */}
          <div className="space-y-2">
            <label className={labelCls}>Service Name <span className="text-rose-400">*</span></label>
            <input value={form.service_name} onChange={set("service_name")} className={inputCls} placeholder="e.g. Tourist Visa Processing" />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Country</label>
            <input value={form.country} onChange={set("country")} className={inputCls} placeholder="e.g. United Arab Emirates" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={set("description")} rows={3}
              className={inputCls + " resize-none"} placeholder="Service description / scope of work" />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className={labelCls}>Currency <span className="text-rose-400">*</span></label>
            <select value={form.currency} onChange={set("currency")}
              className={inputCls + " cursor-pointer"}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Amount <span className="text-rose-400">*</span></label>
            <input value={form.amount} onChange={set("amount")} type="number" min="0" step="0.01"
              className={inputCls} placeholder="0.00" />
          </div>
          {form.amount && !isNaN(parseFloat(form.amount)) && parseFloat(form.amount) > 0 && (
            <div className="md:col-span-2 px-1">
              <p className="text-xs text-white/30 italic">
                In Words: <span className="text-white/50">{amountInWords(parseFloat(form.amount), form.currency)}</span>
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2 md:col-span-2">
            <label className={labelCls}>Notes / Terms</label>
            <textarea value={form.notes} onChange={set("notes")} rows={3}
              className={inputCls + " resize-none"} placeholder="Payment terms, conditions, or additional notes…" />
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-8 flex items-center gap-6">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-3 px-8 py-4 bg-royal hover:bg-royal/80 rounded-xl text-white font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-60"
          >
            {generating ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            {generating ? "Generating PDF…" : "Generate Invoice"}
          </button>
          <p className="text-white/20 text-xs">Invoice number is auto-assigned by the system.</p>
        </div>
      </div>
    </motion.div>
  );
}

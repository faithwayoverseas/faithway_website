"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Download, RefreshCw, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Invoice } from "@/lib/types";
import { formatAmount } from "@/lib/invoiceHelpers";
import { cn } from "@/lib/utils";

const CURRENCY_BADGE: Record<string, string> = {
  INR: "bg-emerald-500/10 text-emerald-400",
  AED: "bg-blue-500/10   text-blue-400",
  USD: "bg-amber-500/10  text-amber-400",
};

export function InvoiceHistoryTab() {
  const supabase = createClient();
  const [invoices,    setInvoices]    = useState<Invoice[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [query,       setQuery]       = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setInvoices(data as Invoice[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let alive = true;
    (async () => { if (alive) await fetchInvoices(); })();
    return () => { alive = false; };
  }, [fetchInvoices]);

  const filtered = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(query.toLowerCase()) ||
    inv.client_name.toLowerCase().includes(query.toLowerCase()) ||
    (inv.country || "").toLowerCase().includes(query.toLowerCase())
  );

  async function handleDownload(inv: Invoice) {
    if (!inv.pdf_url) return;
    setDownloading(inv.id);
    try {
      const res  = await fetch(inv.pdf_url);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `${inv.invoice_number}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch {
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by invoice no, client or country…"
            className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:border-royal outline-none placeholder:text-white/20"
          />
        </div>
        <button onClick={fetchInvoices}
          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/40 hover:text-white transition-all">
          <RefreshCw size={16} />
        </button>
        <span className="text-white/30 text-sm">{filtered.length} invoice{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="glass-premium rounded-3xl border border-white/5 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1.4fr_1fr_1.4fr_0.8fr_0.8fr_1fr_auto] gap-4 px-6 py-4 bg-white/[0.02] border-b border-white/5">
          {["Invoice No", "Date", "Client", "Country", "Currency", "Amount", ""].map(h => (
            <span key={h} className="text-[10px] uppercase tracking-widest font-bold text-white/30">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-white/20 italic">Loading invoices…</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText size={40} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/20 italic">{query ? "No results found." : "No invoices yet. Create your first one!"}</p>
          </div>
        ) : (
          filtered.map((inv, i) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="grid grid-cols-[1.4fr_1fr_1.4fr_0.8fr_0.8fr_1fr_auto] gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
            >
              <span className="text-white font-mono font-bold text-sm">{inv.invoice_number}</span>
              <span className="text-white/50 text-sm">
                {new Date(inv.invoice_date).toLocaleDateString("en-GB")}
              </span>
              <div>
                <p className="text-white text-sm font-medium truncate">{inv.client_name}</p>
                {inv.client_email && <p className="text-white/30 text-xs truncate">{inv.client_email}</p>}
              </div>
              <span className="text-white/50 text-sm">{inv.country || "—"}</span>
              <span className={cn("text-xs font-bold px-2 py-1 rounded-lg w-fit", CURRENCY_BADGE[inv.currency] || "bg-white/5 text-white/40")}>
                {inv.currency}
              </span>
              <span className="text-white font-semibold text-sm">{formatAmount(inv.amount, inv.currency)}</span>
              <button
                onClick={() => handleDownload(inv)}
                disabled={!inv.pdf_url || downloading === inv.id}
                className="flex items-center gap-2 px-4 py-2 bg-royal hover:bg-royal/80 rounded-lg text-white text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30"
              >
                <Download size={13} />
                {downloading === inv.id ? "…" : "PDF"}
              </button>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

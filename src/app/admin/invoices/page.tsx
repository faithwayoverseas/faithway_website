"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, History, Settings2, ReceiptText, DollarSign, LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Invoice } from "@/lib/types";
import { formatAmount } from "@/lib/invoiceHelpers";
import { cn } from "@/lib/utils";
import { CreateInvoiceTab }      from "@/components/admin/invoices/CreateInvoiceTab";
import { InvoiceHistoryTab }     from "@/components/admin/invoices/InvoiceHistoryTab";
import { InvoiceSettingsTab }    from "@/components/admin/invoices/InvoiceSettingsTab";

type Tab = "create" | "history" | "settings";

interface StatCard {
  label: string;
  value: string;
  icon:  LucideIcon;
  color: string;
  sub?:  string;
}

export default function InvoicesPage() {
  const supabase = createClient();
  const [tab,      setTab]      = useState<Tab>("create");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading,  setLoading]  = useState(true);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
    if (data) setInvoices(data as Invoice[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const now       = new Date();
  const thisMonth = invoices.filter(inv => {
    const d = new Date(inv.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const revenueByMonth: Record<string, number> = {};
  thisMonth.forEach(inv => {
    revenueByMonth[inv.currency] = (revenueByMonth[inv.currency] || 0) + Number(inv.amount);
  });

  const revenueStr = Object.entries(revenueByMonth)
    .map(([c, v]) => formatAmount(v, c)).join(" + ") || "—";

  const currencySplit = ["INR", "AED", "USD"].map(c => {
    const count = invoices.filter(inv => inv.currency === c).length;
    return `${c}: ${count}`;
  }).join("  •  ");

  const lastInvoice = invoices[0]?.invoice_number || "—";

  const stats: StatCard[] = [
    { label: "Total Invoices",        value: loading ? "…" : invoices.length.toString(), icon: ReceiptText,  color: "text-blue-400",    sub: "All time" },
    { label: "This Month Revenue",    value: loading ? "…" : revenueStr,                 icon: DollarSign,   color: "text-gold",        sub: "Combined" },
    { label: "Last Invoice Number",   value: loading ? "…" : lastInvoice,                icon: FileText,     color: "text-emerald-400", sub: "Most recent" },
    { label: "Currency Split",        value: loading ? "…" : currencySplit,              icon: DollarSign,   color: "text-purple-400",  sub: "INR / AED / USD" },
  ];

  const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: "create",   label: "Create Invoice", icon: Plus      },
    { id: "history",  label: "Invoice History", icon: History   },
    { id: "settings", label: "Invoice Settings", icon: Settings2 },
  ];

  return (
    <div className="p-8 md:p-12">
      {/* Header */}
      <header className="mb-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-outfit font-bold text-white mb-2 tracking-tight flex items-center gap-3">
            <ReceiptText className="text-gold" size={34} /> Invoices
          </h1>
          <p className="text-white/40 font-light">Generate, manage, and download branded professional invoices.</p>
        </motion.div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-premium p-6 rounded-3xl border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <s.icon size={64} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-2.5 rounded-xl bg-white/5", s.color)}>
                <s.icon size={20} />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">{s.label}</span>
            </div>
            <p className="text-xl font-outfit font-bold text-white leading-tight break-all">{s.value}</p>
            {s.sub && <p className="text-[11px] text-white/20 mt-1">{s.sub}</p>}
          </motion.div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-2 mb-8 p-1.5 bg-white/[0.03] border border-white/5 rounded-2xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200",
              tab === t.id
                ? "bg-royal text-white shadow-[0_8px_20px_rgba(30,58,138,0.3)]"
                : "text-white/40 hover:text-white hover:bg-white/5"
            )}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "create"   && <CreateInvoiceTab    onInvoiceCreated={fetchInvoices} />}
      {tab === "history"  && <InvoiceHistoryTab />}
      {tab === "settings" && <InvoiceSettingsTab  onSettingsChanged={() => {}} />}
    </div>
  );
}

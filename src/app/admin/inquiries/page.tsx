"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  Eye, 
  Mail, 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RotateCcw
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Inquiry, InquiryStatus } from "@/lib/types";
import { exportToCSV } from "@/lib/csv";
import { cn } from "@/lib/utils";

const statusConfig: Record<InquiryStatus, { color: string; icon: any }> = {
  'New': { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: AlertCircle },
  'Contacted': { color: 'text-gold bg-gold/10 border-gold/20', icon: Clock },
  'In Progress': { color: 'text-royal bg-royal/10 border-royal/20', icon: RotateCcw },
  'Converted': { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 },
  'Rejected': { color: 'text-rose-400 bg-rose-400/10 border-rose-400/20', icon: XCircle },
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | "All">("All");
  const supabase = createClient();

  useEffect(() => {
    fetchInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchInquiries() {
    setLoading(true);
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setInquiries(data);
    setLoading(false);
  }

  const filteredInquiries = inquiries.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.service?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    exportToCSV(filteredInquiries, `faithway-leads-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="p-8 md:p-12">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-outfit font-bold text-white mb-2 tracking-tight">Leads & Inquiries</h1>
          <p className="text-white/40 font-light">Manage and track your global client pipeline.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-bold tracking-widest uppercase transition-all"
        >
          <Download size={18} />
          Export CSV
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-royal outline-none transition-all placeholder:text-white/10"
          />
        </div>
        <div className="lg:col-span-4 relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-royal outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="All" className="bg-midnight">All Statuses</option>
            <option value="New" className="bg-midnight">New Leads</option>
            <option value="Contacted" className="bg-midnight">Contacted</option>
            <option value="In Progress" className="bg-midnight">In Progress</option>
            <option value="Converted" className="bg-midnight">Converted</option>
            <option value="Rejected" className="bg-midnight">Rejected</option>
          </select>
        </div>
      </div>

      <div className="glass-premium rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold text-white/40">Identity</th>
                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold text-white/40">Pathway</th>
                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold text-white/40">Status</th>
                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold text-white/40">Received</th>
                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold text-white/40 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-white/20 italic">
                      Retrieving inquiries...
                    </td>
                  </tr>
                ) : filteredInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-white/20 italic">
                      No inquiries found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInquiries.map((inquiry, i) => {
                    const status = statusConfig[inquiry.status];
                    return (
                      <motion.tr
                        key={inquiry.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-royal/10 flex items-center justify-center text-royal font-bold">
                              {inquiry.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-white font-medium">{inquiry.name}</p>
                              <p className="text-xs text-white/30 flex items-center gap-1">
                                <Mail size={12} /> {inquiry.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-sm text-white/60 capitalize">{inquiry.service || "General"}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className={cn(
                            "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                            status.color
                          )}>
                            <status.icon size={12} />
                            {inquiry.status}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm text-white/40 flex items-center gap-2">
                            <Calendar size={14} />
                            {new Date(inquiry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <Link 
                            href={`/admin/inquiries/${inquiry.id}`}
                            className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                          >
                            <Eye size={18} />
                            <span className="text-[10px] uppercase tracking-widest font-bold">Manage</span>
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

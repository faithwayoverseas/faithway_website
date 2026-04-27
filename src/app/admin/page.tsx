"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Inquiry } from "@/lib/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function fetchDashboardData() {
    const { data } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (data) setInquiries(data);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line
    fetchDashboardData();
  }, []);

  const stats = [
    { label: "Total Inquiries", value: inquiries.length.toString(), icon: Users, color: "text-blue-500", trend: "+12.5%" },
    { label: "Conversion Rate", value: "24.8%", icon: TrendingUp, color: "text-gold", trend: "+3.2%" },
    { label: "Pending Leads", value: inquiries.filter(i => i.status === 'New').length.toString(), icon: Clock, color: "text-amber-500", trend: "-5.0%" },
    { label: "Successful Cases", value: "856", icon: CheckCircle2, color: "text-emerald-500", trend: "+18.2%" },
  ];

  return (
    <div className="p-8 md:p-12">
      <header className="mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-outfit font-bold text-white mb-2 tracking-tight">Dashboard Overview</h1>
          <p className="text-white/40 font-light">Welcome back, Administrator. Here&apos;s what&apos;s happening today.</p>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-premium p-8 rounded-3xl border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon size={64} />
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className={cn("p-3 rounded-xl bg-white/5", stat.color)}>
                <stat.icon size={24} />
              </div>
              <span className="text-white/40 text-xs uppercase tracking-widest font-bold">{stat.label}</span>
            </div>

            <div className="flex items-end justify-between">
              <div className="text-3xl font-outfit font-bold text-white">{stat.value}</div>
              <div className={cn(
                "text-xs font-bold px-2 py-1 rounded-lg",
                stat.trend.startsWith('+') ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
              )}>
                {stat.trend}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass-premium p-8 rounded-3xl border border-white/5"
        >
          <h3 className="text-xl font-bold mb-8">Recent Inquiries</h3>
          <div className="space-y-6">
            {loading ? (
              <p className="text-white/20 italic">Loading activity...</p>
            ) : inquiries.length === 0 ? (
              <p className="text-white/20 italic">No inquiries received yet.</p>
            ) : (
              inquiries.map((inquiry) => (
                <div key={inquiry.id} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gold">✨</div>
                    <div>
                      <p className="text-sm font-medium text-white">New lead: {inquiry.name}</p>
                      <p className="text-xs text-white/20">{inquiry.service} • {new Date(inquiry.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Link 
                    href={`/admin/inquiries/${inquiry.id}`}
                    className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2"
                  >
                    Manage <ExternalLink size={12} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-premium p-8 rounded-3xl border border-white/5"
        >
          <h3 className="text-xl font-bold mb-8">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4">
            <Link href="/admin/services" className="w-full py-4 px-6 rounded-xl bg-royal text-white text-sm font-bold tracking-widest uppercase hover:bg-royal/80 transition-all text-center">
              Add New Service
            </Link>
            <Link href="/admin/blog" className="w-full py-4 px-6 rounded-xl bg-white/5 text-white text-sm font-bold tracking-widest uppercase hover:bg-white/10 transition-all text-center border border-white/5">
              Draft Blog Post
            </Link>
            <Link href="/admin/inquiries" className="w-full py-4 px-6 rounded-xl bg-white/5 text-white text-sm font-bold tracking-widest uppercase hover:bg-white/10 transition-all text-center border border-white/5">
              Export Lead Data
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


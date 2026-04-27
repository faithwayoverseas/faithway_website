"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Mail, 
  User, 
  Briefcase, 
  MessageSquare, 
  Calendar,
  Save,
  Trash2,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Inquiry, InquiryStatus } from "@/lib/types";
import { updateInquiryStatus, addInquiryNote } from "@/app/admin/actions";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { cn } from "@/lib/utils";

export default function InquiryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (id) fetchInquiry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchInquiry() {
    setLoading(true);
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      setInquiry(data);
      setNotes(data.notes || "");
    }
    setLoading(false);
  }

  async function handleStatusChange(status: InquiryStatus) {
    setUpdating(true);
    try {
      await updateInquiryStatus(id as string, status);
      setInquiry(prev => prev ? { ...prev, status } : null);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  async function handleSaveNotes() {
    setUpdating(true);
    try {
      await addInquiryNote(id as string, notes);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <div className="p-12 text-white/20 italic">Loading lead details...</div>;
  if (!inquiry) return <div className="p-12 text-white/20 italic">Inquiry not found.</div>;

  return (
    <div className="p-8 md:p-12 max-w-6xl">
      <Link 
        href="/admin/inquiries" 
        className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs uppercase tracking-widest font-bold">Back to Inquiries</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <section className="glass-premium p-8 md:p-10 rounded-[2.5rem] border border-white/5">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-royal/10 flex items-center justify-center text-3xl text-royal font-bold">
                  {inquiry.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-3xl font-outfit font-bold text-white mb-1">{inquiry.name}</h1>
                  <p className="text-white/40 flex items-center gap-2 text-sm">
                    <Calendar size={14} /> Received on {new Date(inquiry.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/20">Email Identity</label>
                  <p className="text-white flex items-center gap-3">
                    <Mail size={16} className="text-royal" /> {inquiry.email}
                    <a href={`mailto:${inquiry.email}`} className="text-white/20 hover:text-white transition-colors">
                      <ExternalLink size={14} />
                    </a>
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/20">Pathway Interested</label>
                  <p className="text-white flex items-center gap-3">
                    <Briefcase size={16} className="text-royal" /> {inquiry.service || "General Inquiry"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/20">Bespoke Inquiry Details</label>
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-white/80 leading-relaxed font-light italic">
                  &quot;{inquiry.details}&quot;
                </div>
              </div>
            </div>
          </section>

          <section className="glass-premium p-8 md:p-10 rounded-[2.5rem] border border-white/5">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <MessageSquare size={20} className="text-gold" /> Internal Admin Notes
              </h3>
              <button 
                onClick={handleSaveNotes}
                disabled={updating}
                className="text-gold hover:text-gold/80 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold transition-all"
              >
                <Save size={16} /> Save Notes
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal observations, follow-up status, or background info..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-white focus:border-gold outline-none transition-all placeholder:text-white/10 min-h-[200px] resize-none"
            />
          </section>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <section className="glass-premium p-8 md:p-10 rounded-[2.5rem] border border-white/5">
            <h3 className="text-xl font-bold mb-8">Pipeline Status</h3>
            <div className="space-y-3">
              {(['New', 'Contacted', 'In Progress', 'Converted', 'Rejected'] as InquiryStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={updating}
                  className={cn(
                    "w-full px-6 py-4 rounded-xl border text-sm font-bold uppercase tracking-widest transition-all text-left flex items-center justify-between group",
                    inquiry.status === status 
                      ? "bg-royal border-royal text-white shadow-lg shadow-royal/20" 
                      : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:border-white/10"
                  )}
                >
                  {status}
                  {inquiry.status === status && <motion.div layoutId="check" className="text-white">✓</motion.div>}
                </button>
              ))}
            </div>
          </section>

          <section className="glass-premium p-8 md:p-10 rounded-[2.5rem] border border-white/5">
            <h3 className="text-xl font-bold mb-8">Danger Zone</h3>
            <button className="w-full px-6 py-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-3">
              <Trash2 size={18} /> Delete Inquiry
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

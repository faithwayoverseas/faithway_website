"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff, Save, X, Quote } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Testimonial } from "@/lib/types";
import { cn } from "@/lib/utils";

const emptyTestimonial: Omit<Testimonial, "id" | "created_at"> = {
  name: "", role: "", content: "", avatar_url: "", is_published: true,
};

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState(emptyTestimonial);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const fetchTestimonials = async () => {
    setLoading(true);
    const { data } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
    if (data) setTestimonials(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchTestimonials();
  }, []);

  function openCreate() { setFormData(emptyTestimonial); setEditing(null); setIsCreating(true); }
  function openEdit(t: Testimonial) {
    setFormData({ name: t.name, role: t.role, content: t.content, avatar_url: t.avatar_url, is_published: t.is_published });
    setEditing(t); setIsCreating(true);
  }
  function closeForm() { setIsCreating(false); setEditing(null); }

  async function handleSave() {
    setSaving(true);
    if (editing) {
      await supabase.from("testimonials").update(formData).eq("id", editing.id);
    } else {
      await supabase.from("testimonials").insert([formData]);
    }
    await fetchTestimonials();
    closeForm(); setSaving(false);
  }

  async function togglePublished(t: Testimonial) {
    await supabase.from("testimonials").update({ is_published: !t.is_published }).eq("id", t.id);
    setTestimonials(prev => prev.map(item => item.id === t.id ? { ...item, is_published: !item.is_published } : item));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this testimonial? This cannot be undone.")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    setTestimonials(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div className="p-8 md:p-12">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-outfit font-bold text-white mb-2 tracking-tight">Testimonials</h1>
          <p className="text-white/40 font-light">Manage client reviews and publish them to the public website.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-royal hover:bg-royal/80 rounded-xl text-white text-sm font-bold tracking-widest uppercase transition-all">
          <Plus size={18} /> New Testimonial
        </button>
      </header>

      <AnimatePresence>
        {isCreating && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-premium p-8 rounded-3xl border border-white/10 mb-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">{editing ? "Edit Testimonial" : "New Testimonial"}</h3>
              <button onClick={closeForm} className="text-white/40 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Client Name</label>
                <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-royal outline-none" placeholder="John Smith" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Role / Country</label>
                <input value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-royal outline-none" placeholder="Software Engineer, Canada" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Avatar URL (optional)</label>
                <input value={formData.avatar_url} onChange={e => setFormData(p => ({ ...p, avatar_url: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-royal outline-none" placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Publish Status</label>
                <button onClick={() => setFormData(p => ({ ...p, is_published: !p.is_published }))}
                  className={cn("w-full px-4 py-3 rounded-xl border text-sm font-bold transition-all text-left", formData.is_published ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400" : "bg-white/5 border-white/10 text-white/40")}>
                  {formData.is_published ? "✓ Published" : "○ Hidden"}
                </button>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Review Content</label>
                <textarea value={formData.content} onChange={e => setFormData(p => ({ ...p, content: e.target.value }))} rows={5} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-royal outline-none resize-none" placeholder="Client review text..." />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-8 py-3 bg-gold hover:bg-gold/80 rounded-xl text-midnight font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50">
                <Save size={16} /> {saving ? "Saving..." : "Save Testimonial"}
              </button>
              <button onClick={closeForm} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm font-bold uppercase tracking-widest transition-all">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <p className="text-white/20 italic col-span-2 p-8">Loading testimonials...</p>
        ) : testimonials.length === 0 ? (
          <div className="col-span-2 glass-premium rounded-3xl p-16 text-center border border-white/5">
            <p className="text-white/30 italic">No testimonials yet. Click &quot;New Testimonial&quot; to add one.</p>
          </div>
        ) : (
          testimonials.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={cn("glass-premium p-8 rounded-3xl border group", t.is_published ? "border-white/5" : "border-white/5 opacity-50")}>
              <Quote size={24} className="text-gold/30 mb-4" />
              <p className="text-white/70 text-sm leading-relaxed italic mb-6 line-clamp-3">&ldquo;{t.content}&rdquo;</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-royal/10 flex items-center justify-center text-royal font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/30 text-xs">{t.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => togglePublished(t)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                    {t.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button onClick={() => openEdit(t)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-white/40 hover:text-rose-500 transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

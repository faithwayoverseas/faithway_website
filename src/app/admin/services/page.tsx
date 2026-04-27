"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Save, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Service } from "@/lib/types";
import { cn } from "@/lib/utils";

const emptyService: Omit<Service, "id" | "created_at"> = {
  title: "", description: "", icon: "", benefits: [], order: 0, is_active: true,
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState(emptyService);
  const [benefitsText, setBenefitsText] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const fetchServices = async () => {
    setLoading(true);
    const { data } = await supabase.from("services").select("*").order("order");
    if (data) setServices(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchServices();
  }, []);

  function openCreate() {
    setFormData(emptyService);
    setBenefitsText("");
    setEditing(null);
    setIsCreating(true);
  }

  function openEdit(s: Service) {
    setFormData({ title: s.title, description: s.description, icon: s.icon, benefits: s.benefits, order: s.order, is_active: s.is_active });
    setBenefitsText((s.benefits || []).join("\n"));
    setEditing(s);
    setIsCreating(true);
  }

  function closeForm() { setIsCreating(false); setEditing(null); }

  async function handleSave() {
    setSaving(true);
    const payload = { ...formData, benefits: benefitsText.split("\n").map(b => b.trim()).filter(Boolean) };
    if (editing) {
      await supabase.from("services").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("services").insert([payload]);
    }
    await fetchServices();
    closeForm();
    setSaving(false);
  }

  async function toggleActive(s: Service) {
    await supabase.from("services").update({ is_active: !s.is_active }).eq("id", s.id);
    setServices(prev => prev.map(item => item.id === s.id ? { ...item, is_active: !item.is_active } : item));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this service? This cannot be undone.")) return;
    await supabase.from("services").delete().eq("id", id);
    setServices(prev => prev.filter(s => s.id !== id));
  }

  return (
    <div className="p-8 md:p-12">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-outfit font-bold text-white mb-2 tracking-tight">Services</h1>
          <p className="text-white/40 font-light">Add, edit and manage the service offerings shown on the public website.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-royal hover:bg-royal/80 rounded-xl text-white text-sm font-bold tracking-widest uppercase transition-all">
          <Plus size={18} /> New Service
        </button>
      </header>

      <AnimatePresence>
        {isCreating && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-premium p-8 rounded-3xl border border-white/10 mb-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">{editing ? "Edit Service" : "New Service"}</h3>
              <button onClick={closeForm} className="text-white/40 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Title</label>
                <input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-royal outline-none" placeholder="e.g. Express Entry" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Icon (emoji)</label>
                <input value={formData.icon} onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-royal outline-none" placeholder="🌍" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Description</label>
                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-royal outline-none resize-none" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Benefits (one per line)</label>
                <textarea value={benefitsText} onChange={e => setBenefitsText(e.target.value)} rows={5} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-royal outline-none resize-none" placeholder={"Fast processing\nExpert guidance\nHigh success rate"} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Display Order</label>
                <input type="number" value={formData.order} onChange={e => setFormData(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-royal outline-none" />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-8 py-3 bg-gold hover:bg-gold/80 rounded-xl text-midnight font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50">
                <Save size={16} /> {saving ? "Saving..." : "Save Service"}
              </button>
              <button onClick={closeForm} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm font-bold uppercase tracking-widest transition-all">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? (
          <p className="text-white/20 italic p-8">Loading services...</p>
        ) : services.length === 0 ? (
          <div className="glass-premium rounded-3xl p-16 text-center border border-white/5">
            <p className="text-white/30 italic mb-4">No services yet. Click &quot;New Service&quot; to add one.</p>
          </div>
        ) : (
          services.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={cn("glass-premium p-6 rounded-2xl border flex items-center gap-6 group", s.is_active ? "border-white/5" : "border-white/5 opacity-50")}>
              <GripVertical size={20} className="text-white/10 cursor-grab shrink-0" />
              <div className="text-3xl">{s.icon}</div>
              <div className="flex-grow">
                <p className="text-white font-semibold">{s.title}</p>
                <p className="text-sm text-white/40 line-clamp-1">{s.description}</p>
              </div>
              <div className={cn("text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border", s.is_active ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-white/20 bg-white/5 border-white/10")}>
                {s.is_active ? "Active" : "Hidden"}
              </div>
              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => toggleActive(s)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                  {s.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                  <Pencil size={18} />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-white/40 hover:text-rose-500 transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

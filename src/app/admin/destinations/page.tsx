"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Star, StarOff, Save, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Destination } from "@/lib/types";
import { cn } from "@/lib/utils";

const emptyDest: Omit<Destination, "id" | "created_at"> = {
  name: "", code: "", description: "", image_url: "", is_featured: false,
};

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Destination | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState(emptyDest);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const fetchDestinations = async () => {
    setLoading(true);
    const { data } = await supabase.from("destinations").select("*").order("name");
    if (data) setDestinations(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchDestinations();
  }, []);

  function openCreate() { setFormData(emptyDest); setEditing(null); setIsCreating(true); }
  function openEdit(d: Destination) {
    setFormData({ name: d.name, code: d.code, description: d.description, image_url: d.image_url, is_featured: d.is_featured });
    setEditing(d); setIsCreating(true);
  }
  function closeForm() { setIsCreating(false); setEditing(null); }

  async function handleSave() {
    setSaving(true);
    try {
      let result;
      if (editing) {
        result = await supabase.from("destinations").update(formData).eq("id", editing.id);
      } else {
        result = await supabase.from("destinations").insert([formData]);
      }

      if (result.error) {
        console.error("Supabase Error:", result.error);
        alert(`Error saving destination: ${result.error.message}`);
      } else {
        await fetchDestinations();
        closeForm();
      }
    } catch (err) {
      console.error("Unexpected Error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Unexpected error: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  async function toggleFeatured(d: Destination) {
    await supabase.from("destinations").update({ is_featured: !d.is_featured }).eq("id", d.id);
    setDestinations(prev => prev.map(item => item.id === d.id ? { ...item, is_featured: !item.is_featured } : item));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this destination?")) return;
    await supabase.from("destinations").delete().eq("id", id);
    setDestinations(prev => prev.filter(d => d.id !== id));
  }

  return (
    <div className="p-8 md:p-12">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-outfit font-bold text-white mb-2 tracking-tight">Destinations</h1>
          <p className="text-white/40 font-light">Manage the global destinations displayed on the public website.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-royal hover:bg-royal/80 rounded-xl text-white text-sm font-bold tracking-widest uppercase transition-all">
          <Plus size={18} /> New Destination
        </button>
      </header>

      <AnimatePresence>
        {isCreating && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-premium p-8 rounded-3xl border border-white/10 mb-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">{editing ? "Edit Destination" : "New Destination"}</h3>
              <button onClick={closeForm} className="text-white/40 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Country Name", key: "name", placeholder: "Canada" },
                { label: "Country Code (flag)", key: "code", placeholder: "CA" },
                { label: "Image URL", key: "image_url", placeholder: "https://..." },
              ].map(field => (
                <div key={field.key} className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">{field.label}</label>
                  <input
                    value={formData[field.key as keyof typeof emptyDest] as string}
                    onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-royal outline-none"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-royal outline-none resize-none"
                />
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setFormData(p => ({ ...p, is_featured: !p.is_featured }))}
                  className={cn("px-5 py-2 rounded-xl border text-sm font-bold transition-all", formData.is_featured ? "bg-gold/10 border-gold/30 text-gold" : "bg-white/5 border-white/10 text-white/40")}
                >
                  {formData.is_featured ? "★ Featured" : "☆ Mark as Featured"}
                </button>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-8 py-3 bg-gold hover:bg-gold/80 rounded-xl text-midnight font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50">
                <Save size={16} /> {saving ? "Saving..." : "Save Destination"}
              </button>
              <button onClick={closeForm} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm font-bold uppercase tracking-widest transition-all">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-white/20 italic col-span-3 p-8">Loading destinations...</p>
        ) : destinations.length === 0 ? (
          <div className="col-span-3 glass-premium rounded-3xl p-16 text-center border border-white/5">
            <p className="text-white/30 italic">No destinations yet. Click &quot;New Destination&quot; to add one.</p>
          </div>
        ) : (
          destinations.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-premium rounded-2xl border border-white/5 overflow-hidden group">
              {d.image_url ? (
                <div className="h-40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.image_url} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <div className="h-40 bg-white/5 flex items-center justify-center text-5xl">🌍</div>
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-bold text-lg">{d.name}</h3>
                  {d.is_featured && <span className="text-[10px] font-bold uppercase tracking-widest text-gold">★ Featured</span>}
                </div>
                <p className="text-white/40 text-sm line-clamp-2 mb-6">{d.description}</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleFeatured(d)} title={d.is_featured ? "Unfeature" : "Feature"} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-gold transition-all">
                    {d.is_featured ? <StarOff size={18} /> : <Star size={18} />}
                  </button>
                  <button onClick={() => openEdit(d)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"><Pencil size={18} /></button>
                  <button onClick={() => handleDelete(d.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-white/40 hover:text-rose-500 transition-all"><Trash2 size={18} /></button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

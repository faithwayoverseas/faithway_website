"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff, Save, X, Image as ImageIcon, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BlogPost } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

const emptyPost: Omit<BlogPost, "id" | "created_at" | "updated_at"> = {
  title: "", slug: "", content: "", meta_title: "", meta_description: "", featured_image: "", is_published: false, author_id: null
};

export default function BlogManagerPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState(emptyPost);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchPosts();
  }, []);

  function openCreate() { setFormData(emptyPost); setEditing(null); setIsCreating(true); }
  function openEdit(p: BlogPost) {
    setFormData({ 
      title: p.title, slug: p.slug, content: p.content, 
      meta_title: p.meta_title, meta_description: p.meta_description, 
      featured_image: p.featured_image || "", is_published: p.is_published, author_id: p.author_id 
    });
    setEditing(p); setIsCreating(true);
  }
  function closeForm() { setIsCreating(false); setEditing(null); }

  function generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }

  async function handleSave() {
    setSaving(true);
    
    // Auto-generate slug if empty
    let finalSlug = formData.slug;
    if (!finalSlug) {
      finalSlug = generateSlug(formData.title);
      setFormData(prev => ({ ...prev, slug: finalSlug }));
    }

    const payload = {
      ...formData,
      slug: finalSlug,
      updated_at: new Date().toISOString()
    };

    if (editing) {
      await supabase.from("blog_posts").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("blog_posts").insert([payload]);
    }
    await fetchPosts();
    closeForm(); setSaving(false);
  }

  async function togglePublished(p: BlogPost) {
    await supabase.from("blog_posts").update({ is_published: !p.is_published }).eq("id", p.id);
    setPosts(prev => prev.map(item => item.id === p.id ? { ...item, is_published: !item.is_published } : item));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this blog post? This cannot be undone.")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div className="p-8 md:p-12">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-outfit font-bold text-white mb-2 tracking-tight">Blog & SEO</h1>
          <p className="text-white/40 font-light">Manage articles, thought leadership, and SEO metadata.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/media" className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm font-bold tracking-widest uppercase transition-all">
            <ImageIcon size={18} /> Media Library
          </Link>
          <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-royal hover:bg-royal/80 rounded-xl text-white text-sm font-bold tracking-widest uppercase transition-all">
            <Plus size={18} /> New Post
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isCreating && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-premium p-8 rounded-3xl border border-white/10 mb-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">{editing ? "Edit Post" : "New Post"}</h3>
              <button onClick={closeForm} className="text-white/40 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content Area */}
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Article Title</label>
                  <input 
                    value={formData.title} 
                    onChange={e => {
                      setFormData(p => ({ ...p, title: e.target.value }));
                      if (!editing && !formData.slug) {
                        setFormData(p => ({ ...p, slug: generateSlug(e.target.value) }));
                      }
                    }} 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-royal outline-none text-lg font-medium" 
                    placeholder="Enter an engaging title..." 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex justify-between">
                    <span>Content (Markdown/HTML)</span>
                    <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank" rel="noreferrer" className="text-royal hover:text-royal/80 transition-colors">Formatting Help</a>
                  </label>
                  <textarea 
                    value={formData.content} 
                    onChange={e => setFormData(p => ({ ...p, content: e.target.value }))} 
                    rows={15} 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-royal outline-none resize-y font-mono text-sm leading-relaxed" 
                    placeholder="Write your content here..." 
                  />
                </div>
              </div>

              {/* Sidebar Settings Area */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">URL Slug</label>
                  <input 
                    value={formData.slug} 
                    onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))} 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white/70 focus:border-royal outline-none font-mono text-sm" 
                    placeholder="my-blog-post" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Featured Image URL</label>
                  <input 
                    value={formData.featured_image || ""} 
                    onChange={e => setFormData(p => ({ ...p, featured_image: e.target.value }))} 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-royal outline-none text-sm" 
                    placeholder="Copy from Media Library..." 
                  />
                  {formData.featured_image && (
                    <div className="mt-2 h-24 rounded-lg overflow-hidden border border-white/10 relative">
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={formData.featured_image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-white/5 space-y-6">
                  <h4 className="text-sm font-bold text-white/80">SEO Metadata</h4>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Meta Title</label>
                    <input 
                      value={formData.meta_title} 
                      onChange={e => setFormData(p => ({ ...p, meta_title: e.target.value }))} 
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2 text-white focus:border-royal outline-none text-sm" 
                      placeholder="60 chars max..." 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Meta Description</label>
                    <textarea 
                      value={formData.meta_description} 
                      onChange={e => setFormData(p => ({ ...p, meta_description: e.target.value }))} 
                      rows={3} 
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2 text-white focus:border-royal outline-none text-sm resize-none" 
                      placeholder="160 chars max..." 
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button onClick={() => setFormData(p => ({ ...p, is_published: !p.is_published }))}
                    className={cn("w-full px-4 py-3 rounded-xl border text-sm font-bold transition-all text-center", formData.is_published ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-500")}>
                    {formData.is_published ? "● Published" : "○ Draft Status"}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-8 border-t border-white/5 pt-8">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-8 py-3 bg-gold hover:bg-gold/80 rounded-xl text-midnight font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50">
                <Save size={16} /> {saving ? "Saving..." : "Save Post"}
              </button>
              <button onClick={closeForm} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm font-bold uppercase tracking-widest transition-all">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? (
          <p className="text-white/20 italic p-8">Loading blog posts...</p>
        ) : posts.length === 0 ? (
          <div className="glass-premium rounded-3xl p-16 text-center border border-white/5">
            <p className="text-white/30 italic mb-4">No articles written yet. Click &quot;New Post&quot; to create one.</p>
          </div>
        ) : (
          posts.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-premium p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center gap-6 group">
              {p.featured_image ? (
                <div className="w-full md:w-32 h-20 rounded-lg overflow-hidden shrink-0 border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.featured_image} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full md:w-32 h-20 rounded-lg bg-white/5 shrink-0 border border-white/10 flex items-center justify-center">
                  <ImageIcon size={24} className="text-white/10" />
                </div>
              )}
              
              <div className="flex-grow">
                <h3 className="text-white font-bold text-lg mb-1">{p.title}</h3>
                <p className="text-sm text-white/40 flex items-center gap-4">
                  <span>/{p.slug}</span>
                  <span>{new Date(p.created_at).toLocaleDateString()}</span>
                </p>
              </div>
              
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                <div className={cn("text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border", p.is_published ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-amber-500 bg-amber-500/10 border-amber-500/20")}>
                  {p.is_published ? "Published" : "Draft"}
                </div>
                
                <div className="flex items-center gap-2">
                  <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all" title="View Public Post">
                    <ExternalLink size={18} />
                  </a>
                  <button onClick={() => togglePublished(p)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all" title="Toggle Publish">
                    {p.is_published ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all" title="Edit Post">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-white/40 hover:text-rose-500 transition-all" title="Delete Post">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Trash2, Copy, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MediaFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
    cacheControl: string;
  };
}

export default function MediaLibraryPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const BUCKET_NAME = "media";

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list("", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });
    
    if (data) {
      // Filter out the empty placeholder file that sometimes appears
      setFiles(data.filter(f => f.name !== ".emptyFolderPlaceholder") as MediaFile[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file);
        
      if (error) {
        console.error("Upload error:", error);
        alert(`Failed to upload ${file.name}`);
      }
    }
    
    if (fileInputRef.current) fileInputRef.current.value = "";
    await fetchFiles();
    setUploading(false);
  }

  async function handleDelete(fileName: string) {
    if (!confirm("Delete this image? This will break any links using it.")) return;
    
    await supabase.storage.from(BUCKET_NAME).remove([fileName]);
    setFiles(prev => prev.filter(f => f.name !== fileName));
  }

  function getPublicUrl(fileName: string) {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    return data.publicUrl;
  }

  function handleCopyUrl(fileName: string) {
    const url = getPublicUrl(fileName);
    navigator.clipboard.writeText(url);
    setCopiedName(fileName);
    setTimeout(() => setCopiedName(null), 2000);
  }

  function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  return (
    <div className="p-8 md:p-12">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-outfit font-bold text-white mb-2 tracking-tight">Media Library</h1>
          <p className="text-white/40 font-light">Upload and manage images for blog posts and destinations.</p>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            multiple 
            accept="image/*" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-3 bg-royal hover:bg-royal/80 rounded-xl text-white text-sm font-bold tracking-widest uppercase transition-all disabled:opacity-50"
          >
            <Upload size={18} /> {uploading ? "Uploading..." : "Upload Images"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <p className="text-white/20 italic col-span-full p-8">Loading media library...</p>
        ) : files.length === 0 ? (
          <div className="col-span-full glass-premium rounded-3xl p-16 text-center border border-white/5">
            <ImageIcon size={48} className="mx-auto mb-4 text-white/10" />
            <p className="text-white/30 italic">No media found. Upload some images to get started.</p>
          </div>
        ) : (
          files.map((file, i) => {
            const publicUrl = getPublicUrl(file.name);
            return (
              <motion.div 
                key={file.name} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }}
                className="glass-premium rounded-2xl border border-white/5 overflow-hidden group"
              >
                <div className="aspect-square bg-midnight relative overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={publicUrl} 
                    alt={file.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                    <button 
                      onClick={() => handleCopyUrl(file.name)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-bold uppercase tracking-widest transition-colors backdrop-blur-md"
                    >
                      {copiedName === file.name ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      {copiedName === file.name ? "Copied" : "Copy URL"}
                    </button>
                    <button 
                      onClick={() => handleDelete(file.name)}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/40 rounded-lg text-rose-100 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors backdrop-blur-md"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-white/[0.02]">
                  <p className="text-white text-xs font-medium truncate mb-1" title={file.name}>{file.name}</p>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest">{file.metadata ? formatBytes(file.metadata.size) : 'Unknown size'}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

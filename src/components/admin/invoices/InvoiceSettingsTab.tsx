"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, Save, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { InvoiceSettings } from "@/lib/types";

const DEFAULT_FORM = {
  company_name:    "FaithWay Overseas",
  company_address: "Bairamalguda Rd, Sri Venkateshwara Colony, Hyderabad - 500079",
  company_phone:   "+971 50 888 1754 | +91 72075 89444",
  company_email:   "faithwayoverseas@gmail.com",
  company_website: "https://faithwayoverseas.com",
  logo_url:        null as string | null,
  signature_url:   null as string | null,
  stamp_url:       null as string | null,
};

type SettingsForm = typeof DEFAULT_FORM;
type AssetKey = "logo_url" | "signature_url" | "stamp_url";

export function InvoiceSettingsTab({ onSettingsChanged }: { onSettingsChanged?: () => void }) {
  const supabase = createClient();

  const [form,      setForm]      = useState<SettingsForm>(DEFAULT_FORM);
  const [rowId,     setRowId]     = useState<string | null>(null);  // id of the single DB row
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [uploading, setUploading] = useState<AssetKey | null>(null);

  const logoRef = useRef<HTMLInputElement>(null);
  const sigRef  = useRef<HTMLInputElement>(null);
  const stmpRef = useRef<HTMLInputElement>(null);

  // ── Fetch the single invoice_settings row ──────────────────────────────────
  async function fetchSettings() {
    setLoading(true);
    setError(null);
    try {
      // Use maybeSingle so we get null (not an error) when no row exists yet
      const { data, error: fetchErr } = await supabase
        .from("invoice_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (fetchErr) throw new Error("Fetch error: " + fetchErr.message);

      if (data) {
        setRowId(data.id);
        setForm({
          company_name:    data.company_name    || DEFAULT_FORM.company_name,
          company_address: data.company_address || DEFAULT_FORM.company_address,
          company_phone:   data.company_phone   || DEFAULT_FORM.company_phone,
          company_email:   data.company_email   || DEFAULT_FORM.company_email,
          company_website: data.company_website || DEFAULT_FORM.company_website,
          logo_url:        data.logo_url        ?? null,
          signature_url:   data.signature_url   ?? null,
          stamp_url:       data.stamp_url       ?? null,
        });
      } else {
        // No row yet — auto-create with defaults so future saves work
        await ensureSettingsRow();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-create the default settings row if it doesn't exist yet
  async function ensureSettingsRow() {
    const { data: inserted, error: insErr } = await supabase
      .from("invoice_settings")
      .insert([{
        ...DEFAULT_FORM,
        last_invoice_year:   new Date().getFullYear(),
        last_invoice_serial: 0,
      }])
      .select()
      .single();

    if (insErr) {
      // If insert fails (e.g. race condition — row now exists), just re-fetch
      const { data: existing } = await supabase
        .from("invoice_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (existing) setRowId(existing.id);
    } else if (inserted) {
      setRowId(inserted.id);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => { if (alive) await fetchSettings(); })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save handler: always UPDATE by id, never blind UPDATE ─────────────────
  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const payload = {
        ...form,
        updated_at: new Date().toISOString(),
      };

      if (rowId) {
        // Row exists — safe targeted UPDATE with WHERE id = rowId
        const { error: upErr } = await supabase
          .from("invoice_settings")
          .update(payload)
          .eq("id", rowId);

        if (upErr) throw new Error("Save failed: " + upErr.message + " [code: " + upErr.code + "]");
      } else {
        // No row id yet — INSERT then capture the new id
        const { data: inserted, error: insErr } = await supabase
          .from("invoice_settings")
          .insert([{
            ...payload,
            last_invoice_year:   new Date().getFullYear(),
            last_invoice_serial: 0,
          }])
          .select()
          .single();

        if (insErr) throw new Error("Insert failed: " + insErr.message + " [code: " + insErr.code + "]");
        if (inserted) setRowId(inserted.id);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
      onSettingsChanged?.();
      // Re-fetch to confirm saved state
      await fetchSettings();
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  }

  // ── Asset upload: timestamped filename → no collision ─────────────────────
  async function handleAssetUpload(e: React.ChangeEvent<HTMLInputElement>, field: AssetKey) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(field);
    setError(null);

    try {
      const ext       = file.name.split(".").pop() || "png";
      const slug      = field.replace("_url", ""); // e.g. "logo"
      const timestamp = Date.now();
      const fileName  = `${slug}_${timestamp}.${ext}`; // e.g. "logo_1714500000000.png"

      const { error: upErr } = await supabase.storage
        .from("invoice-assets")
        .upload(fileName, file, { contentType: file.type, upsert: true });

      if (upErr) throw new Error("Upload failed: " + upErr.message);

      const { data: urlData } = supabase.storage
        .from("invoice-assets")
        .getPublicUrl(fileName);

      // Update local form state immediately (user sees the new image)
      setForm(p => ({ ...p, [field]: urlData.publicUrl }));

      // Persist the new URL to the DB row right away (if row exists)
      if (rowId) {
        const { error: dbErr } = await supabase
          .from("invoice_settings")
          .update({ [field]: urlData.publicUrl, updated_at: new Date().toISOString() })
          .eq("id", rowId);
        if (dbErr) throw new Error("URL save failed: " + dbErr.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed unexpectedly.");
    } finally {
      setUploading(null);
      // Reset file input so same file can be re-uploaded
      if (field === "logo_url")      logoRef.current && (logoRef.current.value = "");
      if (field === "signature_url") sigRef.current  && (sigRef.current.value  = "");
      if (field === "stamp_url")     stmpRef.current && (stmpRef.current.value = "");
    }
  }

  const inputCls = "w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-royal outline-none transition-all placeholder:text-white/10";
  const labelCls = "text-[10px] uppercase tracking-widest font-bold text-white/40";

  if (loading) return <p className="text-white/20 italic p-8">Loading settings…</p>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-3xl">

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="break-all">{error}</span>
        </div>
      )}

      {/* Company Details Card */}
      <div className="glass-premium p-8 rounded-3xl border border-white/5">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
          <FileText size={18} className="text-gold" /> Company Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { key: "company_name",    label: "Company Name",    placeholder: "FaithWay Overseas" },
            { key: "company_email",   label: "Email",           placeholder: "faithwayoverseas@gmail.com" },
            { key: "company_phone",   label: "Phone",           placeholder: "+971 50 888 1754 | +91 72075 89444" },
            { key: "company_website", label: "Website",         placeholder: "https://faithwayoverseas.com" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-2">
              <label className={labelCls}>{label}</label>
              <input
                value={(form[key as keyof SettingsForm] as string) || ""}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                className={inputCls}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div className="space-y-2 md:col-span-2">
            <label className={labelCls}>Office Address</label>
            <input
              value={form.company_address || ""}
              onChange={e => setForm(p => ({ ...p, company_address: e.target.value }))}
              className={inputCls}
              placeholder="Full office address"
            />
          </div>
        </div>
      </div>

      {/* Brand Assets Card */}
      <div className="glass-premium p-8 rounded-3xl border border-white/5">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
          <Upload size={18} className="text-gold" /> Brand Assets
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {([
            { key: "logo_url"      as AssetKey, label: "Company Logo",  ref: logoRef },
            { key: "signature_url" as AssetKey, label: "Signature",     ref: sigRef  },
            { key: "stamp_url"     as AssetKey, label: "Stamp / Seal",  ref: stmpRef },
          ] as const).map(({ key, label, ref }) => (
            <div key={key} className="space-y-3">
              <label className={labelCls}>{label}</label>
              {form[key] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form[key]!}
                  alt={label}
                  className="h-16 w-full object-contain bg-white/5 rounded-xl p-2"
                />
              ) : (
                <div className="h-16 w-full bg-white/[0.03] border border-dashed border-white/20 rounded-xl flex items-center justify-center text-white/20 text-xs">
                  No file uploaded
                </div>
              )}
              <input
                ref={ref}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleAssetUpload(e, key)}
              />
              <button
                onClick={() => ref.current?.click()}
                disabled={uploading === key}
                className="w-full py-2 text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white transition-all disabled:opacity-50"
              >
                {uploading === key ? "Uploading…" : "Upload"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Row */}
      <div className="flex items-center gap-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-4 bg-gold hover:bg-gold/80 rounded-xl text-midnight font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50"
        >
          <Save size={18} /> {saving ? "Saving…" : "Save Settings"}
        </button>
        {saved && (
          <p className="text-emerald-400 text-sm font-bold">✓ Saved successfully</p>
        )}
        {rowId && (
          <p className="text-white/20 text-xs ml-auto">Row ID: {rowId.slice(0, 8)}…</p>
        )}
      </div>
    </motion.div>
  );
}

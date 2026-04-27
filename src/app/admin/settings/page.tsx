"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Save, Phone, Mail, MapPin, MessageCircle, Globe, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Setting {
  key: string;
  value: { text: string };
  description: string;
}

const DEFAULT_SETTINGS: Omit<Setting, "value">[] = [
  { key: "business_email", description: "Primary business email address" },
  { key: "phone_uae", description: "UAE Regional Office phone number" },
  { key: "phone_india", description: "India Support Desk phone number" },
  { key: "whatsapp_number", description: "WhatsApp number (digits only, e.g. 971508881754)" },
  { key: "office_address", description: "Physical office address" },
  { key: "website_url", description: "Public website URL" },
];

const ICONS: Record<string, any> = {
  business_email: Mail,
  phone_uae: Phone,
  phone_india: Phone,
  whatsapp_number: MessageCircle,
  office_address: MapPin,
  website_url: Globe,
};

const LABELS: Record<string, string> = {
  business_email: "Business Email",
  phone_uae: "UAE Phone",
  phone_india: "India Phone",
  whatsapp_number: "WhatsApp Number",
  office_address: "Office Address",
  website_url: "Website URL",
};

const PLACEHOLDERS: Record<string, string> = {
  business_email: "faithwayoverseas@gmail.com",
  phone_uae: "+971 50 888 1754",
  phone_india: "+91 72075 89444",
  whatsapp_number: "971508881754",
  office_address: "Bairamalguda Rd, Sri Venkateshwara Colony, Hyderabad - 500079",
  website_url: "https://faithwayoverseas.com",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from("site_settings").select("*");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((s: Setting) => { map[s.key] = s.value?.text ?? ""; });
      setSettings(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    const upserts = Object.entries(settings).map(([key, text]) => ({
      key,
      value: { text },
      description: DEFAULT_SETTINGS.find(s => s.key === key)?.description ?? key,
    }));

    await supabase.from("site_settings").upsert(upserts, { onConflict: "key" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="p-8 md:p-12 max-w-3xl">
      <header className="mb-12">
        <h1 className="text-4xl font-outfit font-bold text-white mb-2 tracking-tight">Site Settings</h1>
        <p className="text-white/40 font-light">Update business contact information displayed across the website.</p>
      </header>

      {loading ? (
        <p className="text-white/20 italic">Loading settings...</p>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glass-premium p-8 md:p-10 rounded-[2rem] border border-white/5">
            <h3 className="text-lg font-bold mb-8 flex items-center gap-3">
              <AlertCircle size={18} className="text-gold" /> Business Contact Information
            </h3>
            <div className="space-y-6">
              {DEFAULT_SETTINGS.map(({ key, description }) => {
                const Icon = ICONS[key] || Globe;
                return (
                  <div key={key} className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
                      <Icon size={12} /> {LABELS[key]}
                    </label>
                    <input
                      value={settings[key] ?? ""}
                      onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-royal outline-none transition-all placeholder:text-white/10"
                      placeholder={PLACEHOLDERS[key]}
                    />
                    <p className="text-[10px] text-white/20 ml-1">{description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-3 px-8 py-4 bg-gold hover:bg-gold/80 rounded-xl text-midnight font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save All Settings"}
            </button>
            {saved && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-emerald-400 text-sm font-bold">
                ✓ Settings saved successfully
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

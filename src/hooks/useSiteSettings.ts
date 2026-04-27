"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Hardcoded fallback data
export const DEFAULT_SETTINGS = {
  business_name: "Faithway Overseas",
  contact_email: "faithwayoverseas@gmail.com",
  phone_uae: "+971 50 888 1754",
  phone_india: "+91 72075 89444",
  whatsapp_number: "971508881754",
  office_address: "Bairamalguda Rd, Sri Venkateshwara Colony, Hyderabad - 500079",
  working_hours: "Mon-Sat: 9:00 AM - 6:00 PM",
};

export function useSiteSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from("site_settings").select("*");
        
        if (!error && data) {
          const merged = { ...DEFAULT_SETTINGS };
          data.forEach(item => {
            if (item.key && item.value?.text) {
              // @ts-expect-error - dynamically merging settings object
              merged[item.key] = item.value.text;
            }
          });
          setSettings(merged);
        }
      } catch (err) {
        console.error("Error loading site settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  return { settings, loading };
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Hardcoded fallback data
export const DEFAULT_SETTINGS = {
  business_name: "Faithway Overseas",
  contact_email: "contact@faithwayoverseas.com",
  phone_primary: "+1 (555) 123-4567",
  phone_whatsapp: "+15551234567",
  office_address: "123 Premium Blvd, Suite 400, Toronto, ON M5V 3L9",
  working_hours: "Mon-Fri: 9:00 AM - 6:00 PM EST",
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

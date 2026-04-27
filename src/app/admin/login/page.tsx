"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { login } from "../actions";
import { PremiumButton } from "@/components/ui/PremiumButton";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-royal/5 blur-[150px] -z-10" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-outfit font-bold text-white mb-2 tracking-tight">
            FAITHWAY<span className="text-gold">OVERSEAS</span>
          </h1>
          <p className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-bold">Admin Portal Access</p>
        </div>

        <div className="glass-premium p-8 md:p-10 rounded-[2rem] border border-white/5">
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold ml-1">Identity</label>
              <input
                name="email"
                type="email"
                required
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-royal outline-none transition-all placeholder:text-white/10"
                placeholder="admin@faithway.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold ml-1">Secret Key</label>
              <input
                name="password"
                type="password"
                required
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-royal outline-none transition-all placeholder:text-white/10"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-rose-500 text-xs font-medium text-center bg-rose-500/10 py-3 rounded-lg border border-rose-500/20">
                {error}
              </p>
            )}

            <PremiumButton
              type="submit"
              variant="gold"
              className="w-full py-4 text-lg rounded-xl"
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Enter Dashboard"}
            </PremiumButton>
          </form>
        </div>
        
        <p className="text-center mt-8 text-white/20 text-xs font-light">
          Authorized personnel only. All access is strictly monitored.
        </p>
      </motion.div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionTitle } from "../ui/SectionTitle";
import { PremiumButton } from "../ui/PremiumButton";

export const ContactSection = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <section id="contact" className="section-padding relative overflow-hidden">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-24 items-start">
          <div className="lg:col-span-5">
            <SectionTitle
              title="Begin Your Global Legacy"
              subtitle="Secure Consultation"
              align="left"
              className="mb-8 md:mb-12"
            />
            <p className="text-lg md:text-xl text-white/50 mb-10 md:mb-16 font-light leading-relaxed">
              Your journey to international success deserves absolute precision. Connect with our elite consultants today.
            </p>

            <div className="space-y-8 md:space-y-12">
              {[
                { icon: "📍", label: "Regional Hub", value: "Level 41, Emirates Towers, Dubai, UAE" },
                { icon: "✉️", label: "Email Office", value: "faithwayoverseas@gmail.com" },
                { icon: "📞", label: "Priority Line", value: "+971 50 888 1754" },
              ].map((item) => (
                <div key={item.label} className="flex gap-6 md:gap-8 group">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] glass flex items-center justify-center text-xl md:text-2xl group-hover:bg-royal transition-all duration-500">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-white/40 uppercase tracking-[0.2em] text-[10px] md:text-xs font-bold mb-2">{item.label}</h4>
                    <p className="text-base md:text-xl text-white font-outfit">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="glass-premium p-6 md:p-16 rounded-[2rem] md:rounded-[3rem] relative overflow-hidden">
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    onSubmit={handleSubmit}
                    className="space-y-6 md:space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-white/40 text-[10px] md:text-xs uppercase tracking-[0.3em] ml-1 font-bold">Full Identity</label>
                        <input
                          required
                          type="text"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 md:px-6 md:py-5 text-white focus:border-royal outline-none transition-all duration-500 placeholder:text-white/10"
                          placeholder="Your Full Name"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-white/40 text-[10px] md:text-xs uppercase tracking-[0.3em] ml-1 font-bold">Digital Address</label>
                        <input
                          required
                          type="email"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 md:px-6 md:py-5 text-white focus:border-royal outline-none transition-all duration-500 placeholder:text-white/10"
                          placeholder="email@luxury.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-white/40 text-[10px] md:text-xs uppercase tracking-[0.3em] ml-1 font-bold">Bespoke Service</label>
                      <select required className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 md:px-6 md:py-5 text-white focus:border-royal outline-none transition-all duration-500 appearance-none cursor-pointer">
                        <option value="" className="bg-midnight">Select Service Pathway</option>
                        <option value="student" className="bg-midnight">Elite Student Placement</option>
                        <option value="pr" className="bg-midnight">Global Residency (PR)</option>
                        <option value="investment" className="bg-midnight">Citizenship by Investment</option>
                        <option value="work" className="bg-midnight">Expert Work Permit</option>
                      </select>
                    </div>

                    <div className="space-y-4">
                      <label className="text-white/40 text-[10px] md:text-xs uppercase tracking-[0.3em] ml-1 font-bold">Inquiry Details</label>
                      <textarea
                        required
                        rows={5}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 md:px-6 md:py-5 text-white focus:border-royal outline-none transition-all duration-500 placeholder:text-white/10 resize-none"
                        placeholder="Tell us about your global aspirations..."
                      />
                    </div>

                    <PremiumButton
                      type="submit"
                      variant="gold"
                      className="w-full py-5 md:py-6 text-lg md:text-xl rounded-2xl"
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Submit Secure Inquiry"}
                    </PremiumButton>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20"
                  >
                    <div className="w-24 h-24 bg-royal/10 rounded-full flex items-center justify-center text-5xl mx-auto mb-10 border border-royal/20 animate-glow">
                      ✨
                    </div>
                    <h3 className="text-4xl font-bold text-white mb-6 font-outfit tracking-tight">Your Journey Begins</h3>
                    <p className="text-white/40 text-xl mb-12 font-light leading-relaxed">
                      An elite consultant has been assigned to your case. <br />Expect a priority response within 24 hours.
                    </p>
                    <PremiumButton variant="outline" onClick={() => setSubmitted(false)}>
                      Send Another Request
                    </PremiumButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

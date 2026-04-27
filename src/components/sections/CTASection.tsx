"use client";

import { motion } from "framer-motion";
import { PremiumButton } from "../ui/PremiumButton";

export const CTASection = () => {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Cinematic background */}
      <div className="absolute inset-0 bg-royal/10 -z-10" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,hsla(45,100%,50%,0.05),transparent_70%)] -z-10" />
      
      <div className="container-custom">
        <div className="glass-premium p-16 md:p-32 rounded-[4rem] text-center relative overflow-hidden group">
          {/* Animated background lines */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(255,255,255,0.05)_20px,rgba(255,255,255,0.05)_40px)]" />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className="text-gold font-bold tracking-[0.5em] uppercase text-xs md:text-sm mb-8 block">
              The First Step to a Global Legacy
            </span>
            <h2 className="text-5xl md:text-8xl font-bold text-white mb-10 font-outfit leading-tight tracking-tighter">
              Ready to Define <br />
              <span className="royal-gradient">Your Future?</span>
            </h2>
            <p className="text-xl md:text-2xl text-white/50 mb-16 max-w-3xl mx-auto font-light leading-relaxed">
              Join an elite circle of global citizens who have entrusted Faithway with their international aspirations. Your bespoke consultation awaits.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
              <PremiumButton 
                variant="gold" 
                className="text-xl px-16 py-8 rounded-[2rem] shadow-[0_20px_50px_rgba(253,185,49,0.3)]"
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              >
                Book Free Consultation
              </PremiumButton>
              <button 
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                className="text-white/60 hover:text-white transition-colors flex items-center gap-4 group text-lg tracking-widest uppercase font-bold"
              >
                Check Eligibility
                <span className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-royal group-hover:border-royal transition-all duration-500">
                  →
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

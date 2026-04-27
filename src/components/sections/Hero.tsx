"use client";

import { motion } from "framer-motion";
import { PremiumButton } from "../ui/PremiumButton";
import Globe from "../ui/Globe";

export const Hero = () => {
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen lg:min-h-[110vh] flex items-center pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-full lg:w-3/5 h-[40vh] lg:h-full -z-10 opacity-50 lg:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-transparent to-transparent lg:hidden z-10" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-midnight to-midnight z-10 hidden lg:block" />
        <Globe />
      </div>
      
      <div className="container-custom relative z-20">
        <div className="max-w-4xl mx-auto lg:mx-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center gap-4 mb-8 justify-center lg:justify-start"
          >
              <div className="w-8 md:w-12 h-px bg-gold" />
            <span className="text-gold font-bold tracking-[0.3em] md:tracking-[0.4em] uppercase text-[9px] md:text-xs">
              Elite Immigration Partners
            </span>
          </motion.div>

          <h1 className="text-4xl md:text-8xl lg:text-[10rem] font-bold font-outfit text-white mb-8 md:mb-12 leading-[1.1] md:leading-[0.9] tracking-tighter text-center lg:text-left">
            <motion.span
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="block"
            >
              Your Future
            </motion.span>
            <motion.span
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="gold-gradient block"
            >
              Without Borders
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-lg md:text-2xl text-white/50 mb-8 md:mb-12 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light text-center lg:text-left"
          >
            Experience the pinnacle of immigration consultancy. We turn global aspirations into reality with precision, integrity, and elite service.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex flex-col sm:flex-row gap-6 md:gap-8 justify-center lg:justify-start items-center"
          >
            <PremiumButton 
              variant="gold" 
              className="text-lg md:text-xl px-10 md:px-12 py-4 md:py-6 min-w-[220px] md:min-w-[240px]"
              onClick={scrollToContact}
            >
              Start Your Journey
            </PremiumButton>
            <button 
              onClick={() => document.getElementById("destinations")?.scrollIntoView({ behavior: "smooth" })}
              className="text-white/60 hover:text-white transition-colors flex items-center gap-3 md:gap-4 group text-base md:text-lg tracking-widest uppercase font-bold"
            >
              View Destinations
              <span className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-midnight transition-all duration-500">
                ↓
              </span>
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="mt-16 md:mt-24 flex items-center gap-8 md:gap-12 justify-center lg:justify-start"
          >
            {[
              { label: "Experience", value: "15+" },
              { label: "Success Rate", value: "98%" },
              { label: "Destinations", value: "50+" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-bold text-white mb-1 font-outfit">{stat.value}</div>
                <div className="text-white/30 text-[10px] uppercase tracking-widest font-bold">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-royal/10 blur-[200px] -z-10 animate-glow" />

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Explore</span>
        <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent" />
      </motion.div>
    </section>
  );
};

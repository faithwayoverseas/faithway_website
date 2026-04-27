"use client";

import { motion } from "framer-motion";

const stats = [
  { label: "Successful Visa Grants", value: "25,000+", icon: "✨" },
  { label: "Global Destinations", value: "50+", icon: "🌍" },
  { label: "Expert Consultants", value: "100+", icon: "👔" },
  { label: "Client Satisfaction", value: "99%", icon: "⭐" },
];

export const TrustStats = () => {
  return (
    <section className="py-16 md:py-32 relative overflow-hidden">
      <div className="container-custom">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className="relative group"
            >
              <div className="absolute -inset-4 bg-royal/5 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              <div className="text-center md:text-left">
                <div className="text-4xl md:text-7xl font-bold font-outfit mb-2 md:mb-4 flex items-center justify-center md:justify-start gap-4">
                  <span className="gold-gradient">{stat.value}</span>
                </div>
                <div className="text-white/40 uppercase tracking-[0.2em] md:tracking-[0.3em] text-[8px] md:text-xs font-bold mb-3 md:mb-4">
                  {stat.label}
                </div>
                <div className="w-12 h-1 bg-royal/20 rounded-full group-hover:w-full group-hover:bg-royal/50 transition-all duration-700" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Decorative background line */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </section>
  );
};

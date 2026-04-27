"use client";

import { motion } from "framer-motion";
import { SectionTitle } from "../ui/SectionTitle";
import { PremiumButton } from "../ui/PremiumButton";
import { cn } from "@/lib/utils";

const services = [
  {
    title: "Student Visa",
    desc: "Elite placement in top-tier global universities with complete documentation support.",
    benefits: ["University Selection", "SOP Assistance", "Visa Interview Prep"],
    icon: "🎓",
  },
  {
    title: "Permanent Residency",
    desc: "Strategic PR pathways for Canada, Australia, UK and EU through various programs.",
    benefits: ["Points Assessment", "Documentation", "Post-Landing Support"],
    icon: "🏠",
  },
  {
    title: "Business & Investment",
    desc: "Citizenship by investment and entrepreneur visas for high-net-worth individuals.",
    benefits: ["Wealth Verification", "Business Planning", "Family Inclusion"],
    icon: "💼",
  },
  {
    title: "Work Permits",
    desc: "Connecting skilled professionals with global employers and handling legal hurdles.",
    benefits: ["Job Offer Validation", "Employer Liaison", "Sponsorship Support"],
    icon: "⚡",
  },
];

export const ServicesShowcase = () => {
  return (
    <section id="services" className="section-padding bg-midnight/30">
      <div className="container-custom">
        <SectionTitle
          title="Bespoke Immigration Solutions"
          subtitle="Our Elite Services"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-12">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 1, ease: [0.23, 1, 0.32, 1] }}
              className={cn(
                "lg:col-span-6",
                i === 0 ? "lg:col-span-7" : i === 1 ? "lg:col-span-5" : i === 2 ? "lg:col-span-5" : "lg:col-span-7"
              )}
            >
              <div className="glass-card h-full flex flex-col p-6 md:p-12 group hover:bg-white/[0.05] relative overflow-hidden rounded-[2rem] md:rounded-[3rem]">
                <div className="text-4xl md:text-6xl mb-6 md:mb-12 transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 w-fit">{service.icon}</div>
                <h3 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-6 font-outfit tracking-tighter">{service.title}</h3>
                <p className="text-base md:text-xl mb-6 md:mb-12 leading-relaxed font-light group-hover:text-white/70 transition-colors">{service.desc}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-12 flex-grow">
                  {service.benefits.map((benefit) => (
                    <div key={benefit} className="flex items-center gap-3 text-white/60 text-sm">
                      <div className="w-1 h-1 rounded-full bg-gold" />
                      {benefit}
                    </div>
                  ))}
                </div>
                
                <PremiumButton variant="outline" className="w-fit px-10 group-hover:bg-royal group-hover:text-white group-hover:border-royal transition-all duration-500">
                  Explore Service
                </PremiumButton>

                {/* Decorative background number */}
                <div className="absolute top-10 right-10 text-9xl font-black text-white/[0.02] select-none pointer-events-none">
                  0{i + 1}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

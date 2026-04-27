"use client";

import { motion } from "framer-motion";
import { SectionTitle } from "../ui/SectionTitle";
import { PremiumButton } from "../ui/PremiumButton";

const features = [
  {
    title: "Unmatched Expertise",
    desc: "Over 15 years of navigating complex immigration landscapes for high-net-worth individuals and families.",
    icon: "💎",
  },
  {
    title: "Global Network",
    desc: "Strategic partnerships with legal and financial institutions across 50+ countries for seamless transitions.",
    icon: "🌐",
  },
  {
    title: "Personalized Strategy",
    desc: "Every case is unique. We craft bespoke immigration pathways tailored to your specific legacy and goals.",
    icon: "♟️",
  },
  {
    title: "Absolute Integrity",
    desc: "Transparency is our foundation. We maintain the highest ethical standards in every consultation and filing.",
    icon: "🛡️",
  },
];

export const WhyFaithway = () => {
  return (
    <section id="why-us" className="section-padding relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-royal/5 blur-[150px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/5 blur-[100px] -z-10" />
      
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-5">
            <SectionTitle
              title="The Standard of Excellence"
              subtitle="Why Choose Faithway"
              align="left"
              className="mb-0"
            />
            <p className="text-xl text-white/50 mt-8 mb-12 font-light leading-relaxed">
              We don&apos;t just process visas; we architect legacies. Our commitment to absolute integrity and elite service sets a new global benchmark in immigration consultancy.
            </p>
            <PremiumButton variant="outline" className="px-10">
              Download Credentials
            </PremiumButton>
          </div>
          
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 1, ease: [0.23, 1, 0.32, 1] }}
                className="group"
              >
                <div className="glass-card p-10 h-full rounded-[2.5rem] hover:bg-white/[0.07] hover:-translate-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-royal/10 flex items-center justify-center text-3xl mb-8 group-hover:bg-royal group-hover:text-white transition-all duration-500">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 font-outfit tracking-tight">{feature.title}</h3>
                  <p className="text-white/40 leading-relaxed group-hover:text-white/70 transition-colors">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

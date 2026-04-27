"use client";

import { motion } from "framer-motion";
import { SectionTitle } from "../ui/SectionTitle";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Initial Consultation",
    desc: "A deep dive into your profile, goals, and eligibility criteria with our senior consultants.",
    icon: "🗣️",
  },
  {
    title: "Strategic Planning",
    desc: "Crafting a personalized roadmap and gathering essential documentation for your pathway.",
    icon: "📝",
  },
  {
    title: "Application Submission",
    desc: "Precise filing of your application with rigorous quality checks and compliance monitoring.",
    icon: "🚀",
  },
  {
    title: "Ongoing Advocacy",
    desc: "Real-time tracking and representation during processing to ensure maximum success.",
    icon: "🎯",
  },
  {
    title: "Successful Transition",
    desc: "Assistance with pre-departure and post-landing services for a smooth relocation.",
    icon: "🥂",
  },
];

export const ProcessTimeline = () => {
  return (
    <section id="process" className="section-padding relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-royal/5 blur-[200px] -z-10" />
      
      <div className="container-custom">
        <SectionTitle
          title="The Journey to Excellence"
          subtitle="Our Proven Process"
        />
        
        <div className="relative pt-12">
          {/* Vertical line with gradient */}
          <div className="absolute left-[50%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-royal to-transparent hidden lg:block opacity-30" />
          
          <div className="space-y-12 lg:space-y-32">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.1, duration: 1, ease: [0.23, 1, 0.32, 1] }}
                className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-24 ${
                  i % 2 === 0 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div className="flex-1 w-full lg:w-auto">
                  <div className={cn(
                    "p-12 rounded-[3rem] glass-card relative group hover:bg-white/[0.05]",
                    i % 2 === 0 ? "lg:text-left" : "lg:text-right"
                  )}>
                    <span className="text-gold font-bold mb-4 block uppercase tracking-[0.4em] text-[10px] md:text-xs">
                      Phase 0{i + 1}
                    </span>
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 font-outfit tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-white/40 leading-relaxed text-lg font-light group-hover:text-white/70 transition-colors">
                      {step.desc}
                    </p>
                    
                    {/* Corner accent */}
                    <div className={cn(
                      "absolute top-0 w-24 h-24 border-t-2 border-royal opacity-20 group-hover:opacity-100 transition-opacity duration-700",
                      i % 2 === 0 ? "left-0 border-l-2 rounded-tl-[3rem]" : "right-0 border-r-2 rounded-tr-[3rem]"
                    )} />
                  </div>
                </div>
                
                {/* Visual anchor in center */}
                <div className="relative z-10 shrink-0">
                  <div className="w-20 h-20 rounded-full bg-midnight border border-white/10 flex items-center justify-center text-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] group-hover:border-gold transition-colors duration-500">
                    {step.icon}
                  </div>
                  {/* Outer ring */}
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
                    className="absolute inset-[-8px] rounded-full border border-royal/30 -z-10" 
                  />
                </div>
                
                <div className="flex-1 hidden lg:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

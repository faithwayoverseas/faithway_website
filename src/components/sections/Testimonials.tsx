"use client";

import { motion } from "framer-motion";
import { SectionTitle } from "../ui/SectionTitle";

const testimonials = [
  {
    name: "Dr. Arjun Mehta",
    role: "Relocated to Toronto, Canada",
    content: "The level of professionalism and attention to detail at Faithway is unmatched. They handled my Express Entry with such precision that the entire process felt effortless.",
    image: "👨‍⚕️",
  },
  {
    name: "Sarah Jenkins",
    role: "Tech Professional, Australia",
    content: "I had been rejected twice before finding Faithway. Their strategic approach identified gaps in my previous filings and got me my subclass 189 in record time.",
    image: "👩‍💻",
  },
  {
    name: "Vikram Singh",
    role: "Business Investor, UK",
    content: "Navigating the Innovator Founder visa was complex, but Faithway's legal team provided clarity and confidence at every step. Highly recommended for premium clients.",
    image: "💼",
  },
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="section-padding bg-midnight/50 relative overflow-hidden">
      <div className="container-custom">
        <SectionTitle
          title="Voice of Global Citizens"
          subtitle="Client Success Stories"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {testimonials.map((test, i) => (
            <motion.div
              key={test.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 1, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="glass-card p-12 h-full rounded-[3rem] relative group hover:bg-white/[0.07] transition-all duration-700">
                {/* Quote Icon */}
                <div className="text-6xl text-gold/10 absolute top-8 right-10 select-none group-hover:text-gold/20 transition-colors">&quot;</div>
                
                <div className="flex items-center gap-2 mb-8">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-gold text-xs">★</span>
                  ))}
                </div>
                
                <p className="text-xl md:text-2xl text-white/60 mb-12 font-light italic leading-relaxed group-hover:text-white transition-colors">
                  {test.content}
                </p>
                
                <div className="flex items-center gap-6 mt-auto">
                  <div className="w-16 h-16 rounded-2xl bg-royal/20 border border-white/10 flex items-center justify-center text-2xl font-bold font-outfit text-royal">
                    {test.name[0]}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white font-outfit">{test.name}</h4>
                    <p className="text-gold font-bold tracking-[0.2em] text-[10px] md:text-xs uppercase mt-1">
                      {test.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

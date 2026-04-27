"use client";

import { motion } from "framer-motion";
import { SectionTitle } from "../ui/SectionTitle";

const destinations = [
  { name: "Canada", code: "CA", desc: "Express Entry, PNP, and Study Permits.", image: "/destinations/canada.png" },
  { name: "Australia", code: "AU", desc: "Skilled Independent, State Nominated.", image: "/destinations/australia.png" },
  { name: "United Kingdom", code: "UK", desc: "Skilled Worker, Student, and Innovator.", image: "/destinations/uk.png" },
  { name: "Europe", code: "EU", desc: "Golden Visas and Blue Card programs.", image: "/destinations/europe.png" },
  { name: "USA", code: "US", desc: "H1B, EB-5 Investment, and L1 Visas.", image: "/destinations/canada.png" }, // Reusing for placeholder
  { name: "New Zealand", code: "NZ", desc: "Skilled Migrant, Business, and Study.", image: "/destinations/australia.png" }, // Reusing for placeholder
];

export const Destinations = () => {
  return (
    <section id="destinations" className="section-padding relative">
      <div className="container-custom">
        <SectionTitle
          title="Global Opportunities"
          subtitle="World-Class Destinations"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {destinations.map((dest, i) => (
            <motion.div
              key={dest.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 1, ease: [0.23, 1, 0.32, 1] }}
              className="group cursor-pointer"
            >
              <div className="relative h-[350px] md:h-[500px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                  style={{ backgroundImage: `url(${dest.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/20 to-transparent opacity-80" />
                
                {/* Content Overlay */}
                <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end">
                  <div className="mb-4">
                    <span className="text-gold font-bold tracking-widest text-xs uppercase mb-2 block">Pathways to {dest.name}</span>
                    <h3 className="text-2xl md:text-4xl font-bold text-white font-outfit">{dest.name}</h3>
                  </div>
                  
                  <p className="text-white/70 text-sm md:text-base mb-6 md:mb-8 line-clamp-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    {dest.desc}
                  </p>
                  
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-royal group-hover:border-royal transition-all duration-500">
                    <span className="text-xl">→</span>
                  </div>
                </div>
                
                {/* Glossy overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-royal/10 via-transparent to-gold/5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

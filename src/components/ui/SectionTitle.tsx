"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export const SectionTitle = ({
  title,
  subtitle,
  align = "center",
  className,
}: SectionTitleProps) => {
  return (
    <div
      className={cn(
        "mb-20 md:mb-32",
        align === "center" ? "text-center" : "text-left",
        className
      )}
    >
      <div className={cn(
        "flex items-center gap-4 mb-6",
        align === "center" ? "justify-center" : "justify-start"
      )}>
        <div className="w-12 h-px bg-gold/50" />
        {subtitle && (
          <motion.span
            initial={{ opacity: 0, letterSpacing: "0.2em" }}
            whileInView={{ opacity: 1, letterSpacing: "0.5em" }}
            viewport={{ once: true }}
            className="text-gold font-bold uppercase text-[10px] md:text-xs tracking-[0.5em] block"
          >
            {subtitle}
          </motion.span>
        )}
        <div className="w-12 h-px bg-gold/50" />
      </div>
      
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight tracking-tighter"
      >
        {title.split(" ").map((word, i) => (
          <span key={i} className={cn(i === 1 ? "royal-gradient" : "")}>
            {word}{" "}
          </span>
        ))}
      </motion.h2>
    </div>
  );
};

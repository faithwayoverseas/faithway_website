"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  tilt?: boolean;
}

export const GlassCard = ({
  children,
  className,
  hoverEffect = true,
}: GlassCardProps) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -10, transition: { duration: 0.3 } } : {}}
      className={cn(
        "glass-premium rounded-3xl p-8 relative overflow-hidden group",
        className
      )}
    >
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-royal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">{children}</div>
      
      {/* Decorative border glow */}
      <div className="absolute -inset-[1px] bg-gradient-to-br from-white/20 via-transparent to-royal/20 rounded-3xl -z-10" />
    </motion.div>
  );
};

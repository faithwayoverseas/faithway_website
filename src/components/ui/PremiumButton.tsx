"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "gold";
  children: React.ReactNode;
}

export const PremiumButton = ({
  variant = "primary",
  children,
  className,
  ...props
}: PremiumButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const variants = {
    primary: "bg-royal text-white hover:bg-royal/90 shadow-[0_0_20px_rgba(59,130,246,0.5)]",
    outline: "border border-white/20 text-white hover:bg-white/10 backdrop-blur-sm",
    gold: "bg-gold text-midnight font-bold hover:shadow-[0_0_25px_rgba(253,185,49,0.6)]",
  };

  return (
    <motion.button
      ref={buttonRef}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "px-8 py-4 rounded-full font-medium transition-all duration-300 relative overflow-hidden group cursor-pointer",
        variants[variant],
        className
      )}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      
      {/* Shine effect */}
      <div className={cn(
        "absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-700 ease-in-out",
        isHovered ? "left-full" : "-left-full"
      )} />
    </motion.button>
  );
};

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { PremiumButton } from "../ui/PremiumButton";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const navLinks = [
  { name: "Services", href: "#services" },
  { name: "Destinations", href: "#destinations" },
  { name: "Process", href: "#process" },
  { name: "Why Us", href: "#why-us" },
  { name: "Testimonials", href: "#testimonials" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { settings } = useSiteSettings();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 w-full z-[100] transition-all duration-500",
        scrolled ? "py-2 md:py-4 bg-midnight/40 backdrop-blur-2xl border-b border-white/5" : "py-2 md:py-8 bg-transparent"
      )}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link 
          href="/" 
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          className="flex items-center gap-3 group"
        >
          <div className="relative w-6 h-6 md:w-12 md:h-12 overflow-hidden rounded-md md:rounded-lg">
            <Image 
              src="/logo.png" 
              alt="Faithway Overseas Logo" 
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <span className="text-base md:text-2xl font-outfit font-bold tracking-tight text-white">
            FAITHWAY<span className="text-gold">OVERSEAS</span>
          </span>
        </Link>


        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => scrollToSection(link.href)}
              className="text-white/60 hover:text-white transition-colors font-medium text-sm uppercase tracking-widest cursor-pointer"
            >
              {link.name}
            </button>
          ))}
          <PremiumButton 
            variant="gold" 
            className="px-6 py-2"
            onClick={() => scrollToSection("#contact")}
          >
            Consult Now
          </PremiumButton>
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden text-white w-8 h-8 flex items-center justify-center bg-white/5 rounded-full border border-white/10"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <div className="w-4 flex flex-col gap-1">
            <motion.div animate={{ rotate: mobileMenuOpen ? 45 : 0, y: mobileMenuOpen ? 6 : 0 }} className="h-0.5 w-full bg-white rounded-full" />
            <motion.div animate={{ opacity: mobileMenuOpen ? 0 : 1 }} className="h-0.5 w-full bg-white rounded-full" />
            <motion.div animate={{ rotate: mobileMenuOpen ? -45 : 0, y: mobileMenuOpen ? -6 : 0 }} className="h-0.5 w-full bg-white rounded-full" />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 lg:hidden bg-midnight/95 backdrop-blur-2xl z-[90] flex flex-col items-center justify-center gap-8"
          >
            {navLinks.map((link, i) => (
              <motion.button
                key={link.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => scrollToSection(link.href)}
                className="text-3xl font-outfit font-bold text-white/80 hover:text-gold"
              >
                {link.name}
              </motion.button>
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 w-full px-12 flex flex-col gap-6"
            >
              <PremiumButton 
                variant="gold" 
                className="w-full py-6 text-xl"
                onClick={() => scrollToSection("#contact")}
              >
                Consult Now
              </PremiumButton>
              
              <div className="flex flex-col items-center gap-4 mt-4">
                <a href={`tel:${settings.phone_uae}`} className="text-white/40 hover:text-gold transition-colors text-xs uppercase tracking-widest font-bold">UAE Regional Office: {settings.phone_uae}</a>
                <a href={`tel:${settings.phone_india}`} className="text-white/40 hover:text-gold transition-colors text-xs uppercase tracking-widest font-bold">India Support Desk: {settings.phone_india}</a>
                <a href={`https://wa.me/${settings.whatsapp_number?.replace(/[^0-9]/g, '')}`} className="text-gold transition-colors text-xs uppercase tracking-widest font-bold">Direct WhatsApp Chat</a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

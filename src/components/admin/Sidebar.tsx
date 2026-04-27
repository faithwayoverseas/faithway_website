"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Globe2, 
  MessageSquare, 
  FileText, 
  Settings, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/admin/actions";

const menuItems = [
  { name: "Overview", icon: LayoutDashboard, href: "/admin" },
  { name: "Inquiries", icon: Users, href: "/admin/inquiries" },
  { name: "Services", icon: Briefcase, href: "/admin/services" },
  { name: "Destinations", icon: Globe2, href: "/admin/destinations" },
  { name: "Testimonials", icon: MessageSquare, href: "/admin/testimonials" },
  { name: "Blog / SEO", icon: FileText, href: "/admin/blog" },
  { name: "Settings", icon: Settings, href: "/admin/settings" },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-midnight border-r border-white/5 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-8">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="text-xl font-outfit font-bold text-white tracking-tighter">
            FAITHWAY<span className="text-gold">ADMIN</span>
          </span>
        </Link>
      </div>

      <nav className="flex-grow px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-royal text-white shadow-[0_10px_20px_rgba(30,58,138,0.3)]" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-4">
                <item.icon size={20} className={cn(isActive ? "text-white" : "text-white/20 group-hover:text-white")} />
                <span className="text-sm font-medium tracking-wide">{item.name}</span>
              </div>
              {isActive && <ChevronRight size={16} />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <button
          onClick={() => logout()}
          className="flex items-center gap-4 px-4 py-3 w-full text-white/40 hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all duration-300 group"
        >
          <LogOut size={20} className="text-white/20 group-hover:text-rose-500" />
          <span className="text-sm font-medium tracking-wide">Logout</span>
        </button>
      </div>
    </aside>
  );
};

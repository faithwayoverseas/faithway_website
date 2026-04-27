import React from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If this is the login page, don't show the sidebar
  // This is a server component, we check path via some trick or just let the login page handle itself
  // Actually, since this is /admin/layout.tsx, it wraps everything under /admin.
  // We can check if the child is the login page, but better to use a group or just check auth here.

  // In Next.js App Router, you can use route groups (admin)/(auth)/login to avoid this,
  // but let's just keep it simple and check the cookie/session here for the sidebar.

  // If no user and not on login page, redirecting is handled by middleware.
  // But for the UI, we only show Sidebar if user exists.

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {user && <Sidebar />}
      <main className={user ? "pl-64" : ""}>
        {children}
      </main>
    </div>
  );
}

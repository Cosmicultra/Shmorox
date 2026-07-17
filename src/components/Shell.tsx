"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { HomeRedirect } from "@/components/HomeRedirect";
import { MotionProvider, PageTransition } from "@/components/motion";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/auth");

  if (isAuthPage) {
    return (
      <MotionProvider>
        <div className="flex min-h-screen items-center justify-center bg-base px-4">
          <PageTransition>{children}</PageTransition>
        </div>
      </MotionProvider>
    );
  }

  return (
    <MotionProvider>
    <HomeRedirect />
    <div className="flex min-h-screen bg-base">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMobileMenuOpen={() => setMobileOpen(true)} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>

        <footer className="border-t border-border bg-surface/50 px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-secondary">
              AI-assisted marketing workspace · Not a substitute for qualified legal counsel
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-secondary/60">
              Enterprise marketing collaboration, powered by AI
            </p>
          </div>
        </footer>
      </div>
    </div>
    </MotionProvider>
  );
}

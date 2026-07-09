"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "@/components/motion";
import {
  LayoutDashboard,
  PlusCircle,
  HelpCircle,
  Sparkles,
  Menu,
  X,
  Megaphone,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [{ href: "/", label: "Home", icon: LayoutDashboard, match: (p: string) => p === "/" }],
  },
  {
    label: "Create",
    items: [
      { href: "/campaign/new", label: "New Campaign", icon: Megaphone, match: (p: string) => p.startsWith("/campaign") },
      { href: "/review/new", label: "New Review", icon: PlusCircle, match: (p: string) => p.startsWith("/review") },
    ],
  },
  {
    label: "Connect",
    items: [{ href: "/settings/social", label: "Social", icon: Settings, match: (p: string) => p.startsWith("/settings") }],
  },
  {
    label: "Learn",
    items: [{ href: "/help", label: "How It Works", icon: HelpCircle, match: (p: string) => p === "/help" }],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const navContent = (
    <>
      <div className={cn("flex items-center gap-3 px-4 py-5", collapsed && "justify-center px-2")}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-muted shadow-glow">
          <Sparkles className="h-4 w-4 text-white" strokeWidth={2} />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="min-w-0"
          >
            <p className="truncate text-base font-semibold tracking-tight text-primary">Creative Studio</p>
            <p className="truncate text-[10px] font-medium uppercase tracking-widest text-gold">
              AI Marketing Team
            </p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-secondary/70">
                {group.label}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map(({ href, label, icon: Icon, match }) => {
                const active = match(pathname);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onMobileClose}
                      title={collapsed ? label : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-fast",
                        collapsed && "justify-center px-2",
                        active
                          ? "bg-accent/10 text-primary shadow-sm"
                          : "text-secondary hover:bg-muted hover:text-primary"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-gold"
                          transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        />
                      )}
                      <Icon
                        className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-secondary group-hover:text-accent")}
                        strokeWidth={1.75}
                      />
                      {!collapsed && <span>{label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="hidden border-t border-border p-3 md:block">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-secondary transition-colors hover:bg-muted hover:text-primary"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="relative hidden shrink-0 flex-col border-r border-border bg-surface/80 backdrop-blur-xl md:flex"
      >
        {navContent}
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-primary/60 backdrop-blur-sm md:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-border bg-surface shadow-elevated md:hidden"
            >
              <div className="flex items-center justify-end p-2">
                <button
                  onClick={onMobileClose}
                  className="rounded-lg p-2 text-secondary hover:bg-muted"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg p-2 text-secondary transition-colors hover:bg-muted hover:text-primary md:hidden"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

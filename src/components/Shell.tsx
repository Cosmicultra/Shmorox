"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  HelpCircle,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

const NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/review/new", label: "New Review", icon: PlusCircle },
  { href: "/help", label: "How It Works", icon: HelpCircle },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-mckinsey-mist">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-mckinsey-navy">
              <Shield className="h-5 w-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-serif text-lg font-semibold leading-tight text-mckinsey-navy">
                Shmorox
              </p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-mckinsey-slate">
                Legal Marketing Review
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-[#051C2C] text-white"
                      : "text-[#334155] hover:bg-gray-100 hover:text-[#051C2C]"
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <button
            className="rounded-md p-2 text-mckinsey-navy md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <nav className="border-t border-mckinsey-border bg-white px-4 py-3 md:hidden">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold",
                    active
                      ? "bg-[#051C2C] text-white"
                      : "text-[#334155] hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      <footer className="mt-16 border-t border-mckinsey-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm text-mckinsey-slate">
            AI-assisted first-pass review · Not a substitute for qualified legal counsel
          </p>
          <p className="text-xs text-mckinsey-slate/70">
            Built for enterprise marketing & legal teams
          </p>
        </div>
      </footer>
    </div>
  );
}

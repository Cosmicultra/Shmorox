"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, Megaphone, PlusCircle, ChevronRight } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui";
import { MobileMenuButton } from "@/components/Sidebar";
import { cn } from "@/lib/cn";

const BREADCRUMB_MAP: Record<string, string> = {
  "/": "Command Center",
  "/campaign/new": "New Campaign",
  "/review/new": "New Review",
  "/settings/social": "Social Settings",
  "/help": "How It Works",
};

function getBreadcrumbs(pathname: string) {
  if (BREADCRUMB_MAP[pathname]) {
    return [{ label: BREADCRUMB_MAP[pathname], href: pathname }];
  }
  if (pathname.startsWith("/campaign/")) {
    return [
      { label: "Campaigns", href: "/campaign/new" },
      { label: "Campaign Detail", href: pathname },
    ];
  }
  if (pathname.startsWith("/review/")) {
    return [
      { label: "Reviews", href: "/" },
      { label: "Review Report", href: pathname },
    ];
  }
  return [{ label: "Creative Studio", href: "/" }];
}

interface TopBarProps {
  onMobileMenuOpen: () => void;
}

export function TopBar({ onMobileMenuOpen }: TopBarProps) {
  const pathname = usePathname();
  const { resolvedTheme, toggleTheme } = useTheme();
  const crumbs = getBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <MobileMenuButton onClick={onMobileMenuOpen} />
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
          {crumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex min-w-0 items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-secondary/50" />}
              {i === crumbs.length - 1 ? (
                <span className="truncate font-semibold text-primary">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="truncate text-secondary hover:text-primary">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <form action="/auth/signout" method="post">
          <Button variant="ghost" size="sm" type="submit">
            Sign out
          </Button>
        </form>

        <button
          onClick={toggleTheme}
          className={cn(
            "rounded-lg p-2 text-secondary transition-all duration-fast",
            "hover:bg-muted hover:text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
          )}
          aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        <Link href="/review/new" className="hidden sm:block">
          <Button variant="ghost" size="sm">
            <PlusCircle className="h-4 w-4" />
            Review
          </Button>
        </Link>

        <Link href="/campaign/new">
          <Button variant="gold" size="sm">
            <Megaphone className="h-4 w-4" />
            <span className="hidden sm:inline">New Campaign</span>
            <span className="sm:hidden">Campaign</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}

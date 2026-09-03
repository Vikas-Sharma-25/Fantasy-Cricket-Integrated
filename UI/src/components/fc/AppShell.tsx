import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Home,
  Trophy,
  Users,
  User as UserIcon,
  Wallet,
  ClipboardList,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { getMe } from "@/lib/api-services";
import type { User } from "@/lib/api-types";

const navItems = [
  { to: "/matches", label: "Home", icon: Home },
  { to: "/my-matches", label: "My Matches", icon: ClipboardList },
  { to: "/create-team", label: "My Teams", icon: Users },
  { to: "/contests", label: "Contests", icon: Trophy },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

function getInitials(name?: string) {
  if (!name) return "U";
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function AppShell({
  children,
  maxWidth = "max-w-3xl",
}: {
  children: ReactNode;
  maxWidth?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    void getMe()
      .then(setUser)
      .catch(() => {});
  }, []);

  const initials = getInitials(user?.name);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ------------------------------------------------------------- */}
      {/* LEFT VERTICAL SIDEBAR (Desktop & Tablet)                       */}
      {/* ------------------------------------------------------------- */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-surface/95 backdrop-blur shrink-0 sticky top-0 h-screen z-30">
        {/* Top Logo */}
        <div className="flex h-16 items-center px-6 border-b border-border/80">
          <Logo size="sm" />
        </div>

        {/* Vertical Navigation Links */}
        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                  active
                    ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Card in Sidebar */}
        <div className="p-4 border-t border-border/80 space-y-3 bg-surface-2/40">
          <Link
            to="/profile"
            className="flex items-center justify-between rounded-xl border border-border bg-surface p-2.5 transition-colors hover:border-primary/50"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xs font-bold text-primary-foreground">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">
                  {user?.name || "My Profile"}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {user?.email || "Fantasy Player"}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* RIGHT MAIN CONTENT AREA                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6 w-full">
            {/* Mobile Logo */}
            <div className="md:hidden">
              <Logo size="sm" />
            </div>

            {/* Desktop breadcrumb / placeholder */}
            <div className="hidden md:block">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Fantasy Cricket Arena
              </span>
            </div>

            {/* Right Quick Actions */}
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:border-primary/40 transition-colors"
              >
                <Wallet className="h-3.5 w-3.5 text-primary" />
                ₹0
              </Link>
              <button
                type="button"
                aria-label="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface hover:border-primary/40 transition-colors"
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
              </button>
              <Link
                to="/profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display text-xs font-bold text-primary-foreground shadow-sm hover:brightness-110 transition-all"
              >
                {initials}
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={cn("mx-auto w-full flex-1 px-4 sm:px-6 pb-12 pt-6", maxWidth)}>
          {children}
        </main>

        {/* ------------------------------------------------------------- */}
        {/* DECENT & PROFESSIONAL FOOTER                                  */}
        {/* ------------------------------------------------------------- */}
        <footer className="mt-auto border-t border-border bg-surface/90 pb-20 md:pb-8 pt-10 text-xs text-muted-foreground">
          <div className="mx-auto max-w-5xl px-6 lg:px-8 space-y-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              {/* Col 1: Brand & Bio */}
              <div className="space-y-3 md:col-span-2">
                <Logo size="sm" />
                <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                  India's leading skill-based fantasy cricket platform. Pick your dream team, join mega contests, and compete with cricket fans across the nation.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    100% SECURE & VERIFIED
                  </span>
                  <span className="inline-flex items-center rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-foreground">
                    18+ PLAY RESPONSIBLY
                  </span>
                </div>
              </div>

              {/* Col 2: Quick Links */}
              <div className="space-y-2.5">
                <p className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Quick Links
                </p>
                <ul className="space-y-1.5 text-xs">
                  <li>
                    <Link to="/matches" className="hover:text-primary transition-colors">
                      Live & Upcoming Matches
                    </Link>
                  </li>
                  <li>
                    <Link to="/contests" className="hover:text-primary transition-colors">
                      Mega Contests & Pools
                    </Link>
                  </li>
                  <li>
                    <Link to="/create-team" className="hover:text-primary transition-colors">
                      My Fantasy Teams
                    </Link>
                  </li>
                  <li>
                    <Link to="/profile" className="hover:text-primary transition-colors">
                      Account & Profile
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Col 3: Fair Play & Support */}
              <div className="space-y-2.5">
                <p className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Fair Play & Trust
                </p>
                <ul className="space-y-1.5 text-xs">
                  <li>
                    <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      Fair Play Policy
                    </span>
                  </li>
                  <li>
                    <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      Fantasy Point Scoring
                    </span>
                  </li>
                  <li>
                    <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      Terms of Service
                    </span>
                  </li>
                  <li>
                    <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      24x7 Help & Support
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Disclaimer & Copyright */}
            <div className="border-t border-border/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground/80">
              <p>© 2026 Fantasy Cricket Arena. All rights reserved.</p>
              <p className="text-center sm:text-right">
                Game of skill &bull; Strictly for ages 18 and older &bull; Play responsibly
              </p>
            </div>
          </div>
        </footer>

        {/* Bottom Mobile Navigation (on small screens < md) */}
        <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
          <div className="grid grid-cols-5 px-2">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors",
                    active ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  right,
  back = "/matches",
}: {
  title: ReactNode;
  right?: ReactNode;
  back?: string;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <Link
        to={back}
        className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface hover:bg-surface-2">
          ‹
        </span>
        Back
      </Link>
      <h1 className="font-display text-base font-bold text-center flex-1">{title}</h1>
      <div className="min-w-[64px] text-right text-xs text-muted-foreground">{right}</div>
    </div>
  );
}


import { useEffect, useState, useRef, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Home,
  Trophy,
  Users,
  User as UserIcon,
  Wallet,
  ClipboardList,
  Radio,
  Award,
  Gift,
  CheckCircle2,
  X,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  CalendarDays,
  BarChart2,
  HelpCircle,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { getMe, getCachedUser } from "@/lib/api-services";
import type { User } from "@/lib/api-types";
import { removeFlow, FLOW_KEYS } from "@/lib/flow";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "contest" | "wallet" | "live" | "promo";
}

const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Mega Contest Alert",
    description: "IND vs AUS ₹50,000 Mega Contest is filling fast! 85% spots already taken.",
    time: "5m ago",
    read: false,
    type: "contest",
  },
  {
    id: "2",
    title: "Live Match Ticker Active",
    description: "Click any match in the top ticker to view live scorecard, overs summary, and join contests.",
    time: "15m ago",
    read: false,
    type: "live",
  },
  {
    id: "3",
    title: "Fair Play Verified",
    description: "Your fantasy account is KYC certified and protected with anti-bot shields.",
    time: "1d ago",
    read: true,
    type: "promo",
  },
];

const sidebarNavItems = [
  { to: "/matches", label: "Home", icon: Home },
  { to: "/contests", label: "Mega Contests", icon: Trophy },
  { to: "/my-matches", label: "My Matches", icon: ClipboardList },
  { to: "/create-team", label: "My Teams", icon: Users },
  { to: "/leaderboard", label: "Leaderboard", icon: Award },
  { to: "/profile", label: "Wallet & Profile", icon: UserIcon },
];

const cricketNavItems = [
  { to: "/matches", label: "Series & Fixtures", icon: CalendarDays },
  { to: "/matches", label: "Points Table", icon: BarChart2 },
  { to: "/matches", label: "Fantasy Point Rules", icon: HelpCircle },
];

const mobileNavItems = [
  { to: "/matches", label: "Home", icon: Home },
  { to: "/contests", label: "Contests", icon: Trophy },
  { to: "/my-matches", label: "My Matches", icon: ClipboardList },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

export function AppShell({
  children,
  maxWidth = "max-w-3xl",
}: {
  children: ReactNode;
  maxWidth?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [user, setUser] = useState<User | null>(() => getCachedUser());
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cached = getCachedUser();
    if (cached) setUser(cached);

    void getMe()
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => {});

    function onProfileUpdated(e: Event) {
      const customEvent = e as CustomEvent<User>;
      if (customEvent.detail) setUser(customEvent.detail);
    }
    window.addEventListener("user-profile-updated", onProfileUpdated);
    return () => {
      window.removeEventListener("user-profile-updated", onProfileUpdated);
    };
  }, []);

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

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
        <nav className="flex-1 space-y-1 p-3.5 overflow-y-auto scrollbar-none">
          <p className="px-3 py-1 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
            Fantasy Arena
          </p>
          {sidebarNavItems.map(({ to, label, icon: Icon, badge }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => {
                  if (to === "/matches") {
                    removeFlow(FLOW_KEYS.selectedMatchId);
                    window.dispatchEvent(new CustomEvent("reset-home-match"));
                  }
                }}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                  active
                    ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-4.5 w-4.5", active ? "text-primary" : "text-muted-foreground")} />
                  <span>{label}</span>
                </div>
                {badge && (
                  <span className="flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/30 px-2 py-0.5 text-[9px] font-black text-destructive animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-3">
            <p className="px-3 py-1 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
              Cricket Desk
            </p>
            {cricketNavItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-all"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* User Fantasy Account & Wallet Status (Informational only - NO ADS) */}
          <div className="mt-4 rounded-xl border border-border/80 bg-surface/70 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-primary" /> Wallet Cash
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">₹{user?.walletBalance ?? 0}</span>
            </div>
            <div className="h-px bg-border/60" />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> KYC Verified
              </span>
              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">100% Fair Play</span>
            </div>
          </div>
        </nav>

        {/* Bottom User Profile Section */}
        <div className="p-4 border-t border-border/80 space-y-3 bg-surface-2/40">
          {user ? (
            <Link
              to="/profile"
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-2.5 transition-colors hover:border-primary/50"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="h-9 w-9 shrink-0 rounded-full border border-primary/40 object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xs font-bold text-primary-foreground">
                    {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-foreground">
                    {user.name}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 py-2.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
            >
              Login to Account
            </Link>
          )}
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

            {/* Desktop Brand Badge with Logo Icon */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-primary/30 bg-surface/80 backdrop-blur shadow-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-emerald-400 text-primary-foreground shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                    <circle cx="16.5" cy="3.6" r="2.1" />
                    <path d="M14.9 7.2 9.7 9.9l-2.9 4.4-2 5.9 2.1.7 1.8-5.3 2.6-2.2.6 4.3-2.6 5.4 2 1 3.1-6.3-.4-5.1 3.1-1.5 2.9 3.1 1.5-1.4-3.6-4.1z" />
                    <rect x="2.5" y="1.5" width="1.6" height="9" rx="0.8" transform="rotate(-24 3.3 6)" />
                  </svg>
                </div>
                <span className="font-display text-xs font-black tracking-wider text-foreground">
                  FANTASY CRICKET <span className="text-primary">ARENA</span>
                </span>
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              </div>
            </div>

            {/* Right Quick Actions (Wallet & Interactive Notifications) */}
            <div className="flex items-center gap-3 relative" ref={notificationRef}>
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:border-primary/40 transition-colors"
              >
                <Wallet className="h-3.5 w-3.5 text-primary" />
                ₹0
              </Link>

              {/* Notification Bell Button */}
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => setShowNotifications((prev) => !prev)}
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-full border transition-all",
                  showNotifications
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface hover:border-primary/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Popover */}
              {showNotifications && (
                <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-border bg-surface/98 p-4 shadow-2xl backdrop-blur animate-in fade-in-50 zoom-in-95">
                  <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      <span className="font-display text-sm font-bold text-foreground">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-black text-primary">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="mt-3 max-h-80 space-y-2.5 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No notifications at this moment.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "relative rounded-xl border p-3 transition-all",
                            n.read
                              ? "border-border/60 bg-surface-2/40 opacity-80"
                              : "border-primary/30 bg-primary/5"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {n.type === "contest" && <Trophy className="h-4 w-4 text-amber-400 shrink-0" />}
                              {n.type === "wallet" && <Wallet className="h-4 w-4 text-emerald-400 shrink-0" />}
                              {n.type === "live" && <Radio className="h-4 w-4 text-destructive shrink-0" />}
                              {n.type === "promo" && <ShieldCheck className="h-4 w-4 text-primary shrink-0" />}
                              <p className="text-xs font-bold text-foreground">{n.title}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground">{n.time}</span>
                              <button
                                type="button"
                                onClick={() => clearNotification(n.id)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed pl-6">
                            {n.description}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-3 border-t border-border/80 pt-2 text-center">
                    <Link
                      to="/matches"
                      onClick={() => setShowNotifications(false)}
                      className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      View Live Matches <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={cn("mx-auto w-full flex-1 px-4 sm:px-6 pb-12 pt-6", maxWidth)}>
          {children}
        </main>

        {/* Bottom Mobile Navigation (on small screens < md) */}
        <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
          <div className="grid grid-cols-5 px-2">
            {mobileNavItems.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => {
                    if (to === "/matches") {
                      removeFlow(FLOW_KEYS.selectedMatchId);
                      window.dispatchEvent(new CustomEvent("reset-home-match"));
                    }
                  }}
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
        onClick={() => {
          if (back === "/matches") {
            removeFlow(FLOW_KEYS.selectedMatchId);
            window.dispatchEvent(new CustomEvent("reset-home-match"));
          }
        }}
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

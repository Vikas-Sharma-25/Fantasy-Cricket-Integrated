import { useEffect, useState, useRef, useMemo, type ReactNode } from "react";
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
  LayoutDashboard,
  ShieldAlert,
  Megaphone,
  AlertCircle,
  LogOut,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import {
  getMe,
  getCachedUser,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  logoutUser,
} from "@/lib/api-services";
import { getSocket } from "@/lib/socket";
import type { User } from "@/lib/api-types";
import { removeFlow, FLOW_KEYS } from "@/lib/flow";
import { ThemeToggle } from "@/context/ThemeContext";
import { AuthGuard } from "@/components/fc/AuthGuard";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "contest" | "wallet" | "live" | "promo";
  createdAt?: string;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Recently";
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
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
  { to: "/my-teams", label: "My Teams", icon: Users },
  { to: "/leaderboard", label: "Leaderboard", icon: Award },
  { to: "/wallet", label: "Wallet", icon: Wallet },
];

const cricketNavItems = [
  { to: "/matches", label: "Series & Fixtures", icon: CalendarDays, action: "upcoming" },
  { to: "/live-match", label: "Live Match Center", icon: Radio, isLive: true },
  { to: "/rules", label: "Fantasy Point Rules", icon: HelpCircle },
];

const mobileNavItems = [
  { to: "/matches", label: "Home", icon: Home },
  { to: "/contests", label: "Contests", icon: Trophy },
  { to: "/my-matches", label: "Matches", icon: ClipboardList },
  { to: "/wallet", label: "Wallet", icon: Wallet },
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
  const [walletTotal, setWalletTotal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("fc_user_wallet");
      if (saved) {
        const parsed = JSON.parse(saved);
        return (parsed.deposited || 0) + (parsed.winnings || 0) + (parsed.bonus || 0);
      }
    } catch {}
    return 700;
  });

  // Synchronize user profile, role & wallet balance across all tabs & events
  useEffect(() => {
    const syncWallet = () => {
      try {
        const saved = localStorage.getItem("fc_user_wallet");
        if (saved) {
          const parsed = JSON.parse(saved);
          setWalletTotal((parsed.deposited || 0) + (parsed.winnings || 0) + (parsed.bonus || 0));
        }
      } catch {}
    };

    const handleProfileUpdated = (e: any) => {
      if (e.detail) {
        setUser(e.detail);
      } else {
        setUser(getCachedUser());
      }
      syncWallet();
    };
    const handleStorage = () => {
      setUser(getCachedUser());
      syncWallet();
    };
    window.addEventListener("user-profile-updated", handleProfileUpdated);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("user-profile-updated", handleProfileUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Also sync user and wallet when route pathname changes
  useEffect(() => {
    setUser(getCachedUser());
    try {
      const saved = localStorage.getItem("fc_user_wallet");
      if (saved) {
        const parsed = JSON.parse(saved);
        setWalletTotal((parsed.deposited || 0) + (parsed.winnings || 0) + (parsed.bonus || 0));
      }
    } catch {}
  }, [pathname]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toastAlert, setToastAlert] = useState<{ title: string; message: string } | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Load live notifications from backend API
  const loadLiveNotifications = async () => {
    try {
      const items = await getUserNotifications();
      let readSet = new Set<string>();
      try {
        const savedRead = localStorage.getItem("fc_read_notification_ids");
        if (savedRead) readSet = new Set(JSON.parse(savedRead));
      } catch {}

      if (Array.isArray(items) && items.length > 0) {
        const mapped: NotificationItem[] = items.map((item: any) => {
          const id = String(item._id || item.id || `notif-${Date.now()}`);
          const isRead = Boolean(item.isRead) || readSet.has(id);
          const typeLower = (item.type || "system").toLowerCase();
          return {
            id,
            title: item.title,
            description: item.message || item.description || "",
            time: formatRelativeTime(item.createdAt),
            read: isRead,
            type: typeLower.includes("contest")
              ? "contest"
              : typeLower.includes("wallet")
              ? "wallet"
              : typeLower.includes("live")
              ? "live"
              : "promo",
            createdAt: item.createdAt,
          };
        });

        // If there's an unread notification from admin and toast hasn't shown yet in this session
        const unreadList = mapped.filter((n) => !n.read);
        if (unreadList.length > 0 && typeof window !== "undefined" && !sessionStorage.getItem("fc_alert_shown")) {
          const topUnread = unreadList[0];
          setToastAlert({ title: topUnread.title, message: topUnread.description });
          sessionStorage.setItem("fc_alert_shown", "true");
        }

        setNotifications(mapped);
      } else {
        // Fallback default notifications
        setNotifications(initialNotifications);
      }
    } catch {
      setNotifications(initialNotifications);
    }
  };

  useEffect(() => {
    void loadLiveNotifications();

    // Poll every 15 seconds so returning after minutes or days updates immediately
    const pollTimer = setInterval(() => {
      void loadLiveNotifications();
    }, 15000);

    // Refresh immediately when window/tab is focused
    const onWindowFocus = () => {
      void loadLiveNotifications();
    };
    window.addEventListener("focus", onWindowFocus);

    // Real-time Socket.IO listener for immediate live notification delivery
    const socket = getSocket();
    const handleLiveAnnouncement = (data: any) => {
      if (!data) return;
      const id = String(data.id || data._id || `notif-${Date.now()}`);
      const newNotif: NotificationItem = {
        id,
        title: data.title || "Admin Broadcast",
        description: data.message || "",
        time: "Just now",
        read: false,
        type: ((data.type || "system").toLowerCase().includes("contest") ? "contest" : "promo") as any,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== id)]);
      setToastAlert({ title: newNotif.title, message: newNotif.description });
      setTimeout(() => setToastAlert(null), 8000);
    };

    socket.on("admin:announcement", handleLiveAnnouncement);
    socket.on("notification:new", handleLiveAnnouncement);

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener("focus", onWindowFocus);
      socket.off("admin:announcement", handleLiveAnnouncement);
      socket.off("notification:new", handleLiveAnnouncement);
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
    try {
      const readIds = notifications.map((n) => n.id);
      let existingSet = new Set<string>();
      try {
        const saved = localStorage.getItem("fc_read_notification_ids");
        if (saved) existingSet = new Set(JSON.parse(saved));
      } catch {}
      readIds.forEach((id) => existingSet.add(id));
      localStorage.setItem("fc_read_notification_ids", JSON.stringify(Array.from(existingSet)));
      void markAllNotificationsAsRead();
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    try {
      let existingSet = new Set<string>();
      try {
        const saved = localStorage.getItem("fc_read_notification_ids");
        if (saved) existingSet = new Set(JSON.parse(saved));
      } catch {}
      existingSet.add(id);
      localStorage.setItem("fc_read_notification_ids", JSON.stringify(Array.from(existingSet)));
      void markNotificationAsRead(id);
    } catch {}
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}
    setUser(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: null }));
      sessionStorage.setItem("fc_auth_prompt_msg", "You have been logged out successfully.");
      window.location.href = "/login";
    }
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* ------------------------------------------------------------- */}
        {/* LEFT VERTICAL SIDEBAR (Desktop & Tablet)                       */}
        {/* ------------------------------------------------------------- */}
        <aside className="hidden md:flex w-64 flex-col border-r border-[#1e293b] bg-[#0b0f19] text-slate-100 shrink-0 sticky top-0 h-screen z-30 shadow-xl select-none">
          {/* Top Logo */}
          <div className="flex h-16 items-center px-6 border-b border-[#1e293b]">
            <Logo size="sm" forceDark />
          </div>

          {/* Vertical Navigation Links */}
          <nav className="flex-1 space-y-1 p-3.5 overflow-y-auto scrollbar-none">
            <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
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
                      removeFlow("RETURN_TO_MATCH_CENTER");
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("reset-home-match"));
                      }
                    } else if (to === "/contests") {
                      removeFlow(FLOW_KEYS.selectedMatchId);
                      removeFlow("contests_default_tab");
                      removeFlow("contests_from_my_matches");
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("reset-contests-match"));
                      }
                    } else if (to === "/my-teams") {
                      removeFlow(FLOW_KEYS.selectedMatchId);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                    active
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm font-bold"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-4.5 w-4.5", active ? "text-emerald-400" : "text-slate-400")} />
                    <span>{label}</span>
                  </div>
                  {badge && (
                    <span className="flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[9px] font-black text-red-400 animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-3">
              <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Cricket Desk
              </p>
              {cricketNavItems.map(({ to, label, icon: Icon, action, isLive }) => {
                const active = pathname === to && (!action || (typeof window !== "undefined" && window.location.search.includes("tab=upcoming")));
                return (
                  <Link
                    key={label}
                    to={to}
                    onClick={() => {
                      if (action === "upcoming") {
                        removeFlow(FLOW_KEYS.selectedMatchId);
                        removeFlow("RETURN_TO_MATCH_CENTER");
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new CustomEvent("switch-matches-tab", { detail: "UPCOMING" }));
                          window.dispatchEvent(new CustomEvent("reset-home-match"));
                        }
                      }
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer",
                      active
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-4 w-4", isLive ? "text-red-500 animate-pulse" : active ? "text-emerald-400" : "text-slate-400")} />
                      <span>{label}</span>
                    </div>
                    {isLive && (
                      <span className="flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-1.5 py-0.2 text-[9px] font-black text-red-400 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        LIVE
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Admin / Management Navigation for authorized roles */}
            {(user?.role === "admin" || user?.role === "super_admin") && (
              <div className="pt-3">
                <p className="px-3 py-1 text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="h-3 w-3" /> Management
                </p>
                <Link
                  to="/admin"
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all border",
                    pathname === "/admin"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm"
                      : "text-emerald-400/90 hover:bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="h-4.5 w-4.5 text-emerald-400" />
                    <span>Admin Portal</span>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-300">
                    {user?.role === "super_admin" ? "Super" : "Admin"}
                  </span>
                </Link>
              </div>
            )}

          </nav>

          {/* Bottom User Profile Section */}
          <div className="p-4 border-t border-[#1e293b] space-y-2.5 bg-[#070a12]/70">
            {user ? (
              <div className="space-y-2">
                <Link
                  to="/profile"
                  className="flex items-center justify-between rounded-xl border border-[#1e293b] bg-[#0f172a] p-2.5 transition-colors hover:border-emerald-500/50 shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className="h-9 w-9 shrink-0 rounded-full border border-emerald-500/40 object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-display text-xs font-bold text-white">
                        {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-100">
                        {user.name}
                      </p>
                      <p className="truncate text-[10px] text-slate-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
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
          <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur text-foreground shadow-xs">
            <div className="mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6 w-full">
              {/* Mobile Logo */}
              <div className="md:hidden">
                <Logo size="sm" />
              </div>

              {/* Desktop Brand Badge with Logo Icon */}
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-border bg-surface-2/80 backdrop-blur shadow-xs">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-xs">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                      <circle cx="16.5" cy="3.6" r="2.1" />
                      <path d="M14.9 7.2 9.7 9.9l-2.9 4.4-2 5.9 2.1.7 1.8-5.3 2.6-2.2.6 4.3-2.6 5.4 2 1 3.1-6.3-.4-5.1 3.1-1.5 2.9 3.1 1.5-1.4-3.6-4.1z" />
                      <rect x="2.5" y="1.5" width="1.6" height="9" rx="0.8" transform="rotate(-24 3.3 6)" />
                    </svg>
                  </div>
                  <span className="font-display text-xs font-black tracking-wider text-foreground">
                    FANTASY CRICKET <span className="text-emerald-600 dark:text-primary">ARENA</span>
                  </span>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>

              {/* Right Quick Actions (Theme Toggle, Wallet & Interactive Notifications) */}
              <div className="flex items-center gap-2.5 sm:gap-3 relative" ref={notificationRef}>
                {/* Theme Toggle (Dim Light / Dark) */}
                <ThemeToggle />

                <Link
                  to="/wallet"
                  className="flex items-center gap-2 rounded-full border border-border bg-surface-2/80 px-3 py-1.5 text-xs font-semibold hover:border-emerald-500/50 transition-colors cursor-pointer text-foreground shadow-xs"
                >
                  <Wallet className="h-3.5 w-3.5 text-emerald-600 dark:text-primary" />
                  <span className="font-mono font-bold text-emerald-700 dark:text-primary">
                    ₹{walletTotal.toLocaleString("en-IN")}
                  </span>
                </Link>

              {/* Notification Bell Button */}
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => {
                  setShowNotifications((prev) => !prev);
                  if (toastAlert) setToastAlert(null);
                }}
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-full border transition-all cursor-pointer",
                  showNotifications
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface hover:border-primary/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <Bell className={cn("h-4 w-4", unreadCount > 0 ? "text-emerald-400 animate-pulse" : "text-muted-foreground")} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-md animate-bounce">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Admin / Super Admin Console Quick Nav Button */}
              {(user?.role === "admin" || user?.role === "super_admin") && (
                <Link
                  to="/admin"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm",
                    user.role === "super_admin"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30 hover:border-purple-300 shadow-purple-500/10"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 hover:border-emerald-300 shadow-emerald-500/10"
                  )}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>{user.role === "super_admin" ? "Super Admin" : "Admin"}</span>
                </Link>
              )}

              {/* Profile Avatar Quick Button */}
              <Link
                to="/profile"
                aria-label="User Profile"
                className="flex items-center rounded-full ring-2 ring-primary/30 hover:ring-primary/70 transition-all overflow-hidden"
              >
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name || "User"}
                    className="h-8 w-8 rounded-full object-cover border border-primary/40"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary border border-primary/40">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                  </span>
                )}
              </Link>

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
                            <div className="flex items-center gap-2 min-w-0">
                              {n.type === "contest" ? (
                                <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
                              ) : n.type === "wallet" ? (
                                <Wallet className="h-4 w-4 text-emerald-400 shrink-0" />
                              ) : n.type === "live" ? (
                                <Radio className="h-4 w-4 text-destructive shrink-0" />
                              ) : (
                                <Megaphone className="h-4 w-4 text-emerald-400 shrink-0" />
                              )}
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">{n.title}</p>
                                {!n.read && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 animate-ping" />
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-muted-foreground">{n.time}</span>
                              <button
                                type="button"
                                onClick={() => clearNotification(n.id)}
                                className="text-muted-foreground hover:text-foreground cursor-pointer"
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
                      className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      View Live Matches <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Floating Real-Time Toast Alert for Admin Announcements */}
        {toastAlert && (
          <div className="fixed top-20 right-4 sm:right-6 z-50 flex items-start gap-3 rounded-2xl border border-emerald-500/50 bg-surface/98 p-4 shadow-2xl backdrop-blur-md max-w-sm sm:max-w-md animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 border border-emerald-500/40 shadow">
              <Megaphone className="h-4 w-4 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  New Announcement
                </span>
                <button
                  type="button"
                  onClick={() => setToastAlert(null)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="font-display font-bold text-xs text-foreground truncate mt-1">{toastAlert.title}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{toastAlert.message}</p>
              <button
                type="button"
                onClick={() => {
                  setShowNotifications(true);
                  setToastAlert(null);
                }}
                className="mt-2 text-[11px] font-bold text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Notification</span> &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className={cn("mx-auto w-full flex-1 px-4 sm:px-6 pb-12 pt-6", maxWidth)}>
          {children}
        </main>

        {/* Bottom Mobile Navigation (on small screens < md) */}
        <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur text-foreground shadow-lg">
          <div className={cn("grid px-2", (user?.role === "admin" || user?.role === "super_admin") ? "grid-cols-6" : "grid-cols-5")}>
            {mobileNavItems.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => {
                    if (to === "/matches") {
                      removeFlow(FLOW_KEYS.selectedMatchId);
                      removeFlow("RETURN_TO_MATCH_CENTER");
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("reset-home-match"));
                      }
                    } else if (to === "/contests") {
                      removeFlow(FLOW_KEYS.selectedMatchId);
                      removeFlow("contests_default_tab");
                      removeFlow("contests_from_my_matches");
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("reset-contests-match"));
                      }
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
            {(user?.role === "admin" || user?.role === "super_admin") && (
              <Link
                to="/admin"
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors",
                  pathname === "/admin" ? "text-emerald-400 font-bold" : "text-emerald-400/70 hover:text-emerald-300",
                )}
              >
                <ShieldAlert className="h-5 w-5" />
                Admin
              </Link>
            )}
          </div>
        </nav>
      </div>
    </div>
    </AuthGuard>
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
            removeFlow("RETURN_TO_MATCH_CENTER");
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("reset-home-match"));
            }
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

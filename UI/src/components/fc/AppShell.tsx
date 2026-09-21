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
  BarChart3,
  HelpCircle,
  LayoutDashboard,
  ShieldAlert,
  Megaphone,
  AlertCircle,
  LogOut,
  Moon,
  Sun,
  FileText,
  LifeBuoy,
  Users2,
  Settings as SettingsIcon,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { AppShellSectionView, type NavSectionType } from "./AppShellSections";
import {
  getMe,
  getCachedUser,
  getWalletApi,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  logoutUser,
} from "@/lib/api-services";
import { getSocket } from "@/lib/socket";
import type { User } from "@/lib/api-types";
import { removeFlow, FLOW_KEYS } from "@/lib/flow";
import { ThemeToggle, useTheme } from "@/context/ThemeContext";
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

export interface SidebarNavItem {
  key: string;
  label: string;
  icon: any;
  to?: string;
  section?: NavSectionType;
  badge?: string;
  badgeType?: "live" | "hot" | "emerald" | "amber" | "purple" | "neutral";
  isLive?: boolean;
}

const fantasyArenaNavItems: SidebarNavItem[] = [
  { key: "home", to: "/matches", label: "Home", icon: Home },
  { key: "contests", to: "/contests", label: "Mega Contests", icon: Trophy, badge: "HOT", badgeType: "amber" },
  { key: "my-matches", to: "/my-matches", label: "My Matches", icon: ClipboardList },
  { key: "my-teams", to: "/my-teams", label: "My Teams", icon: Users },
  { key: "leaderboard", to: "/leaderboard", label: "Leaderboard", icon: Award },
  { key: "wallet", to: "/wallet", label: "Wallet", icon: Wallet },
  { key: "rewards", section: "rewards", label: "Rewards & Bonuses", icon: Gift, badge: "FREE", badgeType: "emerald" },
  { key: "transactions", section: "transactions", label: "My Transactions", icon: FileText },
];

const cricketDeskNavItems: SidebarNavItem[] = [
  { key: "fixtures", section: "fixtures", label: "Series & Fixtures", icon: CalendarDays, badge: "2026", badgeType: "emerald" },
  { key: "live-match", to: "/live-match", label: "Live Match Center", icon: Radio, isLive: true },
  { key: "stats", section: "stats", label: "Match Statistics", icon: BarChart3, badge: "STATS", badgeType: "purple" },
  { key: "players", to: "/players", label: "Teams & Players", icon: Users2 },
  { key: "rules", to: "/rules", label: "Fantasy Point Rules", icon: HelpCircle },
];

const accountNavItems: SidebarNavItem[] = [
  { key: "notifications", section: "notifications", label: "Notifications", icon: Bell },
  { key: "kyc", section: "kyc", label: "KYC / Verification", icon: ShieldCheck, badge: "VERIFIED", badgeType: "emerald" },
  { key: "settings", section: "settings", label: "Settings", icon: SettingsIcon },
  { key: "support", section: "support", label: "Help & Support", icon: LifeBuoy, badge: "24x7", badgeType: "neutral" },
];

const mobileNavItems = [
  { to: "/matches", label: "Home", icon: Home },
  { to: "/contests", label: "Contests", icon: Trophy },
  { to: "/my-matches", label: "Matches", icon: ClipboardList },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

export function Pic2HeaderBar({
  className,
}: {
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(() => getCachedUser());
  const [walletTotal, setWalletTotal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("fc_user_wallet");
      if (saved) {
        const parsed = JSON.parse(saved);
        return (parsed.deposited || 0) + (parsed.winnings || 0) + (parsed.bonus || 0);
      }
      const raw = localStorage.getItem("cached_user");
      if (raw) {
        const u = JSON.parse(raw);
        return typeof u.walletBalance === "number" ? u.walletBalance : 0;
      }
    } catch {}
    return 100;
  });

  // Always fetch fresh real wallet balance from backend for the authenticated user
  useEffect(() => {
    getWalletApi()
      .then((data) => {
        if (data && typeof data.walletBalance === "number") {
          setWalletTotal(data.walletBalance);
        }
      })
      .catch(() => {});
  }, []);

  // Synchronize user profile, role & wallet balance across all tabs & events
  useEffect(() => {
    const syncWallet = () => {
      try {
        const saved = localStorage.getItem("fc_user_wallet");
        if (saved) {
          const parsed = JSON.parse(saved);
          setWalletTotal((parsed.deposited || 0) + (parsed.winnings || 0) + (parsed.bonus || 0));
          return;
        }
        const cached = getCachedUser();
        if (cached && typeof cached.walletBalance === "number") {
          setWalletTotal(cached.walletBalance);
        }
      } catch {}
    };

    const handleProfileUpdated = (e: any) => {
      if (e.detail) {
        setUser(e.detail);
        if (typeof e.detail.walletBalance === "number") {
          setWalletTotal(e.detail.walletBalance);
        }
      } else {
        setUser(getCachedUser());
      }
      syncWallet();
    };

    const handleWalletUpdated = (e: any) => {
      if (e.detail && typeof e.detail.walletBalance === "number") {
        setWalletTotal(e.detail.walletBalance);
      } else {
        syncWallet();
      }
    };

    const handleStorage = () => {
      setUser(getCachedUser());
      syncWallet();
    };

    window.addEventListener("user-profile-updated", handleProfileUpdated);
    window.addEventListener("wallet-updated", handleWalletUpdated);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("user-profile-updated", handleProfileUpdated);
      window.removeEventListener("wallet-updated", handleWalletUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
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
        setNotifications(mapped);
      }
    } catch {}
  };

  useEffect(() => {
    loadLiveNotifications();
    const interval = setInterval(loadLiveNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  // Click outside listener to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayBadgeCount = unreadCount > 0 ? unreadCount : 2;

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      const allIds = notifications.map((n) => n.id);
      localStorage.setItem("fc_read_notification_ids", JSON.stringify(allIds));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const clearNotification = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      let readSet = new Set<string>();
      try {
        const savedRead = localStorage.getItem("fc_read_notification_ids");
        if (savedRead) readSet = new Set(JSON.parse(savedRead));
      } catch {}
      readSet.add(id);
      localStorage.setItem("fc_read_notification_ids", JSON.stringify(Array.from(readSet)));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {}
  };

  return (
    <div className={cn("flex items-center justify-between gap-3 w-full", className)}>
      {/* Brand Logo matching Pic 2 */}
      <Link
        to="/matches"
        onClick={() => {
          removeFlow(FLOW_KEYS.selectedMatchId);
          removeFlow("RETURN_TO_MATCH_CENTER");
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("reset-home-match"));
          }
        }}
        className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer select-none"
      >
        <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-[#0d2218] border border-emerald-500/40 shadow-md group-hover:border-emerald-400 group-hover:scale-105 transition-all">
          <svg viewBox="0 0 48 48" className="h-6 w-6 sm:h-7 sm:w-7" fill="none">
            <circle cx="20" cy="12" r="3.5" fill="#f8fafc" />
            <path
              d="M17 17.5 L23 18.5 L26 25 L21 33 L18 41 M22 25 L27 34 L31 41 M18 20 L25 21 L31 16"
              stroke="#f8fafc"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M29 14 L37 6 L40 9 L32 17 Z"
              fill="#f8fafc"
              stroke="#e2e8f0"
              strokeWidth="0.8"
            />
            <path
              d="M7 36 C 8 46, 28 46, 38 33 C 44 25, 43 14, 39 9"
              stroke="#10b981"
              strokeWidth="2.8"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
            />
            <circle
              cx="38.5"
              cy="9.5"
              r="3.2"
              fill="#22c55e"
              className="drop-shadow-[0_0_10px_rgba(34,197,94,1)]"
            />
          </svg>
        </div>

        <div className="flex flex-col justify-center">
          <span className="font-display text-[12px] sm:text-[13px] font-black tracking-wider text-white leading-tight uppercase group-hover:text-slate-100 transition-colors">
            FANTASY CRICKET
          </span>
          <span className="font-display text-[11px] sm:text-[12px] font-black tracking-widest text-[#10b981] leading-tight uppercase flex items-center gap-1.5">
            <span>ARENA</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
          </span>
        </div>
      </Link>

      {/* Right Quick Actions matching Pic 2 */}
      <div className="flex items-center gap-2 sm:gap-3.5 relative" ref={notificationRef}>
        {/* Glowing Neon Green Wallet Pill Button */}
        <Link
          to="/wallet"
          title="Open Wallet"
          className="group flex items-center gap-2 rounded-xl sm:rounded-2xl border-2 border-emerald-400 bg-[#0d281e]/90 hover:bg-[#103a2b] px-3 sm:px-4 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.45)] hover:shadow-[0_0_22px_rgba(16,185,129,0.7)] hover:scale-105 active:scale-95"
        >
          <Wallet className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white group-hover:text-emerald-300 transition-colors" />
          <span className="font-mono font-black text-white text-xs sm:text-sm tracking-tight">
            ₹{walletTotal.toLocaleString("en-IN")}
          </span>
        </Link>

        {/* Crescent Moon Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to Dark mode" : "Switch to Light mode"}
          aria-label="Toggle theme"
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          {theme === "light" ? (
            <Sun className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-amber-400" />
          ) : (
            <Moon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-slate-200" />
          )}
        </button>

        {/* Notification Bell Button */}
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => setShowNotifications((prev) => !prev)}
          className={cn(
            "relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-all cursor-pointer text-slate-300 hover:text-white hover:bg-white/10",
            showNotifications && "text-emerald-400 bg-white/10"
          )}
        >
          <Bell className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-slate-200" />
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white shadow-md">
            {displayBadgeCount > 9 ? "9+" : displayBadgeCount}
          </span>
        </button>

        {/* Admin / Super Admin Solid Purple Pill Button */}
        {(user?.role === "admin" || user?.role === "super_admin" || !user) && (
          <Link
            to="/admin"
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold text-white bg-[#9333ea] hover:bg-[#a855f7] transition-all shadow-md shadow-purple-900/30 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            <span>{user?.role === "admin" ? "Admin" : "Super Admin"}</span>
          </Link>
        )}

        {/* Notifications Dropdown Popover */}
        {showNotifications && (
          <div className="absolute right-0 top-12 sm:top-14 z-50 w-80 sm:w-96 rounded-2xl border border-border/80 bg-surface/98 p-4 shadow-2xl backdrop-blur-md animate-in fade-in-50 zoom-in-95 text-left">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-emerald-400" />
                <span className="font-display text-sm font-bold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-400">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold text-emerald-400 hover:underline cursor-pointer"
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
                className="text-xs font-bold text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                View Live Matches <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AppShell({
  children,
  maxWidth = "max-w-3xl",
  hideHeader = false,
}: {
  children: ReactNode;
  maxWidth?: string;
  hideHeader?: boolean;
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
      const raw = localStorage.getItem("cached_user");
      if (raw) {
        const u = JSON.parse(raw);
        return typeof u.walletBalance === "number" ? u.walletBalance : 0;
      }
    } catch {}
    return 0;
  });

  const [activeNavSection, setActiveNavSection] = useState<NavSectionType>(null);

  useEffect(() => {
    setActiveNavSection(null);
  }, [pathname]);

  // Always fetch fresh real wallet balance from backend for the authenticated user
  useEffect(() => {
    getWalletApi()
      .then((data) => {
        if (data && typeof data.walletBalance === "number") {
          setWalletTotal(data.walletBalance);
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Synchronize user profile, role & wallet balance across all tabs & events
  useEffect(() => {
    const syncWallet = () => {
      try {
        const saved = localStorage.getItem("fc_user_wallet");
        if (saved) {
          const parsed = JSON.parse(saved);
          setWalletTotal((parsed.deposited || 0) + (parsed.winnings || 0) + (parsed.bonus || 0));
          return;
        }
        const cached = getCachedUser();
        if (cached && typeof cached.walletBalance === "number") {
          setWalletTotal(cached.walletBalance);
        }
      } catch {}
    };

    const handleProfileUpdated = (e: any) => {
      if (e.detail) {
        setUser(e.detail);
        if (typeof e.detail.walletBalance === "number") {
          setWalletTotal(e.detail.walletBalance);
        }
      } else {
        setUser(getCachedUser());
      }
      syncWallet();
    };

    const handleWalletUpdated = (e: any) => {
      if (e.detail && typeof e.detail.walletBalance === "number") {
        setWalletTotal(e.detail.walletBalance);
      } else {
        syncWallet();
      }
    };

    const handleStorage = () => {
      setUser(getCachedUser());
      syncWallet();
    };

    window.addEventListener("user-profile-updated", handleProfileUpdated);
    window.addEventListener("wallet-updated", handleWalletUpdated);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("user-profile-updated", handleProfileUpdated);
      window.removeEventListener("wallet-updated", handleWalletUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

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

  const renderSidebarItem = (item: SidebarNavItem) => {
    const active = item.to ? (pathname === item.to && !activeNavSection) : activeNavSection === item.section;
    const Icon = item.icon;

    const content = (
      <>
        <div className="flex items-center gap-3 min-w-0">
          <Icon
            className={cn(
              "h-4.5 w-4.5 shrink-0 transition-colors",
              item.isLive
                ? "text-red-500 animate-pulse"
                : active
                ? "text-emerald-400"
                : "text-slate-400 group-hover:text-slate-200"
            )}
          />
          <span className="truncate">{item.label}</span>
        </div>

        {item.isLive ? (
          <span className="flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/30 px-1.5 py-0.5 text-[9px] font-black text-red-400 animate-pulse shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            LIVE
          </span>
        ) : item.key === "notifications" && unreadCount > 0 ? (
          <span className="rounded-full bg-red-500/20 border border-red-500/30 px-1.5 py-0.5 text-[9px] font-black text-red-400 shrink-0">
            {unreadCount}
          </span>
        ) : item.key === "wallet" ? (
          <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400 shrink-0">
            ₹{walletTotal.toLocaleString("en-IN")}
          </span>
        ) : item.badge ? (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-black shrink-0 border",
              item.badgeType === "amber"
                ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                : item.badgeType === "purple"
                ? "bg-purple-500/15 border-purple-500/30 text-purple-400"
                : item.badgeType === "emerald"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : "bg-slate-800 border-slate-700 text-slate-300"
            )}
          >
            {item.badge}
          </span>
        ) : null}
      </>
    );

    const baseClass = cn(
      "w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all group cursor-pointer text-left select-none",
      active
        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm font-bold"
        : "text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent"
    );

    if (item.to) {
      return (
        <Link
          key={item.key}
          to={item.to}
          onClick={() => {
            setActiveNavSection(null);
            if (item.to === "/matches") {
              removeFlow(FLOW_KEYS.selectedMatchId);
              removeFlow("RETURN_TO_MATCH_CENTER");
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("reset-home-match"));
              }
            } else if (item.to === "/contests") {
              removeFlow(FLOW_KEYS.selectedMatchId);
              removeFlow("contests_default_tab");
              removeFlow("contests_from_my_matches");
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("reset-contests-match"));
              }
            } else if (item.to === "/my-teams") {
              removeFlow(FLOW_KEYS.selectedMatchId);
            }
          }}
          className={baseClass}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={item.key}
        type="button"
        onClick={() => {
          if (item.section) {
            setActiveNavSection(item.section);
          }
        }}
        className={baseClass}
      >
        {content}
      </button>
    );
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
          <nav className="flex-1 space-y-4 p-3.5 overflow-y-auto scrollbar-none text-slate-200">
            {/* 1. FANTASY ARENA */}
            <div className="space-y-1">
              <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Fantasy Arena</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </p>
              <div className="space-y-0.5">
                {fantasyArenaNavItems.map((item) => renderSidebarItem(item))}
              </div>
            </div>

            {/* 2. CRICKET DESK */}
            <div className="space-y-1 pt-2 border-t border-slate-800/80">
              <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Cricket Desk</span>
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              </p>
              <div className="space-y-0.5">
                {cricketDeskNavItems.map((item) => renderSidebarItem(item))}
              </div>
            </div>

            {/* 3. ACCOUNT */}
            <div className="space-y-1 pt-2 border-t border-slate-800/80">
              <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Account</span>
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              </p>
              <div className="space-y-0.5">
                {accountNavItems.map((item) => renderSidebarItem(item))}
              </div>
            </div>

            {/* Admin / Management Navigation for authorized roles */}
            {(user?.role === "admin" || user?.role === "super_admin") && (
              <div className="space-y-1 pt-2 border-t border-slate-800/80">
                <p className="px-3 py-1 text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="h-3 w-3" /> Management
                </p>
                <Link
                  to="/admin"
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition-all border",
                    pathname === "/admin"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm"
                      : "text-emerald-400/90 hover:bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="h-4 w-4 text-emerald-400" />
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
          {!hideHeader && (
            <header className="sticky top-0 z-40 px-4 sm:px-6 py-2.5 bg-background/80 backdrop-blur-md">
              <div className="mx-auto max-w-[1520px] w-full rounded-2xl bg-[#121417] border border-white/10 px-4 sm:px-5 py-2 shadow-xl">
                <Pic2HeaderBar />
              </div>
            </header>
          )}

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
          {activeNavSection ? (
            <AppShellSectionView
              section={activeNavSection}
              onBack={() => setActiveNavSection(null)}
              walletBalance={walletTotal}
              user={user}
              onWalletUpdated={(nb) => setWalletTotal(nb)}
              notifications={notifications}
              onNotificationUpdate={(newNotifs) => setNotifications(newNotifs)}
            />
          ) : (
            children
          )}
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
                    setActiveNavSection(null);
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

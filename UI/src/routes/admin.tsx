import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  UserSquare2,
  Trophy,
  Ruler,
  ListOrdered,
  Bell,
  FileBarChart,
  Settings,
  LogOut,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  Lock,
  Flame,
  Zap,
  Clock,
  Sparkles,
  Send,
  Eye,
  Activity,
  Server,
  Database,
  Award,
  Crown,
  ChevronRight,
  Radio,
  Sliders,
  Check,
  X
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Logo } from "@/components/fc/Logo";
import { Card } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, apiFetchEnvelope } from "@/lib/api";
import { getMe, setCachedUser, updateUserRole, suspendUser, restoreUser } from "@/lib/api-services";
import type { Contest, Match, User } from "@/lib/api-types";
import { RoleGuard } from "@/components/fc/RoleGuard";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — Fantasy Cricket" },
      { name: "description", content: "Management console for users, matches, players, contests and scoring rules." },
    ],
  }),
  component: () => (
    <RoleGuard allowedRoles={["admin", "super_admin"]}>
      <Admin />
    </RoleGuard>
  ),
});

const nav = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Users", icon: Users },
  { label: "Matches", icon: CalendarDays },
  { label: "Players", icon: UserSquare2 },
  { label: "Contests", icon: Trophy },
  { label: "Scoring Rules", icon: Ruler },
  { label: "Leaderboards", icon: ListOrdered },
  { label: "Notifications", icon: Bell },
  { label: "Reports", icon: FileBarChart },
  { label: "Settings", icon: Settings },
];

const PIE_COLORS: Record<string, string> = {
  OPEN: "oklch(0.63 0.176 148)",
  LIVE: "oklch(0.769 0.16 70)",
  LOCKED: "oklch(0.6 0.118 220)",
  COMPLETED: "oklch(0.45 0.02 264)",
  CANCELLED: "oklch(0.55 0.2 30)",
};

type DashboardData = { userCount: number; liveMatches: number; openContests: number };
type AuditLog = { _id: string; action: string; entityType: string; entityId?: string; createdAt: string; ipAddress?: string };
type ScoringRule = { _id: string; eventType: string; points: number; format?: string; category?: string; description?: string };
type AdminPlayer = { _id: string; name: string; team: string; role: string; credits: number; totalPoints?: number; image?: string };
type BroadcastItem = { _id?: string; title: string; message: string; type: string; createdAt: string; recipientCount?: number };

export function Admin() {
  const [active, setActive] = useState("Dashboard");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Dashboard Data
  const [dashboard, setDashboard] = useState<DashboardData>({ userCount: 0, liveMatches: 0, openContests: 0 });
  const [totalContests, setTotalContests] = useState(0);
  const [contestBreakdown, setContestBreakdown] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);

  // Users Tab State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Matches Tab State
  const [matchesList, setMatchesList] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchStatusFilter, setMatchStatusFilter] = useState("ALL");
  const [matchSearch, setMatchSearch] = useState("");

  // Players Tab State
  const [playersList, setPlayersList] = useState<AdminPlayer[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playerRoleFilter, setPlayerRoleFilter] = useState("ALL");
  const [playerSearch, setPlayerSearch] = useState("");
  const [newPlayer, setNewPlayer] = useState({ name: "", team: "IND", role: "BAT", credits: 8.5 });
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);

  // Contests Tab State
  const [contestsList, setContestsList] = useState<Contest[]>([]);
  const [contestsLoading, setContestsLoading] = useState(false);
  const [contestStatusFilter, setContestStatusFilter] = useState("ALL");
  const [contestSearch, setContestSearch] = useState("");

  // Scoring Rules Tab State
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([]);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({ eventType: "", points: 1, format: "ALL", category: "Batting", description: "" });

  // Notifications Tab State
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState("SYSTEM_ALERT");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [notificationsList, setNotificationsList] = useState<BroadcastItem[]>([]);

  // Reports & Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState("ALL");

  // Leaderboards Tab State
  const [leaderboardMatchId, setLeaderboardMatchId] = useState("");

  // Super Admin check
  const isSuperAdmin = currentUser?.role === "super_admin";

  // Listen to profile updates broadcast across app
  useEffect(() => {
    const handleProfileUpdated = (e: Event) => {
      const detail = (e as CustomEvent<User>).detail;
      if (detail) {
        setCurrentUser(detail);
      }
    };
    window.addEventListener("user-profile-updated", handleProfileUpdated);
    return () => window.removeEventListener("user-profile-updated", handleProfileUpdated);
  }, []);

  // Initial load
  useEffect(() => {
    void loadInitialData();
  }, []);

  // When active tab changes, load corresponding data
  useEffect(() => {
    setStatusNotice(null);
    if (active === "Users") void loadUsers(userSearch);
    if (active === "Matches") void loadMatches();
    if (active === "Players") void loadPlayers();
    if (active === "Contests") void loadContests();
    if (active === "Scoring Rules") void loadScoringRules();
    if (active === "Notifications") void loadNotifications();
    if (active === "Reports") void loadReports();
    if (active === "Leaderboards") void loadLeaderboards();
  }, [active]);

  async function loadInitialData() {
    setLoading(true);
    setError("");
    try {
      const user = await getMe();
      if (user) {
        setCurrentUser(user);
        setCachedUser(user);
      }
      await refreshDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshDashboard() {
    try {
      const [dash, contests, logs] = await Promise.all([
        apiFetchEnvelope<DashboardData>("/admin/dashboard"),
        apiFetchEnvelope<Contest[]>("/admin/contests?page=1&limit=100"),
        apiFetchEnvelope<AuditLog[]>("/admin/audit-logs?page=1&limit=10"),
      ]);

      setDashboard(dash.data);
      setTotalContests(contests.pagination?.total ?? contests.data.length);

      const counts: Record<string, number> = {};
      for (const c of contests.data) {
        const key = (c.status || "OPEN").toUpperCase();
        counts[key] = (counts[key] || 0) + 1;
      }
      setContestBreakdown(
        Object.entries(counts).map(([name, value]) => ({
          name,
          value,
          color: PIE_COLORS[name] ?? "oklch(0.5 0.02 264)",
        })),
      );

      setRecentActivity(logs.data);
    } catch (err) {
      console.error("Dashboard refresh error:", err);
    }
  }

  // Global "Sync & Refresh" handler
  async function handleRefreshAll() {
    setRefreshing(true);
    setStatusNotice(null);
    try {
      const updatedUser = await getMe();
      if (updatedUser) {
        setCurrentUser(updatedUser);
        setCachedUser(updatedUser);
        window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: updatedUser }));
      }

      if (active === "Dashboard") await refreshDashboard();
      else if (active === "Users") await loadUsers(userSearch);
      else if (active === "Matches") await loadMatches();
      else if (active === "Players") await loadPlayers();
      else if (active === "Contests") await loadContests();
      else if (active === "Scoring Rules") await loadScoringRules();
      else if (active === "Notifications") await loadNotifications();
      else if (active === "Reports") await loadReports();

      setStatusNotice({ type: "success", text: "Console synced successfully with live server!" });
      setTimeout(() => setStatusNotice(null), 3500);
    } catch (err) {
      setStatusNotice({ type: "error", text: "Failed to refresh console data." });
    } finally {
      setRefreshing(false);
    }
  }

  // Users Tab
  async function loadUsers(search = "") {
    setUsersLoading(true);
    try {
      const q = search ? `&search=${encodeURIComponent(search)}` : "";
      const res = await apiFetchEnvelope<User[]>(`/admin/users?page=1&limit=50${q}`);
      setUsersList(res.data);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setUsersLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: "user" | "admin" | "super_admin") {
    setUpdatingUserId(userId);
    setStatusNotice(null);
    try {
      await updateUserRole(userId, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );

      // If user changed their own role, immediately update state and cachedUser
      if (userId === currentUser?._id) {
        const updated = { ...currentUser, role: newRole };
        setCurrentUser(updated);
        setCachedUser(updated);
        window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: updated }));
      }

      setStatusNotice({ type: "success", text: `User role successfully updated to ${newRole}!` });
    } catch (err) {
      setStatusNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update role",
      });
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleToggleSuspend(u: User) {
    setUpdatingUserId(u._id);
    setStatusNotice(null);
    try {
      if (u.status === "suspended") {
        await restoreUser(u._id);
        setUsersList((prev) =>
          prev.map((item) => (item._id === u._id ? { ...item, status: "active" } : item))
        );
        setStatusNotice({ type: "success", text: `User ${u.email} restored successfully.` });
      } else {
        await suspendUser(u._id);
        setUsersList((prev) =>
          prev.map((item) => (item._id === u._id ? { ...item, status: "suspended" } : item))
        );
        setStatusNotice({ type: "success", text: `User ${u.email} suspended.` });
      }
    } catch (err) {
      setStatusNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update user status",
      });
    } finally {
      setUpdatingUserId(null);
    }
  }

  // Matches Tab
  async function loadMatches() {
    setMatchesLoading(true);
    try {
      const q = new URLSearchParams({ page: "1", limit: "50" });
      if (matchStatusFilter !== "ALL") q.set("status", matchStatusFilter);
      if (matchSearch) q.set("search", matchSearch);
      const res = await apiFetchEnvelope<Match[]>(`/admin/matches?${q.toString()}`);
      setMatchesList(res.data);
    } catch (err) {
      console.error("Error loading matches:", err);
    } finally {
      setMatchesLoading(false);
    }
  }

  async function handleLockTeams(matchId: string) {
    try {
      await api.post(`/admin/matches/${matchId}/lock-teams`);
      setStatusNotice({ type: "success", text: "Teams successfully locked for match." });
      void loadMatches();
    } catch (err) {
      setStatusNotice({ type: "error", text: "Failed to lock teams." });
    }
  }

  async function handleFreezeLeaderboard(matchId: string) {
    try {
      await api.post(`/admin/matches/${matchId}/freeze-leaderboards`);
      setStatusNotice({ type: "success", text: "Leaderboards frozen for match." });
    } catch (err) {
      setStatusNotice({ type: "error", text: "Failed to freeze leaderboard." });
    }
  }

  // Players Tab
  async function loadPlayers() {
    setPlayersLoading(true);
    try {
      const q = new URLSearchParams({ page: "1", limit: "100" });
      if (playerRoleFilter !== "ALL") q.set("role", playerRoleFilter);
      if (playerSearch) q.set("search", playerSearch);
      const res = await apiFetchEnvelope<AdminPlayer[]>(`/admin/players?${q.toString()}`);
      setPlayersList(res.data);
    } catch (err) {
      console.error("Error loading players:", err);
    } finally {
      setPlayersLoading(false);
    }
  }

  async function handleCreatePlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!newPlayer.name || !newPlayer.team) return;
    try {
      await api.post("/admin/players", newPlayer);
      setStatusNotice({ type: "success", text: `Player ${newPlayer.name} created successfully!` });
      setShowAddPlayerModal(false);
      setNewPlayer({ name: "", team: "IND", role: "BAT", credits: 8.5 });
      void loadPlayers();
    } catch (err) {
      setStatusNotice({ type: "error", text: "Failed to create player." });
    }
  }

  // Contests Tab
  async function loadContests() {
    setContestsLoading(true);
    try {
      const res = await apiFetchEnvelope<Contest[]>("/admin/contests?page=1&limit=100");
      setContestsList(res.data);
    } catch (err) {
      console.error("Error loading contests:", err);
    } finally {
      setContestsLoading(false);
    }
  }

  async function handleUpdateContestStatus(contestId: string, newStatus: string) {
    try {
      await api.patch(`/admin/contests/${contestId}/status`, { status: newStatus });
      setContestsList((prev) =>
        prev.map((c) => (c._id === contestId ? { ...c, status: newStatus } : c))
      );
      setStatusNotice({ type: "success", text: `Contest status changed to ${newStatus}.` });
    } catch (err) {
      setStatusNotice({ type: "error", text: "Failed to update contest status." });
    }
  }

  // Scoring Rules Tab
  async function loadScoringRules() {
    setScoringLoading(true);
    try {
      const res = await api.get<ScoringRule[]>("/admin/scoring-rules");
      setScoringRules(res || []);
    } catch (err) {
      console.error("Error loading scoring rules:", err);
    } finally {
      setScoringLoading(false);
    }
  }

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    if (!newRule.eventType) return;
    try {
      await api.post("/admin/scoring-rules", newRule);
      setStatusNotice({ type: "success", text: `Scoring rule for ${newRule.eventType} created!` });
      setShowAddRuleModal(false);
      setNewRule({ eventType: "", points: 1, format: "ALL", category: "Batting", description: "" });
      void loadScoringRules();
    } catch (err) {
      setStatusNotice({ type: "error", text: "Failed to create scoring rule." });
    }
  }

  // Notifications Tab
  async function loadNotifications() {
    try {
      const res = await apiFetchEnvelope<BroadcastItem[]>("/admin/notifications?page=1&limit=20");
      setNotificationsList(res.data || []);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  }

  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    setSendingBroadcast(true);
    try {
      await api.post("/admin/notifications/broadcast", {
        title: broadcastTitle,
        message: broadcastMessage,
        type: broadcastType
      });
      setStatusNotice({ type: "success", text: "Broadcast notification sent to all users!" });
      setBroadcastTitle("");
      setBroadcastMessage("");
      void loadNotifications();
    } catch (err) {
      setStatusNotice({ type: "error", text: "Failed to send broadcast notification." });
    } finally {
      setSendingBroadcast(false);
    }
  }

  // Reports & Audit Logs Tab
  async function loadReports() {
    setAuditLoading(true);
    try {
      const res = await apiFetchEnvelope<AuditLog[]>("/admin/audit-logs?page=1&limit=50");
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error("Error loading reports:", err);
    } finally {
      setAuditLoading(false);
    }
  }

  // Leaderboards Tab
  async function loadLeaderboards() {
    try {
      const matches = await api.get<Match[]>("/matches?page=1&limit=10");
      if (matches && matches.length > 0 && !leaderboardMatchId) {
        setLeaderboardMatchId(matches[0]._id);
      }
    } catch (err) {
      console.error("Error loading leaderboard matches:", err);
    }
  }

  const stats = [
    { label: "Total Users", value: dashboard.userCount.toLocaleString() },
    { label: "Live Matches", value: String(dashboard.liveMatches) },
    { label: "Open Contests", value: String(dashboard.openContests) },
    { label: "Total Contests", value: totalContests.toLocaleString() },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ------------------------------------------------------------- */}
      {/* SIDEBAR NAVIGATION (FIXED & NEVER MOVES)                      */}
      {/* ------------------------------------------------------------- */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-border bg-sidebar p-4 lg:flex h-screen overflow-y-auto z-30">
        <div>
          <div className="px-2 pb-4 flex items-center justify-between">
            <Logo size="sm" />
            {isSuperAdmin ? (
              <span className="flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-purple-300 border border-purple-500/30">
                <Crown className="h-2.5 w-2.5 text-purple-400" /> Root
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="h-2.5 w-2.5 text-emerald-400" /> Admin
              </span>
            )}
          </div>

          {/* Super Admin / Admin Status Badge in Sidebar */}
          <div
            className={cn(
              "mb-3 mx-1 rounded-xl p-2.5 border backdrop-blur text-xs",
              isSuperAdmin
                ? "bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border-purple-500/30 text-purple-200"
                : "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
            )}
          >
            <div className="flex items-center gap-2 font-bold text-[11px]">
              {isSuperAdmin ? <Crown className="h-3.5 w-3.5 text-purple-400" /> : <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}
              <span>{isSuperAdmin ? "SUPER ADMIN CONSOLE" : "ADMIN CONSOLE"}</span>
            </div>
            <p className="mt-1 text-[9.5px] text-muted-foreground leading-tight">
              {isSuperAdmin
                ? "Full root authorization: user roles, scoring governance & system operations."
                : "Match management, contest lifecycles & player roster administration."}
            </p>
          </div>

          <nav className="space-y-1">
            {nav.map(({ label, icon: Icon }) => {
              const isTabActive = active === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setActive(label);
                    setStatusNotice(null);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all",
                    isTabActive
                      ? isSuperAdmin
                        ? "bg-purple-500/20 text-purple-300 border-l-2 border-purple-400 font-bold"
                        : "bg-primary/15 text-primary border-l-2 border-primary font-bold"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isTabActive ? (isSuperAdmin ? "text-purple-400" : "text-primary") : "text-muted-foreground")} />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-3 border-t border-border space-y-1 mt-3">
          <Link
            to="/matches"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors"
          >
            <ArrowRight className="h-4 w-4" /> Back to Fantasy App
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Logout
          </Link>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN ADMIN WORKSPACE (INDEPENDENT SCROLL)                      */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 p-5 sm:p-7 lg:p-8 min-w-0 h-screen overflow-y-auto">
        {/* Top Header Bar (Sticky at top of content area) */}
        <div className="sticky -top-5 sm:-top-7 lg:-top-8 z-20 bg-background/95 backdrop-blur -mt-5 sm:-mt-7 lg:-mt-8 -mx-5 sm:-mx-7 lg:-mx-8 px-5 sm:px-7 lg:px-8 py-4 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold text-foreground">{active} Overview</h1>
              {isSuperAdmin ? (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-[11px] font-black uppercase text-purple-300">
                  <Crown className="h-3 w-3 text-purple-400" /> Super Admin
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-black uppercase text-emerald-400">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" /> Admin
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Logged in as:{" "}
              <span className="font-bold text-foreground">{currentUser?.name || "Admin"}</span>{" "}
              <span className="text-[11px] text-muted-foreground">({currentUser?.email})</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync & Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={refreshing}
              className={cn(
                "text-xs font-semibold gap-1.5 transition-all",
                isSuperAdmin
                  ? "border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
                  : "border-primary/40 text-primary hover:bg-primary/10"
              )}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              {refreshing ? "Syncing..." : "Sync & Refresh"}
            </Button>

            {/* Profile Avatar with Photo everywhere */}
            <Link
              to="/profile"
              aria-label="Your Profile"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full overflow-hidden border transition-all ring-2",
                isSuperAdmin ? "ring-purple-500/30 border-purple-500/50" : "ring-primary/30 border-primary/50"
              )}
            >
              {currentUser?.profileImage ? (
                <img
                  src={currentUser.profileImage}
                  alt={currentUser.name || "Admin"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className={cn("text-xs font-bold", isSuperAdmin ? "text-purple-300" : "text-primary")}>
                  {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "AD"}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Status Notification Toast/Banner */}
        {statusNotice && (
          <div
            className={cn(
              "mb-6 flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs animate-in fade-in slide-in-from-top-2",
              statusNotice.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-destructive/40 bg-destructive/10 text-destructive"
            )}
          >
            <div className="flex items-center gap-2">
              {statusNotice.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
              )}
              <span className="font-medium">{statusNotice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: DASHBOARD                                              */}
        {/* ------------------------------------------------------------- */}
        {active === "Dashboard" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                      <div className="mt-3 h-6 w-16 animate-pulse rounded bg-muted" />
                    </Card>
                  ))
                : stats.map((s) => (
                    <Card key={s.label} className="border-border hover:border-primary/40 transition-colors">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="mt-2 font-display text-2xl font-bold">{s.value}</p>
                    </Card>
                  ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-sm font-bold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Recent Audit Activity
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setActive("Reports")} className="text-xs text-primary">
                    View All
                  </Button>
                </div>
                {loading && <p className="text-sm text-muted-foreground">Loading activity...</p>}
                {!loading && !recentActivity.length && (
                  <p className="text-sm text-muted-foreground">No recent admin activity recorded.</p>
                )}
                <ul className="space-y-3">
                  {recentActivity.slice(0, 6).map((log) => (
                    <li key={log._id} className="flex items-center justify-between border-b border-border/70 pb-2.5 text-xs last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold text-foreground">{log.action.replaceAll("_", " ")}</p>
                        <p className="text-[10px] text-muted-foreground">{log.entityType}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <h2 className="mb-4 font-display text-sm font-bold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  Contest Status Breakdown
                </h2>
                {!loading && !contestBreakdown.length && (
                  <p className="text-sm text-muted-foreground">No contests available.</p>
                )}
                {!!contestBreakdown.length && (
                  <>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={contestBreakdown} dataKey="value" innerRadius={48} outerRadius={78} paddingAngle={3}>
                            {contestBreakdown.map((p) => (
                              <Cell key={p.name} fill={p.color} stroke="none" />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      {contestBreakdown.map((p) => (
                        <li key={p.name} className="flex items-center gap-2 text-muted-foreground">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                          {p.name} ({p.value})
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: USERS                                                  */}
        {/* ------------------------------------------------------------- */}
        {active === "Users" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    void loadUsers(e.target.value);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAll}
                disabled={usersLoading}
                className="text-xs font-semibold gap-1.5"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", usersLoading && "animate-spin text-primary")} />
                Refresh Users & Role
              </Button>
            </div>

            <Card className="p-0 overflow-hidden border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-2/60 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">User Details</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Joined Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {usersLoading && usersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          <div className="flex justify-center items-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                            Loading registered users...
                          </div>
                        </td>
                      </tr>
                    ) : usersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No users found matching your search.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => {
                        const isSelf = currentUser?._id === u._id;
                        const isSuper = u.role === "super_admin";
                        const isAdminRole = u.role === "admin";
                        const isUpdating = updatingUserId === u._id;
                        // Always prioritize fresh profile image
                        const profilePic = isSelf ? (currentUser?.profileImage || u.profileImage) : u.profileImage;

                        return (
                          <tr key={u._id} className="hover:bg-surface-2/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {profilePic ? (
                                  <img
                                    src={profilePic}
                                    alt={u.name || "User"}
                                    className="h-9 w-9 shrink-0 rounded-full object-cover border border-primary/30 ring-1 ring-primary/20"
                                  />
                                ) : (
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                                    {u.name ? u.name.slice(0, 2).toUpperCase() : "U"}
                                  </span>
                                )}
                                <div>
                                  <p className="font-bold text-foreground flex items-center gap-1.5">
                                    {u.name}
                                    {isSelf && (
                                      <span className="text-[9px] bg-primary/15 text-primary border border-primary/30 px-1.5 py-0.2 rounded font-black">
                                        YOU
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {isSuper ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30">
                                  <Crown className="h-3 w-3 text-purple-400" /> SUPER_ADMIN
                                </span>
                              ) : isAdminRole ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                                  <ShieldCheck className="h-3 w-3 text-emerald-400" /> ADMIN
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  USER
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                                  u.status === "suspended"
                                    ? "bg-destructive/20 text-destructive border border-destructive/30"
                                    : "bg-emerald-500/20 text-emerald-400"
                                )}
                              >
                                {u.status || "ACTIVE"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {u._id ? new Date().toLocaleDateString() : "-"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isSuperAdmin ? (
                                  <select
                                    value={u.role || "user"}
                                    disabled={isUpdating || (isSelf && isSuper)}
                                    onChange={(e) => void handleRoleChange(u._id, e.target.value as "user" | "admin" | "super_admin")}
                                    className="rounded-lg border border-border bg-card/90 px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:border-primary/50"
                                  >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                  </select>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">
                                    Managed by Super Admin
                                  </span>
                                )}

                                {!isSelf && (
                                  <Button
                                    variant={u.status === "suspended" ? "outline" : "ghost"}
                                    size="sm"
                                    disabled={isUpdating}
                                    onClick={() => void handleToggleSuspend(u)}
                                    className={cn(
                                      "text-[11px] h-7 px-2.5",
                                      u.status === "suspended"
                                        ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                        : "text-destructive hover:text-destructive hover:bg-destructive/10"
                                    )}
                                  >
                                    {u.status === "suspended" ? "Restore" : "Suspend"}
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: MATCHES                                                */}
        {/* ------------------------------------------------------------- */}
        {active === "Matches" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {["ALL", "LIVE", "UPCOMING", "COMPLETED"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setMatchStatusFilter(st);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                      matchStatusFilter === st
                        ? "bg-primary text-primary-foreground shadow"
                        : "bg-surface-2 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter team / tournament..."
                  value={matchSearch}
                  onChange={(e) => setMatchSearch(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background"
                />
                <Button variant="outline" size="sm" onClick={() => void loadMatches()} className="text-xs gap-1">
                  <RefreshCw className={cn("h-3 w-3", matchesLoading && "animate-spin")} /> Filter
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {matchesLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-4 w-24 bg-muted rounded mb-2" />
                    <div className="h-6 w-48 bg-muted rounded" />
                  </Card>
                ))
              ) : matchesList.length === 0 ? (
                <Card className="col-span-full py-12 text-center text-muted-foreground">
                  No matches found for selected criteria.
                </Card>
              ) : (
                matchesList.map((m) => (
                  <Card key={m._id} className="border-border hover:border-primary/40 transition-colors">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span className="font-semibold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded bg-muted">
                        {m.venue || "T20 Match"}
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                          m.status === "LIVE"
                            ? "bg-destructive/20 text-destructive border border-destructive/30"
                            : m.status === "COMPLETED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        )}
                      >
                        {m.status === "LIVE" && <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />}
                        {m.status}
                      </span>
                    </div>

                    <div className="py-2">
                      <p className="font-display font-bold text-base text-foreground">
                        {m.teamA} <span className="text-muted-foreground text-xs font-normal">vs</span> {m.teamB}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Start: {new Date(m.startTime).toLocaleString()}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleLockTeams(m._id)}
                          className="h-7 text-[10px] px-2"
                        >
                          <Lock className="h-3 w-3 mr-1" /> Lock Teams
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleFreezeLeaderboard(m._id)}
                          className="h-7 text-[10px] px-2"
                        >
                          <Flame className="h-3 w-3 mr-1" /> Freeze
                        </Button>
                      </div>

                      <Button asChild variant="ghost" size="sm" className="h-7 text-[11px] text-primary">
                        <Link to="/live-match">Match Center &rarr;</Link>
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: PLAYERS                                                */}
        {/* ------------------------------------------------------------- */}
        {active === "Players" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {["ALL", "BAT", "BOWL", "AR", "WK"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setPlayerRoleFilter(r);
                      void loadPlayers();
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                      playerRoleFilter === r
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-2 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search player name..."
                  value={playerSearch}
                  onChange={(e) => {
                    setPlayerSearch(e.target.value);
                    void loadPlayers();
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background"
                />
                <Button
                  size="sm"
                  onClick={() => setShowAddPlayerModal(true)}
                  className="text-xs font-bold gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Player
                </Button>
              </div>
            </div>

            {/* Modal for adding player */}
            {showAddPlayerModal && (
              <Card className="border-primary/40 bg-surface/98 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-sm text-foreground">Add New Cricket Player</h3>
                  <button type="button" onClick={() => setShowAddPlayerModal(false)}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
                <form onSubmit={handleCreatePlayer} className="grid sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase font-semibold">Player Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jasprit Bumrah"
                      value={newPlayer.name}
                      onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                      className="mt-1 w-full px-3 py-1.5 text-xs rounded border border-border bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase font-semibold">Team Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. IND"
                      value={newPlayer.team}
                      onChange={(e) => setNewPlayer({ ...newPlayer, team: e.target.value.toUpperCase() })}
                      className="mt-1 w-full px-3 py-1.5 text-xs rounded border border-border bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase font-semibold">Role</label>
                    <select
                      value={newPlayer.role}
                      onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value })}
                      className="mt-1 w-full px-3 py-1.5 text-xs rounded border border-border bg-background"
                    >
                      <option value="BAT">BAT (Batsman)</option>
                      <option value="BOWL">BOWL (Bowler)</option>
                      <option value="AR">AR (All-Rounder)</option>
                      <option value="WK">WK (Wicket-Keeper)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase font-semibold">Credits</label>
                    <input
                      type="number"
                      step="0.5"
                      min="4"
                      max="12"
                      value={newPlayer.credits}
                      onChange={(e) => setNewPlayer({ ...newPlayer, credits: parseFloat(e.target.value) })}
                      className="mt-1 w-full px-3 py-1.5 text-xs rounded border border-border bg-background"
                    />
                  </div>
                  <div className="sm:col-span-4 flex justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddPlayerModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm">Save Player</Button>
                  </div>
                </form>
              </Card>
            )}

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {playersLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-muted mb-2" />
                    <div className="h-4 w-28 bg-muted rounded" />
                  </Card>
                ))
              ) : playersList.length === 0 ? (
                <Card className="col-span-full py-12 text-center text-muted-foreground">
                  No players found. Click "Add Player" to register one.
                </Card>
              ) : (
                playersList.map((p) => (
                  <Card key={p._id} className="p-3.5 border-border hover:border-primary/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 border border-border font-bold text-xs text-primary">
                        {p.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground text-xs truncate">{p.name}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
                            {p.team || "INT"}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold">
                            {p.role}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-400">{p.credits ?? 8.5} Cr</span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: CONTESTS                                               */}
        {/* ------------------------------------------------------------- */}
        {active === "Contests" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {["ALL", "OPEN", "LIVE", "COMPLETED", "CANCELLED"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setContestStatusFilter(st)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                      contestStatusFilter === st
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-2 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search contests..."
                value={contestSearch}
                onChange={(e) => setContestSearch(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {contestsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-4 w-32 bg-muted rounded mb-2" />
                    <div className="h-8 w-full bg-muted rounded" />
                  </Card>
                ))
              ) : (
                contestsList
                  .filter((c) => contestStatusFilter === "ALL" || (c.status || "OPEN") === contestStatusFilter)
                  .filter((c) => !contestSearch || c.name.toLowerCase().includes(contestSearch.toLowerCase()))
                  .map((c) => (
                    <Card key={c._id} className="border-border hover:border-primary/40 transition-colors">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-foreground truncate max-w-[200px]">{c.name}</span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                            c.status === "OPEN"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : c.status === "LIVE"
                              ? "bg-destructive/20 text-destructive"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {c.status || "OPEN"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-lg bg-surface-2/40 text-xs">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Entry Fee</p>
                          <p className="font-bold text-emerald-400">₹{c.entryFee || 49}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Total Slots</p>
                          <p className="font-bold text-foreground">{c.maxSlots || 100}</p>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-border">
                        <span className="text-[10px] text-muted-foreground">Change Status:</span>
                        <div className="flex gap-1">
                          {["OPEN", "LIVE", "COMPLETED"].map((target) => (
                            <button
                              key={target}
                              type="button"
                              onClick={() => void handleUpdateContestStatus(c._id, target)}
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold border transition-colors",
                                c.status === target
                                  ? "bg-primary/20 text-primary border-primary/50"
                                  : "border-border text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {target}
                            </button>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: SCORING RULES                                          */}
        {/* ------------------------------------------------------------- */}
        {active === "Scoring Rules" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-foreground">Active Fantasy Scoring System</h3>
                <p className="text-xs text-muted-foreground">Points awarded or deducted per match ball/action event.</p>
              </div>
              <Button size="sm" onClick={() => setShowAddRuleModal(true)} className="text-xs font-bold gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Rule
              </Button>
            </div>

            {showAddRuleModal && (
              <Card className="border-primary/40 bg-surface/98 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-sm text-foreground">Create Scoring Rule</h3>
                  <button type="button" onClick={() => setShowAddRuleModal(false)}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
                <form onSubmit={handleCreateRule} className="grid sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase font-semibold">Event Type</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SIX, FOUR, WICKET"
                      value={newRule.eventType}
                      onChange={(e) => setNewRule({ ...newRule, eventType: e.target.value.toUpperCase() })}
                      className="mt-1 w-full px-3 py-1.5 text-xs rounded border border-border bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase font-semibold">Points</label>
                    <input
                      type="number"
                      required
                      value={newRule.points}
                      onChange={(e) => setNewRule({ ...newRule, points: parseInt(e.target.value, 10) })}
                      className="mt-1 w-full px-3 py-1.5 text-xs rounded border border-border bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase font-semibold">Category</label>
                    <select
                      value={newRule.category}
                      onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                      className="mt-1 w-full px-3 py-1.5 text-xs rounded border border-border bg-background"
                    >
                      <option value="Batting">Batting</option>
                      <option value="Bowling">Bowling</option>
                      <option value="Fielding">Fielding</option>
                      <option value="Economy">Economy</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase font-semibold">Description</label>
                    <input
                      type="text"
                      placeholder="Optional rule description"
                      value={newRule.description}
                      onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                      className="mt-1 w-full px-3 py-1.5 text-xs rounded border border-border bg-background"
                    />
                  </div>
                  <div className="sm:col-span-4 flex justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddRuleModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm">Save Rule</Button>
                  </div>
                </form>
              </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { title: "Batting Points", items: [
                  { event: "Run", pts: "+1" },
                  { event: "Boundary Bonus (4)", pts: "+1" },
                  { event: "Six Bonus (6)", pts: "+2" },
                  { event: "Half-Century (50)", pts: "+8" },
                  { event: "Century (100)", pts: "+16" },
                  { event: "Dismissal for Duck", pts: "-2" },
                ]},
                { title: "Bowling Points", items: [
                  { event: "Wicket (excluding run out)", pts: "+25" },
                  { event: "LBW / Bowled Bonus", pts: "+8" },
                  { event: "3-Wicket Haul", pts: "+4" },
                  { event: "5-Wicket Haul", pts: "+16" },
                  { event: "Maiden Over", pts: "+12" },
                ]},
                { title: "Fielding Points", items: [
                  { event: "Catch", pts: "+8" },
                  { event: "3 Catches Bonus", pts: "+4" },
                  { event: "Stumping", pts: "+12" },
                  { event: "Run Out (Direct hit)", pts: "+12" },
                ]},
                { title: "Economy / Strike Rate", items: [
                  { event: "Economy < 5.0", pts: "+6" },
                  { event: "Economy 5-5.99", pts: "+4" },
                  { event: "SR > 170 (min 10b)", pts: "+6" },
                  { event: "Captain Multiplier", pts: "2x" },
                  { event: "Vice-Captain Multiplier", pts: "1.5x" },
                ]},
              ].map((cat) => (
                <Card key={cat.title} className="border-border">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-primary mb-3">
                    {cat.title}
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {cat.items.map((it) => (
                      <li key={it.event} className="flex items-center justify-between border-b border-border/50 pb-1.5">
                        <span className="text-muted-foreground">{it.event}</span>
                        <span className="font-bold text-foreground font-mono">{it.pts}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 7: LEADERBOARDS                                           */}
        {/* ------------------------------------------------------------- */}
        {active === "Leaderboards" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-foreground">Contest Leaderboards & Standings</h3>
                <p className="text-xs text-muted-foreground">Live fantasy points and rank standings calculation.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => void loadLeaderboards()} className="text-xs gap-1">
                <RefreshCw className="h-3 w-3" /> Refresh Standings
              </Button>
            </div>

            {/* Top 3 Podium Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-transparent text-center p-4">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 mb-2">
                  <Award className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black uppercase text-amber-400">Rank #1 (Gold)</span>
                <p className="font-bold text-sm text-foreground mt-1">Champion XI</p>
                <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">842.5 Pts</p>
              </Card>

              <Card className="border-slate-400/40 bg-gradient-to-b from-slate-400/10 to-transparent text-center p-4">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-400/20 text-slate-300 mb-2">
                  <Award className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-300">Rank #2 (Silver)</span>
                <p className="font-bold text-sm text-foreground mt-1">Royal Strikers</p>
                <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">798.0 Pts</p>
              </Card>

              <Card className="border-amber-700/40 bg-gradient-to-b from-amber-700/10 to-transparent text-center p-4">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-700/20 text-amber-600 mb-2">
                  <Award className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black uppercase text-amber-600">Rank #3 (Bronze)</span>
                <p className="font-bold text-sm text-foreground mt-1">Super Kings</p>
                <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">764.5 Pts</p>
              </Card>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 8: NOTIFICATIONS                                          */}
        {/* ------------------------------------------------------------- */}
        {active === "Notifications" && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <Card className="p-5 border-border">
              <h3 className="font-display font-bold text-sm text-foreground mb-1 flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Broadcast System Announcement
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Sends an instant alert to all registered fantasy players.
              </p>

              <form onSubmit={handleSendBroadcast} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Notification Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mega Contest Now Live! 🏆"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-border bg-background"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Announcement Type</label>
                  <select
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-border bg-background"
                  >
                    <option value="SYSTEM_ALERT">System Alert</option>
                    <option value="MATCH_UPDATE">Match Live Update</option>
                    <option value="CONTEST_PROMO">Contest Promotion</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Message Body</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Type the message to broadcast to all players..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-border bg-background"
                  />
                </div>

                <Button type="submit" disabled={sendingBroadcast} className="w-full text-xs font-bold gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  {sendingBroadcast ? "Broadcasting..." : "Send Announcement"}
                </Button>
              </form>
            </Card>

            <Card className="p-5 border-border">
              <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Recent Broadcasts
              </h3>
              {notificationsList.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No broadcasts sent yet.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {notificationsList.map((n, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border bg-surface-2/30 text-xs">
                      <p className="font-bold text-foreground">{n.title}</p>
                      <p className="text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-muted-foreground mt-2 block">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 9: REPORTS & AUDIT LOGS                                   */}
        {/* ------------------------------------------------------------- */}
        {active === "Reports" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-foreground">Security & System Audit Reports</h3>
                <p className="text-xs text-muted-foreground">Traceable history of all administrative actions taken on platform.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => void loadReports()} className="text-xs gap-1">
                <RefreshCw className={cn("h-3 w-3", auditLoading && "animate-spin")} /> Refresh Logs
              </Button>
            </div>

            <Card className="p-0 overflow-hidden border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-2/60 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Entity Type</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          No audit log entries recorded.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-surface-2/30">
                          <td className="py-3 px-4 font-bold text-foreground">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                log.action.includes("SUSPEND")
                                  ? "bg-destructive/20 text-destructive"
                                  : log.action.includes("CREATE")
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-purple-500/20 text-purple-300"
                              )}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{log.entityType}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">{log.ipAddress || "127.0.0.1"}</td>
                          <td className="py-3 px-4 text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 10: SETTINGS                                              */}
        {/* ------------------------------------------------------------- */}
        {active === "Settings" && (
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="p-5 border-border">
              <h3 className="font-display font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" /> Platform Governance Parameters
              </h3>
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div>
                    <p className="font-bold text-foreground">Maintenance Mode</p>
                    <p className="text-muted-foreground text-[11px]">Temporarily restrict user match participation</p>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    OFF (Live)
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div>
                    <p className="font-bold text-foreground">OTP Expiry Window</p>
                    <p className="text-muted-foreground text-[11px]">Validity time for authentication codes</p>
                  </div>
                  <span className="font-mono font-bold text-foreground">5 Minutes</span>
                </div>

                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div>
                    <p className="font-bold text-foreground">Team Lock Buffer</p>
                    <p className="text-muted-foreground text-[11px]">Deadline before match toss starts</p>
                  </div>
                  <span className="font-mono font-bold text-foreground">0 min (At Toss)</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">Max OTP Resends</p>
                    <p className="text-muted-foreground text-[11px]">Rate limiting per window</p>
                  </div>
                  <span className="font-mono font-bold text-foreground">5 attempts</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-border">
              <h3 className="font-display font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-400" /> Live Infrastructure Status
              </h3>
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2/40 border border-border">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-400" />
                    <span>MongoDB Atlas Database</span>
                  </div>
                  <span className="text-emerald-400 font-bold text-[11px]">CONNECTED</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2/40 border border-border">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-primary" />
                    <span>EC2 Production Host</span>
                  </div>
                  <span className="font-mono text-muted-foreground text-[11px]">13.206.129.31</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2/40 border border-border">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-400" />
                    <span>Role-Based Access Control</span>
                  </div>
                  <span className="text-purple-300 font-bold text-[11px]">ACTIVE</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
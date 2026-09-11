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
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Logo } from "@/components/fc/Logo";
import { Card } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiFetchEnvelope } from "@/lib/api";
import { getMe, updateUserRole, suspendUser, restoreUser } from "@/lib/api-services";
import type { Contest, User } from "@/lib/api-types";
import { RoleGuard } from "@/components/fc/RoleGuard";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Fantasy Cricket" },
      { name: "description", content: "Monitor users, matches, contests and entries across the fantasy cricket platform." },
      { property: "og:title", content: "Fantasy Cricket Admin Dashboard" },
      { property: "og:description", content: "Platform overview: users, matches, contests and entries." },
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
type AuditLog = { _id: string; action: string; entityType: string; entityId?: string; createdAt: string };

function Admin() {
  const [active, setActive] = useState("Dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

  useEffect(() => {
    setLoading(true);
    setError("");

    getMe()
      .then((user) => {
        setCurrentUser(user);
        return Promise.all([
          apiFetchEnvelope<DashboardData>("/admin/dashboard"),
          apiFetchEnvelope<Contest[]>("/admin/contests?page=1&limit=100"),
          apiFetchEnvelope<AuditLog[]>("/admin/audit-logs?page=1&limit=6"),
        ]).then(([dash, contests, logs]) => {
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
        });
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Unable to load dashboard data.");
      })
      .finally(() => setLoading(false));
  }, []);

  const loadUsers = (search = "") => {
    setUsersLoading(true);
    const q = search ? `&search=${encodeURIComponent(search)}` : "";
    apiFetchEnvelope<User[]>(`/admin/users?page=1&limit=50${q}`)
      .then((res) => {
        setUsersList(res.data);
      })
      .catch((err) => {
        setStatusNotice({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to load users",
        });
      })
      .finally(() => setUsersLoading(false));
  };

  useEffect(() => {
    if (active === "Users") {
      loadUsers(userSearch);
    }
  }, [active]);

  const handleRoleChange = async (userId: string, newRole: "user" | "admin" | "super_admin") => {
    setUpdatingUserId(userId);
    setStatusNotice(null);
    try {
      await updateUserRole(userId, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      setStatusNotice({ type: "success", text: `User role successfully updated to ${newRole}!` });
    } catch (err) {
      setStatusNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update role",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleSuspend = async (user: User) => {
    setUpdatingUserId(user._id);
    setStatusNotice(null);
    try {
      if (user.status === "suspended") {
        await restoreUser(user._id);
        setUsersList((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, status: "active" } : u))
        );
        setStatusNotice({ type: "success", text: `User ${user.email} restored successfully.` });
      } else {
        await suspendUser(user._id);
        setUsersList((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, status: "suspended" } : u))
        );
        setStatusNotice({ type: "success", text: `User ${user.email} suspended.` });
      }
    } catch (err) {
      setStatusNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update user status",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const stats = [
    { label: "Total Users", value: dashboard.userCount.toLocaleString() },
    { label: "Live Matches", value: String(dashboard.liveMatches) },
    { label: "Open Contests", value: String(dashboard.openContests) },
    { label: "Total Contests", value: totalContests.toLocaleString() },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar p-4 lg:flex">
        <div className="px-2 pb-6">
          <Logo size="sm" />
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setActive(label);
                setStatusNotice(null);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                active === label
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-border space-y-2">
          <Link
            to="/matches"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors"
          >
            <ArrowRight className="h-4 w-4" /> Back to App
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Logout
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8 min-w-0">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{active} Overview</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Logged in as: <span className="font-semibold text-foreground">{currentUser?.name}</span>{" "}
              <span className={cn(
                "ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                currentUser?.role === "super_admin" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              )}>
                {currentUser?.role === "super_admin" ? "Super Admin" : "Admin"}
              </span>
            </p>
          </div>
          <Link
            to="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground overflow-hidden border border-primary/40 shadow-sm"
          >
            {currentUser?.profileImage ? (
              <img src={currentUser.profileImage} alt={currentUser.name} className="h-full w-full object-cover" />
            ) : (
              currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "AD"
            )}
          </Link>
        </div>

        {error && (
          <Card className="mb-4 border-destructive/30 bg-destructive/10 p-3">
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          </Card>
        )}

        {statusNotice && (
          <div className={cn(
            "mb-4 flex items-center justify-between rounded-xl border p-3.5 text-xs font-semibold transition-all",
            statusNotice.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}>
            <span className="flex items-center gap-2">
              {statusNotice.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {statusNotice.text}
            </span>
            <button
              onClick={() => setStatusNotice(null)}
              className="ml-3 text-[11px] opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: USERS ROLE & PERMISSION MANAGEMENT                     */}
        {/* ------------------------------------------------------------- */}
        {active === "Users" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-4 rounded-xl border border-border">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    loadUsers(e.target.value);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadUsers(userSearch)}
                disabled={usersLoading}
                className="text-xs font-semibold gap-1.5"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", usersLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-2/60 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Joined</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {usersLoading && usersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          <div className="flex justify-center items-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                            Loading users list...
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

                        return (
                          <tr key={u._id} className="hover:bg-surface-2/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                                  {u.name ? u.name.slice(0, 2).toUpperCase() : "U"}
                                </span>
                                <div>
                                  <p className="font-bold text-foreground flex items-center gap-1">
                                    {u.name}
                                    {isSelf && (
                                      <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-black">
                                        YOU
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">{u.email}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                isSuper
                                  ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                                  : isAdminRole
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : "bg-muted/40 text-muted-foreground border-border"
                              )}>
                                {isSuper ? <Shield className="h-3 w-3" /> : isAdminRole ? <ShieldCheck className="h-3 w-3" /> : null}
                                {u.role || "user"}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                u.status === "suspended"
                                  ? "bg-destructive/15 text-destructive border border-destructive/30"
                                  : "bg-emerald-500/15 text-emerald-400"
                              )}>
                                {u.status || "active"}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-muted-foreground text-[11px]">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Role Assignment Dropdown (Super Admin Only) */}
                                {currentUser?.role === "super_admin" ? (
                                  <select
                                    value={u.role || "user"}
                                    disabled={isUpdating || (isSelf && isSuper)}
                                    onChange={(e) =>
                                      handleRoleChange(u._id, e.target.value as "user" | "admin" | "super_admin")
                                    }
                                    className="text-xs bg-background border border-border rounded-lg px-2 py-1 font-semibold text-foreground focus:outline-none focus:border-primary disabled:opacity-50 cursor-pointer"
                                  >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                  </select>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground italic">
                                    Managed by Super Admin
                                  </span>
                                )}

                                {/* Suspend / Restore Action */}
                                {!isSelf && (
                                  <Button
                                    variant={u.status === "suspended" ? "outline" : "ghost"}
                                    size="sm"
                                    disabled={isUpdating}
                                    onClick={() => handleToggleSuspend(u)}
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
        {/* TAB 2: DASHBOARD OVERVIEW (DEFAULT)                           */}
        {/* ------------------------------------------------------------- */}
        {active === "Dashboard" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                      <div className="mt-3 h-6 w-16 animate-pulse rounded bg-muted" />
                    </Card>
                  ))
                : stats.map((s) => (
                    <Card key={s.label}>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="mt-2 font-display text-2xl font-bold">{s.value}</p>
                    </Card>
                  ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <Card>
                <h2 className="mb-4 font-display text-sm font-bold">Recent Activity</h2>
                {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
                {!loading && !recentActivity.length && (
                  <p className="text-sm text-muted-foreground">No admin activity recorded yet.</p>
                )}
                <ul className="space-y-3">
                  {recentActivity.map((log) => (
                    <li key={log._id} className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{log.action.replaceAll("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">{log.entityType}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <h2 className="mb-4 font-display text-sm font-bold">Contest Status Breakdown</h2>
                {!loading && !contestBreakdown.length && (
                  <p className="text-sm text-muted-foreground">No contests yet.</p>
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
          </>
        )}

        {/* ------------------------------------------------------------- */}
        {/* OTHER TABS PLACEHOLDER                                        */}
        {/* ------------------------------------------------------------- */}
        {active !== "Dashboard" && active !== "Users" && (
          <Card className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-display text-lg font-bold text-foreground">{active} Management</h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              This module is active and protected under the RBAC admin security policies.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Button asChild variant="hero" size="sm">
                <Link to="/matches">Open Fantasy Arena</Link>
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
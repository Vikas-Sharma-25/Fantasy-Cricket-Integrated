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
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Logo } from "@/components/fc/Logo";
import { Card } from "@/components/fc/bits";
import { cn } from "@/lib/utils";
import { apiFetchEnvelope } from "@/lib/api";
import type { Contest } from "@/lib/api-types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Fantasy Cricket" },
      { name: "description", content: "Monitor users, matches, contests and entries across the fantasy cricket platform." },
      { property: "og:title", content: "Fantasy Cricket Admin Dashboard" },
      { property: "og:description", content: "Platform overview: users, matches, contests and entries." },
    ],
  }),
  component: Admin,
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
  const [dashboard, setDashboard] = useState<DashboardData>({ userCount: 0, liveMatches: 0, openContests: 0 });
  const [totalContests, setTotalContests] = useState(0);
  const [contestBreakdown, setContestBreakdown] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      apiFetchEnvelope<DashboardData>("/admin/dashboard"),
      apiFetchEnvelope<Contest[]>("/admin/contests?page=1&limit=100"),
      apiFetchEnvelope<AuditLog[]>("/admin/audit-logs?page=1&limit=6"),
    ])
      .then(([dash, contests, logs]) => {
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
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

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
              onClick={() => setActive(label)}
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
        <Link
          to="/login"
          className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" /> Logout
        </Link>
      </aside>

      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">{active} Overview</h1>
          <Link
            to="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          >
            VB
          </Link>
        </div>

        {error && (
          <Card className="mb-4 border-destructive/30">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

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
      </main>
    </div>
  );
}
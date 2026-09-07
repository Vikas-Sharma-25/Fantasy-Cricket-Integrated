import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Clock,
  RefreshCw,
  Trophy,
  Flame,
  Sparkles,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Radio,
  Globe2,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/fc/AppShell";
import { Card, TeamBadge, Tabs, StatusBadge } from "@/components/fc/bits";
import { LoadingState, EmptyState, LoadMoreButton } from "@/components/fc/ListState";
import { Button } from "@/components/ui/button";
import { getMatches } from "@/lib/api-services";
import type { Match } from "@/lib/api-types";
import { setFlow, FLOW_KEYS } from "@/lib/flow";
import { ApiClientError } from "@/lib/api";
import { useLoadMore } from "@/hooks/use-load-more";
import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/matches")({ component: Matches });

const TEAM_FLAGS: Record<string, string> = {
  INDIA: "🇮🇳",
  IND: "🇮🇳",
  AUSTRALIA: "🇦🇺",
  AUS: "🇦🇺",
  ENGLAND: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "SOUTH AFRICA": "🇿🇦",
  SA: "🇿🇦",
  "NEW ZEALAND": "🇳🇿",
  NZ: "🇳🇿",
  PAKISTAN: "🇵🇰",
  PAK: "🇵🇰",
  CSK: "🦁",
  "CHENNAI SUPER KINGS": "🦁",
  MI: "⚡",
  "MUMBAI INDIANS": "⚡",
  RCB: "🔥",
  "ROYAL CHALLENGERS BANGALORE": "🔥",
  KKR: "⚔️",
  "KOLKATA KNIGHT RIDERS": "⚔️",
};

function getTeamFlag(name?: string): string {
  if (!name) return "🏏";
  const upper = name.toUpperCase().trim();
  return TEAM_FLAGS[upper] || "🏏";
}

function Matches() {
  const [tab, setTab] = useState("Live");
  const [category, setCategory] = useState<"ALL" | "INTERNATIONAL" | "DOMESTIC">("ALL");
  const [items, setItems] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filteredItems = items.filter((m) => {
    if (category === "ALL") return true;
    const cat = ((m.providerData as any)?.category || "INTERNATIONAL").toUpperCase();
    return cat === category;
  });

  const { visibleItems, hasMore, loadMore, reset } = useLoadMore(filteredItems, 6);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getMatches(
        tab === "Live" ? "LIVE" : tab === "Completed" ? "COMPLETED" : "UPCOMING",
      );
      setItems(data);
      reset();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to load matches. Please check backend connection.",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [tab]);

  // Real-time Socket.IO sync for ball-by-ball match updates
  useEffect(() => {
    const socket = getSocket();
    socket.emit("match:subscribe", "live-feed");

    const onScoreUpdate = (data: any) => {
      if (!data?.matchId) return;
      setItems((prev) =>
        prev.map((m) => {
          if (m._id === data.matchId) {
            return {
              ...m,
              status: data.status || m.status,
              providerData: {
                ...(m.providerData || {}),
                ...(data.providerData || {}),
              },
            };
          }
          return m;
        })
      );
    };

    socket.on("match:score_update", onScoreUpdate);
    return () => {
      socket.off("match:score_update", onScoreUpdate);
      socket.emit("match:unsubscribe", "live-feed");
    };
  }, []);

  function select(id: string) {
    setFlow(FLOW_KEYS.selectedMatchId, id);
  }

  return (
    <AppShell>
      {/* ------------------------------------------------------------- */}
      {/* TOP ARENA BANNER                                              */}
      {/* ------------------------------------------------------------- */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-surface via-surface-2 to-primary/15 p-6 sm:p-7 shadow-xl">
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-44 w-44 rounded-full bg-amber-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              CRICKET WORLD ARENA &bull; LIVE BALL-BY-BALL
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
              Live Matches & Mega Contests
            </h1>
            <p className="text-xs sm:text-sm text-foreground/80 font-medium max-w-xl">
              Follow real-time ball scoring across International and T20 Domestic leagues, join multi-crore guaranteed pools, and win cash daily!
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-xl border border-primary/40 bg-surface/90 px-4 py-3 text-center shadow-inner">
              <p className="font-display text-xl font-black text-primary">₹50,000</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Free Mega Pool</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/90 px-4 py-3 text-center shadow-inner">
              <p className="font-display text-xl font-black text-foreground">60s</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">UPI Cashout</p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TOURNAMENT CATEGORY PILLS (ALL / INTERNATIONAL / DOMESTIC)     */}
      {/* ------------------------------------------------------------- */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setCategory("ALL")}
          className={cn(
            "shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all border",
            category === "ALL"
              ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
              : "bg-surface text-muted-foreground border-border hover:bg-surface-2 hover:text-foreground"
          )}
        >
          <Globe2 className="h-3.5 w-3.5" /> All Fixtures
        </button>
        <button
          type="button"
          onClick={() => setCategory("INTERNATIONAL")}
          className={cn(
            "shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all border",
            category === "INTERNATIONAL"
              ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
              : "bg-surface text-muted-foreground border-border hover:bg-surface-2 hover:text-foreground"
          )}
        >
          <span>🌍</span> International Series
        </button>
        <button
          type="button"
          onClick={() => setCategory("DOMESTIC")}
          className={cn(
            "shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all border",
            category === "DOMESTIC"
              ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
              : "bg-surface text-muted-foreground border-border hover:bg-surface-2 hover:text-foreground"
          )}
        >
          <span>🏆</span> Domestic & T20 Leagues
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* STATUS TABS (LIVE / UPCOMING / COMPLETED)                     */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface p-1">
          {[
            { id: "Live", label: "Live Matches", icon: Radio, pulse: true },
            { id: "Upcoming", label: "Upcoming", icon: Clock },
            { id: "Completed", label: "Completed", icon: CalendarDays },
          ].map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                )}
              >
                {t.pulse && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                  </span>
                )}
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => void load()}
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} /> Refresh
        </button>
      </div>

      {error && (
        <Card className="mb-4 border-destructive/30 bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MATCH CARDS FEED (CRICBUZZ + DREAM11 STYLE)                   */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        {loading && <LoadingState label="Loading cricket fixtures..." />}

        {!loading &&
          visibleItems.map((m) => {
            const pd = (m.providerData || {}) as any;
            const isLive = m.status === "LIVE";
            const isCompleted = m.status === "COMPLETED";

            const flagA = pd.teamAFlag || getTeamFlag(m.teamA);
            const flagB = pd.teamBFlag || getTeamFlag(m.teamB);
            const codeA = pd.teamACode || m.teamA.slice(0, 3).toUpperCase();
            const codeB = pd.teamBCode || m.teamB.slice(0, 3).toUpperCase();
            const tournament = pd.tournament || (pd.category === "DOMESTIC" ? "Indian Premier T20 League" : "ICC T20 Championship");

            return (
              <Card
                key={m._id}
                className="p-0 overflow-hidden border-border/80 hover:border-primary/60 transition-all duration-200 shadow-md hover:shadow-xl bg-surface/95"
              >
                {/* Header Strip */}
                <div className="flex items-center justify-between border-b border-border/70 bg-surface-2/70 px-4 py-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-foreground truncate max-w-[280px]">
                      {tournament}
                    </span>
                    {pd.format && (
                      <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-black uppercase text-muted-foreground border border-border">
                        {pd.format}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary" />
                      {m.venue?.split(",")[0] || "Stadium"}
                    </span>
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-black text-red-400 border border-red-500/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                      </span>
                    ) : (
                      <StatusBadge status={m.status} />
                    )}
                  </div>
                </div>

                {/* Score & Teams Arena */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    {/* Team A */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-2xl shadow-inner border border-border">
                        {flagA}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-base font-black tracking-tight text-foreground truncate">
                          {codeA}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{m.teamA}</p>
                      </div>
                    </div>

                    {/* Match Center: Score or VS */}
                    <div className="text-center px-2 flex flex-col items-center shrink-0 min-w-[140px]">
                      {isLive ? (
                        <div className="space-y-0.5">
                          <p className="font-display text-xl font-black text-primary">
                            {pd.currentScore || 160}/{pd.currentWickets || 3}
                          </p>
                          <p className="text-[11px] font-semibold text-muted-foreground">
                            ({pd.currentOvers || "17.2"} ov) &bull; CRR: {pd.crr || "9.2"}
                          </p>
                        </div>
                      ) : isCompleted ? (
                        <div className="space-y-0.5">
                          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-border">
                            MATCH ENDED
                          </span>
                          <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                            {pd.statusText || "Result finalized"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="rounded-full bg-surface-2 border border-border px-2.5 py-0.5 font-display text-xs font-black text-primary">
                            VS
                          </span>
                          <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                            {new Date(m.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Team B */}
                    <div className="flex items-center justify-end gap-3 flex-1 min-w-0 text-right">
                      <div className="min-w-0">
                        <p className="font-display text-base font-black tracking-tight text-foreground truncate">
                          {codeB}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{m.teamB}</p>
                      </div>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-2xl shadow-inner border border-border">
                        {flagB}
                      </div>
                    </div>
                  </div>

                  {/* Situation Ticker */}
                  {isLive && pd.statusText && (
                    <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-center text-xs font-semibold text-primary">
                      {pd.statusText}
                    </div>
                  )}

                  {/* Live Recent Balls Strip */}
                  {isLive && Array.isArray(pd.recentBalls) && pd.recentBalls.length > 0 && (
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-xs">
                      <span className="text-[10px] font-bold text-muted-foreground mr-1">RECENT:</span>
                      {pd.recentBalls.map((b: string, i: number) => {
                        const isW = b === "W";
                        const isBoundary = b === "4" || b === "6";
                        return (
                          <span
                            key={i}
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black border",
                              isW
                                ? "bg-red-500/20 text-red-400 border-red-500/50"
                                : isBoundary
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                                : "bg-surface-2 text-foreground border-border"
                            )}
                          >
                            {b}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Strip & Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border/80 bg-surface-2/40 px-4 py-3 gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <span className="font-bold text-foreground">₹50,000 Mega Jackpot</span>
                    <span className="rounded bg-primary/20 px-1.5 py-0.2 text-[10px] font-black text-primary">
                      FREE ENTRY
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      asChild
                      variant="outlineGreen"
                      size="sm"
                      className="flex-1 sm:flex-initial font-bold text-xs gap-1.5"
                      onClick={() => select(m._id)}
                    >
                      <Link to="/live-match">
                        <Radio className="h-3.5 w-3.5 text-red-400" />
                        {isLive ? "LIVE CENTER" : "SCORECARD"}
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="hero"
                      size="sm"
                      className="flex-1 sm:flex-initial font-bold text-xs gap-1.5"
                      onClick={() => select(m._id)}
                    >
                      <Link to="/contests">
                        JOIN CONTEST <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

        {!loading && !filteredItems.length && (
          <EmptyState label={`No ${category.toLowerCase()} ${tab.toLowerCase()} matches found.`} />
        )}
        {!loading && hasMore && <LoadMoreButton onClick={loadMore} />}
      </div>
    </AppShell>
  );
}

import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Clock,
  RefreshCw,
  Trophy,
  MapPin,
  ArrowRight,
  Radio,
  Globe2,
  CalendarDays,
  ChevronRight,
  Play,
  Newspaper,
  Video,
  Flame,
  Zap,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/fc/AppShell";
import { Card, StatusBadge } from "@/components/fc/bits";
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

async function fetchWorldMatches() {
  try {
    const res = await fetch("/api/v1/cricket/live");
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

async function fetchCricketNews() {
  try {
    const res = await fetch("/api/v1/cricket/news");
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

function Matches() {
  const [tab, setTab] = useState("Live");
  const [category, setCategory] = useState<"ALL" | "INTERNATIONAL" | "DOMESTIC">("ALL");
  const [items, setItems] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [worldMatches, setWorldMatches] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    fetchWorldMatches().then(setWorldMatches);
    fetchCricketNews().then(setNews);
  }, []);

  const filteredItems = items.filter((m) => {
    const targetStatus = tab === "Live" ? "LIVE" : tab === "Completed" ? "COMPLETED" : "UPCOMING";
    if (m.status !== targetStatus) return false;
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
        tab === "Live" ? "LIVE" : tab === "Completed" ? "COMPLETED" : "UPCOMING"
      );
      setItems(data);
      reset();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to load matches. Please check backend connection."
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
      {/* 1. LIVE MATCH TICKER STRIP */}
      <div className="-mx-4 sm:-mx-8 -mt-4 sm:-mt-8 mb-6 bg-gradient-to-r from-[#0a3d2c] via-[#0d4a35] to-[#0a3d2c] text-white">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="text-xs font-bold shrink-0 px-2 py-1 bg-black/30 rounded text-green-400">
            MATCHES
          </div>
          <div className="flex-1 flex overflow-x-auto scrollbar-none gap-3 items-center">
            {worldMatches.length > 0 ? (
              worldMatches.map((wm, i) => (
                <div
                  key={i}
                  className="shrink-0 min-w-[260px] bg-white/10 rounded px-3 py-2 text-xs flex flex-col gap-1 cursor-pointer hover:bg-white/20 transition-colors"
                >
                  <div className="flex justify-between items-center text-[10px] text-white/70 font-semibold uppercase">
                    <span>{wm.series || "International Series"}</span>
                    <span className="bg-white/20 px-1 rounded">{wm.format || "T20"}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex flex-col gap-0.5 w-full">
                      <div className="flex justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm">{getTeamFlag(wm.teamA)}</span>{" "}
                          {wm.teamA || "TMA"}
                        </span>
                        <span>{wm.scoreA || ""}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm">{getTeamFlag(wm.teamB)}</span>{" "}
                          {wm.teamB || "TMB"}
                        </span>
                        <span>{wm.scoreB || ""}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-green-300">
                      {wm.statusText || wm.status || "Upcoming"}
                    </span>
                    {wm.status === "LIVE" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-white/50 px-4">Loading live scores...</div>
            )}
          </div>
          <button className="text-xs font-bold shrink-0 px-3 hover:text-green-400 transition-colors">
            ALL &rarr;
          </button>
        </div>
      </div>

      {/* 2. THREE-COLUMN LAYOUT */}
      <div className="flex flex-col md:flex-row gap-6 max-w-[1400px] mx-auto">
        {/* Left Column (w-64, hidden on mobile) LATEST NEWS */}
        <div className="hidden md:block w-64 shrink-0 space-y-4">
          <h3 className="text-red-500 font-bold text-sm uppercase flex items-center gap-2 border-b border-border pb-2">
            <Newspaper className="h-4 w-4" /> LATEST NEWS
          </h3>
          <div className="flex flex-col divide-y divide-border">
            {news.slice(1, 10).map((n, i) => (
              <div key={i} className="py-3 group cursor-pointer">
                <h4 className="text-sm text-foreground group-hover:text-primary transition-colors font-medium leading-snug">
                  {n.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">{n.timeAgo || "2h ago"}</p>
              </div>
            ))}
            {news.length <= 1 && (
              <div className="py-3 text-xs text-muted-foreground">No recent news available.</div>
            )}
          </div>
        </div>

        {/* Center Column (flex-1) MAIN CONTENT */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Featured Article Hero Card */}
          {news[0] && (
            <div className="relative h-64 rounded-xl overflow-hidden group cursor-pointer shadow-md border border-border">
              <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-transparent z-10" />
              <div className="absolute inset-0 bg-primary/20 group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 p-5 z-20 w-full">
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded mb-2 inline-block">
                  TOP STORY
                </span>
                <h2 className="text-white text-xl sm:text-2xl font-black leading-tight drop-shadow-md">
                  {news[0].title}
                </h2>
                <p className="text-white/80 text-xs mt-2">{news[0].timeAgo || "1h ago"}</p>
              </div>
            </div>
          )}

          {/* Tournament Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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

          {/* Status Tabs */}
          <div className="flex items-center justify-between gap-4">
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
                    <span className="hidden sm:inline">{t.label}</span>
                    <span className="sm:hidden">{t.id}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => void load()}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`}
              />{" "}
              Refresh
            </button>
          </div>

          {error && (
            <Card className="border-destructive/30 bg-destructive/10">
              <p className="text-sm text-destructive">{error}</p>
            </Card>
          )}

          {/* MATCH CARDS FEED */}
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
                const tournament =
                  pd.tournament ||
                  (pd.category === "DOMESTIC" ? "Indian Premier T20 League" : "ICC T20 Championship");

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
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />{" "}
                            LIVE
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
                                {new Date(m.startTime).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
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
                          <span className="text-[10px] font-bold text-muted-foreground mr-1">
                            RECENT:
                          </span>
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
        </div>

        {/* Right Column (w-72, hidden on mobile) FEATURED VIDEOS */}
        <div className="hidden md:block w-72 shrink-0 space-y-4">
          <h3 className="text-red-500 font-bold text-sm uppercase flex items-center gap-2 border-b border-border pb-2">
            <Video className="h-4 w-4" /> FEATURED VIDEOS
          </h3>
          <div className="space-y-4">
            {[
              { title: "Injuries hit India's squad! Bumrah returns...", duration: "05:24" },
              { title: "Pakistan's Biggest Meltdown?", duration: "12:10" },
              { title: "Impact Player Rule Debate: Stay or Go?", duration: "08:45" },
            ].map((v, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="relative h-32 rounded-lg overflow-hidden bg-surface-2 border border-border flex items-center justify-center mb-2">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent group-hover:scale-105 transition-transform" />
                  <div className="bg-black/60 rounded-full p-2 z-10 text-white backdrop-blur-sm group-hover:bg-primary transition-colors">
                    <Play className="h-4 w-4 fill-current" />
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10">
                    {v.duration}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                  {v.title}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

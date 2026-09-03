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

export const Route = createFileRoute("/matches")({ component: Matches });

const TEAM_FORM_MAP: Record<string, string[]> = {
  INDIA: ["W", "W", "W", "L", "W"],
  AUSTRALIA: ["W", "L", "W", "W", "L"],
  MI: ["W", "W", "L", "W", "L"],
  CSK: ["L", "W", "W", "W", "L"],
  RCB: ["W", "L", "W", "L", "W"],
  KKR: ["W", "W", "W", "L", "W"],
  GT: ["L", "W", "L", "W", "W"],
  RR: ["W", "W", "L", "L", "W"],
};

function getForm(team: string): string[] {
  const upper = (team || "").toUpperCase();
  return TEAM_FORM_MAP[upper] || ["W", "W", "L", "W", "L"];
}

function Matches() {
  const [tab, setTab] = useState("Upcoming");
  const [items, setItems] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { visibleItems, hasMore, loadMore, reset } = useLoadMore(items, 6);

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
          : "Unable to load matches. Start the API and MongoDB first.",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [tab]);

  function select(id: string) {
    setFlow(FLOW_KEYS.selectedMatchId, id);
  }

  return (
    <AppShell>
      {/* ------------------------------------------------------------- */}
      {/* HIGH-IMPACT HERO BANNER                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-surface via-surface-2 to-primary/15 p-6 sm:p-8 shadow-2xl">
        {/* Glow backdrop circles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-accent/15 blur-2xl" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
            <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> MEGA CRICKET ARENA 2026
          </div>

          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-black uppercase tracking-tight sm:text-4xl text-foreground">
              PLAY FANTASY &bull; <span className="text-primary">WIN ₹50,000+</span>
            </h2>
            <p className="mt-2 text-sm text-foreground/80 font-medium">
              Pick your dream 11, choose your Captain (2X) & Vice-Captain (1.5X), and compete with real cricket fans to claim the top rank!
            </p>
          </div>

          {/* Quick value props */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5 rounded-lg bg-surface/80 px-3 py-1.5 border border-border">
              <Zap className="h-3.5 w-3.5 text-amber-400" /> Instant Live Points
            </span>
            <span className="flex items-center gap-1.5 rounded-lg bg-surface/80 px-3 py-1.5 border border-border">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> 100% Fair Play
            </span>
            <span className="flex items-center gap-1.5 rounded-lg bg-surface/80 px-3 py-1.5 border border-border">
              <Trophy className="h-3.5 w-3.5 text-yellow-400" /> Free Mega Contests
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* QUICK HIGHLIGHT STAT CARDS                                     */}
      {/* ------------------------------------------------------------- */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-primary/30 bg-surface/90 p-3.5 text-center shadow-sm">
          <p className="font-display text-lg font-black text-primary">₹50,000</p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Mega Contest</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/90 p-3.5 text-center shadow-sm">
          <p className="font-display text-lg font-black text-foreground">100+</p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Contests</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/90 p-3.5 text-center shadow-sm">
          <p className="font-display text-lg font-black text-accent">11</p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Player Squad</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between gap-4">
        <Tabs items={["Upcoming", "Live", "Completed"]} active={tab} onChange={setTab} />
        <button
          onClick={() => void load()}
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} /> Refresh
        </button>
      </div>

      {error && (
        <Card className="mt-4 border-destructive/30 bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MATCH CARDS LIST                                              */}
      {/* ------------------------------------------------------------- */}
      <div className="mt-5 space-y-5">
        {loading && <LoadingState label="Loading live & upcoming matches..." />}

        {!loading &&
          visibleItems.map((m) => {
            const teamAForm = getForm(m.teamA);
            const teamBForm = getForm(m.teamB);

            return (
              <Card
                key={m._id}
                className="p-0 overflow-hidden border-border/80 hover:border-primary/50 transition-all duration-200 shadow-md hover:shadow-primary/5"
              >
                {/* Top Info Strip */}
                <div className="flex items-center justify-between border-b border-border bg-surface-2/60 px-4 py-2.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {m.venue || "Wankhede Stadium, Mumbai"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium">
                      {new Date(m.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <StatusBadge status={m.status} />
                  </div>
                </div>

                {/* Teams Matchup Section */}
                <div className="flex items-center justify-between gap-4 p-5 sm:p-6">
                  {/* Team A */}
                  <div className="flex flex-col items-center gap-2 flex-1 text-center">
                    <div className="relative">
                      <TeamBadge team={m.teamA} size={56} />
                    </div>
                    <span className="font-display text-sm font-bold text-foreground">
                      {m.teamA}
                    </span>
                    {/* Recent form chips */}
                    <div className="flex items-center gap-1">
                      {teamAForm.slice(0, 4).map((r, i) => (
                        <span
                          key={i}
                          className={`h-4 w-4 rounded-sm flex items-center justify-center text-[9px] font-extrabold ${
                            r === "W" ? "bg-emerald-600 text-white" : "bg-destructive text-white"
                          }`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* VS Info Center */}
                  <div className="text-center px-2 flex flex-col items-center">
                    <span className="rounded-full bg-surface-2 border border-border px-3 py-1 font-display text-xs font-black tracking-widest text-primary shadow-inner">
                      VS
                    </span>
                    <p className="mt-2 text-[11px] text-muted-foreground font-medium">
                      {new Date(m.startTime).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </p>
                  </div>

                  {/* Team B */}
                  <div className="flex flex-col items-center gap-2 flex-1 text-center">
                    <div className="relative">
                      <TeamBadge team={m.teamB} size={56} />
                    </div>
                    <span className="font-display text-sm font-bold text-foreground">
                      {m.teamB}
                    </span>
                    {/* Recent form chips */}
                    <div className="flex items-center gap-1">
                      {teamBForm.slice(0, 4).map((r, i) => (
                        <span
                          key={i}
                          className={`h-4 w-4 rounded-sm flex items-center justify-center text-[9px] font-extrabold ${
                            r === "W" ? "bg-emerald-600 text-white" : "bg-destructive text-white"
                          }`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mega Contest Highlight Strip */}
                <div className="flex items-center justify-between border-t border-b border-primary/20 bg-primary/5 px-4 py-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                    <span>Mega Contest: ₹50,000 Pool</span>
                  </div>
                  <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                    FREE ENTRY
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-surface-2/20">
                  <Button
                    asChild
                    variant="outlineGreen"
                    size="lg"
                    className="font-bold text-xs"
                    onClick={() => select(m._id)}
                  >
                    <Link to="/match-details">MATCH DETAILS</Link>
                  </Button>
                  <Button
                    asChild
                    variant="hero"
                    size="lg"
                    className="font-bold text-xs gap-1.5"
                    onClick={() => select(m._id)}
                  >
                    <Link to="/contests">
                      VIEW CONTESTS <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}

        {!loading && !items.length && (
          <EmptyState label={`No ${tab.toLowerCase()} matches found.`} />
        )}
        {!loading && hasMore && <LoadMoreButton onClick={loadMore} />}
      </div>
    </AppShell>
  );
}
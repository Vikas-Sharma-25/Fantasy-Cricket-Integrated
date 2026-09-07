import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Radio,
  RefreshCw,
  Trophy,
  Users,
  Flame,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Award,
  ChevronRight,
  Plus,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/fc/AppShell";
import { Card, StatusBadge } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { getMatchLive, getContests, getMyTeams, joinContest } from "@/lib/api-services";
import type { Contest, FantasyTeam } from "@/lib/api-types";
import { getFlow, setFlow, removeFlow, FLOW_KEYS } from "@/lib/flow";
import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/live-match")({ component: LiveMatch });

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

function getFlag(name?: string): string {
  if (!name) return "🏏";
  const upper = name.toUpperCase().trim();
  return TEAM_FLAGS[upper] || "🏏";
}

function LiveMatch() {
  const navigate = useNavigate();
  const matchId = getFlow<string | null>(FLOW_KEYS.selectedMatchId, null);

  const [tab, setTab] = useState<"Live" | "Contests" | "Teams" | "Scorecard">("Live");
  const [live, setLive] = useState<any>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [myTeams, setMyTeams] = useState<FantasyTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  async function loadData(id: string) {
    try {
      const [liveData, contestList, teamList] = await Promise.all([
        getMatchLive(id),
        getContests(id).catch(() => []),
        getMyTeams(id).catch(() => []),
      ]);
      setLive(liveData);
      setContests(contestList);
      setMyTeams(teamList);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!matchId) {
      setLoading(false);
      return;
    }
    void loadData(matchId);
  }, [matchId]);

  // Socket.IO Ball-by-Ball listener
  useEffect(() => {
    if (!matchId) return;
    const socket = getSocket();
    socket.emit("match:subscribe", matchId);

    const handleMatchUpdate = (data: any) => {
      if (data?.matchId === matchId) {
        setLive((prev: any) => ({
          ...prev,
          ...data,
          providerData: {
            ...(prev?.providerData || {}),
            ...(data.providerData || {}),
          },
        }));
      }
    };

    socket.on("match:update", handleMatchUpdate);
    return () => {
      socket.off("match:update", handleMatchUpdate);
      socket.emit("match:unsubscribe", matchId);
    };
  }, [matchId]);

  async function handleJoin(contestId: string) {
    if (!myTeams.length) {
      handleCreateTeam();
      return;
    }
    setJoiningId(contestId);
    setJoinSuccess(null);
    setJoinError(null);
    try {
      await joinContest(contestId, myTeams[0]._id);
      setJoinSuccess("Joined contest successfully! Follow your team on the live leaderboard.");
      void loadData(matchId!);
    } catch (err: any) {
      setJoinError(err?.message || "Unable to join contest");
    } finally {
      setJoiningId(null);
    }
  }

  function handleCreateTeam() {
    if (!matchId) return;
    removeFlow(FLOW_KEYS.editingTeamId);
    removeFlow(FLOW_KEYS.selectedPlayerIds);
    removeFlow(FLOW_KEYS.captainId);
    removeFlow(FLOW_KEYS.viceCaptainId);
    setFlow(FLOW_KEYS.selectedMatchId, matchId);
    setFlow(FLOW_KEYS.selectedTeamName, `Team ${myTeams.length + 1}`);
    navigate({ to: "/players" });
  }

  if (!matchId) {
    return (
      <AppShell>
        <Card className="text-center py-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Radio className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold">No Match Selected</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please pick a live or upcoming cricket fixture from the Arena to open its match center.
          </p>
          <Button asChild variant="hero" size="lg" className="mt-6 font-bold">
            <Link to="/matches">Browse All Matches</Link>
          </Button>
        </Card>
      </AppShell>
    );
  }

  const pd = (live?.providerData || {}) as any;
  const teamA = live?.teamA || "Team A";
  const teamB = live?.teamB || "Team B";
  const flagA = pd.teamAFlag || getFlag(teamA);
  const flagB = pd.teamBFlag || getFlag(teamB);
  const codeA = pd.teamACode || teamA.slice(0, 3).toUpperCase();
  const codeB = pd.teamBCode || teamB.slice(0, 3).toUpperCase();
  const tournament = pd.tournament || "T20 Championship";

  return (
    <AppShell maxWidth="max-w-4xl">
      <PageHeader
        back="/matches"
        title={
          <div className="flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span>LIVE MATCH CENTER</span>
          </div>
        }
        right={
          <button
            onClick={() => void loadData(matchId)}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} /> Refresh
          </button>
        }
      />

      {/* ------------------------------------------------------------- */}
      {/* 1. CRICBUZZ STYLE LIVE SCOREBOARD HEADER                       */}
      {/* ------------------------------------------------------------- */}
      <Card className="p-0 overflow-hidden border-border/80 bg-surface/95 shadow-xl">
        {/* Tournament & Venue strip */}
        <div className="flex items-center justify-between border-b border-border/70 bg-surface-2/80 px-4 py-2 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-foreground truncate">{tournament}</span>
            {pd.format && (
              <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-black uppercase text-muted-foreground border border-border">
                {pd.format}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 text-primary" />
              {live?.venue || "Stadium"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-black text-red-400 border border-red-500/40">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE BALL
            </span>
          </div>
        </div>

        {/* Big Teams Score Comparison */}
        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            {/* Team A */}
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-3xl shadow-inner border border-border">
                {flagA}
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg sm:text-xl font-black text-foreground truncate">
                  {codeA}
                </p>
                <p className="text-xs text-muted-foreground truncate">{teamA}</p>
                {pd.firstInnings && pd.firstInnings.team === teamA && (
                  <p className="font-mono text-xs font-bold text-primary mt-0.5">
                    {pd.firstInnings.score} ({pd.firstInnings.overs} ov)
                  </p>
                )}
              </div>
            </div>

            {/* Center Live Score Display */}
            <div className="text-center px-3 flex flex-col items-center shrink-0 min-w-[170px]">
              <p className="font-display text-3xl sm:text-4xl font-black text-primary tracking-tight">
                {pd.currentScore || 174}/{pd.currentWickets || 3}
              </p>
              <p className="text-xs font-bold text-muted-foreground mt-0.5">
                ({pd.currentOvers || "17.4"} ov) &bull; CRR: {pd.crr || "9.85"}
              </p>
              {pd.rrr && (
                <span className="mt-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                  RRR: {pd.rrr}
                </span>
              )}
            </div>

            {/* Team B */}
            <div className="flex items-center justify-end gap-3.5 flex-1 min-w-0 text-right">
              <div className="min-w-0">
                <p className="font-display text-lg sm:text-xl font-black text-foreground truncate">
                  {codeB}
                </p>
                <p className="text-xs text-muted-foreground truncate">{teamB}</p>
                {pd.firstInnings && pd.firstInnings.team === teamB && (
                  <p className="font-mono text-xs font-bold text-primary mt-0.5">
                    {pd.firstInnings.score} ({pd.firstInnings.overs} ov)
                  </p>
                )}
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-3xl shadow-inner border border-border">
                {flagB}
              </div>
            </div>
          </div>

          {/* Match situation banner */}
          <div className="mt-5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-center text-xs font-bold text-primary shadow-sm">
            {pd.statusText || `${teamA} vs ${teamB} &bull; Live in progress`}
          </div>

          {/* Recent Balls Strip */}
          {Array.isArray(pd.recentBalls) && pd.recentBalls.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
              <span className="text-xs font-bold text-muted-foreground">RECENT OVERS:</span>
              <div className="flex items-center gap-1.5">
                {pd.recentBalls.map((b: string, i: number) => {
                  const isW = b === "W";
                  const isBoundary = b === "4" || b === "6";
                  return (
                    <span
                      key={i}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-black border transition-all duration-300",
                        isW
                          ? "bg-red-500/20 text-red-400 border-red-500/50 shadow-sm shadow-red-500/20 scale-105"
                          : isBoundary
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-500/20"
                          : "bg-surface-2 text-foreground border-border"
                      )}
                    >
                      {b}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ------------------------------------------------------------- */}
      {/* 2. ON-CREASE BATSMEN & CURRENT BOWLER (CRICBUZZ WIDGET)       */}
      {/* ------------------------------------------------------------- */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Batsmen Box */}
        <Card className="p-4 border-border/80 bg-surface/90">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <span>🏏</span> BATSMEN AT CREASE
          </p>
          <div className="space-y-2.5 divide-y divide-border/60">
            {(pd.batsmen || [
              { name: "Virat Kohli", runs: 68, balls: 44, fours: 6, sixes: 2, isStriker: true },
              { name: "Hardik Pandya", runs: 26, balls: 13, fours: 2, sixes: 2, isStriker: false },
            ]).map((bat: any, i: number) => {
              const sr = bat.balls > 0 ? ((bat.runs / bat.balls) * 100).toFixed(1) : "0.0";
              return (
                <div key={i} className={cn("flex items-center justify-between pt-2 first:pt-0", bat.isStriker && "text-primary")}>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold text-foreground">
                      {bat.name} {bat.isStriker ? "*" : ""}
                    </span>
                    {bat.isStriker && (
                      <span className="rounded bg-primary/20 px-1.5 py-0.2 text-[9px] font-black text-primary">
                        STRIKE
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-black text-foreground">
                      {bat.runs} <span className="text-xs font-normal text-muted-foreground">({bat.balls})</span>
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {bat.fours || 0}x4, {bat.sixes || 0}x6 &bull; SR: {sr}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Bowler Box */}
        <Card className="p-4 border-border/80 bg-surface/90">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <span>⚡</span> CURRENT BOWLER
          </p>
          {pd.bowler ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-sm font-bold text-foreground">{pd.bowler.name}</p>
                <p className="text-[11px] text-muted-foreground">Right-arm fast bowler</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-black text-foreground">
                  {pd.bowler.wickets || 0}/{pd.bowler.runs || 0}
                </span>
                <p className="text-[10px] text-muted-foreground">
                  {pd.bowler.overs || "0.0"} ov &bull; Econ: {pd.bowler.economy || "0.0"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Bowler stats updating live...</p>
          )}

          {/* Quick Contest CTA */}
          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Play fantasy in this match?</span>
            <Button
              type="button"
              variant="hero"
              size="sm"
              onClick={() => setTab("Contests")}
              className="text-xs font-bold gap-1"
            >
              <Trophy className="h-3.5 w-3.5" /> View Contests
            </Button>
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. TABS: LIVE FEED / CONTESTS / MY TEAMS / SCORECARD          */}
      {/* ------------------------------------------------------------- */}
      <div className="mt-6 flex items-center gap-2 border-b border-border/80 pb-2">
        {(["Live", "Contests", "Teams", "Scorecard"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-bold transition-all",
              tab === t
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            )}
          >
            {t === "Live" && "Ball-by-Ball Live"}
            {t === "Contests" && `Contests (${contests.length})`}
            {t === "Teams" && `My Teams (${myTeams.length})`}
            {t === "Scorecard" && "Full Scorecard"}
          </button>
        ))}
      </div>

      {/* Notifications banner */}
      {joinSuccess && (
        <p className="mt-4 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs font-bold text-primary">
          {joinSuccess}
        </p>
      )}
      {joinError && (
        <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-xs font-bold text-destructive">
          {joinError}
        </p>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: BALL-BY-BALL COMMENTARY FEED                           */}
      {/* ------------------------------------------------------------- */}
      {tab === "Live" && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-black uppercase text-foreground">
              Live Ball-by-Ball Commentary
            </h3>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Radio className="h-3 w-3 text-red-400 animate-pulse" /> Auto-updates via Socket.IO
            </span>
          </div>

          <div className="space-y-2.5">
            {((pd.commentary || [
              { over: "17.4", runs: 2, text: "Pat Cummins to Virat Kohli: 2 runs, driven gracefully through extra cover.", time: "Just now" },
              { over: "17.3", runs: 1, text: "Pat Cummins to Hardik Pandya: 1 run, worked into square leg.", time: "1m ago" },
              { over: "17.2", runs: 6, isSix: true, text: "Pat Cummins to Hardik Pandya: SIX! Massive maximum over long-on!", time: "2m ago" },
              { over: "17.1", runs: 0, text: "Pat Cummins to Hardik Pandya: Slower ball, no run.", time: "3m ago" },
            ]) as any[]).map((c, idx) => {
              const isW = c.isWicket;
              const isFour = c.isFour || c.runs === 4;
              const isSix = c.isSix || c.runs === 6;

              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3.5 transition-all shadow-sm",
                    idx === 0
                      ? "border-primary/50 bg-surface/90 shadow-primary/5"
                      : "border-border/60 bg-surface/60"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-black",
                      isW
                        ? "bg-red-500/20 text-red-400 border border-red-500/50"
                        : isSix
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                        : isFour
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                        : "bg-surface-2 text-foreground border border-border"
                    )}
                  >
                    {isW ? "W" : c.runs}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-bold text-foreground">Over {c.over}</span>
                      <span>{c.time || "Just now"}</span>
                    </div>
                    <p className="mt-1 text-xs text-foreground/90 font-medium leading-relaxed">
                      {c.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: ACTIVE CONTESTS FOR THIS MATCH                         */}
      {/* ------------------------------------------------------------- */}
      {tab === "Contests" && (
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-black uppercase text-foreground">
              Available Contests for this Match
            </h3>
            <Button
              type="button"
              variant="outlineGreen"
              size="sm"
              onClick={handleCreateTeam}
              className="text-xs font-bold gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Create Team
            </Button>
          </div>

          {!contests.length ? (
            <Card className="text-center py-8">
              <p className="text-xs text-muted-foreground">No contests currently open for this match.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {contests.map((c) => (
                <div
                  key={c._id}
                  className="flex flex-col justify-between rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-sm hover:border-primary/50 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-foreground">{c.name}</span>
                      <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-black text-primary">
                        {c.rules?.entryFee === 0 ? "FREE" : `₹${c.rules?.entryFee}`}
                      </span>
                    </div>

                    <div className="my-4 rounded-xl border border-border/60 bg-surface-2/60 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Prize Pool</p>
                        <p className="font-display text-xl font-black text-primary">
                          ₹{(c.rules?.prizePool || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Entry Fee</p>
                        <p className="font-display text-base font-bold text-foreground">
                          {c.rules?.entryFee === 0 ? "Free Entry" : `₹${c.rules?.entryFee}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{c.joinedSlots} joined</span>
                      <span>{c.maxSlots} spots</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    disabled={joiningId === c._id}
                    onClick={() => handleJoin(c._id)}
                    variant="hero"
                    size="sm"
                    className="mt-5 w-full font-bold text-xs"
                  >
                    {joiningId === c._id ? "Joining..." : "JOIN NOW"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: USER'S FANTASY TEAMS FOR THIS MATCH                    */}
      {/* ------------------------------------------------------------- */}
      {tab === "Teams" && (
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-black uppercase text-foreground">
              My Teams in this Match ({myTeams.length})
            </h3>
            <Button
              type="button"
              variant="hero"
              size="sm"
              onClick={handleCreateTeam}
              className="text-xs font-bold gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Create New Team
            </Button>
          </div>

          {!myTeams.length ? (
            <Card className="text-center py-10">
              <p className="text-sm font-bold text-foreground">You haven't built a team for this match yet.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Select 11 players, pick your Captain (2X) & Vice-Captain (1.5X), and enter cash contests!
              </p>
              <Button
                type="button"
                variant="hero"
                size="lg"
                onClick={handleCreateTeam}
                className="mt-5 font-bold text-xs"
              >
                CREATE YOUR TEAM NOW
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {myTeams.map((team, idx) => (
                <div
                  key={team._id}
                  className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div>
                      <span className="font-display text-base font-bold text-foreground">
                        {team.name || `Team ${idx + 1}`}
                      </span>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        {(team.players || []).length} Players Selected
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-lg font-black text-primary">
                        {team.totalPoints || 0} pts
                      </span>
                      <p className="text-[10px] text-muted-foreground">Live Fantasy Score</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-surface-2 p-2.5">
                      <span className="text-[10px] font-bold text-amber-400">CAPTAIN (2X)</span>
                      <p className="font-bold text-foreground mt-0.5 truncate">
                        {(team as any).captain?.name || "Captain Selected"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-surface-2 p-2.5">
                      <span className="text-[10px] font-bold text-purple-400">VICE-CAPTAIN (1.5X)</span>
                      <p className="font-bold text-foreground mt-0.5 truncate">
                        {(team as any).viceCaptain?.name || "Vice-Captain Selected"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: FULL INNINGS SCORECARD                                 */}
      {/* ------------------------------------------------------------- */}
      {tab === "Scorecard" && (
        <div className="mt-5 space-y-4">
          <Card className="p-4 border-border/80">
            <h3 className="font-display text-sm font-bold uppercase text-foreground mb-3">
              1st Innings: {pd.firstInnings?.team || teamA}
            </h3>
            <div className="flex justify-between items-center text-xs py-2 border-b border-border/60">
              <span className="text-muted-foreground font-medium">Total Score</span>
              <span className="font-mono text-base font-black text-foreground">
                {pd.firstInnings?.score || "185/6"} ({pd.firstInnings?.overs || "20.0"} ov)
              </span>
            </div>
          </Card>

          <Card className="p-4 border-border/80">
            <h3 className="font-display text-sm font-bold uppercase text-foreground mb-3">
              2nd Innings: {pd.battingTeam || teamB} (Current)
            </h3>
            <div className="flex justify-between items-center text-xs py-2 border-b border-border/60">
              <span className="text-muted-foreground font-medium">Current Total</span>
              <span className="font-mono text-base font-black text-primary">
                {pd.currentScore || 174}/{pd.currentWickets || 3} ({pd.currentOvers || "17.4"} ov)
              </span>
            </div>
            <div className="flex justify-between items-center text-xs py-2">
              <span className="text-muted-foreground font-medium">Equation</span>
              <span className="font-semibold text-amber-400">
                {pd.statusText || "Target in sight"}
              </span>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

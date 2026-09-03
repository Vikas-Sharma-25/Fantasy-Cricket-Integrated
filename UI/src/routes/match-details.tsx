import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Clock,
  Plus,
  Users,
  Trophy,
  Flame,
  CloudSun,
  MapPin,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/fc/AppShell";
import { Card, TeamBadge, Tabs } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { getMatch, getMatchPlayers, getMyTeams } from "@/lib/api-services";
import type { Match, MatchPlayer, FantasyTeam } from "@/lib/api-types";
import { getFlow, setFlow, removeFlow, FLOW_KEYS } from "@/lib/flow";

export const Route = createFileRoute("/match-details")({ component: MatchDetails });

const TEAM_FORM_MAP: Record<string, string[]> = {
  MI: ["W", "W", "L", "W", "L"],
  CSK: ["L", "W", "W", "W", "L"],
  RCB: ["W", "L", "W", "L", "W"],
  KKR: ["W", "W", "W", "L", "W"],
  GT: ["L", "W", "L", "W", "W"],
  RR: ["W", "W", "L", "L", "W"],
  DC: ["L", "L", "W", "L", "W"],
  PBKS: ["L", "W", "L", "L", "W"],
  SRH: ["W", "L", "W", "W", "L"],
  LSG: ["W", "L", "L", "W", "W"],
};

function getFormForTeam(team: string): string[] {
  const upper = (team || "").toUpperCase();
  return TEAM_FORM_MAP[upper] || ["W", "W", "L", "W", "L"];
}

function MatchDetails() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("Overview");
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<MatchPlayer[]>([]);
  const [myTeams, setMyTeams] = useState<FantasyTeam[]>([]);
  const matchId = getFlow<string | null>(FLOW_KEYS.selectedMatchId, null);

  useEffect(() => {
    if (matchId) {
      void getMatch(matchId).then(setMatch).catch(() => {});
      void getMatchPlayers(matchId).then(setPlayers).catch(() => {});
      void getMyTeams(matchId).then(setMyTeams).catch(() => {});
    }
  }, [matchId]);

  if (!matchId || !match) {
    return (
      <AppShell>
        <Card className="text-center py-12">
          <p className="text-sm text-muted-foreground">Select a match to view details.</p>
          <Button asChild variant="hero" className="mt-4">
            <Link to="/matches">BACK TO MATCHES</Link>
          </Button>
        </Card>
      </AppShell>
    );
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

  const teamAForm = getFormForTeam(match.teamA);
  const teamBForm = getFormForTeam(match.teamB);

  // Top picks for fantasy
  const topPicks = [...players]
    .filter((p) => p.isAvailable)
    .sort((a, b) => (b.credits ?? 0) - (a.credits ?? 0))
    .slice(0, 4);

  return (
    <AppShell>
      <PageHeader title="Match Details" back="/matches" />

      {/* Match Header Hero Card */}
      <Card className="p-0 overflow-hidden border-border/80">
        <div className="bg-surface-2/60 px-4 py-2 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-semibold">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {match.venue || "Wankhede Stadium, Mumbai"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-destructive/15 px-2 py-0.5 text-[10px] font-extrabold text-destructive">
            <Clock className="h-3 w-3" />
            {match.status}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 px-4 py-6">
          <div className="flex flex-col items-center gap-2">
            <TeamBadge team={match.teamA} size={56} />
            <span className="font-display text-sm font-bold">{match.teamA}</span>
          </div>

          <div className="text-center">
            <p className="font-display text-lg font-black text-foreground">
              {match.teamA} <span className="text-primary">VS</span> {match.teamB}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(match.startTime).toLocaleString()}
            </p>
            <p className="mt-2 text-[11px] font-semibold text-accent">
              Deadline: {new Date(match.fantasyDeadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <TeamBadge team={match.teamB} size={56} />
            <span className="font-display text-sm font-bold">{match.teamB}</span>
          </div>
        </div>
      </Card>

      {/* Attractive Contest Callout Banner */}
      <div className="mt-4 rounded-xl border border-primary/40 gradient-primary p-4 text-primary-foreground shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-display text-sm font-black">
              <Trophy className="h-4 w-4 text-yellow-300" /> MEGA CONTEST LIVE
            </div>
            <p className="text-xs text-primary-foreground/90 font-medium">
              Join with your team & compete for ₹50,000 prize pool!
            </p>
          </div>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="shrink-0 font-bold text-xs bg-white text-black hover:bg-white/90"
            onClick={() => setFlow(FLOW_KEYS.selectedMatchId, matchId)}
          >
            <Link to="/contests">
              JOIN NOW <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-6">
        <Tabs items={["Overview", "Players", "Pitch & Form"]} active={tab} onChange={setTab} />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW & MATCH INSIGHTS                               */}
      {/* ------------------------------------------------------------- */}
      {(tab === "Overview" || tab === "Pitch & Form") && (
        <div className="mt-5 space-y-4">
          {/* Match Info Details Card */}
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-border bg-surface-2/50 px-4 py-2.5">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Match Info
              </h3>
            </div>
            <dl className="divide-y divide-border text-sm">
              <div className="flex justify-between px-4 py-3">
                <dt className="text-muted-foreground">Venue</dt>
                <dd className="font-semibold text-foreground">
                  {match.venue || "Wankhede Stadium, Mumbai"}
                </dd>
              </div>
              <div className="flex justify-between px-4 py-3">
                <dt className="text-muted-foreground">Pitch</dt>
                <dd className="font-semibold text-emerald-400">Batting Friendly &bull; High Bounce</dd>
              </div>
              <div className="flex justify-between px-4 py-3">
                <dt className="text-muted-foreground">Weather</dt>
                <dd className="font-semibold text-foreground flex items-center gap-1.5">
                  <CloudSun className="h-4 w-4 text-amber-400" /> 27°C, Clear Sky
                </dd>
              </div>
              <div className="flex justify-between px-4 py-3">
                <dt className="text-muted-foreground">Toss</dt>
                <dd className="font-semibold text-foreground">Expected 30 mins before start</dd>
              </div>
              <div className="flex justify-between px-4 py-3">
                <dt className="text-muted-foreground">Avg 1st Innings</dt>
                <dd className="font-semibold text-primary">178 Runs</dd>
              </div>
            </dl>
          </Card>

          {/* Recent Form Guide Card */}
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-border bg-surface-2/50 px-4 py-2.5">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Recent Form (Last 5 Matches)
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {/* Team A Form */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <TeamBadge team={match.teamA} size={32} />
                  <span className="font-display text-xs font-bold">{match.teamA}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {teamAForm.map((res, i) => (
                    <span
                      key={i}
                      className={`flex h-6 w-6 items-center justify-center rounded text-[11px] font-extrabold ${
                        res === "W"
                          ? "bg-emerald-600/80 text-white"
                          : "bg-destructive/80 text-white"
                      }`}
                    >
                      {res}
                    </span>
                  ))}
                </div>
              </div>

              {/* Team B Form */}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-2.5">
                  <TeamBadge team={match.teamB} size={32} />
                  <span className="font-display text-xs font-bold">{match.teamB}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {teamBForm.map((res, i) => (
                    <span
                      key={i}
                      className={`flex h-6 w-6 items-center justify-center rounded text-[11px] font-extrabold ${
                        res === "W"
                          ? "bg-emerald-600/80 text-white"
                          : "bg-destructive/80 text-white"
                      }`}
                    >
                      {res}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Head to Head & Win Prediction */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Head to Head (Last 5)
              </span>
              <span className="text-xs font-semibold text-primary">
                {match.teamA} 3 &bull; 2 {match.teamB}
              </span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>{match.teamA} (55%)</span>
                <span>{match.teamB} (45%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden flex">
                <div className="h-full bg-primary" style={{ width: "55%" }} />
                <div className="h-full bg-cyan-500" style={{ width: "45%" }} />
              </div>
            </div>
          </Card>

          {/* Top Fantasy Picks / Key Players */}
          {topPicks.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="border-b border-border bg-surface-2/50 px-4 py-2.5 flex items-center justify-between">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Key Fantasy Picks
                </h3>
                <span className="text-[10px] text-muted-foreground">High Impact Players</span>
              </div>
              <div className="divide-y divide-border">
                {topPicks.map((p) => (
                  <div key={p.playerId} className="flex items-center justify-between px-4 py-3 text-xs">
                    <div>
                      <p className="font-bold text-sm text-foreground">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.realTeam} &bull; {p.role} {p.isPlayingXI ? "&bull; Playing XI" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-sm font-bold text-primary">
                        {p.credits?.toFixed(1)} Cr
                      </span>
                      <span className="block text-[10px] text-muted-foreground">Credits</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: PLAYERS LIST                                            */}
      {/* ------------------------------------------------------------- */}
      {tab === "Players" && (
        <Card className="mt-5 p-0">
          {players
            .filter((p) => p.isAvailable)
            .map((p) => (
              <div
                key={p.matchPlayerId}
                className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.realTeam} &bull; {p.role}
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">
                  {p.credits?.toFixed(1)} Cr
                </span>
              </div>
            ))}
        </Card>
      )}

      {/* Bottom Action Buttons */}
      <div className="mt-6 space-y-3">
        {myTeams.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              asChild
              variant="outlineGreen"
              size="xl"
              className="gap-2 font-bold"
              onClick={() => setFlow(FLOW_KEYS.selectedMatchId, matchId)}
            >
              <Link to="/create-team">
                <Users className="h-4 w-4" /> MY TEAMS ({myTeams.length})
              </Link>
            </Button>
            <Button
              onClick={handleCreateTeam}
              variant="hero"
              size="xl"
              className="gap-2 font-bold"
            >
              <Plus className="h-4 w-4" /> TEAM {myTeams.length + 1}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleCreateTeam}
            variant="hero"
            size="xl"
            className="w-full gap-2 font-bold"
          >
            <Plus className="h-4 w-4" /> CREATE TEAM
          </Button>
        )}
      </div>
    </AppShell>
  );
}
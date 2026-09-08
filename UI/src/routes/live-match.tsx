import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Radio,
  RefreshCw,
  Trophy,
  MapPin,
  Plus,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/fc/AppShell";
import { Card } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { getMatchLive, getContests, getMyTeams, joinContest } from "@/lib/api-services";
import type { Contest, FantasyTeam } from "@/lib/api-types";
import { getFlow, setFlow, removeFlow, FLOW_KEYS } from "@/lib/flow";
import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/live-match")({ component: LiveMatch });

const TEAM_FLAGS: Record<string, string> = {
  INDIA: "🇮🇳", IND: "🇮🇳", AUSTRALIA: "🇦🇺", AUS: "🇦🇺",
  ENGLAND: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "SOUTH AFRICA": "🇿🇦", SA: "🇿🇦",
  "NEW ZEALAND": "🇳🇿", NZ: "🇳🇿", PAKISTAN: "🇵🇰", PAK: "🇵🇰",
  CSK: "🦁", MI: "⚡", RCB: "🔥", KKR: "⚔️",
};

function getFlag(name?: string): string {
  if (!name) return "🏏";
  const upper = name.toUpperCase().trim();
  return TEAM_FLAGS[upper] || "🏏";
}

function LiveMatch() {
  const navigate = useNavigate();
  const matchId = getFlow<string | null>(FLOW_KEYS.selectedMatchId, null);

  const [tab, setTab] = useState<string>("Live");
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
      setJoinSuccess("Joined contest successfully!");
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
            Please pick a match from the Arena to open its match center.
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
  const format = pd.format || "T20";
  const tournament = pd.tournament || "T20 Championship";
  const dateStr = pd.date || "Today";
  
  const allTabs = [
    "Info", "Live", "Scorecard", "Squads", "Contests", "Teams", "Points Table", "Overs", "Graphs", "Full Commentary", "News"
  ];
  
  const isT20 = format.toLowerCase().includes("t20");
  const defaultTotalBalls = isT20 ? 120 : 300;
  
  let ovsLeft = "-";
  if (pd.currentOvers) {
    const oversNum = parseFloat(pd.currentOvers);
    const bowled = Math.floor(oversNum) * 6 + Math.round((oversNum % 1) * 10);
    ovsLeft = (defaultTotalBalls - bowled).toString();
  }

  return (
    <AppShell maxWidth="max-w-4xl">
      <PageHeader
        back="/matches"
        title="MATCH CENTER"
        right={
          <button
            onClick={() => void loadData(matchId)}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} />
          </button>
        }
      />

      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">
          {teamA} vs {teamB}, {format}, {tournament} - Live Cricket Score, Commentary
        </h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
          <span><strong>Series:</strong> {tournament}</span>
          <span>&bull;</span>
          <span><strong>Venue:</strong> {live?.venue || "Stadium"}</span>
          <span>&bull;</span>
          <span><strong>Date & Time:</strong> {dateStr}</span>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-4 border-b border-border/80 mb-6 pb-2 scrollbar-hide text-sm font-semibold">
        {allTabs.map(t => (
          <button
            key={t}
            onClick={() => {
              if (["Live", "Scorecard", "Contests", "Teams"].includes(t)) {
                setTab(t);
              }
            }}
            className={cn(
              "whitespace-nowrap px-1 pb-1 border-b-2 transition-colors",
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              !["Live", "Scorecard", "Contests", "Teams"].includes(t) && "cursor-not-allowed opacity-60"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <Card className="p-4 mb-6 border-border/80 bg-surface/90">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            {pd.firstInnings && pd.firstInnings.team === teamA && (
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-lg">{teamA}</span>
                <span className="font-bold text-lg">{pd.firstInnings.score} ({pd.firstInnings.overs})</span>
              </div>
            )}
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-lg text-primary">{pd.battingTeam || teamB}</span>
              <span className="font-bold text-xl text-primary">
                {pd.currentScore || 176}/{pd.currentWickets || 5} ({pd.currentOvers || 56})
              </span>
            </div>
            
            <div className="text-sm text-muted-foreground mt-2 font-medium">
              CRR: {pd.crr || "3.14"}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-end text-sm text-red-500 font-medium">
            {pd.statusText || "Day 3: 3rd Session - South Zone trail by 532 runs"}
          </div>
        </div>
      </Card>

      {joinSuccess && (
        <p className="mb-4 rounded border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
          {joinSuccess}
        </p>
      )}
      {joinError && (
        <p className="mb-4 rounded border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive">
          {joinError}
        </p>
      )}

      {tab === "Live" && (
        <>
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="w-full lg:w-[65%] border border-border/80 rounded bg-surface/50">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-2/50 text-muted-foreground border-b border-border/80">
                  <tr>
                    <th className="py-2 px-3 font-normal">Batter</th>
                    <th className="py-2 px-3 font-normal text-right">R</th>
                    <th className="py-2 px-3 font-normal text-right">B</th>
                    <th className="py-2 px-3 font-normal text-right">4s</th>
                    <th className="py-2 px-3 font-normal text-right">6s</th>
                    <th className="py-2 px-3 font-normal text-right">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(pd.batsmen || [
                    { name: "Tilak Varma", runs: 18, balls: 59, fours: 1, sixes: 0, isStriker: true },
                    { name: "Shreyas Gopal", runs: 2, balls: 12, fours: 0, sixes: 0, isStriker: false }
                  ]).map((bat: any, i: number) => {
                    const sr = bat.balls > 0 ? ((bat.runs / bat.balls) * 100).toFixed(2) : "0.00";
                    return (
                      <tr key={i} className={bat.isStriker ? "text-primary" : "text-foreground"}>
                        <td className="py-2 px-3">{bat.name} {bat.isStriker ? "*" : ""}</td>
                        <td className="py-2 px-3 text-right font-medium">{bat.runs}</td>
                        <td className="py-2 px-3 text-right">{bat.balls}</td>
                        <td className="py-2 px-3 text-right">{bat.fours || 0}</td>
                        <td className="py-2 px-3 text-right">{bat.sixes || 0}</td>
                        <td className="py-2 px-3 text-right">{sr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <table className="w-full text-sm text-left mt-2">
                <thead className="bg-surface-2/50 text-muted-foreground border-b border-border/80 border-t">
                  <tr>
                    <th className="py-2 px-3 font-normal">Bowler</th>
                    <th className="py-2 px-3 font-normal text-right">O</th>
                    <th className="py-2 px-3 font-normal text-right">M</th>
                    <th className="py-2 px-3 font-normal text-right">R</th>
                    <th className="py-2 px-3 font-normal text-right">W</th>
                    <th className="py-2 px-3 font-normal text-right">ECO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(pd.bowlers || (pd.bowler ? [pd.bowler] : [
                    { name: "Vaibhav S.", overs: "1", maidens: 0, runs: 1, wickets: 0, isCurrent: true },
                    { name: "Mohammed Shami", overs: "9", maidens: 4, runs: 12, wickets: 2, isCurrent: false }
                  ])).map((bowl: any, i: number) => {
                    const eco = bowl.overs > 0 ? (bowl.runs / bowl.overs).toFixed(2) : "0.00";
                    return (
                      <tr key={i} className="text-foreground">
                        <td className="py-2 px-3">{bowl.name} {bowl.isCurrent ? "*" : ""}</td>
                        <td className="py-2 px-3 text-right">{bowl.overs}</td>
                        <td className="py-2 px-3 text-right">{bowl.maidens || 0}</td>
                        <td className="py-2 px-3 text-right font-medium">{bowl.runs}</td>
                        <td className="py-2 px-3 text-right font-medium text-red-500">{bowl.wickets}</td>
                        <td className="py-2 px-3 text-right">{bowl.economy || eco}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="w-full lg:w-[35%] border border-border/80 rounded bg-surface/50 p-4 text-sm flex flex-col gap-3">
              <div className="font-bold mb-1 text-muted-foreground uppercase text-xs">Key Stats</div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Partnership:</span>
                <span className="font-medium">{pd.keyStats?.partnership || pd.partnership || "38 (24)"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Wkt:</span>
                <span className="font-medium truncate ml-2 text-right">{pd.keyStats?.lastWkt || pd.lastWicket || "Rohit Sharma c Kohli b Shami 45(30)"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ovs Left:</span>
                <span className="font-medium">{pd.keyStats?.ovsLeft || ovsLeft}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last 10 ovs:</span>
                <span className="font-medium">{pd.keyStats?.last10Ovs || pd.last10Overs || "76/2"}</span>
              </div>
              <div className="flex justify-between mt-auto pt-2 border-t border-border/60">
                <span className="text-muted-foreground">Toss:</span>
                <span className="font-medium truncate ml-2 text-right">{pd.keyStats?.toss || pd.toss || "Elected to bat first"}</span>
              </div>
            </div>
          </div>

          {Array.isArray(pd.recentBalls) && pd.recentBalls.length > 0 && (
            <div className="flex items-center gap-2 text-sm p-3 bg-surface/30 border border-border/50 rounded mb-6">
              <span className="font-bold text-muted-foreground">Recent:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {pd.recentBalls.map((b: string, i: number) => {
                  const isPipe = b === "|";
                  const isW = b === "W" || b.includes("W");
                  const isB = b === "4" || b === "6";
                  
                  if (isPipe) {
                    return <span key={i} className="text-muted-foreground mx-1">|</span>;
                  }
                  
                  return (
                    <span
                      key={i}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                        isW ? "bg-red-500/10 text-red-500 border border-red-500/30"
                        : isB ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                        : "bg-surface-2 text-foreground border border-border"
                      )}
                    >
                      {b}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-0 divide-y divide-border/60 border border-border/80 rounded bg-surface/30">
            {((pd.commentary || [
              { over: "55.6", text: "Mohammed Shami to Shreyas Gopal, no run, full and driven to mid-on with ease" },
              { over: "55.5", text: "Mohammed Shami to Shreyas Gopal, no run, solidly defended off the front foot" },
              { over: "55.4", text: "Mohammed Shami to Tilak Varma, 1 run, worked off the pads to deep square leg" }
            ]) as any[]).map((c, idx) => (
              <div key={idx} className="flex p-4 gap-4 hover:bg-surface/50 transition-colors">
                <div className="w-12 shrink-0 font-bold text-muted-foreground mt-0.5">
                  {c.over}
                </div>
                <div className="flex-1 text-sm leading-relaxed">
                  {c.text}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "Scorecard" && (
        <div className="p-12 text-center text-muted-foreground border border-border/80 rounded bg-surface/30">
          Full scorecard view goes here.
        </div>
      )}

      {tab === "Contests" && (
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Available Contests</h3>
            <Button
              variant="outlineGreen"
              size="sm"
              onClick={handleCreateTeam}
              className="gap-1"
            >
              <Plus className="h-4 w-4" /> Create Team
            </Button>
          </div>

          {!contests.length ? (
            <div className="text-center py-8 text-muted-foreground border border-border/80 rounded bg-surface/30">
              No contests currently open for this match.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {contests.map((c) => (
                <div
                  key={c._id}
                  className="flex flex-col justify-between rounded-xl border border-border/80 bg-surface/90 p-5 shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{c.name}</span>
                      <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                        {c.rules?.entryFee === 0 ? "FREE" : `₹${c.rules?.entryFee}`}
                      </span>
                    </div>

                    <div className="my-4 rounded-xl border border-border/60 bg-surface-2/60 p-3 flex justify-between">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Prize Pool</p>
                        <p className="text-lg font-bold text-primary">₹{(c.rules?.prizePool || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase text-muted-foreground">Entry Fee</p>
                        <p className="font-bold">{c.rules?.entryFee === 0 ? "Free" : `₹${c.rules?.entryFee}`}</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    disabled={joiningId === c._id}
                    onClick={() => handleJoin(c._id)}
                    className="mt-2 w-full font-bold"
                  >
                    {joiningId === c._id ? "Joining..." : "Join Now"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "Teams" && (
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">My Teams ({myTeams.length})</h3>
            <Button
              size="sm"
              onClick={handleCreateTeam}
              className="gap-1"
            >
              <Plus className="h-4 w-4" /> Create Team
            </Button>
          </div>

          {!myTeams.length ? (
            <div className="text-center py-10 border border-border/80 rounded bg-surface/30">
              <p className="font-bold mb-2">No teams created yet.</p>
              <Button onClick={handleCreateTeam}>Create Team</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {myTeams.map((team, idx) => (
                <div key={team._id} className="rounded-xl border border-border/80 bg-surface p-5">
                  <div className="flex justify-between border-b border-border/60 pb-3">
                    <div>
                      <span className="font-bold">{team.name || `Team ${idx + 1}`}</span>
                      <p className="text-xs text-muted-foreground">{(team.players || []).length} Players</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary">{team.totalPoints || 0} pts</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded bg-surface-2 p-2">
                      <span className="font-bold text-amber-500">CAP (2X)</span>
                      <p className="font-bold mt-1 truncate">{(team as any).captain?.name || "Selected"}</p>
                    </div>
                    <div className="rounded bg-surface-2 p-2">
                      <span className="font-bold text-purple-500">VC (1.5X)</span>
                      <p className="font-bold mt-1 truncate">{(team as any).viceCaptain?.name || "Selected"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

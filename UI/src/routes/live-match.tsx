import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Radio,
  RefreshCw,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Video,
  Newspaper,
  ChevronRight,
  Shield,
  UserCheck,
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
  "PAKISTAN W": "🇵🇰",
  PAKW: "🇵🇰",
  "HONG KONG W": "🇭🇰",
  HKGW: "🇭🇰",
  BANGLADESH: "🇧🇩",
  BAN: "🇧🇩",
  "BANGLADESH WOMEN": "🇧🇩",
  "BANGLADESH W": "🇧🇩",
  BANW: "🇧🇩",
  "UNITED ARAB EMIRATES WOMEN": "🇦🇪",
  "UAE W": "🇦🇪",
  UAEW: "🇦🇪",
  "EAST ZONE": "🏏",
  EZONE: "🏏",
  "SOUTH ZONE": "🏏",
  SZONE: "🏏",
  "AMRITSAR LIONS (AMS)": "🦁",
  AMS: "🦁",
  "MOHALI KINGS (MHK)": "👑",
  MHK: "👑",
  "GUYANA AMAZON WARRIORS": "🏹",
  GAW: "🏹",
  "ANTIGUA AND BARBUDA FALCONS": "🦅",
  ABF: "🦅",
  YORKSHIRE: "🏏",
  YORKS: "🏏",
  ESSEX: "🏏",
  ESS: "🏏",
  CSK: "🦁",
  MI: "⚡",
  RCB: "🔥",
  KKR: "⚔️",
};

function getFlag(name?: string): string {
  if (!name) return "🏏";
  const upper = name.toUpperCase().trim();
  return TEAM_FLAGS[upper] || "🏏";
}

const SIDEBAR_NEWS = [
  { id: "1", title: "Afghanistan to host Zimbabwe, Bangladesh in ODI tri-series", timeAgo: "3h ago" },
  { id: "2", title: "Nahid Rana unlikely to get NOC for Big Bash League", timeAgo: "4h ago" },
  { id: "3", title: "Rohit Yadav withdrawn from India U-19 squads due to age discrepancy", timeAgo: "6h ago" },
  { id: "4", title: "Cricket Australia officially opens door to private investment in Big Bash", timeAgo: "6h ago" },
  { id: "5", title: "Chapman shifts to casual contract with New Zealand", timeAgo: "8h ago" },
];

const SIDEBAR_VIDEOS = [
  {
    id: "vid-1",
    title: "Injuries hit India's squad! Bumrah returns... Where's Hardik?",
    duration: "02:56",
    thumbnail: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "vid-2",
    title: "Pakistan hit new low! 7 players sent home & new coach in",
    duration: "03:27",
    thumbnail: "https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=400&q=80",
  },
];

function LiveMatch() {
  const navigate = useNavigate();

  // Read matchId from URL query param if present, or from TanStack flow state
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const urlMatchId = urlParams?.get("matchId");
  const matchId = urlMatchId || getFlow<string | null>(FLOW_KEYS.selectedMatchId, null);

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
    if (urlMatchId && urlMatchId !== getFlow<string | null>(FLOW_KEYS.selectedMatchId, null)) {
      setFlow(FLOW_KEYS.selectedMatchId, urlMatchId);
    }
  }, [urlMatchId]);

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
      if (data?.matchId === matchId || data?.providerMatchId === matchId) {
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
  const teamA = live?.teamA || "East Zone";
  const teamB = live?.teamB || "South Zone";
  const format = pd.format || "FC";
  const tournament = pd.tournament || pd.series || "Duleep Trophy 2026";
  const dateStr = pd.info?.date || pd.date || "Sunday, September 6";
  const venueStr = live?.venue || pd.venue || "MA Chidambaram Stadium, Chennai";

  const allTabs = [
    "Info",
    "Live",
    "Scorecard",
    "Squads",
    "Contests",
    "Teams",
    "Points Table",
    "Overs",
    "Graphs",
    "Highlights",
    "Full Commentary",
    "News",
  ];

  // Match Info facts
  const infoObj = pd.info || {
    match: `${pd.teamACode || teamA} vs ${pd.teamBCode || teamB} • Final • ${tournament}`,
    series: tournament,
    date: dateStr,
    time: pd.time || "9:30 AM LOCAL, 4:00 AM GMT, 9:30 AM IST",
    toss: pd.toss || `${teamA} won the toss and opt to Bat`,
    venue: venueStr,
    umpires: "Virender Sharma, Rohan Pandit",
    thirdUmpire: "Jayaraman Madanagopal",
    referee: "Pankaj Dharmani",
    eastZoneSquad: {
      team: teamA,
      players: [
        "Abhimanyu Easwaran", "Vaibhav Sooryavanshi", "Kumar Kushagra (wk)",
        "Sudip Kumar Gharami", "Shikhar Mohan", "Ishan Kishan (c)",
        "Md Kounain Quraishi", "Anukul Roy", "Mohammed Shami",
        "Abhijit K Sarkar", "Mukesh Kumar"
      ],
      bench: ["Virat Singh", "Subhranshu Senapati", "Shahbaz Ahmed", "Denish Das", "Suraj Sindhu Jaiswal"]
    },
    southZoneSquad: {
      team: teamB,
      players: [
        "Ricky Bhui", "Narayan Jagadeesan (wk)", "Devdutt Padikkal",
        "Tilak Varma", "Shreyas Gopal", "Smaran Ravichandran",
        "Washington Sundar", "Sai Kishore", "Prasidh Krishna",
        "Vijaykumar Vyshak", "Vidwath Kaverappa"
      ],
      bench: ["Mayank Agarwal", "Baba Indrajith", "Tanmay Agarwal", "Rohit Rayudu"]
    }
  };

  const squadA = infoObj.eastZoneSquad || infoObj.squadA || {
    team: teamA,
    players: ["Abhimanyu Easwaran", "Vaibhav Sooryavanshi", "Kumar Kushagra (wk)", "Sudip Kumar Gharami", "Shikhar Mohan", "Ishan Kishan (c)", "Md Kounain Quraishi", "Anukul Roy", "Mohammed Shami", "Abhijit K Sarkar", "Mukesh Kumar"],
    bench: ["Virat Singh", "Subhranshu Senapati", "Shahbaz Ahmed", "Denish Das", "Suraj Sindhu Jaiswal"]
  };

  const squadB = infoObj.southZoneSquad || infoObj.squadB || {
    team: teamB,
    players: ["Ricky Bhui", "Narayan Jagadeesan (wk)", "Devdutt Padikkal", "Tilak Varma", "Shreyas Gopal", "Smaran Ravichandran", "Washington Sundar", "Sai Kishore", "Prasidh Krishna", "Vijaykumar Vyshak", "Vidwath Kaverappa"],
    bench: ["Mayank Agarwal", "Baba Indrajith", "Tanmay Agarwal", "Rohit Rayudu"]
  };

  const scorecardData = pd.scorecard || {
    firstInnings: {
      team: teamA,
      score: pd.scoreA || "708",
      overs: "165.3 ov",
      batting: [
        { name: "Abhimanyu Easwaran", dismissal: "c Jagadeesan b Krishna", runs: 85, balls: 142, fours: 9, sixes: 0, sr: "59.85" },
        { name: "Vaibhav Sooryavanshi", dismissal: "b Sundar", runs: 42, balls: 68, fours: 5, sixes: 1, sr: "61.76" },
        { name: "Kumar Kushagra (wk)", dismissal: "c Bhui b Kaverappa", runs: 164, balls: 230, fours: 18, sixes: 3, sr: "71.30" },
        { name: "Sudip Kumar Gharami", dismissal: "c & b Sai Kishore", runs: 49, balls: 96, fours: 6, sixes: 0, sr: "51.04" },
        { name: "Ishan Kishan (c)", dismissal: "lbw b Sai Kishore", runs: 112, balls: 160, fours: 12, sixes: 2, sr: "70.00" },
        { name: "Shahbaz Ahmed", dismissal: "not out", runs: 124, balls: 175, fours: 14, sixes: 2, sr: "70.85" },
        { name: "Anukul Roy", dismissal: "c Padikkal b Vyshak", runs: 58, balls: 84, fours: 7, sixes: 1, sr: "69.04" }
      ],
      bowling: [
        { name: "Prasidh Krishna", overs: "32.0", maidens: 6, runs: 138, wickets: 3, economy: "4.31" },
        { name: "Washington Sundar", overs: "38.0", maidens: 5, runs: 145, wickets: 1, economy: "3.81" },
        { name: "Sai Kishore", overs: "41.0", maidens: 7, runs: 162, wickets: 3, economy: "3.95" }
      ]
    },
    secondInnings: {
      team: teamB,
      score: pd.scoreB || "217/5",
      overs: "71.5 ov",
      batting: [
        { name: "Ricky Bhui", dismissal: "c Kishan b Shami", runs: 38, balls: 72, fours: 5, sixes: 0, sr: "52.77" },
        { name: "Narayan Jagadeesan (wk)", dismissal: "b Sarkar", runs: 24, balls: 55, fours: 3, sixes: 0, sr: "43.63" },
        { name: "Devdutt Padikkal", dismissal: "c Roy b Shami", runs: 48, balls: 92, fours: 6, sixes: 1, sr: "52.17" },
        { name: "Smaran Ravichandran", dismissal: "c Kushagra b Shami", runs: 23, balls: 55, fours: 3, sixes: 0, sr: "41.81" },
        { name: "Tilak Varma", dismissal: "batting", runs: 44, balls: 111, fours: 4, sixes: 0, sr: "39.64", isStriker: true },
        { name: "Shreyas Gopal", dismissal: "batting", runs: 15, balls: 56, fours: 0, sixes: 0, sr: "26.79" }
      ],
      bowling: [
        { name: "Mohammed Shami", overs: "18.0", maidens: 6, runs: 42, wickets: 3, economy: "2.33" },
        { name: "Abhijit K Sarkar", overs: "7.5", maidens: 0, runs: 33, wickets: 0, economy: "4.21" },
        { name: "Md Kounain Quraishi", overs: "27.0", maidens: 5, runs: 73, wickets: 0, economy: "2.70" }
      ]
    }
  };

  return (
    <AppShell maxWidth="max-w-6xl">
      <PageHeader
        back="/matches"
        title="MATCH CENTER"
        right={
          <button
            onClick={() => void loadData(matchId)}
            type="button"
            title="Refresh scorecard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Match Title & Series Subtitle (Cricbuzz Header) */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {teamA} vs {teamB}, Final, {tournament} - Commentary
        </h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
          <span><strong>Series:</strong> {tournament}</span>
          <span>&bull;</span>
          <span><strong>Venue:</strong> {venueStr}</span>
          <span>&bull;</span>
          <span><strong>Date & Time:</strong> {dateStr}, {infoObj.time?.split(",")[0] || "9:30 AM LOCAL"}</span>
        </div>
      </div>

      {/* Tab Navigation Strip (All Cricbuzz Tabs) */}
      <div className="flex overflow-x-auto gap-4 sm:gap-6 border-b border-border/80 mb-6 pb-2 scrollbar-none text-sm font-semibold">
        {allTabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "whitespace-nowrap px-1 pb-1 border-b-2 transition-colors cursor-pointer",
              tab === t
                ? "border-emerald-500 text-emerald-400 font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Feedback alerts */}
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

      {/* ============================================================= */}
      {/* 1. INFO TAB (MATCHES CRICBUZZ SCREENSHOT 5)                    */}
      {/* ============================================================= */}
      {tab === "Info" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Info Facts (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
              <div className="bg-emerald-950/40 border-b border-border/80 px-4 py-2.5">
                <h2 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  INFO
                </h2>
              </div>

              <div className="divide-y divide-border/60 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-2 sm:gap-8">
                  <span className="w-36 text-muted-foreground font-bold shrink-0">Match</span>
                  <span className="font-semibold text-foreground">{infoObj.match}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-2 sm:gap-8 hover:bg-surface-2/40 transition-colors">
                  <span className="w-36 text-muted-foreground font-bold shrink-0">Series</span>
                  <span className="font-semibold text-foreground flex items-center justify-between flex-1">
                    <span>{infoObj.series}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-2 sm:gap-8">
                  <span className="w-36 text-muted-foreground font-bold shrink-0">Date</span>
                  <span className="font-medium text-foreground">{infoObj.date}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-2 sm:gap-8">
                  <span className="w-36 text-muted-foreground font-bold shrink-0">Time</span>
                  <span className="font-medium text-foreground">{infoObj.time}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-2 sm:gap-8">
                  <span className="w-36 text-muted-foreground font-bold shrink-0">Toss</span>
                  <span className="font-medium text-emerald-300">{infoObj.toss}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-2 sm:gap-8 hover:bg-surface-2/40 transition-colors">
                  <span className="w-36 text-muted-foreground font-bold shrink-0">Venue</span>
                  <span className="font-semibold text-foreground flex items-center justify-between flex-1">
                    <span>{infoObj.venue}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-2 sm:gap-8">
                  <span className="w-36 text-muted-foreground font-bold shrink-0">Umpires</span>
                  <span className="font-medium text-foreground">{infoObj.umpires}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-2 sm:gap-8">
                  <span className="w-36 text-muted-foreground font-bold shrink-0">3rd Umpire</span>
                  <span className="font-medium text-foreground">{infoObj.thirdUmpire}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-2 sm:gap-8">
                  <span className="w-36 text-muted-foreground font-bold shrink-0">Referee</span>
                  <span className="font-medium text-foreground">{infoObj.referee}</span>
                </div>

                {/* Team A Squad */}
                <div className="flex flex-col px-4 py-3.5 gap-2">
                  <span className="text-muted-foreground font-bold text-xs uppercase tracking-wider text-emerald-400">
                    {squadA.team} Squad
                  </span>
                  <div className="text-xs leading-relaxed space-y-1.5">
                    <p>
                      <strong className="text-foreground">Players: </strong>
                      <span className="text-muted-foreground">{squadA.players.join(", ")}</span>
                    </p>
                    {squadA.bench && squadA.bench.length > 0 && (
                      <p>
                        <strong className="text-foreground">Bench: </strong>
                        <span className="text-muted-foreground">{squadA.bench.join(", ")}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Team B Squad */}
                <div className="flex flex-col px-4 py-3.5 gap-2">
                  <span className="text-muted-foreground font-bold text-xs uppercase tracking-wider text-emerald-400">
                    {squadB.team} Squad
                  </span>
                  <div className="text-xs leading-relaxed space-y-1.5">
                    <p>
                      <strong className="text-foreground">Players: </strong>
                      <span className="text-muted-foreground">{squadB.players.join(", ")}</span>
                    </p>
                    {squadB.bench && squadB.bench.length > 0 && (
                      <p>
                        <strong className="text-foreground">Bench: </strong>
                        <span className="text-muted-foreground">{squadB.bench.join(", ")}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Latest News (Screenshot 5) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <h3 className="text-red-500 font-display text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Newspaper className="h-4 w-4 text-red-500" />
                <span>LATEST NEWS</span>
              </h3>
            </div>

            <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-surface/80 p-2 shadow-sm">
              {SIDEBAR_NEWS.map((n) => (
                <div
                  key={n.id}
                  onClick={() => navigate({ to: "/matches" })}
                  className="p-3 cursor-pointer hover:bg-surface-2/60 rounded-lg transition-colors group"
                >
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {n.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-1">{n.timeAgo}</p>
                </div>
              ))}
              <div className="p-2 pt-3">
                <Button
                  asChild
                  variant="hero"
                  size="sm"
                  className="w-full text-xs font-bold"
                >
                  <Link to="/matches">More News &gt;</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 2. LIVE TAB (MATCHES CRICBUZZ SCREENSHOT 4)                    */}
      {/* ============================================================= */}
      {tab === "Live" && (
        <div className="space-y-6">
          {/* Cricbuzz Big Scorecard Banner */}
          <Card className="p-5 border-border/80 bg-surface/90 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                {/* 1st Innings Score */}
                <div className="flex items-center gap-4 text-sm font-semibold text-muted-foreground">
                  <span className="text-foreground font-bold">{pd.teamACode || teamA}</span>
                  <span className="font-mono text-base">{pd.scoreA || "708"}</span>
                </div>

                {/* 2nd Innings Score (Current) */}
                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-xl sm:text-2xl font-black text-emerald-400">
                    {pd.teamBCode || teamB}
                  </span>
                  <span className="text-2xl sm:text-3xl font-mono font-black text-white">
                    {pd.currentScore || 217}/{pd.currentWickets || 5}
                  </span>
                  <span className="text-sm font-mono text-muted-foreground">
                    ({pd.currentOvers || "71.5"})
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-300 ml-2">
                    CRR: {pd.crr || "3.02"}
                  </span>
                </div>
              </div>

              {/* Status Trail / Requirement */}
              <div className="text-sm font-bold text-red-400 bg-red-950/30 border border-red-800/40 px-3.5 py-2 rounded-lg">
                {pd.statusText || "Day 3: 3rd Session - South Zone trail by 491 runs"}
              </div>
            </div>
          </Card>

          {/* Batters, Bowlers & Key Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 cols: Batter & Bowler Tables */}
            <div className="lg:col-span-8 space-y-4">
              {/* Batter Table */}
              <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-2/70 text-muted-foreground font-bold border-b border-border/80 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Batter</th>
                      <th className="py-2.5 px-3 text-right">R</th>
                      <th className="py-2.5 px-3 text-right">B</th>
                      <th className="py-2.5 px-3 text-right">4s</th>
                      <th className="py-2.5 px-3 text-right">6s</th>
                      <th className="py-2.5 px-3 text-right">SR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {(pd.batsmen || [
                      { name: "Tilak Varma", runs: 44, balls: 111, fours: 4, sixes: 0, sr: "39.64", isStriker: true },
                      { name: "Shreyas Gopal", runs: 15, balls: 56, fours: 0, sixes: 0, sr: "26.79", isStriker: false }
                    ]).map((bat: any, i: number) => (
                      <tr
                        key={i}
                        className={cn(
                          "transition-colors",
                          bat.isStriker ? "text-emerald-400 font-bold bg-emerald-950/10" : "text-foreground"
                        )}
                      >
                        <td className="py-2.5 px-3 flex items-center gap-1.5">
                          <span>{bat.name}</span>
                          {bat.isStriker && <span className="text-emerald-400 font-black">*</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono">{bat.runs}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">{bat.balls}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{bat.fours || 0}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{bat.sixes || 0}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-300">
                          {bat.sr || (bat.balls > 0 ? ((bat.runs / bat.balls) * 100).toFixed(2) : "0.00")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bowler Table */}
              <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-2/70 text-muted-foreground font-bold border-b border-border/80 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Bowler</th>
                      <th className="py-2.5 px-3 text-right">O</th>
                      <th className="py-2.5 px-3 text-right">M</th>
                      <th className="py-2.5 px-3 text-right">R</th>
                      <th className="py-2.5 px-3 text-right">W</th>
                      <th className="py-2.5 px-3 text-right">ECO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {(pd.bowlers || (pd.bowler ? [pd.bowler] : [
                      { name: "Abhijit K Sarkar", overs: "7.5", maidens: 0, runs: 33, wickets: 0, economy: "4.21", isCurrent: true },
                      { name: "Md Kounain Quraishi", overs: "27", maidens: 5, runs: 73, wickets: 0, economy: "2.70", isCurrent: false }
                    ])).map((bowl: any, i: number) => (
                      <tr key={i} className="text-foreground">
                        <td className="py-2.5 px-3 flex items-center gap-1.5">
                          <span>{bowl.name}</span>
                          {bowl.isCurrent && <span className="text-emerald-400 font-black">*</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{bowl.overs}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">{bowl.maidens || 0}</td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono">{bowl.runs}</td>
                        <td className="py-2.5 px-3 text-right font-black font-mono text-red-400">{bowl.wickets || 0}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-300">
                          {bowl.economy || bowl.eco || "4.21"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Recent Balls Strip (Have Your Say | Recent: 0 0 0 0 0) */}
              <div className="flex items-center gap-3 p-3 bg-surface/70 border border-border/80 rounded-xl text-xs font-medium">
                <span className="text-muted-foreground font-bold">Have Your Say</span>
                <span className="text-border">|</span>
                <span className="text-muted-foreground font-bold">Recent:</span>
                <div className="flex items-center gap-1.5">
                  {(pd.recentBalls || ["0", "0", "0", "0", "0"]).map((b: string, i: number) => (
                    <span
                      key={i}
                      className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center font-mono font-bold text-[11px]",
                        b === "W"
                          ? "bg-red-500 text-white"
                          : b === "4" || b === "6"
                          ? "bg-emerald-500 text-white"
                          : "bg-surface-2 text-foreground border border-border"
                      )}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* Commentary Feed */}
              <div className="divide-y divide-border/60 border border-border/80 rounded-xl bg-surface/80 overflow-hidden">
                <div className="bg-surface-2/60 px-4 py-2 text-xs font-black uppercase text-muted-foreground tracking-wider">
                  LIVE COMMENTARY
                </div>
                {((pd.commentary || [
                  { over: "71.5", text: "Abhijit K Sarkar to Tilak Varma, no run, length ball outside off, left alone safely through to the keeper" },
                  { over: "71.4", text: "Abhijit K Sarkar to Tilak Varma, no run, defended solidly from the crease toward mid-wicket" },
                  { over: "71.3", text: "Abhijit K Sarkar to Tilak Varma, no run, back of a length outside off, steered gently to point" },
                  { over: "71.2", text: "Abhijit K Sarkar to Tilak Varma, no run, good length on the stumps, pushed with soft hands to mid-on" },
                  { over: "71.1", text: "Abhijit K Sarkar to Tilak Varma, no run, full and swinging in, blocked resolutely to silly mid-off" },
                  { over: "70.6", text: "Md Kounain Quraishi to Shreyas Gopal, no run, looped up on middle, defended forward" }
                ]) as any[]).map((c, idx) => (
                  <div key={idx} className="flex p-3.5 gap-3 hover:bg-surface-2/30 transition-colors">
                    <span className="w-12 shrink-0 font-mono font-black text-emerald-400 text-xs mt-0.5">
                      {c.over}
                    </span>
                    <p className="flex-1 text-xs text-foreground/90 leading-relaxed">
                      {c.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 4 cols: Key Stats Card & Featured Videos (Screenshot 4) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Key Stats Card */}
              <div className="rounded-xl border border-border/80 bg-surface/90 p-4 text-xs space-y-3 shadow-sm">
                <div className="font-black text-muted-foreground uppercase text-[11px] tracking-wider border-b border-border/60 pb-2">
                  KEY STATS
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Partnership:</span>
                  <span className="font-bold text-foreground font-mono">
                    {pd.keyStats?.partnership || "43 (109)"}
                  </span>
                </div>
                <div className="flex flex-col gap-1 border-t border-border/40 pt-2">
                  <span className="text-muted-foreground font-semibold">Last Wkt:</span>
                  <span className="text-foreground leading-snug text-[11px]">
                    {pd.keyStats?.lastWkt || "Smaran Ravichandran c Kumar Kushagra b Mohammed Shami 23(55) - 174/5 in 53.4 ov."}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-border/40 pt-2">
                  <span className="text-muted-foreground font-semibold">Ovs Left:</span>
                  <span className="font-bold text-foreground font-mono">
                    {pd.keyStats?.ovsLeft || "18.1"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-border/40 pt-2">
                  <span className="text-muted-foreground font-semibold">Last 10 ovs:</span>
                  <span className="font-bold text-foreground font-mono">
                    {pd.keyStats?.last10Ovs || "24 runs, 0 wkts"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-border/40 pt-2">
                  <span className="text-muted-foreground font-semibold">Toss:</span>
                  <span className="font-bold text-emerald-300 text-right truncate ml-2">
                    {pd.keyStats?.toss || "East Zone (Batting)"}
                  </span>
                </div>
              </div>

              {/* Featured Videos Sidebar (Screenshot 4) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/80 pb-2">
                  <h3 className="text-red-500 font-display text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Video className="h-4 w-4 text-red-500" />
                    <span>FEATURED VIDEOS</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {SIDEBAR_VIDEOS.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => navigate({ to: "/matches" })}
                      className="group cursor-pointer rounded-xl overflow-hidden border border-border/80 bg-surface/80 hover:border-primary/60 transition-all p-2.5 shadow-sm"
                    >
                      <div className="relative h-28 rounded-lg overflow-hidden bg-surface-2 flex items-center justify-center mb-2">
                        <img
                          src={v.thumbnail}
                          alt={v.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                        <div className="bg-primary/90 text-primary-foreground rounded-full p-2 z-10 shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="h-3.5 w-3.5 fill-current" />
                        </div>
                        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                          {v.duration}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                        {v.title}
                      </h4>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 3. SCORECARD TAB (FULL INNINGS 1 & 2 BREAKDOWN)               */}
      {/* ============================================================= */}
      {tab === "Scorecard" && (
        <div className="space-y-6">
          {/* Innings 1 Card */}
          <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
            <div className="bg-emerald-950/40 border-b border-border/80 px-4 py-3 flex items-center justify-between">
              <span className="font-bold text-emerald-400 text-sm">
                {scorecardData.firstInnings.team} 1st Innings
              </span>
              <span className="font-mono font-black text-white text-base">
                {scorecardData.firstInnings.score} ({scorecardData.firstInnings.overs})
              </span>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-surface-2/60 text-muted-foreground font-bold border-b border-border/80 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Batter</th>
                  <th className="py-2.5 px-3">Dismissal</th>
                  <th className="py-2.5 px-3 text-right">R</th>
                  <th className="py-2.5 px-3 text-right">B</th>
                  <th className="py-2.5 px-3 text-right">4s</th>
                  <th className="py-2.5 px-3 text-right">6s</th>
                  <th className="py-2.5 px-3 text-right">SR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {scorecardData.firstInnings.batting.map((b: any, i: number) => (
                  <tr key={i} className="hover:bg-surface-2/30 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-foreground">{b.name}</td>
                    <td className="py-2.5 px-3 text-muted-foreground text-[11px]">{b.dismissal}</td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-foreground">{b.runs}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">{b.balls}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{b.fours}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{b.sixes}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-300">{b.sr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Innings 2 Card */}
          <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
            <div className="bg-emerald-950/40 border-b border-border/80 px-4 py-3 flex items-center justify-between">
              <span className="font-bold text-emerald-400 text-sm">
                {scorecardData.secondInnings.team} 2nd Innings
              </span>
              <span className="font-mono font-black text-white text-base">
                {scorecardData.secondInnings.score} ({scorecardData.secondInnings.overs})
              </span>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-surface-2/60 text-muted-foreground font-bold border-b border-border/80 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Batter</th>
                  <th className="py-2.5 px-3">Dismissal</th>
                  <th className="py-2.5 px-3 text-right">R</th>
                  <th className="py-2.5 px-3 text-right">B</th>
                  <th className="py-2.5 px-3 text-right">4s</th>
                  <th className="py-2.5 px-3 text-right">6s</th>
                  <th className="py-2.5 px-3 text-right">SR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {scorecardData.secondInnings.batting.map((b: any, i: number) => (
                  <tr key={i} className="hover:bg-surface-2/30 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-foreground">
                      {b.name} {b.isStriker ? "*" : ""}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground text-[11px]">{b.dismissal}</td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-foreground">{b.runs}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">{b.balls}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{b.fours}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{b.sixes}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-300">{b.sr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 4. SQUADS TAB                                                 */}
      {/* ============================================================= */}
      {tab === "Squads" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border/80 bg-surface/90 p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-emerald-400 text-base flex items-center gap-2">
              <Shield className="h-5 w-5" /> {squadA.team} (Playing XI)
            </h3>
            <div className="space-y-2">
              {squadA.players.map((p: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs p-2 rounded-lg bg-surface-2/40">
                  <UserCheck className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-foreground">{p}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-surface/90 p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-emerald-400 text-base flex items-center gap-2">
              <Shield className="h-5 w-5" /> {squadB.team} (Playing XI)
            </h3>
            <div className="space-y-2">
              {squadB.players.map((p: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs p-2 rounded-lg bg-surface-2/40">
                  <UserCheck className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-foreground">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 5. CONTESTS TAB (FANTASY CONTEST JOINING)                      */}
      {/* ============================================================= */}
      {tab === "Contests" && (
        <div className="mt-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Available Contests</h3>
            <Button
              variant="outlineGreen"
              size="sm"
              onClick={handleCreateTeam}
              className="gap-1 font-bold"
            >
              <Plus className="h-4 w-4" /> Create Team
            </Button>
          </div>

          {!contests.length ? (
            <div className="text-center py-10 text-muted-foreground border border-border/80 rounded-xl bg-surface/40">
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
                      <span className="font-bold text-foreground">{c.name}</span>
                      <span className="rounded bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                        {c.rules?.entryFee === 0 ? "FREE" : `₹${c.rules?.entryFee}`}
                      </span>
                    </div>

                    <div className="my-4 rounded-xl border border-border/60 bg-surface-2/60 p-3 flex justify-between">
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Prize Pool</p>
                        <p className="text-lg font-black text-primary font-mono">
                          ₹{(c.rules?.prizePool || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Entry Fee</p>
                        <p className="font-bold text-foreground">
                          {c.rules?.entryFee === 0 ? "Free" : `₹${c.rules?.entryFee}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    disabled={joiningId === c._id}
                    onClick={() => handleJoin(c._id)}
                    className="mt-2 w-full font-bold"
                    variant="hero"
                  >
                    {joiningId === c._id ? "Joining..." : "Join Contest"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* 6. TEAMS TAB                                                  */}
      {/* ============================================================= */}
      {tab === "Teams" && (
        <div className="mt-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">My Fantasy Teams</h3>
            <Button
              variant="hero"
              size="sm"
              onClick={handleCreateTeam}
              className="gap-1 font-bold"
            >
              <Plus className="h-4 w-4" /> Create Another Team
            </Button>
          </div>

          {!myTeams.length ? (
            <div className="text-center py-10 text-muted-foreground border border-border/80 rounded-xl bg-surface/40">
              You haven't created any teams for this match yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myTeams.map((team, idx) => (
                <div
                  key={team._id || idx}
                  className="p-4 rounded-xl border border-border/80 bg-surface/90 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary">{team.name || `Team ${idx + 1}`}</span>
                    <span className="text-xs text-muted-foreground font-mono">11 Players</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground border-t border-border/40 pt-2">
                    <span>Captain: <strong>{team.captainId ? "Selected" : "None"}</strong></span>
                    <span>Vice-Captain: <strong>{team.viceCaptainId ? "Selected" : "None"}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Other tabs fallback */}
      {!["Info", "Live", "Scorecard", "Squads", "Contests", "Teams"].includes(tab) && (
        <div className="p-12 text-center text-muted-foreground border border-border/80 rounded-xl bg-surface/40">
          <p className="text-sm font-semibold">{tab} data is updating in real-time...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Check the <button type="button" onClick={() => setTab("Live")} className="text-primary font-bold underline">Live</button> or <button type="button" onClick={() => setTab("Info")} className="text-primary font-bold underline">Info</button> tabs for complete match coverage.
          </p>
        </div>
      )}
    </AppShell>
  );
}

import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Radio,
  RefreshCw,
  Plus,
  Play,
  Video,
  Newspaper,
  ChevronRight,
  Shield,
  UserCheck,
  Building2,
  Tv,
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
  { id: "2", title: "Nahid Rana unlikely to get NOC for Big Bash League", timeAgo: "5h ago" },
  { id: "3", title: "Rohit Yadav withdrawn from India U-19 squads due to age discrepancy", timeAgo: "6h ago" },
  { id: "4", title: "Cricket Australia officially opens door to private investment in Big Bash", timeAgo: "7h ago" },
  { id: "5", title: "Chapman shifts to casual contract with New Zealand", timeAgo: "9h ago" },
];

const SIDEBAR_VIDEOS = [
  {
    id: "vid-1",
    title: "Pakistan hit new low! 7 players sent home & new coach in",
    duration: "3:27",
    thumbnail: "https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "vid-2",
    title: "Impact Player Rule Debate: Stay or Go?",
    duration: "3:22",
    thumbnail: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=400&q=80",
  },
];

async function fetchLiveOnlyMatches() {
  try {
    const res = await fetch("/api/v1/cricket/live");
    const json = await res.json();
    const list = json.data || [];
    return list.filter((m: any) => m.status === "LIVE");
  } catch {
    try {
      const res2 = await fetch("/api/cricket/live");
      const json2 = await res2.json();
      const list2 = json2.data || [];
      return list2.filter((m: any) => m.status === "LIVE");
    } catch {
      return [];
    }
  }
}

function LiveMatch() {
  const navigate = useNavigate();

  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const urlMatchId = urlParams?.get("matchId");
  const storedMatchId = getFlow<string | null>(FLOW_KEYS.selectedMatchId, null);

  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(urlMatchId || storedMatchId);
  const [tab, setTab] = useState<string>("Live");
  const [live, setLive] = useState<any>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [myTeams, setMyTeams] = useState<FantasyTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  // 1. Fetch only live matches for the Live Match Center selector
  useEffect(() => {
    fetchLiveOnlyMatches().then((activeLive) => {
      setLiveMatches(activeLive);
      // If user came to /live-match directly with no match selected, auto-select the first live match!
      if (!selectedId && activeLive.length > 0) {
        const firstId = activeLive[0].id || activeLive[0].dbId;
        setSelectedId(firstId);
        setFlow(FLOW_KEYS.selectedMatchId, firstId);
      }
    });
  }, []);

  // 2. Keep URL param and flow state synchronized
  useEffect(() => {
    if (urlMatchId && urlMatchId !== selectedId) {
      setSelectedId(urlMatchId);
      setFlow(FLOW_KEYS.selectedMatchId, urlMatchId);
    }
  }, [urlMatchId]);

  // 3. Load active match data
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
      // Fallback gracefully
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedId) {
      setLoading(false);
      return;
    }
    void loadData(selectedId);
  }, [selectedId]);

  // 4. Socket.IO live updates
  useEffect(() => {
    if (!selectedId) return;
    const socket = getSocket();
    socket.emit("match:subscribe", selectedId);

    const handleMatchUpdate = (data: any) => {
      if (data?.matchId === selectedId || data?.providerMatchId === selectedId) {
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
      socket.emit("match:unsubscribe", selectedId);
    };
  }, [selectedId]);

  function handleSelectLiveMatch(m: any) {
    const id = m.id || m.dbId;
    setSelectedId(id);
    setFlow(FLOW_KEYS.selectedMatchId, id);
    navigate({ to: "/live-match", search: { matchId: id } as any });
  }

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
      if (selectedId) void loadData(selectedId);
    } catch (err: any) {
      setJoinError(err?.message || "Unable to join contest");
    } finally {
      setJoiningId(null);
    }
  }

  function handleCreateTeam() {
    if (!selectedId) return;
    removeFlow(FLOW_KEYS.editingTeamId);
    removeFlow(FLOW_KEYS.selectedPlayerIds);
    removeFlow(FLOW_KEYS.captainId);
    removeFlow(FLOW_KEYS.viceCaptainId);
    setFlow(FLOW_KEYS.selectedMatchId, selectedId);
    setFlow(FLOW_KEYS.selectedTeamName, `Team ${myTeams.length + 1}`);
    navigate({ to: "/players" });
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
    "Points Table",
    "Overs",
    "Graphs",
    "Highlights",
    "Full Commentary",
    "News",
    "Contests",
    "Teams",
  ];

  // Match Info facts (Pics 2 & 3)
  const infoObj = pd.info || {
    match: `${pd.teamACode || "EZONE"} vs ${pd.teamBCode || "SZONE"} • Final • ${tournament}`,
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
        "Shaik Rasheed", "Tilak Varma (c)", "Smaran Ravichandran",
        "Shreyas Gopal", "Tripurana Vijay", "Mohammed Siraj",
        "Chama V Milind", "MD Nidheesh"
      ],
      bench: [
        "Kodimela Himateja", "Tanay Thyagarajan", "Vidwath Kaverappa",
        "Kavuri Saiteja", "Karun Nair", "Aman Khan", "Abhinav Tejrana"
      ]
    }
  };

  const squadA = infoObj.eastZoneSquad || infoObj.squadA || {
    team: teamA,
    players: [
      "Abhimanyu Easwaran", "Vaibhav Sooryavanshi", "Kumar Kushagra (wk)",
      "Sudip Kumar Gharami", "Shikhar Mohan", "Ishan Kishan (c)",
      "Md Kounain Quraishi", "Anukul Roy", "Mohammed Shami",
      "Abhijit K Sarkar", "Mukesh Kumar"
    ],
    bench: ["Virat Singh", "Subhranshu Senapati", "Shahbaz Ahmed", "Denish Das", "Suraj Sindhu Jaiswal"]
  };

  const squadB = infoObj.southZoneSquad || infoObj.squadB || {
    team: teamB,
    players: [
      "Ricky Bhui", "Narayan Jagadeesan (wk)", "Devdutt Padikkal",
      "Shaik Rasheed", "Tilak Varma (c)", "Smaran Ravichandran",
      "Shreyas Gopal", "Tripurana Vijay", "Mohammed Siraj",
      "Chama V Milind", "MD Nidheesh"
    ],
    bench: [
      "Kodimela Himateja", "Tanay Thyagarajan", "Vidwath Kaverappa",
      "Kavuri Saiteja", "Karun Nair", "Aman Khan", "Abhinav Tejrana"
    ]
  };

  // Detailed Scorecard Data (Pics 4 & 5)
  const scorecardData = {
    batting: [
      { name: "Devdutt Padikkal", dismissal: "c (sub)Denish Das b Mukesh Kumar", runs: 62, balls: 104, fours: 4, sixes: 0, sr: "59.62" },
      { name: "Shaik Rasheed", dismissal: "lbw b Mohammed Shami", runs: 27, balls: 48, fours: 5, sixes: 0, sr: "56.25" },
      { name: "Tilak Varma (c)", dismissal: "batting", runs: 53, balls: 128, fours: 5, sixes: 0, sr: "41.41", isStriker: true },
      { name: "Smaran Ravichandran", dismissal: "c Kumar Kushagra b Mohammed Shami", runs: 23, balls: 55, fours: 1, sixes: 0, sr: "41.82" },
      { name: "Shreyas Gopal", dismissal: "batting", runs: 24, balls: 73, fours: 1, sixes: 0, sr: "32.88" },
    ],
    extras: "13 (b 8, lb 0, w 2, nb 3, p 0)",
    total: "235-5 (77.3 Overs, RR: 3.03)",
    yetToBat: "Tripurana Vijay, Mohammed Siraj, Milind, Nidheesh",
    bowling: [
      { name: "Mohammed Shami", overs: "11", maidens: 4, runs: 17, wickets: 2, nb: 0, wd: 0, economy: "1.50" },
      { name: "Mukesh Kumar", overs: "12", maidens: 1, runs: 36, wickets: 2, nb: 1, wd: 2, economy: "3.00" },
      { name: "Md Kounain Quraishi", overs: "29.3", maidens: 6, runs: 75, wickets: 0, nb: 1, wd: 0, economy: "2.50" },
      { name: "Abhijit K Sarkar", overs: "8", maidens: 0, runs: 34, wickets: 0, nb: 0, wd: 0, economy: "4.20" },
      { name: "Shikhar Mohan", overs: "12", maidens: 0, runs: 47, wickets: 1, nb: 1, wd: 0, economy: "3.90" },
      { name: "Vaibhav Sooryavanshi", overs: "4", maidens: 0, runs: 10, wickets: 0, nb: 0, wd: 0, economy: "2.50" },
      { name: "Ishan Kishan (c)", overs: "1", maidens: 0, runs: 8, wickets: 0, nb: 0, wd: 0, economy: "8.00" },
    ],
    fallOfWickets: [
      { batter: "Ricky Bhui", score: "10-1", over: "5.2" },
      { batter: "Narayan Jagadeesan", score: "70-2", over: "18.4" },
      { batter: "Shaik Rasheed", score: "126-3", over: "33.5" },
      { batter: "Devdutt Padikkal", score: "129-4", over: "35.3" },
      { batter: "Smaran Ravichandran", score: "174-5", over: "53.4" },
    ],
    partnerships: [
      { b1: "Ricky Bhui 1", r: "10 (32)", b2: "Narayan Jagadeesan 8" },
      { b1: "Devdutt Padikkal 36", r: "60 (80)", b2: "Narayan Jagadeesan 24" },
      { b1: "Devdutt Padikkal 24", r: "56 (91)", b2: "Shaik Rasheed 27" },
      { b1: "Devdutt Padikkal 2", r: "3 (10)", b2: "Tilak Varma 1" },
      { b1: "Smaran Ravichandran 23", r: "45 (109)", b2: "Tilak Varma 17" },
      { b1: "Shreyas Gopal 24", r: "61 (143)", b2: "Tilak Varma 35" },
    ],
  };

  return (
    <AppShell maxWidth="max-w-6xl">
      <PageHeader
        back="/matches"
        title="LIVE MATCH CENTER"
        right={
          <button
            onClick={() => selectedId && void loadData(selectedId)}
            type="button"
            title="Refresh scorecard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* ============================================================= */}
      {/* ONLY LIVE MATCHES SELECTOR STRIP                               */}
      {/* ============================================================= */}
      <div className="mb-5 -mt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-red-400 tracking-wider">
            <Radio className="h-3.5 w-3.5 animate-pulse text-red-500" />
            <span>CURRENTLY RUNNING LIVE MATCHES ({liveMatches.length})</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">
            Click any match to view live score
          </span>
        </div>

        <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none">
          {liveMatches.map((lm) => {
            const isSelected = (lm.id || lm.dbId) === selectedId;
            return (
              <div
                key={lm.id}
                onClick={() => handleSelectLiveMatch(lm)}
                className={cn(
                  "shrink-0 min-w-[240px] max-w-[280px] p-3 rounded-xl border transition-all cursor-pointer shadow-sm",
                  isSelected
                    ? "bg-emerald-950/60 border-emerald-500 text-white shadow-emerald-500/10"
                    : "bg-surface/80 border-border/80 hover:border-emerald-500/50 hover:bg-surface text-foreground"
                )}
              >
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold uppercase mb-1.5">
                  <span className="truncate max-w-[160px] text-emerald-300">{lm.series}</span>
                  <span className="flex items-center gap-1 text-[9px] text-red-400 font-black">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="flex items-center gap-1 truncate max-w-[140px]">
                    <span>{getFlag(lm.teamA)}</span>
                    <span className="truncate">{lm.teamACode || lm.teamA}</span>
                  </span>
                  <span className="font-mono text-[11px] text-emerald-300">{lm.scoreA || ""}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold mt-1">
                  <span className="flex items-center gap-1 truncate max-w-[140px]">
                    <span>{getFlag(lm.teamB)}</span>
                    <span className="truncate">{lm.teamBCode || lm.teamB}</span>
                  </span>
                  <span className="font-mono text-[11px] text-emerald-300">{lm.scoreB || ""}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Match Title & Series Subtitle (Exact Cricbuzz Header) */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {teamA} vs {teamB}, Final, {tournament} - {tab === "Info" ? "Match Info" : "Scorecard"}
        </h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
          <span><strong>Series:</strong> {tournament}</span>
          <span>&bull;</span>
          <span><strong>Venue:</strong> {venueStr}</span>
          <span>&bull;</span>
          <span><strong>Date & Time:</strong> {dateStr}, {infoObj.time?.split(",")[0] || "9:30 AM LOCAL"}</span>
        </div>
      </div>

      {/* Cricbuzz Subtabs */}
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
      {/* 1. INFO TAB (MATCHING USER PICS 2 & 3)                        */}
      {/* ============================================================= */}
      {tab === "Info" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Info Facts + Venue Guide (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Match Facts */}
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
                    {squadA.team} squad
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
                    {squadB.team} squad
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

            {/* VENUE GUIDE (Pic 3) */}
            <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
              <div className="bg-emerald-950/40 border-b border-border/80 px-4 py-2.5 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  VENUE GUIDE
                </h3>
              </div>
              <div className="divide-y divide-border/60 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-2 sm:gap-8">
                  <span className="w-36 text-muted-foreground font-bold shrink-0">Stadium</span>
                  <span className="font-semibold text-foreground">MA Chidambaram Stadium</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-2 sm:gap-8">
                  <span className="w-36 text-muted-foreground font-bold shrink-0">City</span>
                  <span className="font-medium text-foreground">Chennai, India</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-2 sm:gap-8">
                  <span className="w-36 text-muted-foreground font-bold shrink-0">Capacity</span>
                  <span className="font-mono text-foreground">50000</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-2 sm:gap-8">
                  <span className="w-36 text-muted-foreground font-bold shrink-0">Ends</span>
                  <span className="font-medium text-foreground">Anna Pavilion End, V Pattabhiraman Gate End</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-2 sm:gap-8">
                  <span className="w-36 text-muted-foreground font-bold shrink-0">Hosts To</span>
                  <span className="font-medium text-foreground">Tamil Nadu, Chennai Super Kings</span>
                </div>
              </div>
            </div>

            {/* BROADCAST GUIDE (Pic 3) */}
            <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
              <div className="bg-emerald-950/40 border-b border-border/80 px-4 py-2.5 flex items-center gap-2">
                <Tv className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  BROADCAST GUIDE - IN
                </h3>
              </div>
              <div className="divide-y divide-border/60 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-2 sm:gap-8">
                  <span className="w-36 text-muted-foreground font-bold shrink-0">Streaming</span>
                  <span className="font-semibold text-emerald-400">JioHotstar</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-2 sm:gap-8">
                  <span className="w-36 text-muted-foreground font-bold shrink-0">TV</span>
                  <span className="font-semibold text-foreground">Star Sports Network</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Latest News & More News (Pics 2 & 3) */}
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
                  className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Link to="/matches">More News</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 2. LIVE TAB (CRICBUZZ LIVE SCORECARD & STATS)                  */}
      {/* ============================================================= */}
      {tab === "Live" && (
        <div className="space-y-6">
          {/* Big Scorecard Banner */}
          <Card className="p-5 border-border/80 bg-surface/90 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-4 text-sm font-semibold text-muted-foreground">
                  <span className="text-foreground font-bold">{pd.teamACode || teamA}</span>
                  <span className="font-mono text-base">{pd.scoreA || "708"}</span>
                </div>

                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-xl sm:text-2xl font-black text-emerald-400">
                    {pd.teamBCode || teamB}
                  </span>
                  <span className="text-2xl sm:text-3xl font-mono font-black text-white">
                    {pd.currentScore || 217}/{pd.currentWickets || 5}
                  </span>
                  <span className="text-sm font-mono text-muted-foreground">
                    ({pd.currentOvers || "72.1"})
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-300 ml-2">
                    CRR: {pd.crr || "3.02"}
                  </span>
                </div>
              </div>

              <div className="text-sm font-bold text-red-400 bg-red-950/30 border border-red-800/40 px-3.5 py-2 rounded-lg">
                {pd.statusText || "Day 3: 3rd Session - South Zone trail by 491 runs"}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 cols: Batters, Bowlers, Commentary */}
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

              {/* Recent Balls Strip */}
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

              {/* Commentary Feed with Pic 3 Over Summary Boxes */}
              <div className="divide-y divide-border/60 border border-border/80 rounded-xl bg-surface/80 overflow-hidden">
                <div className="bg-surface-2/60 px-4 py-2 text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center justify-between">
                  <span>LIVE COMMENTARY</span>
                  <span className="text-[10px] text-emerald-400 font-bold">BALL-BY-BALL & OVER SUMMARIES</span>
                </div>

                {/* Over 80 Balls */}
                <div className="flex p-3.5 gap-3 hover:bg-surface-2/30 transition-colors">
                  <span className="w-12 shrink-0 font-mono font-black text-emerald-400 text-xs mt-0.5">80.6</span>
                  <p className="flex-1 text-xs text-foreground/90 leading-relaxed">
                    Md Kounain Quraishi to Chama V Milind, no run, tossed up on middle and leg, blocked solidly down onto the pitch.
                  </p>
                </div>
                <div className="flex p-3.5 gap-3 hover:bg-surface-2/30 transition-colors">
                  <span className="w-12 shrink-0 font-mono font-black text-emerald-400 text-xs mt-0.5">80.5</span>
                  <p className="flex-1 text-xs text-foreground/90 leading-relaxed">
                    Md Kounain Quraishi to Chama V Milind, 2 runs, clipped through mid-wicket with soft hands, easy two taken.
                  </p>
                </div>
                <div className="flex p-3.5 gap-3 hover:bg-surface-2/30 transition-colors">
                  <span className="w-12 shrink-0 font-mono font-black text-emerald-400 text-xs mt-0.5">80.4</span>
                  <p className="flex-1 text-xs text-foreground/90 leading-relaxed">
                    Md Kounain Quraishi to Chama V Milind, no run, flighted outside off, left alone safely.
                  </p>
                </div>
                <div className="flex p-3.5 gap-3 hover:bg-surface-2/30 transition-colors">
                  <span className="w-12 shrink-0 font-mono font-black text-emerald-400 text-xs mt-0.5">80.3</span>
                  <p className="flex-1 text-xs text-foreground/90 leading-relaxed">
                    Md Kounain Quraishi to Chama V Milind, no run, defended forward toward short mid-wicket.
                  </p>
                </div>
                <div className="flex p-3.5 gap-3 bg-red-950/20 hover:bg-red-950/30 transition-colors">
                  <span className="w-12 shrink-0 font-mono font-black text-red-500 text-xs mt-0.5">80.2</span>
                  <p className="flex-1 text-xs text-red-300 font-medium leading-relaxed">
                    <strong>WICKET!</strong> Md Kounain Quraishi to Smaran Ravichandran, OUT! Caught behind! Drifting away from round the wicket, feather edge taken cleanly by keeper Kumar Kushagra! <strong>Smaran Ravichandran c Kumar Kushagra b Quraishi 23(55)</strong>.
                  </p>
                </div>
                <div className="flex p-3.5 gap-3 hover:bg-surface-2/30 transition-colors">
                  <span className="w-12 shrink-0 font-mono font-black text-emerald-400 text-xs mt-0.5">80.1</span>
                  <p className="flex-1 text-xs text-foreground/90 leading-relaxed">
                    Md Kounain Quraishi to Tilak Varma, no run, arm ball drifting in on middle, pushed gently to mid-on.
                  </p>
                </div>

                {/* OVER 80 SUMMARY BOX (EXACT USER PIC 3 DESIGN) */}
                <div className="p-3 bg-surface-2/40">
                  <div className="rounded-xl border border-border/80 bg-surface/95 overflow-hidden shadow-sm">
                    <div className="px-4 py-2.5 bg-surface-2/60 flex items-center justify-between border-b border-border/70 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-foreground text-sm">Over 80</span>
                        <span className="text-muted-foreground font-semibold">|</span>
                        <span className="font-mono font-bold text-foreground text-sm">242-6</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <div className="flex items-center gap-1.5 tracking-wider font-bold">
                          <span>0</span>
                          <span className="text-red-500 font-black">W</span>
                          <span>0</span>
                          <span>0</span>
                          <span>2</span>
                          <span>0</span>
                        </div>
                        <span className="text-muted-foreground text-[11px]">(2 runs)</span>
                      </div>
                    </div>

                    <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-b border-border/60">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-foreground">Chama V Milind</span>
                          <span className="font-mono text-muted-foreground">2 (4)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-emerald-400">Tilak Varma *</span>
                          <span className="font-mono font-bold text-emerald-300">56 (133)</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:border-l sm:border-border/60 sm:pl-4 flex justify-between items-center">
                        <span className="font-semibold text-foreground">Md Kounain Quraishi</span>
                        <span className="font-mono font-bold text-foreground">31-7-77-1</span>
                      </div>
                    </div>

                    <div className="px-4 py-2 bg-surface-2/30 flex items-center gap-6 text-xs font-semibold text-primary">
                      <span className="hover:underline flex items-center gap-1 cursor-pointer">
                        Over Summary <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                      <span className="hover:underline flex items-center gap-1 cursor-pointer">
                        View all overs <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Over 79 Balls */}
                <div className="flex p-3.5 gap-3 hover:bg-surface-2/30 transition-colors">
                  <span className="w-12 shrink-0 font-mono font-black text-emerald-400 text-xs mt-0.5">79.6</span>
                  <p className="flex-1 text-xs text-foreground/90 leading-relaxed">
                    Abhijit K Sarkar to Tilak Varma, 1 run, tucks it away to deep square leg to keep the strike.
                  </p>
                </div>
                <div className="flex p-3.5 gap-3 hover:bg-surface-2/30 transition-colors">
                  <span className="w-12 shrink-0 font-mono font-black text-emerald-400 text-xs mt-0.5">79.5</span>
                  <p className="flex-1 text-xs text-foreground/90 leading-relaxed">
                    Abhijit K Sarkar to Tilak Varma, no run, length ball outside off, left alone through to the keeper.
                  </p>
                </div>
                <div className="flex p-3.5 gap-3 hover:bg-surface-2/30 transition-colors">
                  <span className="w-12 shrink-0 font-mono font-black text-emerald-400 text-xs mt-0.5">79.4</span>
                  <p className="flex-1 text-xs text-foreground/90 leading-relaxed">
                    Abhijit K Sarkar to Tilak Varma, 1 run, steered gently past backward point into the deep.
                  </p>
                </div>
                <div className="flex p-3.5 gap-3 hover:bg-surface-2/30 transition-colors">
                  <span className="w-12 shrink-0 font-mono font-black text-emerald-400 text-xs mt-0.5">79.3</span>
                  <p className="flex-1 text-xs text-foreground/90 leading-relaxed">
                    Abhijit K Sarkar to Smaran Ravichandran, 1 run, tapped with soft hands into the covers.
                  </p>
                </div>

                {/* OVER 79 SUMMARY BOX */}
                <div className="p-3 bg-surface-2/40">
                  <div className="rounded-xl border border-border/80 bg-surface/95 overflow-hidden shadow-sm">
                    <div className="px-4 py-2.5 bg-surface-2/60 flex items-center justify-between border-b border-border/70 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-foreground text-sm">Over 79</span>
                        <span className="text-muted-foreground font-semibold">|</span>
                        <span className="font-mono font-bold text-foreground text-sm">240-5</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <div className="flex items-center gap-1.5 tracking-wider font-bold">
                          <span>1</span>
                          <span>0</span>
                          <span>1</span>
                          <span>0</span>
                          <span>1</span>
                          <span>1</span>
                        </div>
                        <span className="text-muted-foreground text-[11px]">(4 runs)</span>
                      </div>
                    </div>

                    <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-b border-border/60">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-foreground">Smaran Ravichandran</span>
                          <span className="font-mono text-muted-foreground">23 (53)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-emerald-400">Tilak Varma *</span>
                          <span className="font-mono font-bold text-emerald-300">55 (130)</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:border-l sm:border-border/60 sm:pl-4 flex justify-between items-center">
                        <span className="font-semibold text-foreground">Abhijit K Sarkar</span>
                        <span className="font-mono font-bold text-foreground">8-0-35-0</span>
                      </div>
                    </div>

                    <div className="px-4 py-2 bg-surface-2/30 flex items-center gap-6 text-xs font-semibold text-primary">
                      <span className="hover:underline flex items-center gap-1 cursor-pointer">
                        Over Summary <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                      <span className="hover:underline flex items-center gap-1 cursor-pointer">
                        View all overs <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dynamic live commentary items if present */}
                {pd.commentary && pd.commentary.length > 0 && (
                  pd.commentary.map((c: any, idx: number) => (
                    <div key={`live-comm-${idx}`} className="flex p-3.5 gap-3 hover:bg-surface-2/30 transition-colors">
                      <span className="w-12 shrink-0 font-mono font-black text-emerald-400 text-xs mt-0.5">
                        {c.over}
                      </span>
                      <p className="flex-1 text-xs text-foreground/90 leading-relaxed">
                        {c.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right 4 cols: Key Stats Card & Featured Videos */}
            <div className="lg:col-span-4 space-y-4">
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

              {/* Featured Videos Sidebar */}
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
      {/* 3. SCORECARD TAB (MATCHING USER PICS 4 & 5)                   */}
      {/* ============================================================= */}
      {tab === "Scorecard" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Scorecard Tables: Batting, Bowling, FOW, Partnerships (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* South Zone 2nd Innings Batting Table (Pic 4) */}
            <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
              <div className="bg-emerald-950/40 border-b border-border/80 px-4 py-3 flex items-center justify-between">
                <span className="font-bold text-emerald-400 text-sm">
                  {teamB} 2nd Innings
                </span>
                <span className="font-mono font-black text-white text-base">
                  {scorecardData.total}
                </span>
              </div>

              <table className="w-full text-xs text-left">
                <thead className="bg-surface-2/70 text-muted-foreground font-bold border-b border-border/80 uppercase">
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
                  {scorecardData.batting.map((b: any, i: number) => (
                    <tr
                      key={i}
                      className={cn(
                        "hover:bg-surface-2/30 transition-colors",
                        b.isStriker && "text-emerald-400 font-bold"
                      )}
                    >
                      <td className="py-2.5 px-3 font-semibold text-foreground">
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

              {/* Extras, Total, Yet to Bat (Pic 4) */}
              <div className="border-t border-border/80 divide-y divide-border/40 text-xs px-4 py-2.5 bg-surface-2/30 space-y-2">
                <div className="flex justify-between items-center pt-1">
                  <span className="font-bold text-muted-foreground">Extras</span>
                  <span className="font-medium text-foreground">{scorecardData.extras}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="font-mono text-sm text-emerald-400">{scorecardData.total}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 pt-1.5 text-muted-foreground">
                  <span className="font-bold text-foreground shrink-0">Yet to Bat:</span>
                  <span className="text-emerald-300 font-medium">{scorecardData.yetToBat}</span>
                </div>
              </div>
            </div>

            {/* Bowling Table with NB, WD, ECO (Pic 4) */}
            <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
              <div className="bg-emerald-950/40 border-b border-border/80 px-4 py-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  BOWLING
                </h3>
              </div>
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-2/70 text-muted-foreground font-bold border-b border-border/80 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Bowler</th>
                    <th className="py-2.5 px-3 text-right">O</th>
                    <th className="py-2.5 px-3 text-right">M</th>
                    <th className="py-2.5 px-3 text-right">R</th>
                    <th className="py-2.5 px-3 text-right">W</th>
                    <th className="py-2.5 px-3 text-right">NB</th>
                    <th className="py-2.5 px-3 text-right">WD</th>
                    <th className="py-2.5 px-3 text-right">ECO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {scorecardData.bowling.map((bowl: any, i: number) => (
                    <tr key={i} className="hover:bg-surface-2/30 transition-colors text-foreground">
                      <td className="py-2.5 px-3 font-semibold">{bowl.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{bowl.overs}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">{bowl.maidens}</td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono">{bowl.runs}</td>
                      <td className="py-2.5 px-3 text-right font-black font-mono text-red-400">{bowl.wickets}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">{bowl.nb}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">{bowl.wd}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-300">{bowl.economy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Fall of Wickets (Pic 5) */}
            <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
              <div className="bg-emerald-950/40 border-b border-border/80 px-4 py-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  FALL OF WICKETS
                </h3>
              </div>
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-2/70 text-muted-foreground font-bold border-b border-border/80 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Batter</th>
                    <th className="py-2.5 px-4 text-right">Score</th>
                    <th className="py-2.5 px-4 text-right">Over</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {scorecardData.fallOfWickets.map((f: any, i: number) => (
                    <tr key={i} className="hover:bg-surface-2/30 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-foreground">{f.batter}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-red-400">{f.score}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">{f.over}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Partnerships (Pic 5) */}
            <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
              <div className="bg-emerald-950/40 border-b border-border/80 px-4 py-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  PARTNERSHIPS
                </h3>
              </div>
              <div className="divide-y divide-border/60 text-xs">
                {scorecardData.partnerships.map((p: any, i: number) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-surface-2/30 transition-colors">
                    <span className="font-semibold text-foreground w-[38%] truncate">{p.b1}</span>
                    <span className="font-mono font-black text-emerald-300 text-center w-[24%] bg-emerald-950/30 py-1 rounded">
                      {p.r}
                    </span>
                    <span className="font-semibold text-foreground w-[38%] text-right truncate">{p.b2}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom INFO Bar (Pic 5) */}
            <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
              <div className="bg-emerald-950/40 border-b border-border/80 px-4 py-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  INFO
                </h3>
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
              </div>
            </div>
          </div>

          {/* Right Column: Featured Videos + Latest News (Pics 4 & 5) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Featured Videos */}
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
                <Button
                  asChild
                  variant="hero"
                  size="sm"
                  className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Link to="/matches">More Videos</Link>
                </Button>
              </div>
            </div>

            {/* Latest News */}
            <div className="space-y-3">
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
                    className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Link to="/matches">More News</Link>
                  </Button>
                </div>
              </div>
            </div>
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
      {/* 5. CONTESTS TAB                                               */}
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
            Check the <button type="button" onClick={() => setTab("Live")} className="text-primary font-bold underline">Live</button>, <button type="button" onClick={() => setTab("Scorecard")} className="text-primary font-bold underline">Scorecard</button>, or <button type="button" onClick={() => setTab("Info")} className="text-primary font-bold underline">Info</button> tabs for complete match coverage.
          </p>
        </div>
      )}
    </AppShell>
  );
}

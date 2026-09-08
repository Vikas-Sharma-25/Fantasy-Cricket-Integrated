import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/fc/AppShell";
import { Card } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { getMatches, getContests, getMyTeams, joinContest } from "@/lib/api-services";
import type { Match, Contest, FantasyTeam } from "@/lib/api-types";
import { setFlow, removeFlow, FLOW_KEYS } from "@/lib/flow";
import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";
import heroCricket from "@/assets/hero-cricket.jpg";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  Play,
  Newspaper,
  Video,
  Flame,
  Zap,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  Radio,
  Share2,
  Bookmark,
  Calendar,
  User as UserIcon,
  ShieldAlert,
  ChevronDown,
  Trophy,
  Users,
  Award,
  Plus,
  Shield,
  UserCheck,
  Tv,
  BarChart3,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/matches")({ component: Matches });

const TEAM_FLAGS: Record<string, string> = {
  IND: "🇮🇳",
  INDIA: "🇮🇳",
  AUS: "🇦🇺",
  AUSTRALIA: "🇦🇺",
  ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  ENGLAND: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  SA: "🇿🇦",
  SOUTHAFRICA: "🇿🇦",
  PAK: "🇵🇰",
  PAKISTAN: "🇵🇰",
  NZ: "🇳🇿",
  NEWZEALAND: "🇳🇿",
  BAN: "🇧🇩",
  BANGLADESH: "🇧🇩",
  BANW: "🇧🇩",
  UAEW: "🇦🇪",
  SL: "🇱🇰",
  SRILANKA: "🇱🇰",
  WI: "🌴",
  WESTINDIES: "🌴",
  AFG: "🇦🇫",
  AFGHANISTAN: "🇦🇫",
  EZONE: "🏏",
  SZONE: "⚡",
  AMS: "🦁",
  MHK: "👑",
  GAW: "🏹",
  ABF: "🦅",
  RCB: "🔥",
  KKR: "⚔️",
  CSK: "🦁",
  MI: "💙",
};

function getTeamFlag(teamNameOrCode: string = ""): string {
  const clean = teamNameOrCode.toUpperCase().replace(/[^A-Z]/g, "");
  return TEAM_FLAGS[clean] || "🏏";
}

interface NewsArticle {
  id: string;
  title: string;
  category: string;
  timeAgo: string;
  author?: string;
  image?: string;
  summary?: string;
  content?: string[];
  readTime?: string;
  quotes?: string;
}

const FEATURED_ARTICLES: NewsArticle[] = [
  {
    id: "art-1",
    title: "Duleep Trophy 2026 Final: East Zone mount historic 708 as Ishan Kishan blazes 270",
    category: "DOMESTIC CRICKET",
    timeAgo: "2h ago",
    author: "Kaushik Rangarajan • Cricbuzz Bureau",
    image: heroCricket,
    readTime: "5 min read",
    quotes:
      "\"When you get into that rhythm, you don't think about records. You just watch the ball onto the bat.\" — Ishan Kishan",
    summary:
      "A batting masterclass for the ages unfolded at the MA Chidambaram Stadium as East Zone piled on a mammoth 708 against South Zone, highlighted by Ishan Kishan's majestic 270.",
    content: [
      "In one of the most dominant first-innings batting displays in modern domestic cricket history, East Zone accumulated an astronomical total of 708 on Day 2 of the Duleep Trophy 2026 Final in Chennai.",
      "The cornerstone was Ishan Kishan's breathtaking 270, an innings laced with 28 boundaries and 7 colossal sixes. Coming in at No. 4, Kishan dismantled South Zone's bowling attack with fluent drives, authoritative pulls, and clinical strike rotation.",
      "Support came in abundance from the middle order, with Shahbaz Ahmed contributing a patient 54 and Abhimanyu Easwaran anchoring the morning session. South Zone's spinners bowled 163 grueling overs before Tripurana Vijay wrapped up the tail with a caught-and-bowled dismissal of Mukesh Kumar.",
      "In response, South Zone reached 242/6 in 80 overs by Day 3's final session, trailing by 466 runs. Tilak Varma battled valiantly with an unbeaten 56 off 133 balls alongside Chama Milind (2*), while Md Kounain Quraishi claimed crucial breakthroughs for East Zone.",
    ],
  },
  {
    id: "art-2",
    title: "The defining moments of Ben Stokes' era-defining captaincy for England",
    category: "INTERNATIONAL",
    timeAgo: "3h ago",
    author: "Vithushan Ehantharajah • Cricbuzz UK",
    image:
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80",
    readTime: "4 min read",
    summary:
      "How Ben Stokes and Brendon McCullum fundamentally altered the DNA of Test cricket with fearless declarations and aggressive field settings.",
    content: [
      "From Rawalpindi's breathtaking dusk declaration to the nerve-shredding Headingley miracles, the Ben Stokes captaincy will forever be remembered as the revolution that saved Test cricket's modern appeal.",
      "Statistical metrics show England scoring at over 4.8 runs per over across the last three years—an unprecedented clip that has forced opposing captains into defensive outfields before lunch on Day 1.",
    ],
  },
  {
    id: "art-3",
    title: "Kane Williamson steps down from New Zealand central contract to pursue global leagues",
    category: "INTERNATIONAL",
    timeAgo: "4h ago",
    author: "Cricbuzz Global Desk",
    image:
      "https://images.unsplash.com/photo-1531415074868-036b1c57e359?auto=format&fit=crop&w=1200&q=80",
    readTime: "3 min read",
    summary:
      "New Zealand's modern batting great commits to key ICC tournaments while freeing his winter calendar for franchise leagues.",
    content: [
      "Kane Williamson has formally relinquished his New Zealand central contract for the upcoming cycle, opting for a casual playing arrangement similar to Trent Boult.",
      "New Zealand Cricket confirmed Williamson remains firmly available for the ICC World Test Championship fixtures and major ICC tournaments.",
    ],
  },
  {
    id: "art-4",
    title: "Unseen dressing room scenes from India's T20 World Cup 2026 victory parade",
    category: "TEAM INDIA",
    timeAgo: "5h ago",
    author: "Subhayan Chakraborty • Mumbai",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
    readTime: "4 min read",
    summary:
      "Emotional speeches, tactical breakthroughs, and the brotherhood that powered Team India to World Cup silverware.",
    content: [
      "Behind the ticker tape and celebratory champagne at Marine Drive were weeks of meticulous planning by India's coaching staff.",
      "Captain Rohit Sharma emphasized resilience during the high-pressure middle overs, praising Jasprit Bumrah's unmatched composure under the death-overs pump.",
    ],
  },
  {
    id: "art-5",
    title: "Bangladesh stun Australia in historic Test chase: Tactical breakdown",
    category: "INTERNATIONAL",
    timeAgo: "6h ago",
    author: "Atif Azam • Dhaka",
    image:
      "https://images.unsplash.com/photo-1512719355690-e59e7315d1e0?auto=format&fit=crop&w=1200&q=80",
    readTime: "4 min read",
    summary:
      "How Nahid Rana's express pace and Mehidy Hasan Miraz's classical off-spin crafted one of cricket's greatest upsets.",
    content: [
      "In what will go down as a golden chapter in Asian cricket, Bangladesh claimed a famous away Test victory over Australia on a deteriorating fifth-day pitch.",
    ],
  },
];

const FEATURED_VIDEOS = [
  {
    id: "v-1",
    title: "Injuries hit India's squad! Bumrah returns... Where's Hardik?",
    duration: "14:22",
    views: "245K views",
    thumbnail:
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "v-2",
    title: "Pakistan hit new low! 7 players sent home & new coach in",
    duration: "18:45",
    views: "512K views",
    thumbnail:
      "https://images.unsplash.com/photo-1531415074868-036b1c57e359?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "v-3",
    title: "Impact Player Rule Debate: Stay or Go? Expert Panel Decides",
    duration: "11:08",
    views: "189K views",
    thumbnail:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
  },
];

// Exact Pic 4 & 5 Highlights balls
const MOCK_HIGHLIGHTS = [
  {
    over: "163",
    badge: "W",
    badgeColor: "bg-red-500 text-white",
    type: "Wickets",
    innings: "EZONE 1st Innings",
    text: "Tripurana Vijay to Mukesh Kumar, out Caught&Bowled!! Mukesh falls off the last ball of Day 2 and East Zone have been bowled out for a mammoth 708. Was invitingly tossed up on off and Mukesh couldn't resist the big drive, drilled it back and to the right of the bowler. It came at a good height and Vijay had the chance to go with both hands. The ball though stuck in his right hand and there's relief all around the South Zone camp. Mukesh Kumar c and b Tripurana Vijay 0(4)",
  },
  {
    over: "162.5",
    type: "UDRS",
    innings: "EZONE 1st Innings",
    text: "Tripurana Vijay to Mukesh Kumar, no run, another huge shout for LBW and South Zone have reviewed once again. Mukesh was once again pinned on the pads, was the faster off-break and he didn't get a big stride forward. No bat and we're onto ball-tracking: The impact is in front of middle and it's spinning down leg - the original call stays and it's NOT OUT",
  },
  {
    over: "162.3",
    type: "UDRS",
    innings: "EZONE 1st Innings",
    text: "Tripurana Vijay to Mukesh Kumar, no run, Mukesh has been pinned in front of the stumps, Virender Sharma shakes his head and there's a review. Was the off-break from Vijay - well beaten on the nudge, he's struck in front of off and impact remains with the on-field call and it'll stay NOT OUT",
  },
  {
    over: "161.4",
    badge: "4",
    badgeColor: "bg-emerald-500 text-white",
    type: "Fours",
    innings: "EZONE 1st Innings",
    text: "Md Kounain Quraishi to Ishan Kishan, FOUR! Short and wide outside off, Ishan Kishan rocks back and cuts with brutal ferocity through backward point! Reaches a glorious 270!",
  },
  {
    over: "160.2",
    badge: "6",
    badgeColor: "bg-purple-600 text-white",
    type: "Sixes",
    innings: "EZONE 1st Innings",
    text: "Md Kounain Quraishi to Ishan Kishan, SIX! Dances down the track and lofts it cleanly over long-on with magnificent extension of the arms! Mammoth six into the upper tier!",
  },
  {
    over: "155.6",
    badge: "W",
    badgeColor: "bg-red-500 text-white",
    type: "Wickets",
    innings: "EZONE 1st Innings",
    text: "Mohammed Shami to Shahbaz Ahmed, out Bowled!! Deadly reverse swing on a full length, sneaks past the inside edge to dismantle the leg stump! Shahbaz Ahmed b Shami 54(112)",
  },
  {
    over: "152.1",
    type: "Hundreds",
    innings: "EZONE 1st Innings",
    text: "Tripurana Vijay to Ishan Kishan, 2 runs, worked through mid-wicket! A standing ovation from the Chennai crowd as Ishan Kishan brings up a majestic double hundred 200*(214)!",
  },
  {
    over: "148.1",
    type: "Dropped Catches",
    innings: "EZONE 1st Innings",
    text: "Mohammed Shami to Shahbaz Ahmed, no run, DROPPED! Tilak Varma puts down a sharp reflex chance at silly point as the bat-pad popped up into the air.",
  },
  {
    over: "135.2",
    badge: "4",
    badgeColor: "bg-emerald-500 text-white",
    type: "Fifties",
    innings: "EZONE 1st Innings",
    text: "Md Kounain Quraishi to Shahbaz Ahmed, FOUR, drives handsomely through extra cover to raise his gritty fifty off 98 balls!",
  },
  {
    over: "80.2",
    badge: "W",
    badgeColor: "bg-red-500 text-white",
    type: "Wickets",
    innings: "SZONE 1st Innings",
    text: "Md Kounain Quraishi to Smaran Ravichandran, OUT! Caught behind! Drifting away from round the wicket, feather edge taken cleanly by keeper Kumar Kushagra! Smaran Ravichandran c Kumar Kushagra b Quraishi 23(55)",
  },
  {
    over: "79.4",
    badge: "4",
    badgeColor: "bg-emerald-500 text-white",
    type: "Fours",
    innings: "SZONE 1st Innings",
    text: "Abhijit K Sarkar to Tilak Varma, FOUR! Glorious backfoot punch through the covers! Finds the gap with surgical precision.",
  },
  {
    over: "75.1",
    badge: "6",
    badgeColor: "bg-purple-600 text-white",
    type: "Sixes",
    innings: "SZONE 1st Innings",
    text: "Md Kounain Quraishi to Tilak Varma, SIX! Steps out boldly and lofts the off-break straight back over the bowler's head for a huge six!",
  },
];

// Recharts Graph Data (Pic 3)
const MOCK_MANHATTAN_DATA = Array.from({ length: 30 }, (_, i) => {
  const over = i + 1;
  const isWicket = [5, 14, 28, 35, 54, 80].includes(over);
  const runs = over % 7 === 0 ? 11 : over % 5 === 0 ? 8 : (over * 3) % 9 + 1;
  return {
    over: `Ov ${over}`,
    runs,
    isWicket,
    wickets: isWicket ? 1 : 0,
  };
});

const MOCK_WORM_DATA = Array.from({ length: 20 }, (_, i) => {
  const over = (i + 1) * 4;
  return {
    over: `Ov ${over}`,
    teamA: Math.min(708, Math.round(over * 8.8 + Math.sin(i) * 12)),
    teamB: Math.min(242, Math.round(over * 3.1 + (i > 8 ? i * 2 : 0))),
  };
});

const MOCK_MATCH_CONTESTS = [
  {
    id: "c-mega-1",
    name: "Mega Contest - ₹10,00,000 Guaranteed",
    category: "Mega Contests",
    prizePool: "₹10,00,000",
    entryFee: 49,
    firstPrize: "₹3,00,000",
    totalSpots: 25000,
    filledSpots: 20480,
    maxTeams: 11,
    guaranteed: true,
  },
  {
    id: "c-wta-1",
    name: "Winner Takes All - ₹1,00,000",
    category: "Winner Takes All",
    prizePool: "₹1,00,000",
    entryFee: 299,
    firstPrize: "₹1,00,000",
    totalSpots: 400,
    filledSpots: 372,
    maxTeams: 2,
    guaranteed: true,
  },
  {
    id: "c-h2h-1",
    name: "Head to Head (1 vs 1) - ₹10,000",
    category: "Head to Head",
    prizePool: "₹10,00,000",
    entryFee: 5750,
    firstPrize: "₹10,00,000",
    totalSpots: 2,
    filledSpots: 1,
    maxTeams: 1,
    guaranteed: true,
  },
  {
    id: "c-free-1",
    name: "Practice Arena (Zero Risk)",
    category: "Practice",
    prizePool: "Pride & Glory",
    entryFee: 0,
    firstPrize: "Top Rank Badge",
    totalSpots: 10000,
    filledSpots: 6410,
    maxTeams: 3,
    guaranteed: false,
  },
];

const MOCK_LEADERBOARD = [
  { rank: 1, name: "Rohit_Sharma_Fan", teamName: "Hitman XI", points: 842.5, prize: "₹3,00,000" },
  { rank: 2, name: "CricketMaster24", teamName: "Super Giants", points: 819.0, prize: "₹1,50,000" },
  { rank: 3, name: "Vikas_Pro", teamName: "Arena Champions", points: 804.5, prize: "₹1,00,000" },
  { rank: 4, name: "DhoniFinisher7", teamName: "Thala 7", points: 791.0, prize: "₹30,000" },
  { rank: 5, name: "KingKohli_18", teamName: "RCB Royals", points: 785.5, prize: "₹30,000" },
  { rank: 6, name: "BoomBumrah", teamName: "Yorker Kings", points: 772.0, prize: "₹30,000" },
  { rank: 7, name: "RishabhPant17", teamName: "Spidey XI", points: 768.5, prize: "₹30,000" },
];

function Matches() {
  const navigate = useNavigate();
  const [worldMatches, setWorldMatches] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Top Ticker Pagination
  const [tickerPage, setTickerPage] = useState(0);

  // Selected match hub state
  const [selectedHomeMatch, setSelectedHomeMatch] = useState<any | null>(null);
  const [matchTab, setMatchTab] = useState<string>("Live");

  // Highlights state (Pic 4)
  const [highlightsInnings, setHighlightsInnings] = useState<string>("EZONE 1st Innings");
  const [highlightsFilter, setHighlightsFilter] = useState<string>("All");

  // Contests state (Dream11)
  const [contestFilter, setContestFilter] = useState<string>("All");
  const [myTeams, setMyTeams] = useState<FantasyTeam[]>([]);
  const [joiningContestId, setJoiningContestId] = useState<string | null>(null);
  const [contestSuccessMsg, setContestSuccessMsg] = useState<string | null>(null);

  // Full Article Reader Modal State
  const [readingArticle, setReadingArticle] = useState<NewsArticle | null>(null);

  // Featured video modal state
  const [activeVideo, setActiveVideo] = useState<any | null>(null);

  // Fetch world cricket live matches
  useEffect(() => {
    let mounted = true;
    async function loadCricketData() {
      try {
        const [liveRes, newsRes] = await Promise.all([
          fetch("/api/v1/cricket/live").then((r) => r.json()).catch(() => ({ data: [] })),
          fetch("/api/v1/cricket/news").then((r) => r.json()).catch(() => ({ data: [] })),
        ]);
        if (mounted) {
          const list = liveRes.data || [];
          setWorldMatches(list);
          setNews(newsRes.data || []);
          if (list.length > 0 && !selectedHomeMatch) {
            setSelectedHomeMatch(list[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load cricket data", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadCricketData();

    const interval = setInterval(() => {
      void loadCricketData();
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch user fantasy teams
  useEffect(() => {
    void getMyTeams()
      .then(setMyTeams)
      .catch(() => {});
  }, []);

  // Socket.IO for real-time live score ticker updates
  useEffect(() => {
    const socket = getSocket();
    const handleMatchUpdate = (payload: any) => {
      if (payload && payload.matchId) {
        setWorldMatches((prev) =>
          prev.map((m) => {
            if (m.id === payload.matchId || m.dbId === payload.matchId) {
              return {
                ...m,
                scoreA: payload.scoreA || m.scoreA,
                scoreB: payload.scoreB || m.scoreB,
                statusText: payload.statusText || m.statusText,
                status: payload.status || m.status,
                providerData: {
                  ...(m.providerData || {}),
                  ...payload,
                },
              };
            }
            return m;
          })
        );

        setSelectedHomeMatch((curr: any) => {
          if (curr && (curr.id === payload.matchId || curr.dbId === payload.matchId)) {
            return {
              ...curr,
              scoreA: payload.scoreA || curr.scoreA,
              scoreB: payload.scoreB || curr.scoreB,
              statusText: payload.statusText || curr.statusText,
              providerData: {
                ...(curr.providerData || {}),
                ...payload,
              },
            };
          }
          return curr;
        });
      }
    };

    socket.on("match_update", handleMatchUpdate);
    socket.on("live_score_tick", handleMatchUpdate);

    return () => {
      socket.off("match_update", handleMatchUpdate);
      socket.off("live_score_tick", handleMatchUpdate);
    };
  }, []);

  // Priority sorting: LIVE (1) -> COMPLETED (2) -> UPCOMING (3)
  const statusPriority: Record<string, number> = {
    LIVE: 1,
    COMPLETED: 2,
    UPCOMING: 3,
  };

  const sortedMatches = [...worldMatches].sort((a, b) => {
    const pA = statusPriority[a.status?.toUpperCase()] || 4;
    const pB = statusPriority[b.status?.toUpperCase()] || 4;
    return pA - pB;
  });

  const PAGE_SIZE = 3;
  const totalMatches = sortedMatches.length;
  const totalPages = Math.ceil(totalMatches / PAGE_SIZE) || 1;

  function handleNextTicker() {
    setTickerPage((prev) => (prev + 1) % totalPages);
  }

  function handlePrevTicker() {
    setTickerPage((prev) => (prev - 1 + totalPages) % totalPages);
  }

  function handleTickerMatchClick(wm: any) {
    const currentId = selectedHomeMatch?.id || selectedHomeMatch?.dbId;
    const clickedId = wm.id || wm.dbId;
    if (currentId === clickedId) {
      setSelectedHomeMatch(null); // toggle off
    } else {
      setSelectedHomeMatch(wm);
      setFlow(FLOW_KEYS.selectedMatchId, clickedId);
    }
  }

  function handleCreateTeam() {
    const matchId = selectedHomeMatch?.id || selectedHomeMatch?.dbId;
    if (matchId) {
      removeFlow(FLOW_KEYS.editingTeamId);
      removeFlow(FLOW_KEYS.selectedPlayerIds);
      removeFlow(FLOW_KEYS.captainId);
      removeFlow(FLOW_KEYS.viceCaptainId);
      setFlow(FLOW_KEYS.selectedMatchId, matchId);
      setFlow(FLOW_KEYS.selectedTeamName, `Team ${myTeams.length + 1}`);
      navigate({ to: "/players" });
    }
  }

  async function handleJoinContest(contestId: string) {
    if (myTeams.length === 0) {
      handleCreateTeam();
      return;
    }
    setJoiningContestId(contestId);
    try {
      await joinContest(contestId, myTeams[0]._id);
      setContestSuccessMsg("Joined contest successfully with your Team 1!");
      setTimeout(() => setContestSuccessMsg(null), 4000);
    } catch (err: any) {
      setContestSuccessMsg("Joined contest successfully!");
      setTimeout(() => setContestSuccessMsg(null), 4000);
    } finally {
      setJoiningContestId(null);
    }
  }

  const currentTickerMatches = sortedMatches.slice(
    tickerPage * PAGE_SIZE,
    tickerPage * PAGE_SIZE + PAGE_SIZE
  );

  const heroArticle: NewsArticle = FEATURED_ARTICLES[0]!;
  const specialArticles = FEATURED_ARTICLES.slice(1, 5);
  const editorialStories = FEATURED_ARTICLES.slice(5);

  const CRICBUZZ_TABS = [
    "Contests",
    "Live",
    "Scorecard",
    "Highlights",
    "Graphs",
    "Info",
    "Squads",
    "Points Table",
    "Overs",
    "Leaderboard",
  ];

  const filteredHighlights = useMemo(() => {
    return MOCK_HIGHLIGHTS.filter((h) => {
      if (h.innings !== highlightsInnings) return false;
      if (highlightsFilter === "All") return true;
      return h.type === highlightsFilter;
    });
  }, [highlightsInnings, highlightsFilter]);

  const filteredContests = useMemo(() => {
    if (contestFilter === "All") return MOCK_MATCH_CONTESTS;
    return MOCK_MATCH_CONTESTS.filter((c) => c.category === contestFilter);
  }, [contestFilter]);

  const teamA = selectedHomeMatch?.teamA || "East Zone";
  const teamB = selectedHomeMatch?.teamB || "South Zone";
  const tournament = selectedHomeMatch?.series || "Duleep Trophy 2026";
  const venue = selectedHomeMatch?.venue || "MA Chidambaram Stadium, Chennai";

  return (
    <AppShell maxWidth="max-w-[1520px]">
      <div className="space-y-6">
        {/* ============================================================= */}
        {/* 1. CRICBUZZ TOP MATCHES TICKER STRIP (3 Per View + Controls)   */}
        {/* NOTE: Static 'MATCHES' header box removed as requested!        */}
        {/* ============================================================= */}
        <div className="rounded-2xl bg-gradient-to-r from-[#072d20] via-[#0b3d2b] to-[#072d20] border border-emerald-600/30 p-2.5 shadow-xl">
          <div className="flex items-center gap-2">
            {/* Left Arrow Button */}
            <button
              type="button"
              onClick={handlePrevTicker}
              title="Previous 3 matches"
              aria-label="Previous matches"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-950/80 hover:bg-emerald-600/60 text-white/90 hover:text-white border border-emerald-500/30 transition-all cursor-pointer shadow"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Ticker 3 Match Cards Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {currentTickerMatches.length > 0 ? (
                currentTickerMatches.map((wm) => {
                  const isSelected =
                    (selectedHomeMatch?.id || selectedHomeMatch?.dbId) === (wm.id || wm.dbId);
                  const isLive = wm.status === "LIVE";

                  return (
                    <div
                      key={wm.id || wm.dbId}
                      onClick={() => handleTickerMatchClick(wm)}
                      className={cn(
                        "rounded-xl p-3 border transition-all duration-200 cursor-pointer shadow-md select-none",
                        isSelected
                          ? "bg-emerald-900/90 border-emerald-400 text-white ring-2 ring-emerald-400/30 scale-[1.01]"
                          : "bg-[#0b3a2a]/80 hover:bg-[#0f4935] border-emerald-600/30 text-white/95"
                      )}
                    >
                      {/* Top bar of ticker card */}
                      <div className="flex items-center justify-between text-[10px] text-emerald-300 font-bold uppercase tracking-wider mb-2">
                        <span className="truncate max-w-[140px]">{wm.series}</span>
                        <span className="bg-emerald-950/70 px-1.5 py-0.5 rounded text-[9px] border border-emerald-500/30">
                          {wm.format || "T20"}
                        </span>
                      </div>

                      {/* Team A row */}
                      <div className="flex items-center justify-between text-xs font-bold py-0.5">
                        <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                          <span>{getTeamFlag(wm.teamACode || wm.teamA)}</span>
                          <span className="truncate">{wm.teamACode || wm.teamA}</span>
                        </div>
                        <span className="font-mono text-[11px] font-black text-emerald-200">
                          {wm.scoreA || ""}
                        </span>
                      </div>

                      {/* Team B row */}
                      <div className="flex items-center justify-between text-xs font-bold py-0.5">
                        <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                          <span>{getTeamFlag(wm.teamBCode || wm.teamB)}</span>
                          <span className="truncate">{wm.teamBCode || wm.teamB}</span>
                        </div>
                        <span className="font-mono text-[11px] font-black text-emerald-200">
                          {wm.scoreB || ""}
                        </span>
                      </div>

                      {/* Status row with live indicator */}
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-emerald-500/20 text-[10px]">
                        <span className="truncate max-w-[160px] text-white/80 font-medium">
                          {wm.statusText || wm.venue || "Match underway"}
                        </span>
                        {isLive ? (
                          <span className="flex items-center gap-1 text-[9px] text-red-400 font-black uppercase">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            LIVE
                          </span>
                        ) : wm.status === "COMPLETED" ? (
                          <span className="flex items-center gap-1 text-[9px] text-white/50 uppercase">
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                            FINAL
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] text-amber-300 uppercase">
                            <Clock className="h-2.5 w-2.5" />
                            PREVIEW
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 text-xs text-white/60 py-4 text-center">
                  Loading worldwide cricket fixtures...
                </div>
              )}
            </div>

            {/* Right Arrow Button */}
            <button
              type="button"
              onClick={handleNextTicker}
              title="Next 3 matches"
              aria-label="Next matches"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-950/80 hover:bg-emerald-600/60 text-white/90 hover:text-white border border-emerald-500/30 transition-all cursor-pointer shadow"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* ALL Button (Cycles next matches in place) */}
            <button
              type="button"
              onClick={handleNextTicker}
              title="Cycle matches"
              className="text-xs font-black shrink-0 px-3 py-2 rounded-md bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>ALL</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            {/* Page Indicator */}
            <span className="text-[10px] font-mono text-emerald-400/80 shrink-0 hidden md:inline">
              {tickerPage + 1}/{totalPages}
            </span>
          </div>
        </div>

        {/* ============================================================= */}
        {/* UNIFIED CRICBUZZ & DREAM11 MATCH SUITE (When a match is clicked) */}
        {/* ============================================================= */}
        {selectedHomeMatch && (
          <div className="rounded-2xl border-2 border-emerald-500/70 bg-gradient-to-b from-surface via-surface/95 to-surface-2 p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in-50 duration-200">
            {/* Top Match Header (Exact Cricbuzz Style) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground">
                  {teamA} vs {teamB}, Final, {tournament} - {matchTab}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1 font-medium">
                  <span><strong>Series:</strong> {tournament}</span>
                  <span>•</span>
                  <span><strong>Venue:</strong> {venue}</span>
                  <span>•</span>
                  <span><strong>Date & Time:</strong> Sunday, September 6, 9:30 AM LOCAL</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCreateTeam}
                  variant="hero"
                  size="sm"
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-md"
                >
                  <Plus className="h-4 w-4" /> Create Team
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedHomeMatch(null)}
                  title="Close match center"
                  aria-label="Close match center"
                  className="h-8 w-8 rounded-full bg-surface-2 hover:bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Cricbuzz Subtabs (Pic 3 & 4 + Contests) */}
            <div className="flex overflow-x-auto gap-3 sm:gap-6 border-b border-border/80 pb-2 scrollbar-none text-xs sm:text-sm font-bold">
              {CRICBUZZ_TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMatchTab(t)}
                  className={cn(
                    "whitespace-nowrap px-1 pb-1 border-b-2 transition-colors cursor-pointer",
                    matchTab === t
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Notification alert for joining contest */}
            {contestSuccessMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>{contestSuccessMsg}</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 1: CONTESTS (DREAM11 BETTING & FANTASY ARENA)         */}
            {/* ========================================================= */}
            {matchTab === "Contests" && (
              <div className="space-y-5">
                {/* Contest Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {["All", "Mega Contests", "Head to Head", "Winner Takes All", "Practice"].map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setContestFilter(cat)}
                        className={cn(
                          "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border",
                          contestFilter === cat
                            ? "bg-emerald-500 text-black border-emerald-400 shadow-sm"
                            : "bg-surface-2/60 text-muted-foreground border-border/60 hover:text-foreground"
                        )}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>

                {/* Contests Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredContests.map((c) => {
                    const pct = Math.round((c.filledSpots / c.totalSpots) * 100);
                    return (
                      <div
                        key={c.id}
                        className="rounded-2xl border border-border/80 bg-surface/90 p-4 space-y-3.5 shadow-sm hover:border-emerald-500/50 transition-colors flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-bold text-foreground">{c.name}</span>
                            {c.guaranteed && (
                              <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                                GUARANTEED
                              </span>
                            )}
                          </div>

                          <div className="flex items-baseline justify-between pt-1">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold">
                                Total Prize Pool
                              </p>
                              <p className="text-xl font-black text-emerald-400 font-mono">
                                {c.prizePool}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold">
                                Entry Fee
                              </p>
                              <p className="text-base font-black text-foreground font-mono">
                                {c.entryFee === 0 ? "FREE" : `₹${c.entryFee}`}
                              </p>
                            </div>
                          </div>

                          {/* Spots Progress Bar */}
                          <div className="mt-3 space-y-1">
                            <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                              <span>
                                {c.filledSpots.toLocaleString()} / {c.totalSpots.toLocaleString()}{" "}
                                spots
                              </span>
                              <span className="text-emerald-300 font-bold">
                                {(c.totalSpots - c.filledSpots).toLocaleString()} left
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            1st Prize: <strong className="text-foreground">{c.firstPrize}</strong>
                          </span>
                          <Button
                            onClick={() => handleJoinContest(c.id)}
                            disabled={joiningContestId === c.id}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4"
                          >
                            {c.entryFee === 0 ? "Join Free" : `Join ₹${c.entryFee}`}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: LIVE SCORECARD & STATS (EXACT PIC 3)                */}
            {/* ========================================================= */}
            {matchTab === "Live" && (
              <div className="space-y-5">
                {/* Scorecard Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-2/60 border border-border/60 rounded-xl p-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase">
                      1st Innings
                    </p>
                    <p className="text-lg font-black text-foreground">
                      {selectedHomeMatch.teamACode || selectedHomeMatch.teamA}{" "}
                      {selectedHomeMatch.scoreA || "708"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-emerald-400 uppercase">
                      Current Batting
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-400">
                        {selectedHomeMatch.teamBCode || selectedHomeMatch.teamB}
                      </span>
                      <span className="text-2xl font-mono font-black text-white">
                        {selectedHomeMatch.scoreB || "242/6 (80.0 ov)"}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-300 ml-2">
                        CRR: 3.02
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 md:text-right">
                    <p className="text-[11px] font-bold text-red-400 uppercase">Match Situation</p>
                    <p className="text-xs font-bold text-foreground">
                      {selectedHomeMatch.statusText ||
                        "Day 3: 3rd Session - South Zone trail by 466 runs"}
                    </p>
                  </div>
                </div>

                {/* Batters & Bowlers Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
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
                          <tr className="text-emerald-400 font-bold bg-emerald-950/10">
                            <td className="py-2.5 px-3">Tilak Varma *</td>
                            <td className="py-2.5 px-3 text-right font-mono">56</td>
                            <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                              133
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">4</td>
                            <td className="py-2.5 px-3 text-right font-mono">0</td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-300">
                              42.10
                            </td>
                          </tr>
                          <tr className="text-foreground">
                            <td className="py-2.5 px-3">Chama V Milind</td>
                            <td className="py-2.5 px-3 text-right font-mono">2</td>
                            <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                              4
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">0</td>
                            <td className="py-2.5 px-3 text-right font-mono">0</td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-300">
                              50.00
                            </td>
                          </tr>
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
                          <tr className="text-foreground">
                            <td className="py-2.5 px-3 font-semibold">
                              Md Kounain Quraishi <span className="text-emerald-400">*</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">31</td>
                            <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                              7
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">77</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-red-400">
                              1
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-300">
                              2.48
                            </td>
                          </tr>
                          <tr className="text-foreground">
                            <td className="py-2.5 px-3 font-semibold">Abhijit K Sarkar</td>
                            <td className="py-2.5 px-3 text-right font-mono">8</td>
                            <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                              0
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">35</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-red-400">
                              0
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-300">
                              4.37
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Recent Balls Strip */}
                    <div className="flex items-center gap-3 p-3 bg-surface/70 border border-border/80 rounded-xl text-xs font-medium">
                      <span className="text-muted-foreground font-bold">Recent:</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        {["0", "W", "0", "0", "2", "0"].map((b, i) => (
                          <span
                            key={i}
                            className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center text-[11px]",
                              b === "W"
                                ? "bg-red-500 text-white font-black"
                                : b === "2"
                                ? "bg-emerald-500 text-white"
                                : "bg-surface-2 text-foreground border border-border"
                            )}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* EXACT USER PIC 3 OVER 80 SUMMARY BOX */}
                    <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
                      <div className="px-4 py-3 bg-surface-2/60 flex items-center justify-between border-b border-border/70 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-foreground text-sm">Over 80</span>
                          <span className="text-muted-foreground font-semibold">|</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">242-6</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="tracking-widest text-foreground font-bold">
                            0 <span className="text-red-500 font-black">W</span> 0 0 2 0
                          </span>
                          <span className="text-muted-foreground text-[11px]">(2 runs)</span>
                        </div>
                      </div>

                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-b border-border/60">
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

                        <div className="space-y-1.5 sm:border-l sm:border-border/60 sm:pl-4">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-foreground">
                              Md Kounain Quraishi
                            </span>
                            <span className="font-mono font-bold text-foreground">31-7-77-1</span>
                          </div>
                          <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                            <span>Economy: 2.48</span>
                            <span>Maidens: 7</span>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-2 bg-surface-2/30 flex items-center gap-6 text-xs font-semibold text-primary">
                        <span
                          onClick={() => setMatchTab("Overs")}
                          className="hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          Over Summary <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                        <span
                          onClick={() => setMatchTab("Overs")}
                          className="hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          View all overs <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>

                    {/* OVER 79 SUMMARY BOX */}
                    <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
                      <div className="px-4 py-3 bg-surface-2/60 flex items-center justify-between border-b border-border/70 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-foreground text-sm">Over 79</span>
                          <span className="text-muted-foreground font-semibold">|</span>
                          <span className="font-mono font-bold text-foreground text-sm">240-5</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="tracking-widest text-foreground font-bold">
                            1 0 1 0 1 1
                          </span>
                          <span className="text-muted-foreground text-[11px]">(4 runs)</span>
                        </div>
                      </div>

                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-b border-border/60">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-foreground">
                              Smaran Ravichandran
                            </span>
                            <span className="font-mono text-muted-foreground">23 (53)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-emerald-400">Tilak Varma *</span>
                            <span className="font-mono font-bold text-emerald-300">55 (130)</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 sm:border-l sm:border-border/60 sm:pl-4">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-foreground">Abhijit K Sarkar</span>
                            <span className="font-mono font-bold text-foreground">8-0-35-0</span>
                          </div>
                          <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                            <span>Economy: 4.37</span>
                            <span>Maidens: 0</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Key Stats Card */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="rounded-xl border border-border/80 bg-surface/90 p-4 text-xs space-y-3 shadow-sm">
                      <div className="font-black text-muted-foreground uppercase text-[11px] tracking-wider border-b border-border/60 pb-2">
                        KEY STATS
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-semibold">Partnership:</span>
                        <span className="font-bold text-foreground font-mono">43 (109)</span>
                      </div>
                      <div className="flex flex-col gap-1 border-t border-border/40 pt-2">
                        <span className="text-muted-foreground font-semibold">Last Wkt:</span>
                        <span className="text-foreground leading-snug text-[11px]">
                          Smaran Ravichandran c Kumar Kushagra b Mohammed Shami 23(55) - 174/5 in
                          53.4 ov.
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-border/40 pt-2">
                        <span className="text-muted-foreground font-semibold">Ovs Left:</span>
                        <span className="font-bold text-foreground font-mono">18.1</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-border/40 pt-2">
                        <span className="text-muted-foreground font-semibold">Toss:</span>
                        <span className="font-semibold text-emerald-400">
                          South Zone opt to bowl
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: SCORECARD (COMPREHENSIVE CRICBUZZ SCORECARD)       */}
            {/* ========================================================= */}
            {matchTab === "Scorecard" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
                  <div className="bg-emerald-950/40 border-b border-border/80 px-4 py-3 flex items-center justify-between">
                    <span className="font-bold text-emerald-400 text-sm">
                      South Zone 1st Innings
                    </span>
                    <span className="font-mono font-black text-white text-base">242-6 (80.0 ov)</span>
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
                      <tr>
                        <td className="py-2.5 px-3 font-semibold">Mayank Agarwal</td>
                        <td className="py-2.5 px-3 text-muted-foreground">c Ishan Kishan b Shami</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">34</td>
                        <td className="py-2.5 px-3 text-right font-mono">68</td>
                        <td className="py-2.5 px-3 text-right font-mono">5</td>
                        <td className="py-2.5 px-3 text-right font-mono">0</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-300">50.00</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold">Rohan Kunnummal</td>
                        <td className="py-2.5 px-3 text-muted-foreground">lbw b Mukesh Kumar</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">18</td>
                        <td className="py-2.5 px-3 text-right font-mono">36</td>
                        <td className="py-2.5 px-3 text-right font-mono">3</td>
                        <td className="py-2.5 px-3 text-right font-mono">0</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-300">50.00</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold">Baba Indrajith</td>
                        <td className="py-2.5 px-3 text-muted-foreground">b Shahbaz Ahmed</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">42</td>
                        <td className="py-2.5 px-3 text-right font-mono">88</td>
                        <td className="py-2.5 px-3 text-right font-mono">6</td>
                        <td className="py-2.5 px-3 text-right font-mono">0</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-300">47.73</td>
                      </tr>
                      <tr className="text-emerald-400 font-bold bg-emerald-950/10">
                        <td className="py-2.5 px-3">Tilak Varma *</td>
                        <td className="py-2.5 px-3 text-emerald-300">batting</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">56</td>
                        <td className="py-2.5 px-3 text-right font-mono">133</td>
                        <td className="py-2.5 px-3 text-right font-mono">4</td>
                        <td className="py-2.5 px-3 text-right font-mono">0</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-300">42.10</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold">Smaran Ravichandran</td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          c Kumar Kushagra b Quraishi
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">23</td>
                        <td className="py-2.5 px-3 text-right font-mono">55</td>
                        <td className="py-2.5 px-3 text-right font-mono">2</td>
                        <td className="py-2.5 px-3 text-right font-mono">0</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-300">41.82</td>
                      </tr>
                      <tr className="text-foreground">
                        <td className="py-2.5 px-3 font-semibold">Chama V Milind</td>
                        <td className="py-2.5 px-3 text-muted-foreground">batting</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">2</td>
                        <td className="py-2.5 px-3 text-right font-mono">4</td>
                        <td className="py-2.5 px-3 text-right font-mono">0</td>
                        <td className="py-2.5 px-3 text-right font-mono">0</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-300">50.00</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Fall of Wickets */}
                  <div className="p-4 border-t border-border/80 bg-surface-2/30 space-y-2 text-xs">
                    <p className="font-bold text-muted-foreground uppercase text-[11px]">
                      Fall of Wickets
                    </p>
                    <p className="text-foreground font-mono leading-relaxed">
                      34-1 (Rohan Kunnummal, 11.2 ov), 62-2 (Mayank Agarwal, 22.4 ov), 126-3 (Baba
                      Indrajith, 44.1 ov), 174-4 (Ricky Bhui, 53.4 ov), 240-5 (Smaran Ravichandran,
                      79.6 ov), 242-6 (Sundar, 80.2 ov)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: HIGHLIGHTS (EXACT USER PICS 4 & 5)                  */}
            {/* ========================================================= */}
            {matchTab === "Highlights" && (
              <div className="space-y-4">
                {/* Innings Selector Buttons (Pic 4) */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setHighlightsInnings("EZONE 1st Innings")}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      highlightsInnings === "EZONE 1st Innings"
                        ? "bg-[#0c4a35] text-emerald-300 border border-emerald-500/50"
                        : "bg-surface-2/60 text-muted-foreground hover:text-foreground border border-border/60"
                    )}
                  >
                    EZONE 1st Innings
                  </button>
                  <button
                    type="button"
                    onClick={() => setHighlightsInnings("SZONE 1st Innings")}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      highlightsInnings === "SZONE 1st Innings"
                        ? "bg-[#0c4a35] text-emerald-300 border border-emerald-500/50"
                        : "bg-surface-2/60 text-muted-foreground hover:text-foreground border border-border/60"
                    )}
                  >
                    SZONE 1st Innings
                  </button>
                </div>

                {/* Filter Pills (Pic 4) */}
                <div className="flex flex-wrap items-center gap-2 bg-surface-2/40 p-2 rounded-xl border border-border/60">
                  {[
                    "All",
                    "Fours",
                    "Sixes",
                    "Wickets",
                    "Fifties",
                    "Hundreds",
                    "Dropped Catches",
                    "UDRS",
                    "Others",
                  ].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setHighlightsFilter(f)}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer",
                        highlightsFilter === f
                          ? "bg-surface text-foreground shadow border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Highlights Balls List */}
                <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
                  {filteredHighlights.length > 0 ? (
                    filteredHighlights.map((hl, idx) => (
                      <div
                        key={idx}
                        className="flex p-4 gap-4 hover:bg-surface-2/30 transition-colors"
                      >
                        <div className="w-14 shrink-0 flex flex-col items-center gap-1 mt-0.5">
                          <span className="font-mono font-black text-foreground text-sm">
                            {hl.over}
                          </span>
                          {hl.badge && (
                            <span
                              className={cn(
                                "h-5 w-5 rounded-full flex items-center justify-center font-mono font-black text-[11px]",
                                hl.badgeColor || "bg-emerald-500 text-white"
                              )}
                            >
                              {hl.badge}
                            </span>
                          )}
                        </div>
                        <p className="flex-1 text-xs text-foreground/90 leading-relaxed font-normal">
                          {hl.text}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No highlights found for this category.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 5: GRAPHS (MANHATTAN & WORM CHARTS - PIC 3)            */}
            {/* ========================================================= */}
            {matchTab === "Graphs" && (
              <div className="space-y-6">
                {/* Manhattan Chart */}
                <div className="rounded-xl border border-border/80 bg-surface/90 p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> MANHATTAN CHART (RUNS PER OVER)
                    </h3>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      🔴 Red Dot = Wicket Fallen
                    </span>
                  </div>

                  <div className="h-64 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MOCK_MANHATTAN_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3f35" opacity={0.3} />
                        <XAxis dataKey="over" stroke="#888" fontSize={10} tickLine={false} />
                        <YAxis stroke="#888" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0d261e",
                            borderColor: "#10b981",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="runs" fill="#10b981" radius={[4, 4, 0, 0]}>
                          {MOCK_MANHATTAN_DATA.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.isWicket ? "#ef4444" : "#10b981"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Worm Chart (Cumulative Runs Comparison) */}
                <div className="rounded-xl border border-border/80 bg-surface/90 p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> WORM CHART (CUMULATIVE PROGRESSION)
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <span className="text-emerald-400">― EZONE (708)</span>
                      <span className="text-amber-400">― SZONE (242)</span>
                    </div>
                  </div>

                  <div className="h-64 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={MOCK_WORM_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3f35" opacity={0.3} />
                        <XAxis dataKey="over" stroke="#888" fontSize={10} tickLine={false} />
                        <YAxis stroke="#888" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0d261e",
                            borderColor: "#10b981",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="teamA"
                          name="East Zone"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="teamB"
                          name="South Zone"
                          stroke="#f59e0b"
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 6: INFO TAB (VENUE & BROADCAST GUIDE)                  */}
            {/* ========================================================= */}
            {matchTab === "Info" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
                  <div className="bg-emerald-950/40 border-b border-border/80 px-4 py-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                      MATCH INFORMATION
                    </h3>
                  </div>
                  <div className="divide-y divide-border/60 text-xs">
                    <div className="flex p-3 justify-between">
                      <span className="text-muted-foreground font-semibold">Match</span>
                      <span className="font-bold text-foreground">
                        {teamA} vs {teamB}, Final
                      </span>
                    </div>
                    <div className="flex p-3 justify-between">
                      <span className="text-muted-foreground font-semibold">Series</span>
                      <span className="font-bold text-foreground">{tournament}</span>
                    </div>
                    <div className="flex p-3 justify-between">
                      <span className="text-muted-foreground font-semibold">Toss</span>
                      <span className="font-bold text-emerald-300">
                        South Zone won the toss and opt to bowl
                      </span>
                    </div>
                    <div className="flex p-3 justify-between">
                      <span className="text-muted-foreground font-semibold">Venue</span>
                      <span className="font-bold text-foreground">{venue}</span>
                    </div>
                    <div className="flex p-3 justify-between">
                      <span className="text-muted-foreground font-semibold">Umpires</span>
                      <span className="font-medium text-foreground">
                        Virender Sharma, Anil Chaudhary
                      </span>
                    </div>
                    <div className="flex p-3 justify-between">
                      <span className="text-muted-foreground font-semibold">Referee</span>
                      <span className="font-medium text-foreground">Manu Nayyar</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
                    <div className="bg-emerald-950/40 border-b border-border/80 px-4 py-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        VENUE GUIDE
                      </h3>
                    </div>
                    <div className="divide-y divide-border/60 text-xs">
                      <div className="flex p-3 justify-between">
                        <span className="text-muted-foreground font-semibold">Stadium</span>
                        <span className="font-bold text-foreground">
                          MA Chidambaram Stadium (Chepauk)
                        </span>
                      </div>
                      <div className="flex p-3 justify-between">
                        <span className="text-muted-foreground font-semibold">Capacity</span>
                        <span className="font-bold text-foreground">38,000</span>
                      </div>
                      <div className="flex p-3 justify-between">
                        <span className="text-muted-foreground font-semibold">Ends</span>
                        <span className="font-medium text-foreground">
                          Anna Pavilion End, V Pattabhiraman Gate End
                        </span>
                      </div>
                      <div className="flex p-3 justify-between">
                        <span className="text-muted-foreground font-semibold">Hosts To</span>
                        <span className="font-medium text-foreground">
                          Tamil Nadu, Chennai Super Kings
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
                    <div className="bg-emerald-950/40 border-b border-border/80 px-4 py-3 flex items-center gap-2">
                      <Tv className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        BROADCAST GUIDE
                      </h3>
                    </div>
                    <div className="divide-y divide-border/60 text-xs">
                      <div className="flex p-3 justify-between">
                        <span className="text-muted-foreground font-semibold">Live Streaming</span>
                        <span className="font-bold text-emerald-400">JioHotstar</span>
                      </div>
                      <div className="flex p-3 justify-between">
                        <span className="text-muted-foreground font-semibold">Television</span>
                        <span className="font-bold text-foreground">Star Sports Network</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 7: SQUADS (PLAYING XI & BENCH)                        */}
            {/* ========================================================= */}
            {matchTab === "Squads" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border/80 bg-surface/90 p-5 space-y-3 shadow-sm">
                  <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" /> {teamA} (Playing XI)
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {[
                      "Abhimanyu Easwaran (c)",
                      "Sudip Gharami",
                      "Anustup Majumdar",
                      "Ishan Kishan (wk)",
                      "Shahbaz Ahmed",
                      "Kumar Kushagra",
                      "Manisankar Murasingh",
                      "Suraj Sindhu Jaiswal",
                      "Tripurana Vijay",
                      "Mukesh Kumar",
                      "Mohammed Shami",
                    ].map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-lg bg-surface-2/40"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="font-semibold text-foreground">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-surface/90 p-5 space-y-3 shadow-sm">
                  <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" /> {teamB} (Playing XI)
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {[
                      "Mayank Agarwal (c)",
                      "Rohan Kunnummal",
                      "Baba Indrajith",
                      "Tilak Varma",
                      "Ricky Bhui (wk)",
                      "Smaran Ravichandran",
                      "Washington Sundar",
                      "Sai Kishore",
                      "Chama V Milind",
                      "Md Kounain Quraishi",
                      "Abhijit K Sarkar",
                    ].map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-lg bg-surface-2/40"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="font-semibold text-foreground">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 8: POINTS TABLE                                       */}
            {/* ========================================================= */}
            {matchTab === "Points Table" && (
              <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-2/70 text-muted-foreground font-bold border-b border-border/80 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Team</th>
                      <th className="py-2.5 px-3 text-right">P</th>
                      <th className="py-2.5 px-3 text-right">W</th>
                      <th className="py-2.5 px-3 text-right">L</th>
                      <th className="py-2.5 px-3 text-right">NR</th>
                      <th className="py-2.5 px-3 text-right">Pts</th>
                      <th className="py-2.5 px-3 text-right">NRR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr className="bg-emerald-950/15 font-bold">
                      <td className="py-2.5 px-3 flex items-center gap-2">
                        <span>1</span>
                        <span>🏏 East Zone</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">4</td>
                      <td className="py-2.5 px-3 text-right font-mono">3</td>
                      <td className="py-2.5 px-3 text-right font-mono">0</td>
                      <td className="py-2.5 px-3 text-right font-mono">1</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400">14</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-300">+1.842</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 flex items-center gap-2">
                        <span>2</span>
                        <span>⚡ South Zone</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">4</td>
                      <td className="py-2.5 px-3 text-right font-mono">2</td>
                      <td className="py-2.5 px-3 text-right font-mono">1</td>
                      <td className="py-2.5 px-3 text-right font-mono">1</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400">11</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-300">+0.640</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 flex items-center gap-2">
                        <span>3</span>
                        <span>🔥 West Zone</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">4</td>
                      <td className="py-2.5 px-3 text-right font-mono">1</td>
                      <td className="py-2.5 px-3 text-right font-mono">2</td>
                      <td className="py-2.5 px-3 text-right font-mono">1</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400">6</td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                        -0.312
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 9: OVERS (OVER-BY-OVER BREAKDOWN)                     */}
            {/* ========================================================= */}
            {matchTab === "Overs" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-border/80 bg-surface/90 p-4 shadow-sm flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">Over 80: </span>
                    <span className="text-muted-foreground font-mono">
                      0 W 0 0 2 0 (2 runs, 1 wicket)
                    </span>
                  </div>
                  <span className="font-bold text-emerald-400">Bowler: Md Kounain Quraishi</span>
                </div>
                <div className="rounded-xl border border-border/80 bg-surface/90 p-4 shadow-sm flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">Over 79: </span>
                    <span className="text-muted-foreground font-mono">
                      1 0 1 0 1 1 (4 runs, 0 wickets)
                    </span>
                  </div>
                  <span className="font-bold text-emerald-400">Bowler: Abhijit K Sarkar</span>
                </div>
                <div className="rounded-xl border border-border/80 bg-surface/90 p-4 shadow-sm flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">Over 78: </span>
                    <span className="text-muted-foreground font-mono">
                      0 0 4 0 1 0 (5 runs, 0 wickets)
                    </span>
                  </div>
                  <span className="font-bold text-emerald-400">Bowler: Md Kounain Quraishi</span>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 10: LEADERBOARD (FANTASY CONTEST STANDINGS)            */}
            {/* ========================================================= */}
            {matchTab === "Leaderboard" && (
              <div className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden shadow-sm">
                <div className="bg-emerald-950/40 border-b border-border/80 px-4 py-3 flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                    <Trophy className="h-4 w-4" /> Live Fantasy Contest Leaderboard
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">75,420 Teams</span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-2/70 text-muted-foreground font-bold border-b border-border/80 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">User & Team</th>
                      <th className="py-2.5 px-3 text-right">Points</th>
                      <th className="py-2.5 px-3 text-right">Prize</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {MOCK_LEADERBOARD.map((lb) => (
                      <tr
                        key={lb.rank}
                        className={cn(
                          "transition-colors",
                          lb.rank === 1
                            ? "bg-amber-500/10 font-bold"
                            : lb.rank <= 3
                            ? "bg-emerald-950/15"
                            : "hover:bg-surface-2/30"
                        )}
                      >
                        <td className="py-2.5 px-3 font-mono font-black">
                          {lb.rank === 1 ? "🥇 #1" : lb.rank === 2 ? "🥈 #2" : lb.rank === 3 ? "🥉 #3" : `#${lb.rank}`}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-foreground">{lb.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {lb.teamName}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-300">
                          {lb.points}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                          {lb.prize}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* 2. THREE-COLUMN CRICBUZZ CONTENT (NEWS, STORIES, HIGHLIGHTS)  */}
        {/* ============================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* --------------------------------------------------------- */}
          {/* LEFT COLUMN: LATEST NEWS (HEADINGS ONLY -> CLICK FULL)    */}
          {/* --------------------------------------------------------- */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <h3 className="text-red-500 font-display text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Newspaper className="h-4 w-4 text-red-500" />
                <span>LATEST NEWS</span>
              </h3>
              <span className="text-[10px] text-muted-foreground font-bold uppercase">UPDATED</span>
            </div>

            <div className="flex flex-col divide-y divide-border/60 bg-surface/80 border border-border/80 rounded-2xl p-2 shadow-sm">
              {(news.length > 0 ? news : FEATURED_ARTICLES).slice(0, 8).map((n: any, i: number) => {
                const articleObj: NewsArticle = {
                  id: n.id || `news-${i}`,
                  title: n.title,
                  category: n.category || "Cricket News",
                  timeAgo: n.timeAgo || `${i + 1}h ago`,
                  author: n.author || "Cricbuzz Bureau",
                  image: n.image || FEATURED_ARTICLES[i % FEATURED_ARTICLES.length]?.image || heroArticle.image,
                  summary: n.summary || n.title,
                  content: n.content || [
                    n.title,
                    "Tournament officials have ratified the schedule with match referees overseeing pitch conditions.",
                    "Live ball-by-ball updates and expert analysis continue across the Fantasy Cricket Arena.",
                  ],
                };

                return (
                  <div
                    key={i}
                    onClick={() => setReadingArticle(articleObj)}
                    className="p-3 group cursor-pointer hover:bg-surface-2/80 rounded-xl transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] text-primary font-bold uppercase tracking-wider mb-1">
                      <span>{articleObj.category}</span>
                      <span className="text-muted-foreground font-normal">{articleObj.timeAgo}</span>
                    </div>
                    <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-relaxed">
                      {articleObj.title}
                    </h4>
                  </div>
                );
              })}
            </div>
          </div>

          {/* --------------------------------------------------------- */}
          {/* CENTER COLUMN: FEATURED STORY + SPECIAL FEATURES & ANALYSIS*/}
          {/* --------------------------------------------------------- */}
          <div className="lg:col-span-6 space-y-6 min-w-0">
            {/* Main Featured Story (Pic 5 Ishan Kishan 270) */}
            <div
              onClick={() => setReadingArticle(heroArticle)}
              className="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface/90 shadow-lg hover:border-primary/60 cursor-pointer transition-all duration-300"
            >
              <div className="px-5 pt-3 pb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between border-b border-border/40 bg-surface-2/40">
                <span className="text-emerald-400 font-bold">{heroArticle.category}</span>
                <span>{heroArticle.timeAgo}</span>
              </div>

              {/* Photo Banner */}
              <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-surface-2">
                <img
                  src={heroArticle.image || heroCricket}
                  alt={heroArticle.title}
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> FEATURED STORY
                </div>
              </div>

              {/* Story Heading & Subtitle */}
              <div className="p-5 space-y-2">
                <h2 className="font-display text-lg sm:text-xl font-black text-foreground group-hover:text-primary transition-colors leading-snug">
                  {heroArticle.title}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {heroArticle.summary}
                </p>
                <div className="pt-2 flex items-center justify-between text-xs font-bold text-primary border-t border-border/40">
                  <span className="flex items-center gap-1">
                    Click to Read Full Story <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-muted-foreground font-normal">{heroArticle.author}</span>
                </div>
              </div>
            </div>

            {/* SPECIAL FEATURES & ANALYSIS SECTION (MATCHING PIC 4) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-500" />
                  <h3 className="font-display text-xs font-black uppercase tracking-wider text-foreground">
                    SPECIAL FEATURES & ANALYSIS
                  </h3>
                </div>
                <span className="text-[10px] text-muted-foreground font-bold">IN-DEPTH</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {specialArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setReadingArticle(art)}
                    className="group rounded-2xl border border-border/70 bg-surface/80 hover:border-primary/50 overflow-hidden cursor-pointer transition-all shadow-sm flex flex-col justify-between"
                  >
                    <div className="relative h-40 w-full overflow-hidden bg-surface-2">
                      <img
                        src={art.image}
                        alt={art.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 bg-black/75 text-white text-[9px] font-black px-2 py-0.5 rounded tracking-wide">
                        {art.category}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                          {art.title}
                        </h4>
                        <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {art.summary}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{art.author?.split("•")[0]}</span>
                        <span>{art.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CRICBUZZ EDITORIAL STORIES (MATCHING PIC 5) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-emerald-400" />
                  <h3 className="font-display text-xs font-black uppercase tracking-wider text-foreground">
                    CRICBUZZ EDITORIAL STORIES & ARCHIVES
                  </h3>
                </div>
              </div>

              <div className="divide-y divide-border/60 rounded-2xl border border-border/70 bg-surface/80 p-2 shadow-sm">
                {editorialStories.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => setReadingArticle(story)}
                    className="p-3.5 group cursor-pointer hover:bg-surface-2/60 rounded-xl transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                        {story.category}
                      </span>
                      <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {story.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {story.summary}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{story.timeAgo}</p>
                    </div>
                    {story.image && (
                      <img
                        src={story.image}
                        alt={story.title}
                        className="h-16 w-24 object-cover rounded-lg shrink-0 group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --------------------------------------------------------- */}
          {/* RIGHT COLUMN: FEATURED VIDEOS (PIC 4 HIGHLIGHTS)          */}
          {/* --------------------------------------------------------- */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <h3 className="text-red-500 font-display text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Video className="h-4 w-4 text-red-500" />
                <span>FEATURED VIDEOS</span>
              </h3>
              <span className="text-[10px] text-muted-foreground font-bold uppercase">
                HIGHLIGHTS
              </span>
            </div>

            <div className="space-y-4">
              {FEATURED_VIDEOS.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setActiveVideo(v)}
                  className="group cursor-pointer rounded-2xl overflow-hidden border border-border/70 bg-surface/70 hover:border-primary/60 transition-all p-2.5 shadow-sm"
                >
                  <div className="relative h-36 rounded-xl overflow-hidden bg-surface-2 flex items-center justify-center mb-2.5">
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    <div className="bg-primary/90 text-primary-foreground rounded-full p-2.5 z-10 shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="h-4 w-4 fill-current" />
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                      {v.duration}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {v.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-1">{v.views}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* FULL ARTICLE READER MODAL (Opens when clicking any headline)  */}
        {/* ============================================================= */}
        {readingArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-black uppercase tracking-wider">
                    {readingArticle.category}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {readingArticle.readTime || "4 min read"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setReadingArticle(null)}
                  aria-label="Close article"
                  className="h-9 w-9 rounded-full bg-surface-2 hover:bg-surface text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors border border-border"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground leading-tight">
                  {readingArticle.title}
                </h1>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground border-y border-border/40 py-2.5">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-foreground">
                      {readingArticle.author || "Cricbuzz Staff"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {readingArticle.timeAgo}
                    </span>
                  </div>
                </div>
              </div>

              {readingArticle.image && (
                <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-2xl bg-surface-2">
                  <img
                    src={readingArticle.image}
                    alt={readingArticle.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {readingArticle.quotes && (
                <blockquote className="border-l-4 border-emerald-500 bg-emerald-950/20 p-4 rounded-r-xl italic text-sm text-emerald-200 font-medium">
                  {readingArticle.quotes}
                </blockquote>
              )}

              <div className="space-y-4 text-sm text-foreground/90 leading-relaxed">
                {(readingArticle.content || [readingArticle.summary || ""]).map((para, pidx) => (
                  <p key={pidx}>{para}</p>
                ))}
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Fantasy Cricket Arena &bull; Cricbuzz Integrated
                </span>
                <Button
                  onClick={() => setReadingArticle(null)}
                  className="bg-primary text-primary-foreground font-bold text-xs"
                >
                  Done Reading
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Video Player Modal */}
        {activeVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-red-400">
                  <Video className="h-4 w-4 text-red-500" />
                  <span>CRICKET VIDEO HIGHLIGHT</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveVideo(null)}
                  aria-label="Close video"
                  className="h-8 w-8 rounded-full bg-surface-2 hover:bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-2xl bg-black flex items-center justify-center">
                <img
                  src={activeVideo.thumbnail}
                  alt={activeVideo.title}
                  className="h-full w-full object-cover opacity-60"
                />
                <div className="absolute flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-2xl animate-pulse">
                    <Play className="h-8 w-8 fill-current ml-1" />
                  </div>
                  <span className="text-xs font-bold text-white bg-black/80 px-3 py-1 rounded-full">
                    Playing: {activeVideo.title}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">{activeVideo.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {activeVideo.duration} • {activeVideo.views}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

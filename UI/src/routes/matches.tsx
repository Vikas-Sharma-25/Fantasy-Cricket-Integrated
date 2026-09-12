import { useEffect, useMemo, useState, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/fc/AppShell";
import { Card } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { getMatches, getContests, getMyTeams, joinContest, getMyContests, getLeaderboard, getMatchPlayers, deleteTeam, getLocalWalletBalance, deductLocalWallet } from "@/lib/api-services";
import type { Match, Contest, FantasyTeam, MatchPlayer } from "@/lib/api-types";
import { TeamPitchPreview, type PitchPlayer } from "@/components/fc/TeamPitchPreview";
import { setFlow, removeFlow, getFlow, FLOW_KEYS } from "@/lib/flow";
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
  AlertCircle,
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
  ArrowLeft,
  Info,
  HelpCircle,
  Check,
  Star,
  Globe2,
  Eye,
  ShieldCheck,
  Lock,
  Volume2,
  VolumeX,
  Maximize2,
  Thermometer,
  CloudRain,
  Wind,
  Droplets,
  Sun,
  Compass,
  MapPin,
  Pencil,
  Trash2,
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
      "A batting masterclass for the ages unfolded at the MA Chidambaram Stadium as East Zone piled on a mammoth 708 against South Zone, highlighted by Ishan Kishan's career-defining 270.",
    content: [
      "In one of the most ruthless displays of first-class batting seen in modern Indian domestic cricket, East Zone posted an imposing total of 708 all out on Day 2 of the Duleep Trophy 2026 final at Chepauk.",
      "The centerpiece was Ishan Kishan's blistering 270 off just 312 balls, studded with 28 boundaries and 7 sixes. He punished both pace and spin with equal disdain, driving South Zone's bowling attack into submission on a sweltering Chennai afternoon.",
      "South Zone responded with resilience on Day 3, with Tilak Varma compiling an unbeaten half-century (56 off 133) alongside Chama Milind. However, facing a steep mountain, they ended the day at 242/6, still trailing by 466 runs.",
      "The pitch continues to offer turn and bounce for spinners, setting up a tantalizing Day 4 where East Zone will look to enforce the follow-on and claim the silverware.",
    ],
  },
  {
    id: "art-2",
    title: "The defining moments of Ben Stokes' era-defining captaincy for England",
    category: "INTERNATIONAL",
    timeAgo: "3h ago",
    author: "Vithushan Ehantharajah • Cricbuzz Global",
    readTime: "4 min read",
    quotes: "\"We don't play for draws. We play to create memories and push limits.\" — Ben Stokes",
    summary:
      "How Ben Stokes and Brendon McCullum fundamentally altered the DNA of Test cricket through sheer tactical audacity and unshakeable self-belief.",
    content: [
      "Under Ben Stokes, England have rewritten Test match conventions. Chasing 378 against India with ease, declaring on Day 1 of Ashes Tests, and continually bowling with attacking fields regardless of economy rates.",
      "While skeptics pointed to defensive frailties, Stokes' England proved that calculated risk outscores conservative caution over a 5-day cycle.",
      "As England prepare for their upcoming subcontinent tour, Stokes' leadership philosophy faces its ultimate tactical test on spin-friendly tracks.",
    ],
  },
  {
    id: "art-3",
    title: "Kane Williamson steps down from New Zealand central contract to pursue global leagues",
    category: "INTERNATIONAL",
    timeAgo: "4h ago",
    author: "Cricbuzz Global Desk",
    readTime: "3 min read",
    quotes: "\"Playing for New Zealand remains the pinnacle, but balancing franchise leagues is vital at this stage.\" — Kane Williamson",
    summary:
      "New Zealand's modern batting great commits to key ICC tournaments while embracing the flexibility of worldwide franchise cricket.",
    content: [
      "Kane Williamson has formally relinquished his New Zealand central contract for the 2026/27 cycle. The 34-year-old batting maestro emphasized his unwavering commitment to Blackcaps ICC assignments, including the Champions Trophy.",
      "New Zealand Cricket accepted the arrangement, acknowledging the changing economics of international cricket where top stars transition towards casual contracts.",
      "Williamson is slated to feature in the SA20, Big Bash League, and the Indian Premier League in upcoming windows.",
    ],
  },
  {
    id: "art-4",
    title: "Unseen dressing room scenes from India's T20 World Cup victory celebration",
    category: "TEAM INDIA",
    timeAgo: "6h ago",
    author: "Somesh Agarwal • Chepauk Correspondent",
    readTime: "4 min read",
    quotes: "\"This trophy belongs to every Indian fan who stood by us through heartbreaks.\" — Rohit Sharma",
    summary:
      "Emotional speeches, tactical honesty, and the behind-the-scenes bond that powered the Men in Blue to their historic ICC championship trophy.",
    content: [
      "Minutes after the final ball was bowled, emotions poured out in the dressing room. Hardik Pandya and Rohit Sharma shared a tearful embrace that encapsulated months of overcoming criticism.",
      "Rahul Dravid, normally understated, hoisted the silverware amidst cheers from the entire coaching staff. Jasprit Bumrah reflected on the penultimate over that choked the opposition chase.",
      "The victory lap and subsequent victory parade marked a golden chapter for Indian cricket's white-ball legacy.",
    ],
  },
  {
    id: "art-5",
    title: "Bangladesh stun Australia in historic Test chase: Tactical breakdown",
    category: "INTERNATIONAL",
    timeAgo: "8h ago",
    author: "Atif Azam • Dhaka Correspondent",
    readTime: "6 min read",
    quotes: "\"We believed in our young pacers and our fourth-innings discipline.\" — Najmul Shanto",
    summary:
      "How Nahid Rana's express pace and Mehidy Hasan Miraz's all-round heroics delivered Bangladesh's most historic overseas Test triumph.",
    content: [
      "In front of an electric Melbourne crowd, Bangladesh chased down 280 on a treacherous Day 5 pitch, recording their first-ever Test victory against Australia on Australian soil.",
      "Nahid Rana bowled with frightening speed exceeding 150 km/h, picking up 5 crucial wickets across both innings.",
      "Mehidy Hasan held his nerve during a nail-biting final session, striking the winning boundary to spark delirium among travelling Bangladeshi supporters.",
    ],
  },
  {
    id: "art-6",
    title: "Jasprit Bumrah's bowling evolution: How the yorker became an unstoppable weapon",
    category: "ANALYSIS",
    timeAgo: "10h ago",
    author: "Analysis Desk",
    readTime: "4 min read",
    quotes: "\"Accuracy comes from muscle memory and endless practice in the nets.\" — Jasprit Bumrah",
    summary: "Detailed biomechanical examination of Bumrah's hyper-extended action, release angles, and late dip.",
    content: [
      "Jasprit Bumrah's unique release point creates an optical illusion for batters, appearing closer by nearly 40 milliseconds compared to orthodox fast bowlers.",
      "His dipping slower yorker, clocked at 118 km/h right after a 145 km/h bouncer, remains the most difficult ball to negotiate in white-ball cricket today.",
    ],
  },
];

const LATEST_NEWS_ITEMS = [
  { id: "n1", title: "Chapman shifts to casual contract with New Zealand", time: "2h ago", cat: "NEWS" },
  { id: "n2", title: "Injuries hit India's squad! Bumrah returns... Where's Hardik?", time: "3h ago", cat: "ANALYSIS" },
  { id: "n3", title: "Pakistan hit new low! 7 players sent home & new coach in", time: "5h ago", cat: "NEWS" },
  { id: "n4", title: "Impact Player Rule Debate: Stay or Go? Expert Panel Decides", time: "6h ago", cat: "OPINION" },
  { id: "n5", title: "Nashra Sandhu six-fer demolishes Hong Kong in Women's Asia Cup", time: "7h ago", cat: "MATCH REPORT" },
  { id: "n6", title: "Duleep Trophy 2026: East Zone dominate with mammoth 708", time: "8h ago", cat: "DOMESTIC" },
  { id: "n7", title: "IPL 2027 Mega Auction: Key marquee players who could fetch ₹20+ Crore", time: "9h ago", cat: "AUCTION" },
  { id: "n8", title: "MS Dhoni retirement speculation grows after CSK season briefing", time: "11h ago", cat: "IPL" },
  { id: "n9", title: "Jasprit Bumrah officially named ICC Men's Player of the Month", time: "13h ago", cat: "AWARDS" },
  { id: "n10", title: "BCCI confirms standalone window for domestic Women's T20 League", time: "14h ago", cat: "BCCI" },
];

const FEATURED_VIDEOS = [
  {
    id: "v0",
    title: "⚡ OFFICIAL CRICKET ARENA: Cinematic 4K Matchday Anthem",
    duration: "00:15",
    views: "1.8M views",
    tag: "ARENA 4K",
    videoUrl: "/for_this_fantasy_cricket_wbsit.mp4",
  },
  {
    id: "v1",
    title: "Injuries hit India's squad! Bumrah returns... Where's Hardik?",
    duration: "14:22",
    views: "245K views",
    tag: "ANALYSIS",
    videoUrl: "/for_this_fantasy_cricket_wbsit.mp4",
  },
  {
    id: "v2",
    title: "Pakistan hit new low! 7 players sent home & new coach in",
    duration: "18:45",
    views: "512K views",
    tag: "EXCLUSIVE",
    videoUrl: "/for_this_fantasy_cricket_wbsit.mp4",
  },
  {
    id: "v3",
    title: "Impact Player Rule Debate: Stay or Go? Expert Panel Decides",
    duration: "11:08",
    views: "189K views",
    tag: "DEBATE",
    videoUrl: "/for_this_fantasy_cricket_wbsit.mp4",
  },
  {
    id: "v4",
    title: "Chepauk Masterclass: Ishan Kishan's 270 Full Boundary Reel",
    duration: "09:30",
    views: "890K views",
    tag: "HIGHLIGHTS",
    videoUrl: "/for_this_fantasy_cricket_wbsit.mp4",
  },
];

const ICC_RANKINGS = {
  teams: [
    { rank: 1, team: "India", rating: 268, points: 14850, flag: "🇮🇳" },
    { rank: 2, team: "Australia", rating: 259, points: 13920, flag: "🇦🇺" },
    { rank: 3, team: "England", rating: 252, points: 12890, flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { rank: 4, team: "South Africa", rating: 247, points: 11450, flag: "🇿🇦" },
    { rank: 5, team: "New Zealand", rating: 240, points: 10800, flag: "🇳🇿" },
  ],
  batters: [
    { rank: 1, player: "Suryakumar Yadav", team: "IND", rating: 889, flag: "🇮🇳" },
    { rank: 2, player: "Phil Salt", team: "ENG", rating: 842, flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { rank: 3, player: "Travis Head", team: "AUS", rating: 818, flag: "🇦🇺" },
    { rank: 4, player: "Babar Azam", team: "PAK", rating: 765, flag: "🇵🇰" },
    { rank: 5, player: "Ruturaj Gaikwad", team: "IND", rating: 742, flag: "🇮🇳" },
  ],
};

const GLOBAL_SCHEDULE = [
  { series: "India tour of England 2026", dates: "Jun 20 - Jul 28", matches: "5 Tests", venue: "Headingley, Lord's, Edgbaston" },
  { series: "Australia vs South Africa ODI Series", dates: "Aug 12 - Aug 24", matches: "3 ODIs, 3 T20Is", venue: "SCG, MCG, Perth" },
  { series: "Caribbean Premier League 2026", dates: "Aug 30 - Sep 22", matches: "34 T20s", venue: "Guyana, Trinidad, Barbados" },
  { series: "ICC Champions Trophy 2027 Qualifiers", dates: "Oct 05 - Oct 19", matches: "16 ODIs", venue: "Dubai, Sharjah" },
];

const MOCK_MANHATTAN_DATA = [
  { over: 71, runs: 4, wickets: 0 },
  { over: 72, runs: 6, wickets: 0 },
  { over: 73, runs: 8, wickets: 0 },
  { over: 74, runs: 14, wickets: 0 },
  { over: 75, runs: 2, wickets: 1 },
  { over: 76, runs: 3, wickets: 0 },
  { over: 77, runs: 5, wickets: 0 },
  { over: 78, runs: 7, wickets: 0 },
  { over: 79, runs: 4, wickets: 0 },
  { over: 80, runs: 2, wickets: 1 },
];

const MOCK_WORM_DATA = [
  { over: 10, teamA: 48, teamB: 35 },
  { over: 20, teamA: 112, teamB: 78 },
  { over: 30, teamA: 185, teamB: 115 },
  { over: 40, teamA: 260, teamB: 155 },
  { over: 50, teamA: 340, teamB: 190 },
  { over: 60, teamA: 425, teamB: 220 },
  { over: 70, teamA: 530, teamB: 235 },
  { over: 80, teamA: 640, teamB: 242 },
];

const MOCK_HIGHLIGHTS = [
  {
    innings: "EZONE 1st Innings",
    over: "142.4",
    type: "Hundreds",
    badge: "100",
    text: "Tilak Varma to Ishan Kishan: SIX! Brings up his historic 250 with a thunderous pull over deep midwicket!",
  },
  {
    innings: "EZONE 1st Innings",
    over: "135.2",
    type: "Sixes",
    badge: "6",
    text: "Chama Milind to Ishan Kishan: SIX! Lofted clean inside-out over long-off into the VIP stands!",
  },
  {
    innings: "EZONE 1st Innings",
    over: "128.5",
    type: "Fours",
    badge: "4",
    text: "Md Kounain Quraishi to Kumar Kushagra: FOUR! Flayed through backward point with pinpoint precision.",
  },
  {
    innings: "SZONE 1st Innings",
    over: "79.2",
    type: "Wickets",
    badge: "W",
    text: "Abhijit Sarkar to Smaran Ravichandran: OUT! Caught behind! Faint edge through to Kumar Kushagra!",
  },
  {
    innings: "SZONE 1st Innings",
    over: "75.4",
    type: "Fifties",
    badge: "50",
    text: "Mohammed Shami to Tilak Varma: 1 run, tucked to square leg. Reaches a fighting half-century off 122 balls!",
  },
  {
    innings: "SZONE 1st Innings",
    over: "74.2",
    type: "Sixes",
    badge: "6",
    text: "Shahbaz Ahmed to Tilak Varma: SIX! Dances down the pitch and launches it high over long-on!",
  },
  {
    innings: "SZONE 1st Innings",
    over: "68.3",
    type: "Dropped Catches",
    badge: "DC",
    text: "Mukesh Kumar to Chama Milind: DROPPED! Slashed to first slip where the fielder spills a sharp chance!",
  },
];

const MOCK_MATCH_CONTESTS = [
  {
    id: "c-gl-100",
    name: "Grand League - ₹5 Lakhs",
    category: "Mega Contests",
    prizePool: "₹5,00,000",
    entryFee: 100,
    firstPrize: "₹1,50,000",
    totalSpots: 10000,
    filledSpots: 4500,
    maxTeams: 5,
    guaranteed: true,
  },
  {
    id: "c-mega-1",
    name: "Mega Contest - ₹10 Lakhs",
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
    prizePool: "₹10,000",
    entryFee: 5750,
    firstPrize: "₹10,000",
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

const MOCK_POINTS_TABLE = [
  { rank: 1, team: "East Zone", p: 4, w: 3, l: 0, d: 1, nr: 0, pts: 21, nrr: "+1.420" },
  { rank: 2, team: "South Zone", p: 4, w: 2, l: 1, d: 1, nr: 0, pts: 15, nrr: "+0.840" },
  { rank: 3, team: "West Zone", p: 4, w: 2, l: 2, d: 0, nr: 0, pts: 12, nrr: "-0.110" },
  { rank: 4, team: "North Zone", p: 4, w: 1, l: 2, d: 1, nr: 0, pts: 9, nrr: "-0.560" },
  { rank: 5, team: "Central Zone", p: 4, w: 0, l: 3, d: 1, nr: 0, pts: 3, nrr: "-1.280" },
];

interface TeamSquadDetails {
  players: string[];
  bench: string[];
  staff: string[];
}

function getTeamSquadDetails(teamName: string = ""): TeamSquadDetails {
  const t = teamName.toUpperCase();
  if (t.includes("ENG") || t.includes("ENGLAND")) {
    return {
      players: [
        "Ben Duckett",
        "Emilio Gay",
        "Jordan Cox",
        "Joe Root (c)",
        "Harry Brook",
        "Dan Lawrence",
        "Jamie Smith (wk)",
        "Gus Atkinson",
        "Ollie Robinson",
        "Jofra Archer",
        "Josh Tongue",
      ],
      bench: ["Shoaib Bashir", "Sonny Baker", "Sam Cook", "Ollie Pope", "Theo Wylie"],
      staff: ["Stephen Fleming", "Marcus Trescothick", "Paul Collingwood", "Jeetan Patel", "David Saker"],
    };
  }
  if (t.includes("PAK") || t.includes("PAKISTAN")) {
    return {
      players: [
        "Azan Awais",
        "Saim Ayub",
        "Abdullah Shafique",
        "Shan Masood",
        "Babar Azam (c)",
        "Saud Shakeel",
        "Ghazi Ghori (wk)",
        "Mohammad Imran Randhawa",
        "Razaullah",
        "Mohammad Abbas",
        "Mohammad Ali",
      ],
      bench: ["Arafat Minhas", "Ubaid Shah", "Sajid Khan", "Mohammad Imran", "Saad Baig", "Abdullah Fazal"],
      staff: ["Mike Hesson", "Asad Shafiq", "Ashley Noffke", "Shane McDermott"],
    };
  }
  if (t.includes("EAST") || t.includes("EZONE")) {
    return {
      players: [
        "Abhimanyu Easwaran (c)",
        "Ishan Kishan (wk)",
        "Sudip Kumar Gharami",
        "Kumar Kushagra",
        "Shahbaz Ahmed",
        "Riyan Parag",
        "Akash Deep",
        "Mukesh Kumar",
        "Mohammed Shami",
        "Md Kounain Quraishi",
        "Abhijit K Sarkar",
      ],
      bench: [
        "Virat Singh",
        "Manisankar Murasingh",
        "Anukul Roy",
        "Suraj Sindhu Jaiswal",
      ],
      staff: ["Debangshu Mukherjee", "Sourasish Lahiri", "Ranadeb Bose"],
    };
  }
  if (t.includes("SOUTH") || t.includes("SZONE")) {
    return {
      players: [
        "Mayank Agarwal (c)",
        "Rohan Kunnummal",
        "Hanuma Vihari",
        "Tilak Varma",
        "Ricky Bhui (wk)",
        "Smaran Ravichandran",
        "Washington Sundar",
        "Shreyas Gopal",
        "Chama V Milind",
        "Vijaykumar Vyshak",
        "R Sai Kishore",
      ],
      bench: [
        "N Jagadeesan",
        "Tanmay Agarwal",
        "Basil Thampi",
        "Pradosh Ranjan Paul",
      ],
      staff: ["Sulakshan Kulkarni", "S Badrinath", "Sunil Joshi", "R Sridhar"],
    };
  }
  if (t.includes("IND") || t.includes("INDIA")) {
    return {
      players: [
        "Rohit Sharma (c)",
        "Yashasvi Jaiswal",
        "Shubman Gill",
        "Virat Kohli",
        "Rishabh Pant (wk)",
        "KL Rahul",
        "Ravindra Jadeja",
        "Ravichandran Ashwin",
        "Jasprit Bumrah",
        "Mohammed Shami",
        "Mohammed Siraj",
      ],
      bench: ["Sarfaraz Khan", "Dhruv Jurel", "Axar Patel", "Akash Deep", "Kuldeep Yadav"],
      staff: ["Gautam Gambhir", "Abhishek Nayar", "Ryan ten Doeschate", "Morne Morkel", "T Dilip"],
    };
  }
  if (t.includes("AUS") || t.includes("AUSTRALIA")) {
    return {
      players: [
        "Usman Khawaja",
        "Nathan McSweeney",
        "Marnus Labuschagne",
        "Steven Smith",
        "Travis Head",
        "Mitchell Marsh",
        "Alex Carey (wk)",
        "Pat Cummins (c)",
        "Mitchell Starc",
        "Nathan Lyon",
        "Josh Hazlewood",
      ],
      bench: ["Scott Boland", "Josh Inglis", "Beau Webster", "Sean Abbott"],
      staff: ["Andrew McDonald", "Daniel Vettori", "Andre Borovec", "Michael Di Venuto"],
    };
  }
  return {
    players: [
      `${teamName} Captain (c)`,
      "Opening Batter 1",
      "Opening Batter 2",
      "Wicketkeeper (wk)",
      "Top Order Batter",
      "All-Rounder 1",
      "All-Rounder 2",
      "Spin Bowler",
      "Fast Bowler 1",
      "Fast Bowler 2",
      "Pace Specialist",
    ],
    bench: ["Bench Batter", "Reserve Pacer", "Reserve Spinner", "Substitute Fielder"],
    staff: ["Head Coach", "Batting Coach", "Bowling Coach", "Fielding Coach", "Physiotherapist"],
  };
}

function getMatchOfficials() {
  return {
    umpires: "Chris Gaffaney, Paul Reiffel",
    thirdUmpire: "Allahudien Paleker",
    referee: "Ranjan Madugalle",
  };
}

function getMatchBroadcast(tournamentName: string = "", teamA: string = "", teamB: string = "") {
  const t = (tournamentName + " " + teamA + " " + teamB).toLowerCase();
  if (t.includes("england") || t.includes("pakistan") || t.includes("eng") || t.includes("pak")) {
    return {
      streaming: "SonyLIV",
      tv: "Sony Sports Network",
    };
  }
  if (t.includes("india") || t.includes("ipl") || t.includes("duleep")) {
    return {
      streaming: "JioHotstar / FanCode",
      tv: "Star Sports Network / Sports18",
    };
  }
  return {
    streaming: "SonyLIV",
    tv: "Sony Sports Network",
  };
}

function getVenuePitchAndWeather(venueName: string = "", teamA: string = "", teamB: string = "", providerData?: any) {
  const v = (venueName || "").toLowerCase();
  const pd = providerData || {};
  const customPitch = pd.pitchReport || "";
  const customAvg = pd.avgScore || "";

  if (v.includes("edgbaston") || v.includes("birmingham")) {
    return {
      stadium: "Edgbaston",
      city: "Birmingham, England",
      capacity: "21,000",
      ends: "City End, Pavilion End",
      hostsTo: "Warwickshire",
      pitchType: "Batting Friendly • True carry & fast outfield",
      pitchSummary: customPitch || "The Edgbaston pitch offers true pace and bounce with a lightning-fast outfield. Early moisture under overcast skies will provide seam movement for the pacers with the new ball, but once settled, batters will find great value for their shots with consistent bounce through the line.",
      avg1st: customAvg || "184",
      avg2nd: "169",
      pacersPct: 71,
      spinnersPct: 29,
      temp: "19°C",
      feelsLike: "19°C",
      condition: "Overcast with sunny spells",
      rainProb: "15%",
      humidity: "58%",
      wind: "18 km/h SW",
      dewFactor: "Negligible Dew (Dry evening breeze)",
      tossAdvantage: "Batting Second (54% wins in T20s)",
    };
  }
  if (v.includes("chidambaram") || v.includes("chennai") || v.includes("chepauk")) {
    return {
      stadium: "MA Chidambaram Stadium, Chepauk",
      city: "Chennai, Tamil Nadu, India",
      capacity: "38,200",
      ends: "Anna Pavilion End, V Pattabiraman Gate End",
      hostsTo: "Tamil Nadu, Chennai Super Kings",
      pitchType: "Spin Friendly • Dry red-soil deck with turn",
      pitchSummary: customPitch || "Chepauk's signature red soil track provides true bounce in the early phases before breaking up. Spinners will extract considerable turn from the rough with variable bounce as the match progresses.",
      avg1st: customAvg || "178",
      avg2nd: "158",
      pacersPct: 48,
      spinnersPct: 52,
      temp: "29°C",
      feelsLike: "33°C",
      condition: "Clear & Pleasant, Warm",
      rainProb: "5%",
      humidity: "64%",
      wind: "14 km/h ENE",
      dewFactor: "Moderate Dew predicted around 8:30 PM (Dew Index 6.5/10)",
      tossAdvantage: "Batting First (58% wins)",
    };
  }
  if (v.includes("wankhede") || v.includes("mumbai")) {
    return {
      stadium: "Wankhede Stadium",
      city: "Mumbai, Maharashtra, India",
      capacity: "33,108",
      ends: "Garware Pavilion End, Tata End",
      hostsTo: "Mumbai, Mumbai Indians",
      pitchType: "High-Scoring Belter • Short boundaries & dew",
      pitchSummary: customPitch || "A renowned batting paradise with red soil that provides exceptional carry. The 64m square boundaries and fast outfield make 200+ totals common. Evening dew will make the ball slippery for bowlers in the second innings.",
      avg1st: customAvg || "192",
      avg2nd: "181",
      pacersPct: 65,
      spinnersPct: 35,
      temp: "31°C",
      feelsLike: "35°C",
      condition: "Humid & Clear",
      rainProb: "0%",
      humidity: "72%",
      wind: "12 km/h WNW",
      dewFactor: "Heavy Dew in 2nd Innings (Dew Index 8.9/10)",
      tossAdvantage: "Bowling First (63% wins due to dew)",
    };
  }
  if (v.includes("chinnaswamy") || v.includes("bengaluru") || v.includes("bangalore")) {
    return {
      stadium: "M. Chinnaswamy Stadium",
      city: "Bengaluru, Karnataka, India",
      capacity: "35,000",
      ends: "Pavilion End, Bheemeshwara End",
      hostsTo: "Karnataka, Royal Challengers Bangalore",
      pitchType: "Batting Paradise • Altitude & short boundaries",
      pitchSummary: customPitch || "Situated at 920m above sea level with boundary sizes under 62m, Chinnaswamy is one of the highest scoring grounds in world cricket. Ball flies through thin air, and outfields are like glass.",
      avg1st: customAvg || "196",
      avg2nd: "185",
      pacersPct: 58,
      spinnersPct: 42,
      temp: "26°C",
      feelsLike: "27°C",
      condition: "Mild & Pleasant",
      rainProb: "20%",
      humidity: "60%",
      wind: "11 km/h E",
      dewFactor: "Significant Dew after sunset",
      tossAdvantage: "Bowling First (61% wins)",
    };
  }
  if (v.includes("lord") || v.includes("london")) {
    return {
      stadium: "Lord's Cricket Ground",
      city: "London, England",
      capacity: "30,000",
      ends: "Pavilion End, Nursery End",
      pitchType: "Pace & Movement • Iconic Lord's Slope",
      pitchSummary: customPitch || "The iconic 2.5m slope across the ground produces sharp deviation down the slope. Pacers get seam and lateral movement in the first 10 overs, while batters must adapt their stance.",
      avg1st: customAvg || "172",
      avg2nd: "156",
      pacersPct: 76,
      spinnersPct: 24,
      temp: "21°C",
      feelsLike: "21°C",
      condition: "Partly Cloudy",
      rainProb: "10%",
      humidity: "55%",
      wind: "15 km/h W",
      dewFactor: "Negligible Dew",
      tossAdvantage: "Batting First (55% wins)",
    };
  }
  if (v.includes("sylhet")) {
    return {
      stadium: "Sylhet International Cricket Stadium",
      city: "Sylhet, Bangladesh",
      capacity: "18,500",
      ends: "Green Gallery End, Pavilion End",
      pitchType: "Slow & Low • Spinner Dominance",
      pitchSummary: customPitch || "A typically slow and stopping subcontinent surface. Spinners rule the roost with low bounce and generous bite into the surface. 140+ is a fighting winning score.",
      avg1st: customAvg || "138",
      avg2nd: "122",
      pacersPct: 41,
      spinnersPct: 59,
      temp: "28°C",
      feelsLike: "32°C",
      condition: "Warm & Humid",
      rainProb: "15%",
      humidity: "78%",
      wind: "9 km/h S",
      dewFactor: "Mild Dew in 2nd Innings",
      tossAdvantage: "Batting First (60% wins)",
    };
  }
  if (v.includes("providence") || v.includes("guyana")) {
    return {
      stadium: "Providence Stadium",
      city: "Providence, Guyana",
      capacity: "15,000",
      ends: "Media Centre End, Pavilion End",
      pitchType: "Grip & Turn • Sticky Caribbean Clay",
      pitchSummary: customPitch || "The Providence wicket is historically low-scoring with spinners and medium-pacers with variations excelling. Ball grips and hesitates off the pitch.",
      avg1st: customAvg || "152",
      avg2nd: "140",
      pacersPct: 48,
      spinnersPct: 52,
      temp: "29°C",
      feelsLike: "34°C",
      condition: "Tropical & Humid",
      rainProb: "25%",
      humidity: "82%",
      wind: "16 km/h NE",
      dewFactor: "High Outfield Moisture",
      tossAdvantage: "Batting Second (52% wins)",
    };
  }

  // Fallback for any other venue
  const parts = (venueName || "International Cricket Stadium, Dubai").split(",");
  const stadiumName = parts[0]?.trim() || venueName || "International Cricket Stadium";
  const cityName = parts.slice(1).join(",").trim() || "National Sports Complex";
  return {
    stadium: stadiumName,
    city: cityName,
    capacity: "35,000",
    ends: "Pavilion End, Media End",
    hostsTo: teamA || "International Cricket",
    pitchType: "Sporting Track • Fair contest between bat & ball",
    pitchSummary: customPitch || `A well-prepared sporting wicket at ${stadiumName}. Good bounce for fast bowlers in the powerplay, true carry for stroke-makers, and assistance for spinners as the match develops.`,
    avg1st: customAvg || "175",
    avg2nd: "162",
    pacersPct: 60,
    spinnersPct: 40,
    temp: "27°C",
    feelsLike: "29°C",
    condition: "Clear Skies",
    rainProb: "5%",
    humidity: "60%",
    wind: "12 km/h NE",
    dewFactor: "Moderate Dew in Evening",
    tossAdvantage: "Batting First (53% wins)",
  };
}

function getVenueGuide(venueName: string = "") {
  return getVenuePitchAndWeather(venueName);
}

function getMatchSpecificNews(match: any, teamA: string = "England", teamB: string = "Pakistan", tournament: string = "T20 International Series", venue: string = "Edgbaston, Birmingham") {
  const normA = (teamA || "").toLowerCase();
  const normB = (teamB || "").toLowerCase();

  if (normA.includes("eng") || normB.includes("pak")) {
    return [
      {
        id: "ep-1",
        title: `England vs Pakistan: Jos Buttler and Babar Azam set for high-octane clash at ${venue}`,
        category: "MATCH PREVIEW",
        timeAgo: "1h ago",
        author: "Cricbuzz Global Desk",
        summary: `With both teams gearing up for their clash at ${venue}, tactical matchups between England's boundary hitters and Pakistan's pace trio take center stage.`,
        content: [
          `England's management confirmed aggressive intent from ball one at ${venue}. Harry Brook and Ben Duckett spent extensive time fine-tuning their sweep shots against spin.`,
          "Pakistan skipper Babar Azam highlighted the importance of a solid start in the powerplay, emphasizing discipline against England's fast bowling unit.",
          "Weather conditions in Birmingham remain favorable with clear spells expected for the duration of play."
        ],
        quotes: `"We know the quality Pakistan brings with the ball. Our plan is to apply early pressure and back our strengths." — Jos Buttler`
      },
      {
        id: "ep-2",
        title: "Jofra Archer fit and firing: Spearhead confirms readiness to lead England pace attack",
        category: "FITNESS & SQUAD",
        timeAgo: "3h ago",
        author: "Sky Sports Cricket",
        summary: `After an intense bowling spell in Tuesday's net session, Jofra Archer has been cleared by medical staff to unleash full pace at ${venue}.`,
        content: [
          "Archer bowled six high-intensity overs touching speeds in excess of 92 mph. Medical team reported no discomfort.",
          "His battle against Saim Ayub and Abdullah Shafique at the top of the order will be crucial to England's plans."
        ],
        quotes: `"I'm feeling strong, rhythm is back, and I can't wait to play in front of the home Birmingham crowd." — Jofra Archer`
      },
      {
        id: "ep-3",
        title: "Pakistan focus on middle-overs spin throttle with Arafat Minhas and Sajid Khan",
        category: "TACTICAL BRIEFING",
        timeAgo: "4h ago",
        author: "PCB Media Release",
        summary: "Head coach Mike Hesson conducted specialized fielding and bowling drills focused on squeezing run-rates during the middle overs against England's middle order.",
        content: [
          `Hesson stressed the value of dot-ball percentage on ${venue}'s true surface to force England's batters into high-risk shots.`,
          "Saud Shakeel is expected to play a floating anchor role depending on the state of the innings."
        ],
        quotes: `"If we execute our lengths consistently and take our half-chances in the field, we are confident of a winning outcome." — Mike Hesson`
      },
      {
        id: "ep-4",
        title: "Fantasy XI Analysis: Why vice-captaincy on all-rounders is key in England vs Pakistan clash",
        category: "FANTASY INSIDER",
        timeAgo: "6h ago",
        author: "Fantasy Cricket Intel",
        summary: `Data trends from ${venue} reveal that top-order wicketkeepers and death-over pacers account for 68% of dream team captaincy points.`,
        content: [
          "With short straight boundaries and pace off the wicket, batters who score quickly in powerplays carry immense multiplier upside.",
          "Key differential pick: Gus Atkinson and Mohammad Imran who offer dual wicket-taking threat with both new and old balls."
        ],
        quotes: `"Target players involved in multiple facets of the game to maximize your points ceiling."`
      }
    ];
  }

  if (normA.includes("ind") || normB.includes("aus")) {
    return [
      {
        id: "ia-1",
        title: `${teamA} vs ${teamB} Mega Clash: Blockbuster battle at ${venue}`,
        category: "MATCH PREVIEW",
        timeAgo: "1h ago",
        author: "BCCI & CA Media",
        summary: `Rivalry reaches fever pitch as ${teamA} take on ${teamB} in ${tournament}. Both teams boast star-studded lineups with tournament implications on the line.`,
        content: [
          "Star players from both sides completed high-intensity slip-catching and powerplay hitting simulations.",
          "Captains acknowledged the pitch behavior and stated that aggression in the first 6 overs will define the tempo."
        ],
        quotes: `"It's always an honor and a fierce battle when we face each other. Every ball counts."`
      },
      {
        id: "ia-2",
        title: `Pace battery ready: Fast bowlers set to exploit conditions at ${venue}`,
        category: "BOWLING ANALYSIS",
        timeAgo: "3h ago",
        author: "Star Sports & Fox Cricket",
        summary: "Curator confirms good grass coverage that will give strike pacers early seam and carry.",
        content: [
          "Bowlers from both camps spent an hour targeting the fifth-stump corridor during morning nets.",
          "Batters worked on late dabs and soft hands to combat edge-inducing movement."
        ],
        quotes: `"Discipline in line and length will be the deciding factor."`
      },
      {
        id: "ia-3",
        title: `Fantasy XI Masterclass: Strategic player picks for ${teamA} vs ${teamB}`,
        category: "FANTASY INSIDER",
        timeAgo: "5h ago",
        author: "Fantasy Analytics Desk",
        summary: `Over 50,000 managers have joined contests for this marquee clash. Here are the top captaincy and differential choices.`,
        content: [
          "Top-order accumulators and primary death bowlers carry the highest point floors according to historical data.",
          "Watch out for middle-order explosive hitters if early wickets fall."
        ],
        quotes: `"Pick captains with guaranteed 4 overs and top-4 batting roles."`
      }
    ];
  }

  return [
    {
      id: "gen-1",
      title: `${teamA} vs ${teamB} Official Preview: Team combinations and strategy at ${venue}`,
      category: "MATCH PREVIEW",
      timeAgo: "1h ago",
      author: "Cricbuzz Match Center",
      summary: `Both ${teamA} and ${teamB} have finalized their strategic plans for this crucial ${tournament} contest at ${venue}.`,
      content: [
        `Ahead of the clash between ${teamA} and ${teamB}, coaches emphasized adaptability and situational awareness.`,
        `${teamA} focus on maximizing powerplay scoring, while ${teamB} aim to control run rates with clever bowling rotations.`
      ],
      quotes: `"We are fully prepared and focused on executing our game plan from the very first ball." — Captain`
    },
    {
      id: "gen-2",
      title: `${teamA} Camp Report: Full squad fitness confirmed ahead of matchday`,
      category: "SQUAD REPORT",
      timeAgo: "3h ago",
      author: "Medical Team Bulletin",
      summary: `Medical staff report zero injury concerns for ${teamA}, giving the selection committee full flexibility for the playing XI.`,
      content: [
        `All key players passed fitness tests with flying colors during final practice drills.`,
        `The team looks sharp and ready to contend for crucial championship points.`
      ],
      quotes: `"Everyone is fit, motivated, and determined to perform."`
    },
    {
      id: "gen-3",
      title: `${teamB} Strategic Focus: Neutralizing opposition strengths at ${venue}`,
      category: "TACTICAL BRIEFING",
      timeAgo: "4h ago",
      author: "Coaching Staff Brief",
      summary: `${teamB}'s coaching staff reviewed match footage to formulate specific plans against ${teamA}'s leading performers.`,
      content: [
        `Bowlers practiced death-overs yorkers and slower ball variations under the guidance of bowling mentors.`,
        `Batters focused on countering both spin and express pace under varied field placements.`
      ],
      quotes: `"Our preparation has been thorough, and we are ready for the challenge."`
    },
    {
      id: "gen-4",
      title: `Fantasy XI & Pitch Insights: Differential picks for ${teamA} vs ${teamB}`,
      category: "FANTASY INSIDER",
      timeAgo: "6h ago",
      author: "Fantasy Expert Desk",
      summary: `Analysis of pitch conditions at ${venue} reveals key recommendations for captain and vice-captain selections.`,
      content: [
        `Historical matches at ${venue} favor balanced all-rounders who contribute with both bat and ball.`,
        `Keep an eye on the toss to make last-minute adjustments based on dew and pitch reports.`
      ],
      quotes: `"Select players whose roles guarantee maximum time on the field."`
    }
  ];
}

function getMatchMarketNews(teamA: string = "East Zone", teamB: string = "South Zone") {
  return getMatchSpecificNews(null, teamA, teamB);
}

const PLAYER_HEADSHOTS: Record<string, string> = {
  "Ben Duckett": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Ben_Duckett_%28cropped%29.jpg/220px-Ben_Duckett_%28cropped%29.jpg",
  "Joe Root": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Joe_Root_in_2023.jpg/220px-Joe_Root_in_2023.jpg",
  "Harry Brook": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Harry_Brook_2023.jpg/220px-Harry_Brook_2023.jpg",
  "Jofra Archer": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Jofra_Archer_in_2019.jpg/220px-Jofra_Archer_in_2019.jpg",
  "Saim Ayub": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Saim_Ayub_in_2023.jpg/220px-Saim_Ayub_in_2023.jpg",
  "Abdullah Shafique": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Abdullah_Shafique_2023.jpg/220px-Abdullah_Shafique_2023.jpg",
  "Shan Masood": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Shan_Masood_2023.jpg/220px-Shan_Masood_2023.jpg",
  "Babar Azam": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Babar_Azam_2023.jpg/220px-Babar_Azam_2023.jpg",
  "Stephen Fleming": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Stephen_Fleming_2011.jpg/220px-Stephen_Fleming_2011.jpg",
  "Marcus Trescothick": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Marcus_Trescothick_2012.jpg/220px-Marcus_Trescothick_2012.jpg",
  "Paul Collingwood": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Paul_Collingwood_2009.jpg/220px-Paul_Collingwood_2009.jpg",
  "Rohit Sharma": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Rohit_Sharma_November_2023_%28cropped%29.jpg/220px-Rohit_Sharma_November_2023_%28cropped%29.jpg",
  "Virat Kohli": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_05.jpg/220px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_05.jpg",
  "Jasprit Bumrah": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jasprit_Bumrah_in_2023.jpg/220px-Jasprit_Bumrah_in_2023.jpg",
  "Pat Cummins": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Pat_Cummins_in_2023.jpg/220px-Pat_Cummins_in_2023.jpg",
  "Steven Smith": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Steve_Smith_in_2023.jpg/220px-Steve_Smith_in_2023.jpg",
  "Travis Head": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Travis_Head_2023.jpg/220px-Travis_Head_2023.jpg",
};

function PlayerAvatar({ name }: { name: string }) {
  const [hasError, setHasError] = useState(false);
  const clean = name.replace(/\(c\)|\(wk\)/gi, "").trim();
  const url = !hasError ? PLAYER_HEADSHOTS[clean] : null;

  if (url) {
    return (
      <img
        src={url}
        alt={clean}
        onError={() => setHasError(true)}
        className="w-10 h-10 rounded-full object-cover border border-border/80 shrink-0 bg-surface-2"
        loading="lazy"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-surface-2 border border-border/70 flex items-center justify-center text-muted-foreground/60 shrink-0">
      <UserIcon className="w-5 h-5" />
    </div>
  );
}

function getPlayerRole(name: string, index: number): string {
  const lower = name.toLowerCase();
  if (lower.includes("(wk)")) return "WK-Batter";
  if (lower.includes("smith") && lower.includes("wk")) return "WK-Batter";
  if (lower.includes("cox")) return "WK-Batter";
  if (lower.includes("ghori")) return "WK-Batter";
  if (lower.includes("pant") || lower.includes("kishan") || lower.includes("carey") || lower.includes("bhui") || lower.includes("baig")) return "WK-Batter";
  
  if (lower.includes("ayub")) return "Batting Allrounder";
  if (lower.includes("lawrence")) return "Batting Allrounder";
  if (lower.includes("shakeel")) return "Batting Allrounder";
  if (lower.includes("randhawa")) return "Bowling Allrounder";
  if (lower.includes("jadeja") || lower.includes("ashwin") || lower.includes("sundar") || lower.includes("marsh") || lower.includes("head") || lower.includes("parag") || lower.includes("minhas")) return "Allrounder";

  if (lower.includes("atkinson") || lower.includes("robinson") || lower.includes("archer") || lower.includes("tongue") || lower.includes("abbas") || lower.includes("ali") || lower.includes("shami") || lower.includes("siraj") || lower.includes("bumrah") || lower.includes("starc") || lower.includes("lyon") || lower.includes("hazlewood") || lower.includes("sharma") || lower.includes("cummins") || lower.includes("bashir") || lower.includes("cook") || lower.includes("baker") || lower.includes("shah") || lower.includes("sajid")) return "Bowler";

  if (index >= 7) return "Bowler";
  if (index >= 4) return "Batter";
  return "Batter";
}

function getStaffRole(name: string, index: number): string {
  const lower = name.toLowerCase();
  if (lower.includes("fleming")) return "Head Coach";
  if (lower.includes("trescothick")) return "Interim Test Head Coach";
  if (lower.includes("collingwood")) return "Assistant Coach";
  if (lower.includes("patel")) return "Spin Bowling Coach";
  if (lower.includes("saker")) return "Fast Bowling Coach";
  if (lower.includes("hesson")) return "Head Coach";
  if (lower.includes("shafiq")) return "Batting Coach";
  if (lower.includes("noffke")) return "Bowling Coach";
  if (lower.includes("mcdermott")) return "Fielding Coach";
  if (lower.includes("gambhir") || lower.includes("mcdonald") || lower.includes("kulkarni")) return "Head Coach";
  if (lower.includes("nayar") || lower.includes("badrinath") || lower.includes("venuto")) return "Batting Coach";
  if (lower.includes("morkel") || lower.includes("joshi") || lower.includes("vettori")) return "Bowling Coach";
  if (lower.includes("dilip") || lower.includes("sridhar") || lower.includes("borovec")) return "Fielding Coach";
  
  const defaults = ["Head Coach", "Batting Coach", "Bowling Coach", "Fielding Coach", "Fast Bowling Coach"];
  return defaults[index] || "Support Staff";
}

function calculateMatchCountdown(match: any) {
  let targetTime: number = 0;
  const raw = match?.startTime || match?.date;
  if (raw) {
    const parsed = new Date(raw).getTime();
    if (!isNaN(parsed) && parsed > Date.now()) {
      targetTime = parsed;
    }
  }

  if (!targetTime) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0);
    targetTime = tomorrow.getTime();
  }

  const diff = Math.max(0, targetTime - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

function getMatchDateAndTimeString(match: any) {
  let dateStr = "Tomorrow";
  let timeStr = "7:00 PM IST (1:30 PM GMT • 2:00 PM Local)";
  const raw = match?.startTime || match?.date;
  if (raw) {
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
        timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) + " IST";
      }
    } catch {}
  }
  if (match?.statusText && (match.statusText.includes("Tomorrow") || match.statusText.includes("Today"))) {
    const parts = match.statusText.split("•");
    if (parts.length > 1) {
      dateStr = parts[0].trim();
      timeStr = parts[1].trim() + " IST";
    }
  }
  return { dateStr, timeStr };
}

function getMatchTimeDisplay(match: any): string {
  const status = (match?.status || "UPCOMING").toUpperCase();
  if (status === "LIVE") {
    return "LIVE • In Progress";
  }
  if (status === "COMPLETED") {
    return match?.statusText || "Match Completed";
  }
  if (match?.statusText && (match.statusText.includes("Tomorrow") || match.statusText.includes("Today"))) {
    return match.statusText;
  }
  const raw = match?.startTime || match?.date;
  if (raw) {
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " • " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      }
    } catch {}
  }
  return "Tomorrow • 7:00 PM";
}

function MatchStartingSoonCard({
  match,
  sectionName,
  onJoinContests,
  onViewSquads,
  onViewInfo,
}: {
  match: any;
  sectionName: string;
  onJoinContests: () => void;
  onViewSquads: () => void;
  onViewInfo: () => void;
}) {
  const teamA = match?.teamA || "Team A";
  const teamB = match?.teamB || "Team B";
  const teamAFlag = match?.teamAFlag || getTeamFlag(match?.teamACode || teamA);
  const teamBFlag = match?.teamBFlag || getTeamFlag(match?.teamBCode || teamB);
  const venue = match?.venue || "Edgbaston, Birmingham";

  const [timeLeft, setTimeLeft] = useState(() => calculateMatchCountdown(match));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateMatchCountdown(match));
    }, 1000);
    return () => clearInterval(timer);
  }, [match]);

  const { dateStr, timeStr } = getMatchDateAndTimeString(match);

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-[#072419] via-surface to-surface-2 p-6 sm:p-8 shadow-xl space-y-6 text-center animate-in fade-in-50 duration-150">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
        <Clock className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "6s" }} />
        <span>MATCH STARTING SOON • {match?.format || "T20"}</span>
      </div>

      <div className="flex items-center justify-center gap-4 sm:gap-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl">{teamAFlag}</span>
          <span className="text-base sm:text-lg font-black text-foreground">{teamA}</span>
        </div>
        <span className="text-sm font-black text-muted-foreground/60">VS</span>
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-black text-foreground">{teamB}</span>
          <span className="text-2xl sm:text-3xl">{teamBFlag}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
        {timeLeft.days > 0 && (
          <div className="flex flex-col items-center bg-surface-2/90 border border-emerald-500/20 rounded-xl px-3 py-2 min-w-[64px]">
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">{String(timeLeft.days).padStart(2, "0")}</span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Days</span>
          </div>
        )}
        <div className="flex flex-col items-center bg-surface-2/90 border border-emerald-500/20 rounded-xl px-3 py-2 min-w-[64px]">
          <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">{String(timeLeft.hours).padStart(2, "0")}</span>
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Hours</span>
        </div>
        <span className="text-emerald-500 font-mono font-bold text-xl">:</span>
        <div className="flex flex-col items-center bg-surface-2/90 border border-emerald-500/20 rounded-xl px-3 py-2 min-w-[64px]">
          <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">{String(timeLeft.minutes).padStart(2, "0")}</span>
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Mins</span>
        </div>
        <span className="text-emerald-500 font-mono font-bold text-xl">:</span>
        <div className="flex flex-col items-center bg-surface-2/90 border border-emerald-500/20 rounded-xl px-3 py-2 min-w-[64px]">
          <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 animate-pulse">{String(timeLeft.seconds).padStart(2, "0")}</span>
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Secs</span>
        </div>
      </div>

      <div className="max-w-md mx-auto rounded-xl bg-surface-2/60 border border-border/80 p-3.5 space-y-1.5 text-xs text-left">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="font-semibold">Scheduled Date:</span>
          <span className="font-bold text-foreground">{dateStr}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="font-semibold">Start Time:</span>
          <span className="font-bold text-emerald-400">{timeStr}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="font-semibold">Match Status:</span>
          <span className="font-bold text-foreground">UPCOMING • Toss scheduled 30m before play</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="font-semibold">Venue:</span>
          <span className="font-bold text-foreground truncate max-w-[200px]">{venue}</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto space-y-1.5">
        <h4 className="text-sm sm:text-base font-black text-foreground">
          {sectionName} Will Activate Automatically
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {teamA} vs {teamB} has not started yet. Real-time {sectionName.toLowerCase()}, over breakdowns, ball-by-ball commentary, and live scores will appear here automatically once play begins.
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={onJoinContests}
          variant="hero"
          className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-lg hover:scale-[1.02] cursor-pointer"
        >
          <Trophy className="h-4 w-4" /> Join Contests &amp; Build Team
        </Button>
        <Button
          onClick={onViewSquads}
          variant="outline"
          className="text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 gap-2 cursor-pointer"
        >
          <Users className="h-4 w-4" /> View Confirmed Squads
        </Button>
        <Button
          onClick={onViewInfo}
          variant="outline"
          className="text-xs border-border hover:bg-surface-2 gap-2 cursor-pointer"
        >
          <Info className="h-4 w-4" /> Match Info
        </Button>
      </div>
    </div>
  );
}

function getMatchOversData(match: any, teamA: string, teamB: string) {
  return [
    {
      overNumber: 20,
      runs: 14,
      wickets: 1,
      bowler: "Jofra Archer",
      balls: [
        { ball: "20.1", text: "1", type: "single" },
        { ball: "20.2", text: "4", type: "four" },
        { ball: "20.3", text: "W", type: "wicket" },
        { ball: "20.4", text: "1", type: "single" },
        { ball: "20.5", text: "6", type: "six" },
        { ball: "20.6", text: "2", type: "two" },
      ],
      totalScore: `${teamB} 187/5 (20.0 ov)`,
      summary: "Archer to Babar, OUT! Caught at long on! High drama in the final over, but Pakistan finish with a competitive total."
    },
    {
      overNumber: 19,
      runs: 11,
      wickets: 0,
      bowler: "Gus Atkinson",
      balls: [
        { ball: "19.1", text: "2", type: "two" },
        { ball: "19.2", text: "1", type: "single" },
        { ball: "19.3", text: "4", type: "four" },
        { ball: "19.4", text: "1", type: "single" },
        { ball: "19.5", text: "1", type: "single" },
        { ball: "19.6", text: "2", type: "two" },
      ],
      totalScore: `${teamB} 173/4 (19.0 ov)`,
      summary: "Atkinson nails the yorker on ball 5, but batters manage to sneak two on the final delivery."
    },
    {
      overNumber: 18,
      runs: 16,
      wickets: 0,
      bowler: "Josh Tongue",
      balls: [
        { ball: "18.1", text: "6", type: "six" },
        { ball: "18.2", text: "4", type: "four" },
        { ball: "18.3", text: "1", type: "single" },
        { ball: "18.4", text: "1", type: "single" },
        { ball: "18.5", text: "0", type: "dot" },
        { ball: "18.6", text: "4", type: "four" },
      ],
      totalScore: `${teamB} 162/4 (18.0 ov)`,
      summary: "Expensive over from Tongue! 16 runs plundered with back-to-back boundaries."
    },
    {
      overNumber: 17,
      runs: 8,
      wickets: 1,
      bowler: "Ollie Robinson",
      balls: [
        { ball: "17.1", text: "0", type: "dot" },
        { ball: "17.2", text: "1", type: "single" },
        { ball: "17.3", text: "W", type: "wicket" },
        { ball: "17.4", text: "1", type: "single" },
        { ball: "17.5", text: "2", type: "two" },
        { ball: "17.6", text: "4", type: "four" },
      ],
      totalScore: `${teamB} 146/4 (17.0 ov)`,
      summary: "Robinson strikes! Clean bowled with an off-cutter before a boundary off the edge to third man."
    },
    {
      overNumber: 16,
      runs: 7,
      wickets: 0,
      bowler: "Jofra Archer",
      balls: [
        { ball: "16.1", text: "1", type: "single" },
        { ball: "16.2", text: "1", type: "single" },
        { ball: "16.3", text: "2", type: "two" },
        { ball: "16.4", text: "0", type: "dot" },
        { ball: "16.5", text: "1", type: "single" },
        { ball: "16.6", text: "2", type: "two" },
      ],
      totalScore: `${teamB} 138/3 (16.0 ov)`,
      summary: "Disciplined death-bowling line from Archer outside off stump."
    },
  ];
}

function getMatchFullCommentary(match: any, teamA: string, teamB: string) {
  return [
    {
      ball: "20.6",
      over: "20",
      event: "2",
      badgeType: "run",
      headline: "Bowler to Batter, 2 runs",
      desc: "Full on the pads, whipped away through mid-wicket with soft hands. Great sprint between wickets to finish the over with a brace!",
      score: "187/5",
    },
    {
      ball: "20.5",
      over: "20",
      event: "6",
      badgeType: "six",
      headline: "Bowler to Batter, SIX! Maximum over long-off!",
      desc: "In the slot and dispatched! Batter stands tall and lofts it cleanly over the long-off fence into the second tier. What a shot!",
      score: "185/5",
    },
    {
      ball: "20.4",
      over: "20",
      event: "1",
      badgeType: "single",
      headline: "Bowler to Batter, 1 run",
      desc: "Slower ball cutter outside off, tapped gently to cover-point for a quick single.",
      score: "179/5",
    },
    {
      ball: "20.3",
      over: "20",
      event: "W",
      badgeType: "wicket",
      headline: "Bowler to Batter, OUT! Caught in the deep!",
      desc: "OUT c Fielder b Bowler! Tries to clear long-on but mistimes the back-of-a-length delivery. Fielder judges it cleanly on the boundary rope.",
      score: "178/5",
    },
    {
      ball: "20.2",
      over: "20",
      event: "4",
      badgeType: "four",
      headline: "Bowler to Batter, FOUR! Pierces the gap!",
      desc: "Short and wide, Batter cuts it hard between backward point and short third man. Raced away to the boundary rope in a flash!",
      score: "178/4",
    },
    {
      ball: "20.1",
      over: "20",
      event: "1",
      badgeType: "single",
      headline: "Bowler to Batter, 1 run",
      desc: "Yorker right on the base of off stump, dug out safely to mid-on.",
      score: "174/4",
    },
    {
      ball: "19.6",
      over: "19",
      event: "2",
      badgeType: "run",
      headline: "Bowler to Batter, 2 runs",
      desc: "Driven firmly into the gap at sweeper cover. Easy couple of runs taken.",
      score: "173/4",
    },
    {
      ball: "19.3",
      over: "19",
      event: "4",
      badgeType: "four",
      headline: "Bowler to Batter, FOUR! Glorious cover drive!",
      desc: "Half volley outside off, Batter leans into it with supreme balance and threads the gap between extra cover and mid-off. Textbook boundary!",
      score: "170/4",
    },
  ];
}

let memoryCachedWorldMatches: any[] = [];
let memoryCachedSelectedMatch: any = null;
let memoryCachedNews: any[] = [];

function Matches() {
  const navigate = useNavigate();
  const [worldMatches, setWorldMatches] = useState<any[]>(() => memoryCachedWorldMatches);
  const [news, setNews] = useState<any[]>(() => memoryCachedNews);
  const [loading, setLoading] = useState(() => memoryCachedWorldMatches.length === 0);

  // Top Ticker Pagination (3 per view)
  const [tickerPage, setTickerPage] = useState(0);

  // Selected match for Full-Page view: default is null so Dashboard (Pic 2) always displays on open!
  const [selectedHomeMatch, setSelectedHomeMatch] = useState<any | null>(null);
  const [matchTab, setMatchTab] = useState<string>(() => {
    return getFlow<string | null>("OPEN_MATCH_TAB", null) || "Live";
  });
  const [arenaTab, setArenaTab] = useState<"UPCOMING" | "LIVE" | "COMPLETED">("UPCOMING");

  // Highlights state (Pic 4)
  const [highlightsInnings, setHighlightsInnings] = useState<string>("EZONE 1st Innings");
  const [highlightsFilter, setHighlightsFilter] = useState<string>("All");

  // Contests state (Dream11)
  const [contestFilter, setContestFilter] = useState<string>("All");
  const [contestSubTab, setContestSubTab] = useState<"contests" | "myContests" | "myTeams">(() => {
    return getFlow<any | null>("OPEN_CONTEST_SUBTAB", null) || "contests";
  });
  const [myTeams, setMyTeams] = useState<FantasyTeam[]>([]);
  const [matchContests, setMatchContests] = useState<Contest[]>([]);
  const [myContests, setMyContests] = useState<any[]>([]);
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);
  const [joinModalContest, setJoinModalContest] = useState<any | null>(null);
  const [selectedJoinTeamId, setSelectedJoinTeamId] = useState<string>("");
  const [allJoinedModalContest, setAllJoinedModalContest] = useState<any | null>(null);
  const [noTeamsModalContest, setNoTeamsModalContest] = useState<any | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [previewTeamModal, setPreviewTeamModal] = useState<FantasyTeam | null>(null);
  const [viewingContestDetails, setViewingContestDetails] = useState<any | null>(null);
  const [leaderboardContestModal, setLeaderboardContestModal] = useState<any | null>(null);
  const [leaderboardRows, setLeaderboardRows] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [joiningContestId, setJoiningContestId] = useState<string | null>(null);
  const [contestSuccessMsg, setContestSuccessMsg] = useState<string | null>(null);
  const [contestErrorMsg, setContestErrorMsg] = useState<string | null>(null);
  const [pendingJoinError, setPendingJoinError] = useState<string | null>(null);

  // Dedicated Join Flow with newly created team (Point 3)
  const [pendingJoinContest, setPendingJoinContest] = useState<any | null>(null);
  const [pendingJoinTeamInfo, setPendingJoinTeamInfo] = useState<{ id: string; name: string } | null>(null);
  const [joinSuccessModal, setJoinSuccessModal] = useState<{ contestName: string; teamName: string; deductedFee?: number; remainingBalance?: number } | null>(null);

  // Full Article Reader Modal State
  const [readingArticle, setReadingArticle] = useState<NewsArticle | null>(null);

  // Featured video modal state
  const [activeVideo, setActiveVideo] = useState<any | null>(null);

  // Arena Hero Banner Video State
  const [isBannerMuted, setIsBannerMuted] = useState(true);
  const bannerVideoRef = useRef<HTMLVideoElement>(null);

  function toggleBannerSound() {
    if (bannerVideoRef.current) {
      const next = !bannerVideoRef.current.muted;
      bannerVideoRef.current.muted = next;
      setIsBannerMuted(next);
    } else {
      setIsBannerMuted((prev) => !prev);
    }
  }

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
          // NOTE: Do NOT auto-select list[0] so home page stays clean until user clicks a match!
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

  // Fetch user fantasy teams for contest interactions
  const currentMatchId = selectedHomeMatch?.id || selectedHomeMatch?.dbId;

  // Auto-fetch contests, user teams, and joined entries whenever match selection changes
  useEffect(() => {
    if (!currentMatchId) return;
    let mounted = true;

    void getContests(currentMatchId)
      .then((c) => {
        if (mounted && c && c.length > 0) setMatchContests(c);
      })
      .catch(() => {});

    void getMyTeams(currentMatchId)
      .then((t) => {
        if (mounted && t) setMyTeams(t);
      })
      .catch(() => {});

    void getMyContests(currentMatchId)
      .then((mc) => {
        if (mounted && mc) setMyContests(mc);
      })
      .catch(() => {});

    void getMatchPlayers(currentMatchId)
      .then((mp) => {
        if (mounted && mp) setMatchPlayers(mp);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [currentMatchId]);

  // Listen for reset event from navigation (e.g. clicking Home in sidebar) or browser Back button (popstate)
  useEffect(() => {
    function onResetHomeMatch() {
      setSelectedHomeMatch(null);
      removeFlow(FLOW_KEYS.selectedMatchId);
    }
    function onSwitchMatchesTab(e: Event) {
      const customEvent = e as CustomEvent<string>;
      const tabName = (customEvent.detail || "UPCOMING").toUpperCase();
      if (tabName === "UPCOMING" || tabName === "LIVE" || tabName === "COMPLETED") {
        setArenaTab(tabName as any);
      }
      setSelectedHomeMatch(null);
      removeFlow(FLOW_KEYS.selectedMatchId);
    }
    function onPopState() {
      // Intercept browser back button when match center is open: close match & return to Home feed
      if (selectedHomeMatch) {
        setSelectedHomeMatch(null);
        removeFlow(FLOW_KEYS.selectedMatchId);
      }
    }

    // Check URL parameters on mount / update
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab")?.toUpperCase();
      if (tabParam === "UPCOMING" || tabParam === "LIVE" || tabParam === "COMPLETED") {
        setArenaTab(tabParam as any);
        setSelectedHomeMatch(null);
      }
    }

    window.addEventListener("reset-home-match", onResetHomeMatch);
    window.addEventListener("switch-matches-tab", onSwitchMatchesTab);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("reset-home-match", onResetHomeMatch);
      window.removeEventListener("switch-matches-tab", onSwitchMatchesTab);
      window.removeEventListener("popstate", onPopState);
    };
  }, [selectedHomeMatch]);

  // Restore pending match selection ONLY if returning specifically from team creation flow
  useEffect(() => {
    if (worldMatches.length > 0 && !selectedHomeMatch) {
      const returnFromTeam = getFlow<boolean>("RETURN_TO_MATCH_CENTER", false);
      if (returnFromTeam) {
        removeFlow("RETURN_TO_MATCH_CENTER");
        const pendingMatchId = getFlow<string | null>(FLOW_KEYS.selectedMatchId, null);
        if (pendingMatchId) {
          const found = worldMatches.find((m) => (m.id || m.dbId) === pendingMatchId);
          if (found) {
            handleSelectMatch(found);
            const openTab = getFlow<string | null>("OPEN_MATCH_TAB", null);
            if (openTab) {
              setMatchTab(openTab);
              removeFlow("OPEN_MATCH_TAB");
            }
            const openSubTab = getFlow<any | null>("OPEN_CONTEST_SUBTAB", null);
            if (openSubTab) {
              setContestSubTab(openSubTab);
              removeFlow("OPEN_CONTEST_SUBTAB");
            }
          }
        }
      }
    }
  }, [worldMatches, selectedHomeMatch]);

  // Helper: map players for pitch preview
  function getSquadForTeam(team: FantasyTeam): PitchPlayer[] {
    return (team.playerIds ?? []).map((player: any) => {
      const pid = String(player?._id ?? player?.playerId ?? player);
      const matchPlayer = matchPlayers.find((mp) => String(mp.playerId ?? mp._id) === pid);
      return {
        playerId: pid,
        name: matchPlayer?.name ?? player?.name ?? "Player",
        role: matchPlayer?.role ?? player?.role ?? "Batsman",
        realTeam: matchPlayer?.realTeam ?? player?.realTeam ?? "-",
        credits: matchPlayer?.credits ?? player?.credits ?? null,
      };
    });
  }

  // Helper: get player name
  function getPlayerName(playerIdOrObj: any) {
    const pid = String(playerIdOrObj?._id ?? playerIdOrObj?.playerId ?? playerIdOrObj ?? "");
    const matchPlayer = matchPlayers.find((mp) => String(mp.playerId ?? mp._id) === pid);
    return matchPlayer?.name ?? playerIdOrObj?.name ?? "Player";
  }

  // Sort matches: LIVE first, then COMPLETED, then UPCOMING
  const sortedMatches = useMemo(() => {
    return [...worldMatches].sort((a, b) => {
      const order: Record<string, number> = { LIVE: 1, COMPLETED: 2, UPCOMING: 3 };
      const statusA = (a.status || "UPCOMING").toUpperCase();
      const statusB = (b.status || "UPCOMING").toUpperCase();
      return (order[statusA] || 99) - (order[order[statusB] || 99] || 99);
    });
  }, [worldMatches]);

  const arenaMatches = useMemo(() => {
    return sortedMatches.filter((m) => {
      const s = (m.status || "UPCOMING").toUpperCase();
      return s === arenaTab;
    });
  }, [sortedMatches, arenaTab]);

  const PAGE_SIZE = 3;
  const totalPages = Math.max(1, Math.ceil(sortedMatches.length / PAGE_SIZE));

  function handlePrevTicker() {
    setTickerPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  }

  function handleNextTicker() {
    setTickerPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  }

  // When clicking any match card: OPEN FULL-PAGE MATCH CENTER
  function handleSelectMatch(wm: any) {
    setSelectedHomeMatch(wm);
    const clickedId = wm.id || wm.dbId;
    setFlow(FLOW_KEYS.selectedMatchId, clickedId);

    // Push browser history state so browser Back button returns to Home feed instead of navigating away
    if (typeof window !== "undefined") {
      try {
        window.history.pushState({ matchView: true, matchId: clickedId }, "", window.location.href);
      } catch {}
    }

    // Set appropriate initial tab based on match status
    const status = (wm.status || "UPCOMING").toUpperCase();
    if (status === "UPCOMING") {
      setMatchTab("Info"); // Opens Info tab with teal indicator as in Pic 2
    } else if (status === "COMPLETED") {
      setMatchTab("Scorecard");
    } else {
      setMatchTab("Live");
    }
  }

  // Close match center cleanly and sync browser history
  function handleBackToHome() {
    setSelectedHomeMatch(null);
    removeFlow(FLOW_KEYS.selectedMatchId);
    removeFlow("RETURN_TO_MATCH_CENTER");
    if (typeof window !== "undefined" && window.history.state?.matchView) {
      window.history.back();
    }
  }

  // Create team handler: ONLY available for UPCOMING matches
  function handleCreateTeam() {
    const matchId = selectedHomeMatch?.id || selectedHomeMatch?.dbId;
    if (matchId) {
      removeFlow(FLOW_KEYS.editingTeamId);
      removeFlow(FLOW_KEYS.selectedPlayerIds);
      removeFlow(FLOW_KEYS.captainId);
      removeFlow(FLOW_KEYS.viceCaptainId);
      removeFlow(FLOW_KEYS.returnToContestId);
      setFlow(FLOW_KEYS.selectedMatchId, matchId);
      setFlow("RETURN_TO_MATCH_CENTER", true);
      setFlow(FLOW_KEYS.selectedTeamName, `Team ${myTeams.length + 1}`);
      navigate({ to: "/players" });
    }
  }

  // Initiate Join Contest: Checks if user has 0 teams, unjoined teams, or all teams joined
  function handleInitiateJoin(c: any) {
    const contestId = String(c._id || c.id);
    const entries = myContests.filter((mc) => {
      const cid = String(mc.contestId?._id || mc.contestId || mc._id || "");
      return cid === contestId;
    });
    const joinedTeamIds = entries.map((e) => String(e.fantasyTeamId?._id || e.fantasyTeamId || ""));
    const unjoinedTeams = myTeams.filter((t) => !joinedTeamIds.includes(String(t._id)));

    if (myTeams.length === 0) {
      setNoTeamsModalContest(c);
      return;
    }

    if (unjoinedTeams.length > 0) {
      setJoinModalContest(c);
      setSelectedJoinTeamId(String(unjoinedTeams[0]._id));
      return;
    }

    // All existing teams have already joined this contest!
    setAllJoinedModalContest(c);
  }

  // Confirm join with chosen existing team
  async function handleConfirmJoinContest(overrideTeamId?: string) {
    const teamId = overrideTeamId || selectedJoinTeamId;
    if (!joinModalContest || !teamId) return;
    setContestErrorMsg(null);

    const fee = typeof joinModalContest.entryFee === "number" ? joinModalContest.entryFee : 0;
    const currentBal = getLocalWalletBalance();

    if (fee > 0 && currentBal < fee) {
      setContestErrorMsg("You don't have sufficient money to join contest. Please add money to your wallet.");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("fc_wallet_insufficient_notice", `You need at least ₹${fee} to join "${joinModalContest.name}". Please add funds to your wallet.`);
        setTimeout(() => {
          navigate({ to: "/wallet" });
        }, 2200);
      }
      return;
    }

    setIsJoining(true);
    let targetContestId = String(joinModalContest._id || joinModalContest.id);
    const targetTeam = myTeams.find((t) => String(t._id) === teamId);
    const teamName = targetTeam ? targetTeam.name : "your team";

    try {
      if (targetContestId.startsWith("c-") && currentMatchId) {
        const liveContests = await getContests(currentMatchId).catch(() => []);
        if (liveContests.length > 0) {
          setMatchContests(liveContests);
          const matchFound = liveContests.find((lc) => lc.name.toLowerCase().includes(joinModalContest.name.toLowerCase().split("-")[0].trim()) || lc.name === joinModalContest.name);
          if (matchFound) {
            targetContestId = String(matchFound._id);
          }
        }
      }

      await joinContest(targetContestId, teamId);

      const remainingBal = deductLocalWallet(fee, joinModalContest.name);

      setJoinSuccessModal({
        contestName: joinModalContest.name,
        teamName,
        deductedFee: fee,
        remainingBalance: remainingBal,
      });
      setContestSuccessMsg(`🎉 Successfully joined ${joinModalContest.name} with ${teamName}!`);
      setJoinModalContest(null);
      setContestSubTab("myContests");

      // Refresh data
      if (currentMatchId) {
        const [updatedContests, updatedEntries, updatedTeams] = await Promise.all([
          getContests(currentMatchId).catch(() => []),
          getMyContests(currentMatchId).catch(() => []),
          getMyTeams(currentMatchId).catch(() => []),
        ]);
        if (updatedContests.length > 0) setMatchContests(updatedContests);
        setMyContests(updatedEntries);
        setMyTeams(updatedTeams);
      }
      setTimeout(() => setContestSuccessMsg(null), 5000);
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("INSUFFICIENT_WALLET_BALANCE") || msg.toLowerCase().includes("sufficient money")) {
        setContestErrorMsg("You don't have sufficient money to join contest. Please add money to your wallet.");
        if (typeof window !== "undefined") {
          sessionStorage.setItem("fc_wallet_insufficient_notice", "You don't have sufficient money to join contest. Please add money to your wallet.");
          setTimeout(() => {
            navigate({ to: "/wallet" });
          }, 2200);
        }
        return;
      }
      setContestErrorMsg(msg || "Failed to join contest");
      setTimeout(() => setContestErrorMsg(null), 5000);
    } finally {
      setIsJoining(false);
    }
  }

  // Execute join with newly created squad (Point 3)
  async function handleExecutePendingJoin() {
    if (!pendingJoinContest || !pendingJoinTeamInfo) return;
    setPendingJoinError(null);

    const fee = typeof pendingJoinContest.entryFee === "number" ? pendingJoinContest.entryFee : 0;
    const currentBal = getLocalWalletBalance();

    if (fee > 0 && currentBal < fee) {
      setPendingJoinError("You don't have sufficient money to join contest. Please add money to your wallet.");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("fc_wallet_insufficient_notice", `You need at least ₹${fee} to join "${pendingJoinContest.name}". Please add funds to your wallet.`);
        setTimeout(() => {
          navigate({ to: "/wallet" });
        }, 2200);
      }
      return;
    }

    setIsJoining(true);
    const targetTeamName = pendingJoinTeamInfo.name;
    const targetContestName = pendingJoinContest.name;
    let targetContestId = String(pendingJoinContest._id || pendingJoinContest.id);

    try {
      if (targetContestId.startsWith("c-") && currentMatchId) {
        const liveContests = await getContests(currentMatchId).catch(() => []);
        if (liveContests.length > 0) {
          const matchFound = liveContests.find(
            (lc) =>
              lc.name.toLowerCase().includes(pendingJoinContest.name.toLowerCase().split("-")[0].trim()) ||
              lc.name === pendingJoinContest.name
          );
          if (matchFound) {
            targetContestId = String(matchFound._id);
          }
        }
      }

      await joinContest(targetContestId, pendingJoinTeamInfo.id);

      const remainingBal = deductLocalWallet(fee, targetContestName);

      setPendingJoinContest(null);
      setPendingJoinTeamInfo(null);

      // Refresh contests & user teams immediately
      if (currentMatchId) {
        const [updatedContests, updatedEntries, updatedTeams] = await Promise.all([
          getContests(currentMatchId).catch(() => []),
          getMyContests(currentMatchId).catch(() => []),
          getMyTeams(currentMatchId).catch(() => []),
        ]);
        if (updatedContests.length > 0) setMatchContests(updatedContests);
        setMyContests(updatedEntries);
        setMyTeams(updatedTeams);
      }

      setJoinSuccessModal({
        contestName: targetContestName,
        teamName: targetTeamName,
        deductedFee: fee,
        remainingBalance: remainingBal,
      });
      setContestSubTab("myContests");
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("INSUFFICIENT_WALLET_BALANCE") || msg.toLowerCase().includes("sufficient money")) {
        setPendingJoinError("You don't have sufficient money to join contest. Please add money to your wallet.");
        if (typeof window !== "undefined") {
          sessionStorage.setItem("fc_wallet_insufficient_notice", "You don't have sufficient money to join contest. Please add money to your wallet.");
          setTimeout(() => {
            navigate({ to: "/wallet" });
          }, 2200);
        }
        return;
      }
      setPendingJoinError(msg || "Failed to join contest");
      setTimeout(() => setPendingJoinError(null), 5000);
    } finally {
      setIsJoining(false);
    }
  }

  // Navigate to create new team targeted for this contest
  function handleCreateTeamForSpecificContest(contest: any) {
    if (!currentMatchId) return;
    let contestIdToPass = String(contest._id || contest.id);
    if (contestIdToPass.startsWith("c-") && matchContests.length > 0) {
      const matchFound = matchContests.find((lc) => lc.name.toLowerCase().includes(contest.name.toLowerCase().split("-")[0].trim()) || lc.name === contest.name);
      if (matchFound) {
        contestIdToPass = String(matchFound._id);
      }
    }
    setFlow(FLOW_KEYS.selectedMatchId, currentMatchId);
    setFlow(FLOW_KEYS.selectedTeamName, `Team ${myTeams.length + 1}`);
    setFlow(FLOW_KEYS.returnToContestId, contestIdToPass);
    removeFlow(FLOW_KEYS.selectedPlayerIds);
    removeFlow(FLOW_KEYS.captainId);
    removeFlow(FLOW_KEYS.viceCaptainId);
    removeFlow(FLOW_KEYS.editingTeamId);
    setJoinModalContest(null);
    setAllJoinedModalContest(null);
    setNoTeamsModalContest(null);
    navigate({ to: "/players" });
  }

  // Edit existing team
  function handleEditTeam(team: FantasyTeam) {
    if (!currentMatchId) return;
    setFlow(FLOW_KEYS.selectedMatchId, currentMatchId);
    setFlow(FLOW_KEYS.editingTeamId, team._id);
    setFlow(FLOW_KEYS.selectedTeamName, team.name);
    setFlow(
      FLOW_KEYS.selectedPlayerIds,
      (team.playerIds ?? []).map((p: any) => String(p?._id ?? p?.playerId ?? p))
    );
    setFlow(FLOW_KEYS.captainId, String((team.captainId as any)?._id ?? team.captainId ?? ""));
    setFlow(FLOW_KEYS.viceCaptainId, String((team.viceCaptainId as any)?._id ?? team.viceCaptainId ?? ""));
    navigate({ to: "/players" });
  }

  // Delete existing team
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  async function handleDeleteTeam(team: FantasyTeam) {
    const confirmed = window.confirm(`Are you sure you want to delete "${team.name}"?`);
    if (!confirmed) return;
    setDeletingTeamId(team._id);
    try {
      await deleteTeam(team._id);
      setMyTeams((prev) => prev.filter((t) => t._id !== team._id));
      if (currentMatchId) {
        void getMyContests(currentMatchId).then(setMyContests).catch(() => {});
      }
    } catch (err: any) {
      alert(err?.message || "Failed to delete team");
    } finally {
      setDeletingTeamId(null);
    }
  }

  // Open leaderboard modal
  function handleOpenLeaderboard(c: any) {
    setLeaderboardContestModal(c);
    setLoadingLeaderboard(true);
    const cid = String(c._id || c.id || c.contestId?._id || c.contestId);
    void getLeaderboard(cid)
      .then((rows) => {
        if (rows && rows.length > 0) {
          setLeaderboardRows(rows);
        } else {
          setLeaderboardRows(MOCK_LEADERBOARD);
        }
      })
      .catch(() => {
        setLeaderboardRows(MOCK_LEADERBOARD);
      })
      .finally(() => setLoadingLeaderboard(false));
  }

  const currentTickerMatches = sortedMatches.slice(
    tickerPage * PAGE_SIZE,
    tickerPage * PAGE_SIZE + PAGE_SIZE
  );

  const heroArticle: NewsArticle = FEATURED_ARTICLES[0]!;
  const specialArticles = FEATURED_ARTICLES.slice(1, 4);
  const editorialStories = FEATURED_ARTICLES.slice(4);

  const matchStatus = (selectedHomeMatch?.status || "LIVE").toUpperCase();

  // Cricbuzz Tab Ordering strictly adhering to user requirements (Pic 2):
  // Info | Live | Scorecard | Squads | Overs | Graphs | Highlights | Full Commentary | News | Contests
  const availableTabs = useMemo(() => {
    return [
      "Info",
      "Live",
      "Scorecard",
      "Squads",
      "Overs",
      "Graphs",
      "Highlights",
      "Full Commentary",
      "News",
      "Contests",
    ];
  }, []);

  // Sync active tab whenever match or available tabs change
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(matchTab)) {
      setMatchTab(matchStatus === "UPCOMING" ? "Info" : "Live");
    }
  }, [availableTabs, matchTab, matchStatus]);

  const filteredHighlights = useMemo(() => {
    return MOCK_HIGHLIGHTS.filter((h) => {
      if (h.innings !== highlightsInnings) return false;
      if (highlightsFilter === "All") return true;
      return h.type === highlightsFilter;
    });
  }, [highlightsInnings, highlightsFilter]);

  const displayContests = useMemo(() => {
    if (matchContests.length > 0) {
      return matchContests.map((c) => {
        const rules = (c.rules || {}) as any;
        return {
          _id: c._id,
          id: c._id,
          name: c.name,
          category:
            rules.category ||
            (c.name.toLowerCase().includes("mega")
              ? "Mega Contests"
              : c.name.toLowerCase().includes("winner")
              ? "Winner Takes All"
              : c.name.toLowerCase().includes("head")
              ? "Head to Head"
              : "Practice"),
          prizePool:
            rules.prizePool !== undefined
              ? `₹${Number(rules.prizePool).toLocaleString()}`
              : c.prizePool || "₹10,00,000",
          entryFee: rules.entryFee ?? (c.entryFee ?? 0),
          firstPrize:
            rules.firstPrize !== undefined
              ? `₹${Number(rules.firstPrize).toLocaleString()}`
              : c.firstPrize || (rules.entryFee === 0 || c.name.toLowerCase().includes("free") ? "Top Rank Badge" : "₹3,00,000"),
          totalSpots: c.maxSlots || 25000,
          filledSpots: c.joinedSlots || 0,
          maxTeams: c.maxTeams || (c.name.toLowerCase().includes("head") ? 1 : c.name.toLowerCase().includes("winner") ? 2 : 11),
          guaranteed: c.guaranteed ?? true,
          raw: c,
        };
      });
    }
    return MOCK_MATCH_CONTESTS.map((c) => ({ ...c, _id: c.id, raw: c }));
  }, [matchContests]);

  const filteredContests = useMemo(() => {
    if (contestFilter === "All") return displayContests;
    return displayContests.filter((c) => c.category === contestFilter);
  }, [displayContests, contestFilter]);

  // Group My Contests by Contest ID (Point 4: 1 card per contest with all joined teams)
  const groupedMyContests = useMemo(() => {
    const map = new Map<string, { contest: any; entries: any[] }>();
    for (const mc of myContests) {
      const contestObj = mc.contestId && typeof mc.contestId === "object" ? mc.contestId : mc;
      const cId = String(contestObj?._id || contestObj?.id || mc.contestId || mc._id || "");
      if (!cId) continue;
      if (!map.has(cId)) {
        map.set(cId, { contest: contestObj, entries: [] });
      }
      map.get(cId)!.entries.push(mc);
    }
    return Array.from(map.values());
  }, [myContests]);

  // Detect pending contest join flow after team creation (Point 3)
  useEffect(() => {
    const pendingContestId = getFlow<string | null>(FLOW_KEYS.pendingJoinContestId, null);
    const pendingTeamId = getFlow<string | null>(FLOW_KEYS.pendingJoinTeamId, null);
    const pendingTeamName = getFlow<string | null>(FLOW_KEYS.pendingJoinTeamName, null);

    if (pendingContestId && pendingTeamId) {
      const allPossibleContests = [...displayContests, ...matchContests, ...MOCK_MATCH_CONTESTS];
      const foundContest = allPossibleContests.find(
        (c) =>
          String(c._id || c.id) === String(pendingContestId) ||
          c.name?.toLowerCase().includes(String(pendingContestId).toLowerCase())
      );

      setPendingJoinContest(
        foundContest || {
          _id: pendingContestId,
          id: pendingContestId,
          name: "Mega Contest ₹50,000 Jackpot",
          entryFee: 0,
          prizePool: "₹50,000",
        }
      );
      setPendingJoinTeamInfo({
        id: pendingTeamId,
        name: pendingTeamName || "Your Squad",
      });
      removeFlow(FLOW_KEYS.pendingJoinContestId);
      removeFlow(FLOW_KEYS.pendingJoinTeamId);
      removeFlow(FLOW_KEYS.pendingJoinTeamName);
    }
  }, [displayContests, matchContests]);

  const teamA = selectedHomeMatch?.teamA || "East Zone";
  const teamB = selectedHomeMatch?.teamB || "South Zone";
  const tournament = selectedHomeMatch?.series || "Duleep Trophy 2026";
  const venue = selectedHomeMatch?.venue || "MA Chidambaram Stadium, Chennai";

  return (
    <AppShell maxWidth="max-w-[1520px]">
      <div className="space-y-6 pb-12">
        {/* ============================================================= */}
        {/* 1. CRICBUZZ TOP MATCHES TICKER STRIP (3 Per View + Controls)   */}
        {/* Point 5: ONLY visible on Home feed; hidden when match clicked! */}
        {/* ============================================================= */}
        {!selectedHomeMatch && (
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
                    const status = (wm.status || "UPCOMING").toUpperCase();
                    const isLive = status === "LIVE";
                    const isComp = status === "COMPLETED";
                    const isSelected = selectedHomeMatch && (selectedHomeMatch.id === wm.id || selectedHomeMatch.dbId === wm.dbId);

                    return (
                      <div
                        key={wm.id || wm.dbId || wm.series}
                        onClick={() => handleSelectMatch(wm)}
                        className={cn(
                          "rounded-xl p-3 border transition-all cursor-pointer text-left relative overflow-hidden group select-none shadow-md",
                          isSelected
                            ? "bg-emerald-900/90 border-emerald-400 ring-2 ring-emerald-400/50 shadow-emerald-900/50 scale-[1.01]"
                            : "bg-surface/90 hover:bg-surface border-border/80 hover:border-emerald-500/50"
                        )}
                      >
                        {/* Top Series & Format Header */}
                        <div className="flex items-center justify-between gap-1 text-[11px] mb-2">
                          <span className="font-semibold text-muted-foreground truncate max-w-[170px]">
                            {wm.series || "International Match"}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isLive ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-500 bg-red-500/10 border border-red-500/30 px-1.5 py-0.2 rounded animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                LIVE
                              </span>
                            ) : isComp ? (
                              <span className="text-[10px] font-bold text-muted-foreground bg-surface-2 px-1.5 py-0.2 rounded">
                                RESULT
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                UPCOMING
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-muted-foreground/80">
                              {wm.format || "T20"}
                            </span>
                          </div>
                        </div>

                        {/* Team A row */}
                        <div className="flex items-center justify-between text-xs py-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-base leading-none">{wm.teamAFlag || getTeamFlag(wm.teamACode || wm.teamA)}</span>
                            <span className="font-bold text-foreground truncate max-w-[110px]">
                              {wm.teamACode || wm.teamA}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold text-foreground">
                            {wm.scoreA || (isLive ? "Yet to bat" : "—")}
                          </span>
                        </div>

                        {/* Team B row */}
                        <div className="flex items-center justify-between text-xs py-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-base leading-none">{wm.teamBFlag || getTeamFlag(wm.teamBCode || wm.teamB)}</span>
                            <span className="font-bold text-foreground truncate max-w-[110px]">
                              {wm.teamBCode || wm.teamB}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold text-foreground">
                            {wm.scoreB || (isLive ? "Innings break" : "—")}
                          </span>
                        </div>

                        {/* Status summary banner */}
                        <div className="mt-2 pt-1.5 border-t border-border/60 flex items-center justify-between text-[11px]">
                          <p className={cn(
                            "truncate font-medium",
                            isLive ? "text-emerald-400" : isComp ? "text-muted-foreground" : "text-amber-400"
                          )}>
                            {wm.statusText || (isLive ? "Match in progress" : isComp ? "Match Completed" : "Starts soon")}
                          </p>
                          <span className="text-[10px] text-primary group-hover:translate-x-0.5 transition-transform flex items-center shrink-0">
                            {isSelected ? "Active" : "View →"}
                          </span>
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
        )}

        {/* ========================================================================= */}
        {/* VIEW A: FULL-PAGE MATCH SUITE (Rendered ONLY when a match is clicked!)     */}
        {/* Covers full page, replacing home 3-column feed with clean Cricbuzz view   */}
        {/* ========================================================================= */}
        {selectedHomeMatch ? (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Top Navigation & Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface/90 border border-border/80 rounded-2xl p-4 sm:p-5 shadow-lg">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBackToHome}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface border border-border text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Home</span>
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-black text-foreground">
                      {teamA} vs {teamB}
                    </h1>
                    {matchStatus === "LIVE" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-500 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        LIVE
                      </span>
                    ) : matchStatus === "COMPLETED" ? (
                      <span className="text-[10px] font-bold text-muted-foreground bg-surface-2 px-2 py-0.5 rounded-full border border-border">
                        RESULT
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        UPCOMING
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tournament} • {venue}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                {matchStatus !== "UPCOMING" && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2/70 border border-border text-xs text-muted-foreground font-semibold">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{matchStatus === "LIVE" ? "Contests Closed • Live Standings Active" : "Match Finished"}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleBackToHome}
                  title="Close match view"
                  aria-label="Close match view"
                  className="h-8 w-8 rounded-full bg-surface-2 hover:bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Cricbuzz Subtabs Bar (Exact Pic 4 Layout: Underline active style) */}
            <div className="border-b border-border/80 flex overflow-x-auto gap-4 sm:gap-8 pb-1 scrollbar-none text-xs sm:text-sm">
              {availableTabs.map((t) => {
                const isActive = matchTab === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMatchTab(t)}
                    className={cn(
                      "pb-2.5 px-1 font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer",
                      isActive
                        ? "border-emerald-500 text-emerald-400"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: CONTESTS (Enabled ONLY for UPCOMING matches) */}
            {matchTab === "Contests" && (
              <div className="space-y-6 animate-in fade-in-50 duration-150">
                {contestSuccessMsg && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 flex items-center gap-2 text-xs text-emerald-400 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{contestSuccessMsg}</span>
                  </div>
                )}

                {/* Contests Top CTA Banner (Unified Single Button combining Create Team and Create Team Now) */}
                <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 via-surface to-surface-2 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏆</span>
                      <h3 className="font-black text-foreground text-base sm:text-lg">
                        Select 11 Players & Build Your Winning Fantasy XI
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose Captain (2x points) & Vice-Captain (1.5x points). Max 7 players from one team.
                    </p>
                  </div>
                  <Button
                    onClick={handleCreateTeam}
                    variant="hero"
                    className="w-full sm:w-auto text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <Plus className="h-4 w-4" /> Create Team • Create Team Now
                  </Button>
                </div>

                {/* Contests Sub-tabs Bar: All Contests, My Contests, My Teams */}
                <div className="flex items-center gap-2 border-b border-border/80 pb-3">
                  <button
                    type="button"
                    onClick={() => setContestSubTab("contests")}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                      contestSubTab === "contests"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-surface-2 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All Contests ({displayContests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setContestSubTab("myContests")}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      contestSubTab === "myContests"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-surface-2 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    My Contests ({myContests.length})
                    {myContests.length > 0 && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setContestSubTab("myTeams")}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      contestSubTab === "myTeams"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-surface-2 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    My Teams ({myTeams.length})
                  </button>
                </div>

                {/* VIEW 1: ALL CONTESTS */}
                {contestSubTab === "contests" && (
                  <div className="space-y-4">
                    {/* Contest Category Filter Pills */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {["All", "Mega Contests", "Winner Takes All", "Head to Head", "Practice"].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setContestFilter(cat)}
                          className={cn(
                            "px-3.5 py-1.5 rounded-full font-bold transition-all border cursor-pointer",
                            contestFilter === cat
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                              : "bg-surface-2 text-muted-foreground border-border hover:text-foreground"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Contests Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredContests.map((c) => {
                        const spotsLeft = Math.max(0, c.totalSpots - c.filledSpots);
                        const pct = Math.min(100, Math.round((c.filledSpots / c.totalSpots) * 100));

                        const contestId = String(c._id || c.id);
                        const joinedEntries = myContests.filter((mc) => {
                          const cid = String(mc.contestId?._id || mc.contestId || mc._id || "");
                          return cid === contestId;
                        });
                        const joinedTeamNames = joinedEntries.map((e) => {
                          const teamObj = e.fantasyTeamId;
                          const teamName = teamObj?.name || (typeof teamObj === "object" ? teamObj.name : null);
                          if (teamName) return teamName;
                          const found = myTeams.find((t) => String(t._id) === String(teamObj?._id || teamObj));
                          return found ? found.name : "Team";
                        });
                        const joinedTeamIds = joinedEntries.map((e) => String(e.fantasyTeamId?._id || e.fantasyTeamId || ""));
                        const unjoinedTeams = myTeams.filter((t) => !joinedTeamIds.includes(String(t._id)));
                        const hasJoinedAny = joinedTeamIds.length > 0;
                        const hasJoinedAll = myTeams.length > 0 && unjoinedTeams.length === 0;

                        return (
                          <div
                            key={c.id || c._id}
                            onClick={() => handleInitiateJoin(c)}
                            role="button"
                            tabIndex={0}
                            className={cn(
                              "rounded-2xl border bg-surface/90 hover:border-emerald-500/60 p-4 transition-all shadow-md space-y-3.5 cursor-pointer hover:shadow-lg",
                              hasJoinedAny ? "border-emerald-500/40 ring-1 ring-emerald-500/20" : "border-border/80"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                                    {c.category}
                                  </span>
                                  {hasJoinedAny && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-900/60 border border-emerald-500/40 px-2 py-0.5 rounded-full animate-in fade-in duration-200">
                                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                      Joined ({joinedTeamNames.join(", ")})
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-black text-sm text-foreground mt-1.5">{c.name}</h4>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-muted-foreground block">Entry Fee</span>
                                <span className="font-mono text-base font-black text-emerald-400">
                                  {c.entryFee === 0 ? "FREE" : `₹${c.entryFee}`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs py-1 border-y border-border/60">
                              <div>
                                <span className="text-[10px] text-muted-foreground block">Prize Pool</span>
                                <span className="font-bold text-foreground">{c.prizePool}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-muted-foreground block">1st Prize</span>
                                <span className="font-bold text-amber-400 flex items-center gap-1">
                                  <Trophy className="h-3 w-3 text-amber-400" />
                                  {c.firstPrize}
                                </span>
                              </div>
                            </div>

                            {/* Spots progress */}
                            <div className="space-y-1">
                              <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>{spotsLeft.toLocaleString()} spots left</span>
                                <span>{c.totalSpots.toLocaleString()} spots</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-muted-foreground">
                                Up to {c.maxTeams} teams {c.guaranteed && "• Guaranteed"}
                              </span>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInitiateJoin(c);
                                }}
                                disabled={isJoining}
                                size="sm"
                                className={cn(
                                  "font-bold text-xs px-4 cursor-pointer transition-all",
                                  hasJoinedAll
                                    ? "bg-surface-2 hover:bg-surface border border-emerald-500/50 text-emerald-300"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:scale-[1.02]"
                                )}
                              >
                                {myTeams.length === 0
                                  ? "Join Contest"
                                  : hasJoinedAll
                                  ? "+ Join with New Team"
                                  : hasJoinedAny
                                  ? `Join with another team (${unjoinedTeams.length} left)`
                                  : "Join Contest"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* VIEW 2: MY CONTESTS */}
                {contestSubTab === "myContests" && (
                  <div className="space-y-4">
                    {myContests.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border/80 bg-surface/50 p-8 text-center space-y-3">
                        <Trophy className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                        <h4 className="font-bold text-foreground text-sm">No Contests Joined Yet</h4>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                          You haven't entered any contests for this match yet. Check out available contests and compete for mega prizes!
                        </p>
                        <Button
                          onClick={() => setContestSubTab("contests")}
                          variant="hero"
                          size="sm"
                          className="font-bold text-xs"
                        >
                          Browse All Contests
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupedMyContests.map(({ contest: contestObj, entries }, idx) => {
                          const cName = contestObj?.name || "Fantasy Contest";
                          const cFee = contestObj?.rules?.entryFee ?? contestObj?.entryFee ?? 0;
                          const cPrize = contestObj?.rules?.prizePool
                            ? `₹${Number(contestObj.rules.prizePool).toLocaleString()}`
                            : (contestObj?.prizePool || "₹50,000");

                          const isMultiTeam = entries.length > 1;

                          return (
                            <div
                              key={contestObj?._id || idx}
                              className="rounded-2xl border border-emerald-500/40 bg-surface/90 p-4 shadow-md space-y-3 relative overflow-hidden"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                                      {contestObj?.type || "PUBLIC"}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-900/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                      {isMultiTeam ? `Entered with (${entries.length} Teams)` : "Entered"}
                                    </span>
                                  </div>
                                  <h4 className="font-black text-sm text-foreground mt-1.5">{cName}</h4>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-muted-foreground block">Entry Fee</span>
                                  <span className="font-mono text-base font-black text-emerald-400">
                                    {cFee === 0 ? "FREE" : `₹${cFee}`}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs py-2 border-y border-border/60">
                                <div>
                                  <span className="text-[10px] text-muted-foreground block">Prize Pool</span>
                                  <span className="font-bold text-foreground">{cPrize}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-muted-foreground block">Status</span>
                                  <span className="font-bold text-emerald-400">Active Entry</span>
                                </div>
                              </div>

                              {/* Joined Teams (Grouped Point 4) */}
                              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2">
                                <div className="flex items-center justify-between pb-1 border-b border-border/40">
                                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                    {isMultiTeam ? `Joined with (${entries.length} Teams):` : "Joined with:"}
                                  </span>
                                  {isMultiTeam && (
                                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                                      Multi-Team Entry
                                    </span>
                                  )}
                                </div>

                                <div className={cn("gap-2", isMultiTeam ? "grid grid-cols-1 sm:grid-cols-2" : "space-y-1.5")}>
                                  {entries.map((mcEntry, eIdx) => {
                                    const teamObj = mcEntry.fantasyTeamId;
                                    const teamId = String(teamObj?._id || (typeof teamObj === "string" ? teamObj : "") || "");
                                    const userTeam = myTeams.find((t) => String(t._id) === teamId);
                                    const userTeamName = teamObj?.name || userTeam?.name || `Team ${eIdx + 1}`;

                                    const capName =
                                      teamObj?.captainId?.name ||
                                      (userTeam?.captainId ? getPlayerName(userTeam.captainId) : null);
                                    const vcName =
                                      teamObj?.viceCaptainId?.name ||
                                      (userTeam?.viceCaptainId ? getPlayerName(userTeam.viceCaptainId) : null);

                                    return (
                                      <div
                                        key={mcEntry._id || eIdx}
                                        className="rounded-lg bg-surface-2/80 border border-border/80 p-2 text-xs"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-foreground">{userTeamName}</span>
                                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                            Active
                                          </span>
                                        </div>
                                        {(capName || vcName) && (
                                          <div className="mt-1 flex items-center gap-2.5 text-[10px] text-muted-foreground">
                                            {capName && (
                                              <span>
                                                <b className="text-amber-400">C:</b> {capName}
                                              </span>
                                            )}
                                            {vcName && (
                                              <span>
                                                <b className="text-cyan-400">VC:</b> {vcName}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Two Action Buttons: View Details & Leaderboard */}
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setViewingContestDetails({ contest: contestObj, entries })}
                                  className="text-xs font-bold gap-1.5 border-border hover:bg-surface-2 cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5 text-primary" /> View Details
                                </Button>
                                <Button
                                  type="button"
                                  variant="hero"
                                  size="sm"
                                  onClick={() => handleOpenLeaderboard(contestObj)}
                                  className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                                >
                                  <Trophy className="h-3.5 w-3.5 text-amber-300" /> Leaderboard
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW 3: MY TEAMS */}
                {contestSubTab === "myTeams" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-surface-2/60 border border-border/80 rounded-xl p-3">
                      <div>
                        <h4 className="font-bold text-xs text-foreground">Your Created Squads</h4>
                        <p className="text-[11px] text-muted-foreground">
                          {myTeams.length} of 11 teams created for this match
                        </p>
                      </div>
                      <Button
                        onClick={handleCreateTeam}
                        variant="hero"
                        size="sm"
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" /> Create Team {myTeams.length + 1}
                      </Button>
                    </div>

                    {myTeams.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border/80 bg-surface/50 p-8 text-center space-y-3">
                        <Users className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                        <h4 className="font-bold text-foreground text-sm">No Teams Created Yet</h4>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                          Build your dream fantasy squad of 11 players, select Captain & Vice-Captain, and start winning!
                        </p>
                        <Button
                          onClick={handleCreateTeam}
                          variant="hero"
                          size="sm"
                          className="font-bold text-xs"
                        >
                          <Plus className="h-4 w-4" /> Create Team 1
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myTeams.map((t) => {
                          const capName = getPlayerName(t.captainId);
                          const vcName = getPlayerName(t.viceCaptainId);
                          const squadPlayers = getSquadForTeam(t);

                          return (
                            <div
                              key={t._id}
                              className="rounded-2xl border border-border/80 bg-surface/90 hover:border-emerald-500/40 p-4 shadow-md space-y-3 transition-all"
                            >
                              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                <h4 className="font-black text-sm text-foreground flex items-center gap-1.5">
                                  <span>🏏</span> {t.name}
                                </h4>
                                <span className="text-xs font-mono text-muted-foreground">
                                  Credits: <b className="text-foreground">{t.totalCredits || 100}</b>/100
                                </span>
                              </div>

                              {/* C & VC Badges */}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl border border-border bg-surface-2/60 p-2 flex items-center gap-2">
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 font-black text-[10px] text-black">
                                    C
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-xs truncate text-foreground">{capName}</p>
                                    <p className="text-[10px] text-muted-foreground">2X Points</p>
                                  </div>
                                </div>
                                <div className="rounded-xl border border-border bg-surface-2/60 p-2 flex items-center gap-2">
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400 font-black text-[10px] text-black">
                                    VC
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-xs truncate text-foreground">{vcName}</p>
                                    <p className="text-[10px] text-muted-foreground">1.5X Points</p>
                                  </div>
                                </div>
                              </div>

                              <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                                <span>{squadPlayers.length || 11} Players Selected</span>
                                <span>Max 7 from one team</span>
                              </div>

                              {/* View, Edit & Delete Buttons */}
                              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/60">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPreviewTeamModal(t)}
                                  className="text-xs font-bold gap-1 border-border hover:bg-surface-2"
                                >
                                  <Eye className="h-3.5 w-3.5 text-primary" /> View
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditTeam(t)}
                                  className="text-xs font-bold gap-1 border-border hover:bg-surface-2"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-emerald-400" /> Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteTeam(t)}
                                  disabled={deletingTeamId === t._id}
                                  className="text-xs font-bold gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-400" /> {deletingTeamId === t._id ? "..." : "Delete"}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: LIVE */}
            {matchTab === "Live" && (
              matchStatus === "UPCOMING" ? (
                <MatchStartingSoonCard
                  match={selectedHomeMatch}
                  sectionName="Live Match Feed"
                  onJoinContests={() => setMatchTab("Contests")}
                  onViewSquads={() => setMatchTab("Squads")}
                  onViewInfo={() => setMatchTab("Info")}
                />
              ) : (() => {
                const sqA = getTeamSquadDetails(teamA);
                const sqB = getTeamSquadDetails(teamB);
                const b1 = sqB.players[3] || sqB.players[0] || "Striker";
                const b2 = sqB.players[4] || sqB.players[1] || "Non-Striker";
                const bw1 = sqA.players[8] || sqA.players[9] || "Bowler 1";
                const bw2 = sqA.players[9] || sqA.players[10] || "Bowler 2";
                const score1 = selectedHomeMatch?.scoreA || "—";
                const score2 = selectedHomeMatch?.scoreB || "—";
                const statusStr = selectedHomeMatch?.statusText || `${teamA} vs ${teamB} • LIVE`;

                return (
                  <div className="space-y-6 animate-in fade-in-50 duration-150">
                    {/* Cricbuzz Scorecard Banner */}
                    <div className="rounded-2xl border border-border/80 bg-surface/80 p-5 sm:p-6 shadow-md">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            1st Innings
                          </span>
                          <p className="text-2xl sm:text-3xl font-black text-foreground mt-0.5">
                            {teamA} {score1}
                          </p>
                        </div>

                        <div className="text-left md:text-center md:border-x border-border/80 md:px-4">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                            Current Batting
                          </span>
                          <div className="flex items-baseline md:justify-center gap-2 mt-0.5">
                            <p className="text-2xl sm:text-3xl font-black text-emerald-400">
                              {teamB} {score2}
                            </p>
                          </div>
                          <span className="text-[11px] font-mono text-emerald-300 font-semibold block mt-1">
                            {statusStr}
                          </span>
                        </div>

                        <div className="text-left md:text-right">
                          <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                            Match Situation
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-foreground mt-1">
                            {statusStr}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2-Column Cricbuzz Live Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left (2 cols): Batter & Bowler Tables */}
                      <div className="lg:col-span-2 space-y-5">
                        {/* Batter Table */}
                        <div className="rounded-2xl border border-border/80 bg-surface/90 overflow-hidden shadow-md">
                          <div className="px-4 py-2.5 bg-surface-2/60 border-b border-border/80 flex items-center justify-between text-xs font-bold text-muted-foreground">
                            <span className="w-44">BATTER</span>
                            <div className="flex-1 grid grid-cols-5 text-right font-mono text-[11px]">
                              <span>R</span>
                              <span>B</span>
                              <span>4s</span>
                              <span>6s</span>
                              <span>SR</span>
                            </div>
                          </div>

                          <div className="divide-y divide-border/60 text-xs">
                            <div className="px-4 py-2.5 flex items-center justify-between font-medium">
                              <span className="w-44 font-bold text-emerald-400 truncate">
                                {b1} *
                              </span>
                              <div className="flex-1 grid grid-cols-5 text-right font-mono text-[11px]">
                                <span className="font-bold text-foreground">46</span>
                                <span className="text-muted-foreground">34</span>
                                <span className="text-muted-foreground">4</span>
                                <span className="text-muted-foreground">1</span>
                                <span className="font-bold text-foreground">135.29</span>
                              </div>
                            </div>
                            <div className="px-4 py-2.5 flex items-center justify-between font-medium">
                              <span className="w-44 font-bold text-foreground truncate">
                                {b2}
                              </span>
                              <div className="flex-1 grid grid-cols-5 text-right font-mono text-[11px]">
                                <span className="font-bold text-foreground">22</span>
                                <span className="text-muted-foreground">18</span>
                                <span className="text-muted-foreground">2</span>
                                <span className="text-muted-foreground">0</span>
                                <span className="font-bold text-foreground">122.22</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bowler Table */}
                        <div className="rounded-2xl border border-border/80 bg-surface/90 overflow-hidden shadow-md">
                          <div className="px-4 py-2.5 bg-surface-2/60 border-b border-border/80 flex items-center justify-between text-xs font-bold text-muted-foreground">
                            <span className="w-44">BOWLER</span>
                            <div className="flex-1 grid grid-cols-5 text-right font-mono text-[11px]">
                              <span>O</span>
                              <span>M</span>
                              <span>R</span>
                              <span>W</span>
                              <span>ECO</span>
                            </div>
                          </div>

                          <div className="divide-y divide-border/60 text-xs">
                            <div className="px-4 py-2.5 flex items-center justify-between font-medium">
                              <span className="w-44 font-bold text-emerald-400 truncate">
                                {bw1} *
                              </span>
                              <div className="flex-1 grid grid-cols-5 text-right font-mono text-[11px]">
                                <span className="font-bold text-foreground">3.2</span>
                                <span className="text-muted-foreground">0</span>
                                <span className="text-muted-foreground">24</span>
                                <span className="font-bold text-emerald-400">1</span>
                                <span className="text-foreground">7.20</span>
                              </div>
                            </div>
                            <div className="px-4 py-2.5 flex items-center justify-between font-medium">
                              <span className="w-44 font-bold text-foreground truncate">
                                {bw2}
                              </span>
                              <div className="flex-1 grid grid-cols-5 text-right font-mono text-[11px]">
                                <span className="font-bold text-foreground">3.0</span>
                                <span className="text-muted-foreground">0</span>
                                <span className="text-muted-foreground">21</span>
                                <span className="font-bold text-foreground">1</span>
                                <span className="text-foreground">7.00</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* OVER SUMMARY BOX */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                              Recent Over Breakdown
                            </h4>
                          </div>

                          <div className="rounded-2xl border border-border/80 bg-surface/90 p-4 shadow-sm space-y-3">
                            <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-foreground">Current Over</span>
                                <span className="text-muted-foreground">|</span>
                                <span className="font-bold text-emerald-400">{score2}</span>
                              </div>
                              <div className="flex items-center gap-1 font-mono text-xs font-bold">
                                <span>1</span>
                                <span>0</span>
                                <span className="text-blue-400 font-black">4</span>
                                <span>1</span>
                                <span>2</span>
                                <span>0</span>
                                <span className="text-muted-foreground ml-1">(8 runs)</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="space-y-1">
                                <p className="text-emerald-400 font-semibold">
                                  <span className="font-bold">{b1}</span>: 46 (34)*
                                </p>
                                <p className="text-foreground">
                                  <span className="font-bold">{b2}</span>: 22 (18)
                                </p>
                              </div>
                              <div className="sm:text-right">
                                <p className="text-muted-foreground">
                                  <span className="font-bold text-foreground">{bw1}</span>: 3.2-0-24-1
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right (1 col): Key Stats Panel */}
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-border/80 bg-surface/90 p-4 shadow-md space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-2">
                            Key Match Stats
                          </h4>

                          <div className="space-y-3 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Format:</span>
                              <span className="font-bold font-mono text-foreground">{selectedHomeMatch?.format || "T20"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Series:</span>
                              <span className="font-bold text-right text-[11px] text-foreground max-w-[160px] truncate">
                                {tournament}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <span className="font-bold text-emerald-400">{statusStr}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Venue:</span>
                              <span className="font-bold text-foreground text-right text-[11px] truncate max-w-[160px]">{venue}</span>
                            </div>
                          </div>
                        </div>

                        {/* Recent Balls Strip */}
                        <div className="rounded-2xl border border-border/80 bg-surface/90 p-4 shadow-md space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                            Recent Deliveries
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {["0", "1", "W", "0", "0", "4", "2", "6", "1", "0", "W", "0"].map((b, idx) => (
                              <span
                                key={idx}
                                className={cn(
                                  "h-7 w-7 rounded-full flex items-center justify-center font-mono text-xs font-bold border",
                                  b === "W"
                                    ? "bg-red-500/20 text-red-400 border-red-500/40"
                                    : b === "4"
                                    ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                                    : b === "6"
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                    : "bg-surface-2 text-foreground border-border"
                                )}
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* TAB CONTENT: HIGHLIGHTS */}
            {matchTab === "Highlights" && (
              matchStatus === "UPCOMING" ? (
                <MatchStartingSoonCard
                  match={selectedHomeMatch}
                  sectionName="Match Highlights"
                  onJoinContests={() => setMatchTab("Contests")}
                  onViewSquads={() => setMatchTab("Squads")}
                  onViewInfo={() => setMatchTab("Info")}
                />
              ) : (
                <div className="space-y-5 animate-in fade-in-50 duration-150">
                  {/* Highlights List */}
                  <div className="divide-y divide-border/80 border border-border/80 rounded-2xl bg-surface/90 overflow-hidden shadow-md">
                    {filteredHighlights.map((h, i) => (
                      <div key={i} className="p-4 flex items-start gap-4 hover:bg-surface-2/40 transition-colors">
                        <div className="text-center shrink-0 w-14">
                          <span className="font-mono text-xs font-black text-muted-foreground block">
                            {h.over}
                          </span>
                          <span
                            className={cn(
                              "mt-1 inline-flex items-center justify-center text-[10px] font-black px-1.5 py-0.5 rounded border",
                              h.badge === "W"
                                ? "bg-red-500/20 text-red-400 border-red-500/40"
                                : h.badge === "6"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                : h.badge === "4"
                                ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                                : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                            )}
                          >
                            {h.badge}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-foreground leading-relaxed pt-0.5">
                          {h.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* TAB CONTENT: GRAPHS */}
            {matchTab === "Graphs" && (
              matchStatus === "UPCOMING" ? (
                <MatchStartingSoonCard
                  match={selectedHomeMatch}
                  sectionName="Run-Rate & Manhattan Graphs"
                  onJoinContests={() => setMatchTab("Contests")}
                  onViewSquads={() => setMatchTab("Squads")}
                  onViewInfo={() => setMatchTab("Info")}
                />
              ) : (
                <div className="space-y-6 animate-in fade-in-50 duration-150">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Manhattan Chart */}
                    <div className="rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-md space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-foreground text-sm">Manhattan (Runs per Over)</h4>
                          <p className="text-[11px] text-muted-foreground">Overs 71 - 80 breakdown with wickets</p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          Live Feed
                        </span>
                      </div>

                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={MOCK_MANHATTAN_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a3342" />
                            <XAxis dataKey="over" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                              labelStyle={{ color: "#e2e8f0", fontWeight: "bold" }}
                            />
                            <Bar dataKey="runs" fill="#10b981" radius={[4, 4, 0, 0]}>
                              {MOCK_MANHATTAN_DATA.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.wickets > 0 ? "#ef4444" : "#10b981"}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex items-center justify-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Runs per over
                        </span>
                        <span className="flex items-center gap-1.5 text-red-400">
                          <span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Wicket in over
                        </span>
                      </div>
                    </div>

                    {/* Worm Chart */}
                    <div className="rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-md space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-foreground text-sm">Worm Chart (Cumulative Progression)</h4>
                          <p className="text-[11px] text-muted-foreground">{teamA} vs {teamB} Run Chase</p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          Live Feed
                        </span>
                      </div>

                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={MOCK_WORM_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a3342" />
                            <XAxis dataKey="over" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                              labelStyle={{ color: "#e2e8f0", fontWeight: "bold" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="runsA"
                              stroke="#10b981"
                              strokeWidth={2.5}
                              dot={{ r: 3, fill: "#10b981" }}
                              name={teamA}
                            />
                            <Line
                              type="monotone"
                              dataKey="runsB"
                              stroke="#3b82f6"
                              strokeWidth={2.5}
                              dot={{ r: 3, fill: "#3b82f6" }}
                              name={teamB}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex items-center justify-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> {teamA}
                        </span>
                        <span className="flex items-center gap-1.5 text-blue-400">
                          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> {teamB}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* TAB CONTENT: LEADERBOARD (Live ranks for live/completed matches) */}
            {matchTab === "Leaderboard" && (
              <div className="space-y-4 animate-in fade-in-50 duration-150">
                <div className="rounded-2xl border border-border/80 bg-surface/90 overflow-hidden shadow-md">
                  <div className="px-5 py-3.5 bg-surface-2/60 border-b border-border/80 flex items-center justify-between text-xs font-bold text-muted-foreground">
                    <span className="w-16">RANK</span>
                    <span className="flex-1">USER &amp; TEAM</span>
                    <span className="w-24 text-right font-mono">POINTS</span>
                    <span className="w-28 text-right">PRIZE</span>
                  </div>

                  <div className="divide-y divide-border/60 text-xs">
                    {MOCK_LEADERBOARD.map((item) => (
                      <div
                        key={item.rank}
                        className={cn(
                          "px-5 py-3 flex items-center justify-between font-medium",
                          item.rank === 1
                            ? "bg-amber-500/10"
                            : item.rank <= 3
                            ? "bg-emerald-500/5"
                            : ""
                        )}
                      >
                        <span className="w-16 font-bold flex items-center gap-1.5">
                          {item.rank === 1 ? (
                            <Trophy className="h-4 w-4 text-amber-400" />
                          ) : (
                            `#${item.rank}`
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate">{item.teamName}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{item.name}</p>
                        </div>
                        <span className="w-24 text-right font-mono font-bold text-emerald-400">
                          {item.points} pts
                        </span>
                        <span className="w-28 text-right font-bold text-amber-400">
                          {item.prize}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: RESULT (Shown for COMPLETED matches) */}
            {matchTab === "Result" && (
              <div className="space-y-6 animate-in fade-in-50 duration-150">
                <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/70 via-surface to-surface-2 p-6 shadow-md space-y-4">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                    MATCH RESULT
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-foreground">
                    {selectedHomeMatch.statusText || `${teamA} won by 6 wickets`}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-border/80">
                    <div>
                      <p className="text-muted-foreground">Player of the Match:</p>
                      <p className="font-bold text-foreground text-sm mt-0.5">Ishan Kishan (East Zone) — 270 (312)</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Match Outcome:</p>
                      <p className="font-bold text-emerald-400 text-sm mt-0.5">East Zone clinched Championship Trophy</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SCORECARD */}
            {matchTab === "Scorecard" && (
              matchStatus === "UPCOMING" ? (
                <MatchStartingSoonCard
                  match={selectedHomeMatch}
                  sectionName="Full Match Scorecard"
                  onJoinContests={() => setMatchTab("Contests")}
                  onViewSquads={() => setMatchTab("Squads")}
                  onViewInfo={() => setMatchTab("Info")}
                />
              ) : (() => {
                const sqA = getTeamSquadDetails(teamA);
                return (
                  <div className="rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-md space-y-5 animate-in fade-in-50 duration-150">
                    <h3 className="font-black text-foreground text-base border-b border-border/80 pb-3">
                      {teamA} 1st Innings — {selectedHomeMatch?.scoreA || "Innings in progress"}
                    </h3>
                    <div className="divide-y divide-border/60 text-xs">
                      <div className="py-2.5 flex items-center justify-between font-bold text-muted-foreground">
                        <span className="w-52">Batter</span>
                        <span className="flex-1">Dismissal</span>
                        <div className="flex gap-4 font-mono w-32 justify-end">
                          <span>R</span>
                          <span>B</span>
                          <span>4s</span>
                          <span>6s</span>
                        </div>
                      </div>
                      <div className="py-2 flex items-center justify-between">
                        <span className="w-52 font-bold text-foreground">{sqA.players[0] || "Top Order Batter 1"}</span>
                        <span className="flex-1 text-muted-foreground text-[11px]">c Bowler b Support</span>
                        <div className="flex gap-4 font-mono w-32 justify-end font-bold text-foreground">
                          <span>58</span>
                          <span>42</span>
                          <span>6</span>
                          <span>2</span>
                        </div>
                      </div>
                      <div className="py-2 flex items-center justify-between">
                        <span className="w-52 font-bold text-foreground">{sqA.players[1] || "Top Order Batter 2"}</span>
                        <span className="flex-1 text-muted-foreground text-[11px]">lbw b Strike Bowler</span>
                        <div className="flex gap-4 font-mono w-32 justify-end font-bold text-foreground">
                          <span>34</span>
                          <span>28</span>
                          <span>4</span>
                          <span>1</span>
                        </div>
                      </div>
                      <div className="py-2 flex items-center justify-between">
                        <span className="w-52 font-bold text-foreground">{sqA.players[2] || "Middle Order Anchor"}</span>
                        <span className="flex-1 text-muted-foreground text-[11px]">not out</span>
                        <div className="flex gap-4 font-mono w-32 justify-end font-bold text-foreground">
                          <span>46</span>
                          <span>34</span>
                          <span>4</span>
                          <span>1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* TAB CONTENT: INFO (Exact Pics 4 & 5 Layout: Cricbuzz Match Info) */}
            {matchTab === "Info" && (() => {
              const squadA = getTeamSquadDetails(teamA);
              const squadB = getTeamSquadDetails(teamB);
              const vg = getVenueGuide(venue);
              const officials = getMatchOfficials();
              const broadcast = getMatchBroadcast(tournament, teamA, teamB);

              const teamACode = selectedHomeMatch?.teamACode || (teamA.toUpperCase().includes("ENG") ? "ENG" : teamA.slice(0, 3).toUpperCase());
              const teamBCode = selectedHomeMatch?.teamBCode || (teamB.toUpperCase().includes("PAK") ? "PAK" : teamB.slice(0, 3).toUpperCase());
              const formatStr = selectedHomeMatch?.format || "3rd Test";
              const matchTitle = `${teamACode} vs ${teamBCode} • ${formatStr} • ${tournament}`;
              
              let dateStr = "Wednesday, September 9";
              const rawDate = selectedHomeMatch?.date || selectedHomeMatch?.startTime;
              if (rawDate) {
                try {
                  const d = new Date(rawDate);
                  if (!isNaN(d.getTime())) {
                    dateStr = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
                  }
                } catch {}
              }

              const timeStr = "11:00 AM LOCAL, 10:00 AM GMT, 3:30 PM IST";
              const tossStr = matchStatus === "UPCOMING"
                ? "Toss scheduled 30 mins before match start"
                : (selectedHomeMatch?.providerData?.toss || ((teamA.toUpperCase().includes("ENG") || teamB.toUpperCase().includes("PAK"))
                    ? "England won the toss and opt to Bowl"
                    : `${teamA} won the toss and opt to Bowl`));

              return (
                <div className="space-y-6 animate-in fade-in-50 duration-150">
                  {/* CARD 1: INFO */}
                  <div className="rounded-xl border border-emerald-500/20 bg-surface/90 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-emerald-950 via-[#073625] to-emerald-950 border-b border-emerald-500/30 px-4 py-3">
                      <h3 className="font-black text-emerald-300 text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-emerald-400" />
                        INFO
                      </h3>
                    </div>

                    <div className="divide-y divide-border/60 text-xs sm:text-sm">
                      {/* Match */}
                      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">Match</span>
                        <span className="flex-1 text-foreground/90 font-medium">{matchTitle}</span>
                      </div>

                      {/* Series */}
                      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">Series</span>
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-foreground/90 font-medium">{tournament}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                        </div>
                      </div>

                      {/* Date */}
                      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">Date</span>
                        <span className="flex-1 text-foreground/90">{dateStr}</span>
                      </div>

                      {/* Time */}
                      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">Time</span>
                        <span className="flex-1 text-foreground/90">{timeStr}</span>
                      </div>

                      {/* Toss */}
                      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">Toss</span>
                        <span className="flex-1 text-foreground/90">{tossStr}</span>
                      </div>

                      {/* Venue */}
                      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">Venue</span>
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-foreground/90 font-medium">{vg.stadium}{vg.city ? `, ${vg.city}` : ""}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                        </div>
                      </div>

                      {/* Umpires */}
                      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">Umpires</span>
                        <span className="flex-1 text-foreground/90">{officials.umpires}</span>
                      </div>

                      {/* 3rd Umpire */}
                      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">3rd Umpire</span>
                        <span className="flex-1 text-foreground/90">{officials.thirdUmpire}</span>
                      </div>

                      {/* Referee */}
                      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">Referee</span>
                        <span className="flex-1 text-foreground/90">{officials.referee}</span>
                      </div>

                      {/* Team A squad */}
                      <div className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">{teamA} squad</span>
                        <div className="flex-1 space-y-2.5 text-xs sm:text-sm">
                          <div>
                            <span className="font-bold text-foreground block mb-0.5">Players</span>
                            <p className="text-muted-foreground leading-relaxed">{squadA.players.join(", ")}</p>
                          </div>
                          <div>
                            <span className="font-bold text-foreground block mb-0.5">Bench</span>
                            <p className="text-muted-foreground leading-relaxed">{squadA.bench.join(", ")}</p>
                          </div>
                          <div>
                            <span className="font-bold text-foreground block mb-0.5">Support Staff</span>
                            <p className="text-muted-foreground leading-relaxed">{squadA.staff.join(", ")}</p>
                          </div>
                        </div>
                      </div>

                      {/* Team B squad */}
                      <div className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">{teamB} squad</span>
                        <div className="flex-1 space-y-2.5 text-xs sm:text-sm">
                          <div>
                            <span className="font-bold text-foreground block mb-0.5">Players</span>
                            <p className="text-muted-foreground leading-relaxed">{squadB.players.join(", ")}</p>
                          </div>
                          <div>
                            <span className="font-bold text-foreground block mb-0.5">Bench</span>
                            <p className="text-muted-foreground leading-relaxed">{squadB.bench.join(", ")}</p>
                          </div>
                          <div>
                            <span className="font-bold text-foreground block mb-0.5">Support Staff</span>
                            <p className="text-muted-foreground leading-relaxed">{squadB.staff.join(", ")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: VENUE GUIDE */}
                  <div className="rounded-xl border border-emerald-500/20 bg-surface/90 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-emerald-950 via-[#073625] to-emerald-950 border-b border-emerald-500/30 px-4 py-3">
                      <h3 className="font-black text-emerald-300 text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-400" />
                        VENUE GUIDE
                      </h3>
                    </div>

                    <div className="divide-y divide-border/60 text-xs sm:text-sm">
                      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">Stadium</span>
                        <span className="flex-1 text-foreground/90 font-medium">{vg.stadium}</span>
                      </div>
                      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">City</span>
                        <span className="flex-1 text-foreground/90">{vg.city}</span>
                      </div>
                      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">Capacity</span>
                        <span className="flex-1 text-foreground/90 font-mono">{vg.capacity}</span>
                      </div>
                      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">Ends</span>
                        <span className="flex-1 text-foreground/90">{vg.ends}</span>
                      </div>
                      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">Hosts To</span>
                        <span className="flex-1 text-foreground/90">{vg.hostsTo}</span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: BROADCAST GUIDE - IN */}
                  <div className="rounded-xl border border-emerald-500/20 bg-surface/90 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-emerald-950 via-[#073625] to-emerald-950 border-b border-emerald-500/30 px-4 py-3">
                      <h3 className="font-black text-emerald-300 text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2">
                        <Radio className="h-4 w-4 text-emerald-400" />
                        BROADCAST GUIDE - IN
                      </h3>
                    </div>

                    <div className="divide-y divide-border/60 text-xs sm:text-sm">
                      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">Streaming</span>
                        <span className="flex-1 text-foreground/90 font-medium">{broadcast.streaming}</span>
                      </div>
                      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="w-44 sm:w-52 font-bold text-foreground shrink-0">TV</span>
                        <span className="flex-1 text-foreground/90 font-medium">{broadcast.tv}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TAB CONTENT: SQUADS (Exact Pics 3 & 4 Layout) */}
            {matchTab === "Squads" && (() => {
              const sqA = getTeamSquadDetails(teamA);
              const sqB = getTeamSquadDetails(teamB);
              const teamACode = selectedHomeMatch?.teamACode || (teamA.toUpperCase().includes("ENG") ? "ENG" : teamA.slice(0, 3).toUpperCase());
              const teamBCode = selectedHomeMatch?.teamBCode || (teamB.toUpperCase().includes("PAK") ? "PAK" : teamB.slice(0, 3).toUpperCase());
              const teamAFlag = selectedHomeMatch?.teamAFlag || getTeamFlag(teamACode || teamA);
              const teamBFlag = selectedHomeMatch?.teamBFlag || getTeamFlag(teamBCode || teamB);

              const maxPlayers = Math.max(sqA.players.length, sqB.players.length);
              const maxStaff = Math.max(sqA.staff?.length || 0, sqB.staff?.length || 0);
              const maxBench = Math.max(sqA.bench?.length || 0, sqB.bench?.length || 0);

              return (
                <div className="space-y-6 animate-in fade-in-50 duration-150">
                  {/* Top Mint Header Bar (Pic 3) */}
                  <div className="bg-[#133d2e] border border-emerald-500/30 rounded-xl px-6 py-3.5 flex items-center justify-between text-sm sm:text-base font-black text-foreground shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{teamAFlag}</span>
                      <span className="tracking-wider">{teamACode}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="tracking-wider">{teamBCode}</span>
                      <span className="text-2xl">{teamBFlag}</span>
                    </div>
                  </div>

                  {/* Playing XI Subheader (Pic 3) */}
                  <div className="text-center py-2.5 border-y border-border/80">
                    <h4 className="text-sm sm:text-base font-black text-foreground tracking-wide">
                      Playing XI
                    </h4>
                  </div>

                  {/* Playing XI 2-Column Grid */}
                  <div className="rounded-2xl border border-border/80 bg-surface/90 overflow-hidden divide-y divide-border/60 shadow-md">
                    {Array.from({ length: maxPlayers }).map((_, idx) => {
                      const pA = sqA.players[idx];
                      const pB = sqB.players[idx];
                      const roleA = pA ? getPlayerRole(pA, idx) : "";
                      const roleB = pB ? getPlayerRole(pB, idx) : "";
                      const isAyub = pB?.toLowerCase().includes("ayub");

                      return (
                        <div key={`playing-${idx}`} className="grid grid-cols-2">
                          {/* Left Column: Team A (Avatar on Left) */}
                          <div className="p-3 sm:p-4 flex items-center gap-3 border-r border-border/70 min-w-0">
                            {pA ? (
                              <>
                                <PlayerAvatar name={pA} />
                                <div className="min-w-0">
                                  <div className="font-bold text-xs sm:text-sm text-foreground truncate">
                                    {pA}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">{roleA}</div>
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-muted-foreground/40 italic">—</div>
                            )}
                          </div>

                          {/* Right Column: Team B (Avatar on Right, Name on Left) */}
                          <div className={cn("p-3 sm:p-4 flex items-center justify-between gap-3 text-right min-w-0", isAyub && "bg-emerald-950/20")}>
                            {pB ? (
                              <>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-xs sm:text-sm text-foreground truncate flex items-center justify-end gap-1">
                                    {isAyub && <span className="text-emerald-400 text-xs">▲</span>}
                                    <span>{pB}</span>
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">{roleB}</div>
                                </div>
                                <PlayerAvatar name={pB} />
                              </>
                            ) : (
                              <div className="text-xs text-muted-foreground/40 italic sm:ml-auto">—</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Support Staff Subheader (Pic 4) */}
                  {maxStaff > 0 && (
                    <>
                      <div className="text-center py-2.5 border-y border-border/80">
                        <h4 className="text-sm sm:text-base font-black text-foreground tracking-wide">
                          Support Staff
                        </h4>
                      </div>

                      <div className="rounded-2xl border border-border/80 bg-surface/90 overflow-hidden divide-y divide-border/60 shadow-md">
                        {Array.from({ length: maxStaff }).map((_, idx) => {
                          const sA = sqA.staff?.[idx];
                          const sB = sqB.staff?.[idx];
                          const roleA = sA ? getStaffRole(sA, idx) : "";
                          const roleB = sB ? getStaffRole(sB, idx) : "";

                          return (
                            <div key={`staff-${idx}`} className="grid grid-cols-2">
                              {/* Left Column: Team A Staff */}
                              <div className="p-3 sm:p-4 flex items-center gap-3 border-r border-border/70 min-w-0">
                                {sA ? (
                                  <>
                                    <PlayerAvatar name={sA} />
                                    <div className="min-w-0">
                                      <div className="font-bold text-xs sm:text-sm text-foreground truncate">
                                        {sA}
                                      </div>
                                      <div className="text-[11px] text-muted-foreground">{roleA}</div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-xs text-muted-foreground/40 italic">—</div>
                                )}
                              </div>

                              {/* Right Column: Team B Staff */}
                              <div className="p-3 sm:p-4 flex items-center justify-between gap-3 text-right min-w-0">
                                {sB ? (
                                  <>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold text-xs sm:text-sm text-foreground truncate">
                                        {sB}
                                      </div>
                                      <div className="text-[11px] text-muted-foreground">{roleB}</div>
                                    </div>
                                    <PlayerAvatar name={sB} />
                                  </>
                                ) : (
                                  <div className="text-xs text-muted-foreground/40 italic sm:ml-auto">—</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Bench Subheader */}
                  {maxBench > 0 && (
                    <>
                      <div className="text-center py-2.5 border-y border-border/80">
                        <h4 className="text-sm sm:text-base font-black text-foreground tracking-wide">
                          Bench
                        </h4>
                      </div>

                      <div className="rounded-2xl border border-border/80 bg-surface/90 overflow-hidden divide-y divide-border/60 shadow-md">
                        {Array.from({ length: maxBench }).map((_, idx) => {
                          const bA = sqA.bench?.[idx];
                          const bB = sqB.bench?.[idx];
                          const roleA = bA ? getPlayerRole(bA, idx + 11) : "";
                          const roleB = bB ? getPlayerRole(bB, idx + 11) : "";

                          return (
                            <div key={`bench-${idx}`} className="grid grid-cols-2">
                              {/* Left Column: Team A Bench */}
                              <div className="p-3 sm:p-4 flex items-center gap-3 border-r border-border/70 min-w-0">
                                {bA ? (
                                  <>
                                    <PlayerAvatar name={bA} />
                                    <div className="min-w-0">
                                      <div className="font-bold text-xs sm:text-sm text-foreground truncate">
                                        {bA}
                                      </div>
                                      <div className="text-[11px] text-muted-foreground">{roleA}</div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-xs text-muted-foreground/40 italic">—</div>
                                )}
                              </div>

                              {/* Right Column: Team B Bench */}
                              <div className="p-3 sm:p-4 flex items-center justify-between gap-3 text-right min-w-0">
                                {bB ? (
                                  <>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold text-xs sm:text-sm text-foreground truncate">
                                        {bB}
                                      </div>
                                      <div className="text-[11px] text-muted-foreground">{roleB}</div>
                                    </div>
                                    <PlayerAvatar name={bB} />
                                  </>
                                ) : (
                                  <div className="text-xs text-muted-foreground/40 italic sm:ml-auto">—</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* TAB CONTENT: OVERS */}
            {matchTab === "Overs" && (
              matchStatus === "UPCOMING" ? (
                <MatchStartingSoonCard
                  match={selectedHomeMatch}
                  sectionName="Over Summaries"
                  onJoinContests={() => setMatchTab("Contests")}
                  onViewSquads={() => setMatchTab("Squads")}
                  onViewInfo={() => setMatchTab("Info")}
                />
              ) : (() => {
                const oversList = getMatchOversData(selectedHomeMatch, teamA, teamB);
                return (
                  <div className="space-y-4 animate-in fade-in-50 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-border/70">
                      <h3 className="font-black text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
                        <Clock className="h-4 w-4 text-emerald-400" />
                        Over-By-Over Breakdown
                      </h3>
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        {selectedHomeMatch?.scoreB || selectedHomeMatch?.scoreA || "Live Feed"}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {oversList.map((ov) => (
                        <div
                          key={ov.overNumber}
                          className="rounded-2xl border border-border/80 bg-surface/90 p-4 sm:p-5 shadow-sm space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border/50 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-foreground">
                                Over {ov.overNumber}
                              </span>
                              <span className="text-muted-foreground font-semibold">
                                ({ov.runs} runs{ov.wickets > 0 ? `, ${ov.wickets} wicket` : ""})
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-emerald-400 font-bold">{ov.bowler}</span>
                            </div>
                            <span className="font-mono font-bold text-foreground text-xs">
                              {ov.totalScore}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className="text-muted-foreground text-[11px] font-sans mr-1">Balls:</span>
                            {ov.balls.map((b, bIdx) => (
                              <span
                                key={bIdx}
                                className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm",
                                  b.type === "wicket"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                    : b.type === "four"
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                                    : b.type === "six"
                                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                                    : b.type === "dot"
                                    ? "bg-surface-2 text-muted-foreground border border-border/60"
                                    : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                                )}
                              >
                                {b.text}
                              </span>
                            ))}
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                            {ov.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}

            {/* TAB CONTENT: FULL COMMENTARY */}
            {matchTab === "Full Commentary" && (
              matchStatus === "UPCOMING" ? (
                <MatchStartingSoonCard
                  match={selectedHomeMatch}
                  sectionName="Full Ball-by-Ball Commentary"
                  onJoinContests={() => setMatchTab("Contests")}
                  onViewSquads={() => setMatchTab("Squads")}
                  onViewInfo={() => setMatchTab("Info")}
                />
              ) : (() => {
                const commentaryList = getMatchFullCommentary(selectedHomeMatch, teamA, teamB);
                return (
                  <div className="space-y-4 animate-in fade-in-50 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-border/70">
                      <h3 className="font-black text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
                        <Radio className="h-4 w-4 text-emerald-400" />
                        Ball-by-Ball Live Commentary
                      </h3>
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        {selectedHomeMatch?.scoreB || selectedHomeMatch?.scoreA || "Live Feed"}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-border/80 bg-surface/90 divide-y divide-border/60 overflow-hidden shadow-sm">
                      {commentaryList.map((c, cIdx) => (
                        <div key={cIdx} className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4 hover:bg-surface-2/40 transition-colors">
                          <div className="flex flex-col items-center gap-1.5 shrink-0 min-w-[48px]">
                            <span className="font-mono text-xs font-bold text-foreground">{c.ball}</span>
                            <span
                              className={cn(
                                "w-6 h-6 rounded-md flex items-center justify-center font-black text-[11px] shadow-sm",
                                c.badgeType === "wicket"
                                  ? "bg-red-500 text-white"
                                  : c.badgeType === "four"
                                  ? "bg-blue-500 text-white"
                                  : c.badgeType === "six"
                                  ? "bg-purple-600 text-white"
                                  : c.event === "0"
                                  ? "bg-surface-2 text-muted-foreground border border-border"
                                  : "bg-emerald-600 text-white"
                              )}
                            >
                              {c.event}
                            </span>
                          </div>
                          <div className="flex-1 space-y-1">
                            <h5 className="text-xs sm:text-sm font-bold text-foreground">
                              {c.headline}
                            </h5>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {c.desc}
                            </p>
                          </div>
                          <div className="shrink-0 text-right font-mono text-xs font-bold text-muted-foreground hidden sm:block">
                            {c.score}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}

            {/* TAB CONTENT: NEWS (Req 5) */}
            {matchTab === "News" && (() => {
              const matchNewsList = getMatchSpecificNews(selectedHomeMatch, teamA, teamB, tournament, venue);
              return (
                <div className="space-y-6 animate-in fade-in-50 duration-150">
                  <div className="rounded-xl border border-emerald-500/20 bg-surface/90 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-emerald-950 via-[#073625] to-emerald-950 border-b border-emerald-500/30 px-4 py-3">
                      <h3 className="font-black text-emerald-300 text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2">
                        <Newspaper className="h-4 w-4 text-emerald-400" />
                        LATEST NEWS &amp; MATCH UPDATES • {teamA.toUpperCase()} VS {teamB.toUpperCase()}
                      </h3>
                    </div>
                    <div className="divide-y divide-border/60">
                      {matchNewsList.map((item) => (
                        <div key={item.id} className="p-4 sm:p-6 space-y-2.5 hover:bg-surface-2/40 transition-colors">
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold uppercase">
                              {item.category}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground font-mono">{item.timeAgo}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-foreground/80 font-medium">Source: {item.author}</span>
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-foreground hover:text-emerald-400 transition-colors cursor-pointer">
                            {item.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                            {item.summary}
                          </p>
                          {item.content && item.content.length > 0 && (
                            <div className="space-y-1.5 pt-1 text-xs text-muted-foreground leading-relaxed">
                              {item.content.map((para, idx) => (
                                <p key={idx}>{para}</p>
                              ))}
                            </div>
                          )}
                          {item.quotes && (
                            <blockquote className="mt-2 border-l-2 border-emerald-500 pl-3 py-0.5 text-xs italic text-emerald-300/90 bg-emerald-950/20 rounded-r">
                              {item.quotes}
                            </blockquote>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW B: DEFAULT HOME PAGE (Pic 3: Cricbuzz 3-Column Layout & Stories)       */
          /* ========================================================================= */
          <div className="space-y-8 animate-in fade-in-50 duration-200">
            {/* ============================================================= */}
            {/* ARENA LIVE STRIKE: CINEMATIC 4K MOTION REEL                   */}
            {/* High-octane interactive video banner with audio & actions    */}
            {/* ============================================================= */}
            <div className="relative rounded-3xl overflow-hidden border border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 via-slate-950 to-black p-6 sm:p-8 shadow-2xl shadow-emerald-950/40 group">
              {/* Background ambient video */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-45 group-hover:opacity-55 transition-opacity duration-500">
                <video
                  ref={bannerVideoRef}
                  src="/for_this_fantasy_cricket_wbsit.mp4"
                  autoPlay
                  loop
                  muted={isBannerMuted}
                  playsInline
                  className="h-full w-full object-cover object-center scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
              </div>

              {/* Banner Foreground Content */}
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-2xl space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1 rounded-full shadow">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      ⚡ ARENA LIVE STRIKE • 4K 60FPS
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-surface-2/80 px-2 py-0.5 rounded border border-border">
                      HIGH-OCTANE ACTION
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase leading-none">
                    DOMINATE EVERY BALL. <span className="text-emerald-400">WIN REAL CASH.</span>
                  </h2>

                  <p className="text-xs sm:text-sm text-foreground/85 max-w-xl leading-relaxed">
                    Step inside the most electric cricket arena in India. Real-time pitch dynamics, high-multiplier mega pools, and instant automated bank payouts.
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    {sortedMatches.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSelectMatch(sortedMatches[0])}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 cursor-pointer"
                      >
                        <Trophy className="h-4 w-4" />
                        <span>ENTER MATCH CENTER ({sortedMatches[0].teamA} vs {sortedMatches[0].teamB})</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Banner Action Controls */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={toggleBannerSound}
                    aria-label={isBannerMuted ? "Turn reel sound on" : "Mute reel sound"}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/80 hover:bg-emerald-950/80 border border-emerald-500/40 text-xs font-bold text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
                  >
                    {isBannerMuted ? (
                      <>
                        <VolumeX className="h-4 w-4 text-emerald-400" />
                        <span>UNMUTE REEL</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4 text-emerald-400 animate-pulse" />
                        <span>SOUND ON</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveVideo({
                        id: "promo-theatre",
                        title: "⚡ OFFICIAL CRICKET ARENA: 4K Cinematic Matchday Trailer",
                        videoUrl: "/for_this_fantasy_cricket_wbsit.mp4",
                        duration: "00:15",
                        views: "1.8M views",
                      })
                    }
                    aria-label="Expand cinematic reel"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2/90 hover:bg-surface border border-border text-foreground text-xs font-bold shadow-lg backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
                  >
                    <Maximize2 className="h-4 w-4 text-emerald-400" />
                    <span>THEATRE MODE</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3-COLUMN CRICBUZZ LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* ------------------------------------------------------------- */}
              {/* LEFT COLUMN: LATEST NEWS (w-3/12 on large screens - Sticky)  */}
              {/* ------------------------------------------------------------- */}
              <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto pr-1 scrollbar-none">
                <div className="flex items-center justify-between pb-2 border-b border-border/80">
                  <h3 className="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                    <Flame className="h-4 w-4 fill-red-500" />
                    LATEST NEWS
                  </h3>
                  <span className="text-[10px] font-bold text-muted-foreground">UPDATED</span>
                </div>

                <div className="divide-y divide-border/60 space-y-2">
                  {LATEST_NEWS_ITEMS.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        const art = FEATURED_ARTICLES.find((a) => a.title.includes(item.title.slice(0, 15))) || heroArticle;
                        setReadingArticle(art);
                      }}
                      className="pt-2.5 pb-1 group cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
                        <span className="font-bold text-emerald-400">{item.cat}</span>
                        <span>•</span>
                        <span>{item.time}</span>
                      </div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* MIDDLE COLUMN: FEATURED ARTICLE HERO (w-6/12 on large screens)*/}
              {/* ------------------------------------------------------------- */}
              <div className="lg:col-span-6 space-y-6">
                <div
                  onClick={() => setReadingArticle(heroArticle)}
                  className="rounded-2xl border border-border/80 bg-surface/90 overflow-hidden shadow-xl hover:border-emerald-500/50 transition-all cursor-pointer group"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-surface-2">
                    <img
                      src={heroArticle.image || heroCricket}
                      alt={heroArticle.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded shadow">
                        FEATURED STORY
                      </span>
                      <span className="text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur">
                        {heroArticle.category}
                      </span>
                    </div>
                    <span className="absolute top-4 right-4 text-[10px] font-mono bg-black/60 text-white/90 px-2 py-0.5 rounded backdrop-blur">
                      {heroArticle.timeAgo}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6 space-y-3">
                    <h2 className="text-lg sm:text-xl font-black text-foreground group-hover:text-emerald-400 transition-colors leading-snug">
                      {heroArticle.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {heroArticle.summary}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Click to Read Full Story →
                      </span>
                      <span>{heroArticle.author}</span>
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* MATCHES ARENA (Pic 4 only opens when clicking a match!)   */}
                {/* ========================================================= */}
                <div className="space-y-4 rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Trophy className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                          CRICKET MATCHES ARENA
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Select any match to enter Match Center, view scorecard, or join contests
                        </p>
                      </div>
                    </div>

                    {/* Arena Tabs: Upcoming / Live / Completed */}
                    <div className="inline-flex rounded-xl bg-surface-2 p-1 border border-border">
                      <button
                        type="button"
                        onClick={() => setArenaTab("UPCOMING")}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          arenaTab === "UPCOMING"
                            ? "bg-emerald-500 text-slate-950 shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Upcoming ({worldMatches.filter((m) => (m.status || "UPCOMING").toUpperCase() === "UPCOMING").length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setArenaTab("LIVE")}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                          arenaTab === "LIVE"
                            ? "bg-red-500 text-white shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                        Live ({worldMatches.filter((m) => (m.status || "").toUpperCase() === "LIVE").length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setArenaTab("COMPLETED")}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          arenaTab === "COMPLETED"
                            ? "bg-surface text-foreground shadow-sm border border-border"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Completed ({worldMatches.filter((m) => (m.status || "").toUpperCase() === "COMPLETED").length})
                      </button>
                    </div>
                  </div>

                  {/* Matches Grid */}
                  <div className="space-y-3">
                    {arenaMatches.length > 0 ? (
                      arenaMatches.map((m: any) => {
                        const isLive = (m.status || "").toUpperCase() === "LIVE";
                        const isComp = (m.status || "").toUpperCase() === "COMPLETED";

                        return (
                          <div
                            key={m.id || m.dbId || m.series}
                            onClick={() => handleSelectMatch(m)}
                            className="rounded-xl border border-border/80 bg-surface hover:border-emerald-500/50 hover:bg-surface-2/60 transition-all p-4 cursor-pointer group shadow-sm hover:shadow-md"
                          >
                            {/* Card Header: Series & Format & Status */}
                            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-border/50 text-xs">
                              <span className="font-semibold text-muted-foreground truncate">
                                {m.series || "International Cricket Series"}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                {isLive ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-500 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full animate-pulse">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                    LIVE
                                  </span>
                                ) : isComp ? (
                                  <span className="text-[10px] font-bold text-muted-foreground bg-surface-2 px-2 py-0.5 rounded-full border border-border">
                                    RESULT
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                    UPCOMING
                                  </span>
                                )}
                                <span className="text-[10px] font-bold text-muted-foreground/80 bg-surface-2/80 px-1.5 py-0.5 rounded">
                                  {m.format || "T20"}
                                </span>
                              </div>
                            </div>

                            {/* Teams & Scores */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center py-1">
                              {/* Team A */}
                              <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xl leading-none">
                                    {m.teamAFlag || getTeamFlag(m.teamACode || m.teamA)}
                                  </span>
                                  <span className="font-extrabold text-sm text-foreground truncate max-w-[130px]">
                                    {m.teamA}
                                  </span>
                                </div>
                                <span className="font-mono text-xs font-bold text-foreground sm:ml-auto">
                                  {m.scoreA || (isLive ? "Yet to bat" : "—")}
                                </span>
                              </div>

                              {/* Team B */}
                              <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xl leading-none">
                                    {m.teamBFlag || getTeamFlag(m.teamBCode || m.teamB)}
                                  </span>
                                  <span className="font-extrabold text-sm text-foreground truncate max-w-[130px]">
                                    {m.teamB}
                                  </span>
                                </div>
                                <span className="font-mono text-xs font-bold text-foreground sm:ml-auto">
                                  {m.scoreB || (isLive ? "Yet to bat" : "—")}
                                </span>
                              </div>
                            </div>

                            {/* Footer: Match status/time + Contest Information + Action (Req 1) */}
                            <div className="mt-3 pt-2.5 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <div className="flex flex-wrap items-center gap-2.5">
                                {/* Match status / time */}
                                <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-emerald-400/80" />
                                  <span>{getMatchTimeDisplay(m)}</span>
                                </span>
                                {/* Contest Information */}
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                  <Trophy className="h-3 w-3 text-amber-400" />
                                  <span>{isLive ? "Contests Locked • Live Standings" : isComp ? "Contests Completed" : "Mega Contest ₹10 Lakhs • Contests Open"}</span>
                                </span>
                              </div>

                              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400 group-hover:text-emerald-300 text-xs shrink-0 self-end sm:self-auto">
                                <span>{isLive ? "View Live Match" : isComp ? "View Match Summary" : "Enter Match Center"}</span>
                                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                        No {arenaTab.toLowerCase()} matches at the moment.
                      </div>
                    )}
                  </div>
                </div>

                {/* SPECIAL FEATURES & ANALYSIS (Pic 5) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/80">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-primary" />
                      SPECIAL FEATURES &amp; ANALYSIS
                    </h3>
                    <span className="text-[10px] font-bold text-muted-foreground">IN-DEPTH</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {specialArticles.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => setReadingArticle(art)}
                        className="rounded-xl border border-border/80 bg-surface/90 p-4 hover:border-emerald-500/40 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                            {art.category}
                          </span>
                          <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {art.title}
                          </h4>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {art.summary}
                          </p>
                        </div>
                        <div className="pt-3 mt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{art.author?.split("•")[0]}</span>
                          <span>{art.timeAgo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* RIGHT COLUMN: WORLD CRICKET UPDATES (w-3/12 on large screens-Sticky)*/}
              {/* Replaces Video section with attractive live worldwide cricket updates */}
              {/* ------------------------------------------------------------- */}
              <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto pr-1 scrollbar-none">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-border/80">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Globe2 className="h-4 w-4 text-emerald-400" />
                    WORLD CRICKET UPDATES
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    LIVE RADAR
                  </span>
                </div>

                {/* Worldwide Live & Recent Matches List */}
                <div className="space-y-3">
                  {(worldMatches.length > 0 ? worldMatches.slice(0, 5) : [
                    {
                      id: "wm-live-1",
                      series: "Duleep Trophy 2026, Final",
                      format: "FC",
                      teamA: "East Zone",
                      teamB: "South Zone",
                      teamACode: "EZONE",
                      teamBCode: "SZONE",
                      teamAFlag: "🏏",
                      teamBFlag: "🏏",
                      scoreA: "708/8d",
                      scoreB: "176/5 (56 ov)",
                      status: "LIVE",
                      statusText: "Day 3: SZONE trail by 532 runs",
                    },
                    {
                      id: "wm-live-2",
                      series: "Women's Asia Cup T20I",
                      format: "T20I",
                      teamA: "Pakistan Women",
                      teamB: "Hong Kong Women",
                      teamACode: "PAKW",
                      teamBCode: "HKW",
                      teamAFlag: "🇵🇰",
                      teamBFlag: "🇭🇰",
                      scoreA: "143/8 (20 ov)",
                      scoreB: "71 (17.3 ov)",
                      status: "COMPLETED",
                      statusText: "PAKW won by 72 runs",
                    },
                    {
                      id: "wm-live-3",
                      series: "Big Bash League 2026",
                      format: "T20",
                      teamA: "Adelaide Strikers",
                      teamB: "Melbourne Stars",
                      teamACode: "ADS",
                      teamBCode: "MLS",
                      teamAFlag: "⚡",
                      teamBFlag: "⭐",
                      scoreA: "189/4 (20 ov)",
                      scoreB: "89/3 (11.2 ov)",
                      status: "LIVE",
                      statusText: "MLS need 101 runs in 52 balls",
                    },
                    {
                      id: "wm-live-4",
                      series: "Caribbean Premier League",
                      format: "T20",
                      teamA: "Guyana Warriors",
                      teamB: "Antigua Falcons",
                      teamACode: "GAW",
                      teamBCode: "ABF",
                      teamAFlag: "🌴",
                      teamBFlag: "🦅",
                      scoreA: "Upcoming",
                      scoreB: "Preview",
                      status: "UPCOMING",
                      statusText: "Match starts at 7:30 PM",
                    },
                  ]).map((wm: any) => {
                    const st = (wm.status || "LIVE").toUpperCase();
                    const isLive = st === "LIVE";
                    const isComp = st === "COMPLETED";

                    return (
                      <div
                        key={wm.id || wm.dbId}
                        onClick={() => handleSelectMatch(wm)}
                        className="rounded-xl border border-border/80 bg-surface/90 p-3 hover:border-emerald-500/50 hover:bg-surface-2/70 transition-all cursor-pointer group shadow-sm"
                      >
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                          <span className="font-bold truncate max-w-[140px] text-foreground/80">
                            {wm.series || "International Match"}
                          </span>
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded font-bold uppercase text-[9px]",
                              isLive
                                ? "bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse"
                                : isComp
                                ? "bg-surface-2 text-muted-foreground border border-border"
                                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            )}
                          >
                            {wm.status || "LIVE"}
                          </span>
                        </div>

                        {/* Team A */}
                        <div className="flex items-center justify-between text-xs py-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm">{wm.teamAFlag || getTeamFlag(wm.teamACode || wm.teamA)}</span>
                            <span className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {wm.teamACode || wm.teamA}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold text-foreground">
                            {wm.scoreA || (isLive ? "Yet to bat" : "—")}
                          </span>
                        </div>

                        {/* Team B */}
                        <div className="flex items-center justify-between text-xs py-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm">{wm.teamBFlag || getTeamFlag(wm.teamBCode || wm.teamB)}</span>
                            <span className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {wm.teamBCode || wm.teamB}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold text-foreground">
                            {wm.scoreB || (isLive ? "Innings break" : "—")}
                          </span>
                        </div>

                        {/* Status text */}
                        <div className="mt-2 pt-1.5 border-t border-border/50 flex items-center justify-between text-[10px]">
                          <span
                            className={cn(
                              "truncate font-medium",
                              isLive ? "text-emerald-400" : isComp ? "text-muted-foreground" : "text-amber-400"
                            )}
                          >
                            {wm.statusText || (isLive ? "Match in progress" : isComp ? "Match Completed" : "Starts soon")}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Cricket Pulse Widget */}
                <div className="rounded-xl border border-border/80 bg-gradient-to-b from-surface/90 to-surface-2/60 p-3.5 shadow-sm space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-border/60">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-foreground">
                      CRICKET PULSE • BREAKING
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2 group cursor-default">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <p className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors leading-snug">
                        <span className="font-bold text-foreground">India Squad:</span> Jasprit Bumrah fit and named captain for upcoming tri-series.
                      </p>
                    </div>
                    <div className="flex items-start gap-2 group cursor-default">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <p className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors leading-snug">
                        <span className="font-bold text-foreground">Duleep Trophy:</span> East Zone declare at 708/8d; Ishan Kishan bags 250*.
                      </p>
                    </div>
                    <div className="flex items-start gap-2 group cursor-default">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <p className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors leading-snug">
                        <span className="font-bold text-foreground">ICC Update:</span> New FTP cycle allocates exclusive 4-week window for franchise T20 leagues.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trending Series Tags */}
                <div className="rounded-xl border border-border/80 bg-surface/90 p-3 shadow-sm space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                    TRENDING SERIES
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {["#DuleepTrophy", "#ChampionsTrophy27", "#BigBash16", "#WomensAsiaCup", "#IPL2027Auction"].map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold px-2 py-1 rounded-md bg-surface-2 hover:bg-emerald-500/10 hover:text-emerald-400 text-muted-foreground border border-border/80 transition-colors cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================= */}
            {/* RICH CRICKET CONTENT SECTION (Pic 5): Rankings, Fixtures, Trivia */}
            {/* Zero Ads! Pure authentic cricket data.                        */}
            {/* ============================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-border/80">
              {/* ICC Rankings Widget */}
              <div className="rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    ICC World Rankings (Men's T20I)
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-bold">OFFICIAL</span>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Top Teams</p>
                  <div className="divide-y divide-border/60 text-xs">
                    {ICC_RANKINGS.teams.map((t) => (
                      <div key={t.rank} className="py-1.5 flex items-center justify-between">
                        <span className="font-mono text-muted-foreground w-6">#{t.rank}</span>
                        <span className="font-bold text-foreground flex-1 flex items-center gap-1.5">
                          <span>{t.flag}</span> {t.team}
                        </span>
                        <span className="font-mono font-bold text-emerald-400">{t.rating} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Top Batters</p>
                  <div className="divide-y divide-border/60 text-xs">
                    {ICC_RANKINGS.batters.map((b) => (
                      <div key={b.rank} className="py-1.5 flex items-center justify-between">
                        <span className="font-mono text-muted-foreground w-6">#{b.rank}</span>
                        <span className="font-bold text-foreground flex-1 flex items-center gap-1.5">
                          <span>{b.flag}</span> {b.player} ({b.team})
                        </span>
                        <span className="font-mono font-bold text-foreground">{b.rating}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Global Upcoming Tour Schedule */}
              <div className="rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    Upcoming Global Tours &amp; Series
                  </h4>
                  <span className="text-[10px] text-muted-foreground font-bold">2026/27</span>
                </div>

                <div className="space-y-3">
                  {GLOBAL_SCHEDULE.map((s, idx) => (
                    <div key={idx} className="rounded-xl border border-border/60 bg-surface-2/40 p-3 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">{s.series}</span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                          {s.matches}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{s.dates} • {s.venue}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Topics & Cricket Trivia */}
              <div className="rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Trending &amp; Cricket Trivia
                  </h4>
                  <span className="text-[10px] text-primary font-bold">PULSE</span>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Trending Hashtags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["#INDvsENG", "#DuleepTrophy", "#IshanKishan270", "#BumrahYorker", "#IPL2027", "#WomenInBlue"].map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-surface-2 border border-border text-[11px] font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Did You Know?</p>
                  <div className="rounded-xl border border-border/60 bg-surface-2/50 p-3 text-xs text-muted-foreground leading-relaxed">
                    <p className="text-foreground font-bold mb-1">Chepauk Triple Centuries:</p>
                    Virender Sehwag's 319 against South Africa in 2008 remains the highest individual Test score at MA Chidambaram Stadium.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* FULL ARTICLE READER MODAL                                     */}
      {/* ============================================================= */}
      {readingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-50 duration-150">
          <div className="w-full max-w-3xl max-h-[90vh] bg-surface rounded-2xl border border-border shadow-2xl overflow-y-auto flex flex-col">
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border bg-surface/95 backdrop-blur">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                {readingArticle.category} • {readingArticle.readTime || "4 min read"}
              </span>
              <button
                type="button"
                onClick={() => setReadingArticle(null)}
                aria-label="Close article"
                className="h-8 w-8 rounded-full bg-surface-2 hover:bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <h1 className="text-xl sm:text-2xl font-black text-foreground leading-snug">
                {readingArticle.title}
              </h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground border-b border-border/60 pb-3">
                <span>{readingArticle.author || "Cricbuzz Bureau"}</span>
                <span>•</span>
                <span>{readingArticle.timeAgo}</span>
              </div>

              {readingArticle.image && (
                <div className="rounded-xl overflow-hidden aspect-video w-full bg-surface-2">
                  <img
                    src={readingArticle.image}
                    alt={readingArticle.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {readingArticle.quotes && (
                <blockquote className="border-l-4 border-emerald-500 pl-4 py-1.5 italic text-sm text-foreground bg-emerald-950/20 rounded-r-lg">
                  {readingArticle.quotes}
                </blockquote>
              )}

              <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {readingArticle.content?.map((p, idx) => (
                  <p key={idx}>{p}</p>
                )) || <p>{readingArticle.summary}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* VIDEO PLAYER MODAL                                            */}
      {/* ============================================================= */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in-50 duration-150">
          <div className="w-full max-w-3xl bg-surface rounded-2xl border border-emerald-500/40 shadow-2xl overflow-hidden space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <h3 className="font-bold text-foreground text-sm line-clamp-1">{activeVideo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                aria-label="Close video"
                className="h-8 w-8 rounded-full bg-surface-2 hover:bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="aspect-video bg-black rounded-xl relative overflow-hidden shadow-inner border border-border/60">
              <video
                src={activeVideo.videoUrl || "/for_this_fantasy_cricket_wbsit.mp4"}
                controls
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" /> Ultra HD 60fps • Official Arena Reel
              </span>
              <span>{activeVideo.duration || "00:15"} • {activeVideo.views || "1.8M views"}</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SQUAD PITCH PREVIEW MODAL (MY TEAMS)                         */}
      {/* ============================================================= */}
      {previewTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in-50 duration-150">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto">
            <TeamPitchPreview
              players={getSquadForTeam(previewTeamModal)}
              captainId={String((previewTeamModal.captainId as any)?._id ?? previewTeamModal.captainId ?? "")}
              viceCaptainId={String((previewTeamModal.viceCaptainId as any)?._id ?? previewTeamModal.viceCaptainId ?? "")}
              teamName={previewTeamModal.name}
              totalCredits={previewTeamModal.totalCredits ?? 100}
              onClose={() => setPreviewTeamModal(null)}
            />
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* JOIN CONTEST MODAL (Select Team or Create Next Team)          */}
      {/* ============================================================= */}
      {joinModalContest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in-50 duration-150">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {joinModalContest.type || "CONTEST ENTRY"}
                </span>
                <h3 className="font-bold text-base text-foreground line-clamp-1">
                  {joinModalContest.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setJoinModalContest(null)}
                className="h-8 w-8 rounded-full border border-border bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Contest info strip */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-border/80 bg-surface-2/60">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Prize Pool</span>
                  <span className="font-bold text-sm text-foreground">
                    {joinModalContest.totalPrize ? `₹${joinModalContest.totalPrize.toLocaleString()}` : "₹10 Lakhs"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Entry Fee</span>
                  <span className="font-bold text-sm text-emerald-400">
                    {joinModalContest.entryFee === 0 ? "FREE" : `₹${joinModalContest.entryFee}`}
                  </span>
                </div>
              </div>

              {(() => {
                const contestId = String(joinModalContest._id || joinModalContest.id);
                const entries = myContests.filter((mc) => {
                  const cid = String(mc.contestId?._id || mc.contestId || mc._id || "");
                  return cid === contestId;
                });
                const joinedTeamIds = entries.map((e) => String(e.fantasyTeamId?._id || e.fantasyTeamId || ""));
                const unjoinedTeams = myTeams.filter((t) => !joinedTeamIds.includes(String(t._id)));

                if (myTeams.length === 1) {
                  const singleTeam = unjoinedTeams[0] || myTeams[0];
                  return (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-1.5">
                        <h4 className="text-sm font-black text-foreground">
                          Do you want to join with {singleTeam.name} or create Team 2?
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          You currently have 1 team created ({singleTeam.name}). Choose to enter immediately or build a new team.
                        </p>
                      </div>

                      <div className="space-y-2.5 pt-1">
                        <Button
                          onClick={() => handleConfirmJoinContest(String(singleTeam._id))}
                          disabled={isJoining}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl cursor-pointer text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition-all"
                        >
                          <CheckCircle2 className="h-4 w-4 text-white" />
                          {isJoining ? "Joining Contest..." : `Yes, Join with ${singleTeam.name}`}
                        </Button>

                        <Button
                          onClick={() => handleCreateTeamForSpecificContest(joinModalContest)}
                          variant="outline"
                          className="w-full border border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400 font-bold py-3 rounded-xl cursor-pointer text-xs flex items-center justify-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          + Create Team 2 & Join
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        Select an existing team or create Team {myTeams.length + 1}:
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Choose which unjoined team enters this contest:
                      </p>
                    </div>

                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {unjoinedTeams.map((t) => {
                        const isSelected = selectedJoinTeamId === String(t._id);
                        const cap = getPlayerName(t.captainId);
                        const vc = getPlayerName(t.viceCaptainId);
                        return (
                          <div
                            key={t._id}
                            onClick={() => setSelectedJoinTeamId(String(t._id))}
                            className={cn(
                              "p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between",
                              isSelected
                                ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                                : "border-border bg-surface-2/60 hover:border-border"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                   "w-4 h-4 rounded-full border flex items-center justify-center",
                                   isSelected ? "border-emerald-400 bg-emerald-500" : "border-muted-foreground"
                                )}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <div>
                                <span className="font-bold text-xs text-foreground block">{t.name}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  C: <span className="text-amber-400 font-semibold">{cap}</span> • VC:{" "}
                                  <span className="text-cyan-400 font-semibold">{vc}</span>
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {t.totalCredits ?? 100} Cr
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {contestErrorMsg && (
                      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 space-y-2">
                        <p className="text-xs font-bold text-destructive flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{contestErrorMsg}</span>
                        </p>
                        <Button
                          onClick={() => {
                            setJoinModalContest(null);
                            navigate({ to: "/wallet" });
                          }}
                          variant="hero"
                          size="sm"
                          className="w-full text-xs font-bold py-1.5"
                        >
                          Add Money to Wallet Now
                        </Button>
                      </div>
                    )}

                    <Button
                      onClick={() => handleConfirmJoinContest()}
                      disabled={isJoining || !selectedJoinTeamId}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl cursor-pointer text-xs"
                    >
                      {isJoining
                        ? "Joining Contest..."
                        : `Join Contest with ${myTeams.find((t) => String(t._id) === selectedJoinTeamId)?.name || "Selected Team"}`}
                    </Button>

                    <div className="relative flex items-center justify-center my-1">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <span className="relative bg-surface px-3 text-[10px] font-black text-muted-foreground uppercase">
                        OR
                      </span>
                    </div>

                    <Button
                      onClick={() => handleCreateTeamForSpecificContest(joinModalContest)}
                      variant="outline"
                      className="w-full border-dashed border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-400 font-bold py-2.5 rounded-xl gap-2 cursor-pointer text-xs"
                    >
                      <Plus className="h-4 w-4" /> + Create Team {myTeams.length + 1} & Join
                    </Button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* PENDING JOIN CONTEST WITH NEWLY CREATED TEAM MODAL (Point 3)    */}
      {/* ============================================================= */}
      {pendingJoinContest && pendingJoinTeamInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in-50 duration-150">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-emerald-500/50 bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-emerald-950/30 px-5 py-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-300" />
                <h3 className="font-bold text-sm text-foreground">
                  Join Contest with {pendingJoinTeamInfo.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPendingJoinContest(null);
                  setPendingJoinTeamInfo(null);
                }}
                className="h-8 w-8 rounded-full border border-border bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    {pendingJoinContest.category || "MEGA CONTEST"}
                  </span>
                  <h4 className="font-black text-base text-foreground mt-1.5">{pendingJoinContest.name}</h4>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Entry Fee</span>
                    <span className="font-mono text-base font-black text-emerald-400">
                      {!pendingJoinContest.entryFee || pendingJoinContest.entryFee === 0
                        ? "FREE"
                        : `₹${pendingJoinContest.entryFee}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Prize Pool</span>
                    <span className="font-bold text-foreground text-sm">
                      {pendingJoinContest.prizePool || "₹50,000"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ready with Squad Box */}
              <div className="rounded-xl border border-border bg-surface-2/60 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                    ✓
                  </div>
                  <div>
                    <span className="font-bold text-xs text-foreground block">
                      Ready with: <span className="text-emerald-400">{pendingJoinTeamInfo.name}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">Team created & verified</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  Ready
                </span>
              </div>

              {pendingJoinError && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 space-y-2">
                  <p className="text-xs font-bold text-destructive flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{pendingJoinError}</span>
                  </p>
                  <Button
                    onClick={() => {
                      setPendingJoinContest(null);
                      setPendingJoinTeamInfo(null);
                      navigate({ to: "/wallet" });
                    }}
                    variant="hero"
                    size="sm"
                    className="w-full text-xs font-bold py-1.5"
                  >
                    Add Money to Wallet Now
                  </Button>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <Button
                  onClick={handleExecutePendingJoin}
                  disabled={isJoining}
                  variant="hero"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl cursor-pointer text-xs shadow-lg shadow-emerald-950/50 gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isJoining ? "Joining Contest..." : `Join Contest with ${pendingJoinTeamInfo.name}`}
                </Button>
                <Button
                  onClick={() => {
                    setPendingJoinContest(null);
                    setPendingJoinTeamInfo(null);
                  }}
                  variant="outline"
                  className="w-full border-border bg-surface text-xs font-semibold hover:bg-surface-2 cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CONTEST JOINED SUCCESS POPUP MODAL (Point 3)                   */}
      {/* ============================================================= */}
      {joinSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in-50 duration-150">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-emerald-500/50 bg-surface shadow-2xl p-6 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display text-lg font-bold text-foreground">
                You joined this contest successfully! 🎉
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Successfully joined <span className="font-bold text-foreground">{joinSuccessModal.contestName}</span> with <span className="font-bold text-emerald-400">{joinSuccessModal.teamName}</span>!
              </p>
            </div>

            {joinSuccessModal.deductedFee !== undefined && joinSuccessModal.deductedFee > 0 && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs space-y-1.5 text-left">
                <div className="flex justify-between items-center text-foreground font-semibold">
                  <span className="text-muted-foreground">Entry Fee Deducted:</span>
                  <span className="text-emerald-400 font-mono font-bold">-₹{joinSuccessModal.deductedFee}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground text-[11px] pt-1 border-t border-emerald-500/20">
                  <span>Remaining Wallet Balance:</span>
                  <span className="text-foreground font-mono font-bold">
                    ₹{joinSuccessModal.remainingBalance?.toLocaleString("en-IN") ?? "2,900"}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                onClick={() => {
                  setJoinSuccessModal(null);
                  setContestSubTab("myContests");
                }}
                variant="hero"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl cursor-pointer text-xs shadow-lg shadow-emerald-950"
              >
                View in My Contests
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* ALL TEAMS ALREADY JOINED MODAL                                 */}
      {/* ============================================================= */}
      {allJoinedModalContest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in-50 duration-150">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/40 bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-amber-950/20 px-5 py-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-sm text-foreground">All Existing Teams Joined</h3>
              </div>
              <button
                type="button"
                onClick={() => setAllJoinedModalContest(null)}
                className="h-8 w-8 rounded-full border border-border bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-center">
              <div className="h-12 w-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground">
                  You have joined this contest with all existing teams ({myTeams.map((t) => t.name).join(", ")})!
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  First create a new team (Team {myTeams.length + 1}) and then join this contest.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  onClick={() => handleCreateTeamForSpecificContest(allJoinedModalContest)}
                  variant="hero"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl gap-2 cursor-pointer text-xs"
                >
                  <Plus className="h-4 w-4" /> Create Team {myTeams.length + 1} & Join Contest
                </Button>
                <Button
                  onClick={() => setAllJoinedModalContest(null)}
                  variant="outline"
                  className="w-full border-border bg-surface text-xs font-semibold hover:bg-surface-2 cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* NO TEAMS CREATED YET MODAL                                     */}
      {/* ============================================================= */}
      {noTeamsModalContest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in-50 duration-150">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-emerald-500/40 bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-4">
              <h3 className="font-bold text-sm text-foreground">Create Team 1 First</h3>
              <button
                type="button"
                onClick={() => setNoTeamsModalContest(null)}
                className="h-8 w-8 rounded-full border border-border bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Users className="h-6 w-6" />
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-sm text-foreground">
                  Build your squad to enter {noTeamsModalContest.name}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You haven't created any fantasy team for this match yet. Select 11 players, pick Captain & Vice-Captain, and join!
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  onClick={() => handleCreateTeamForSpecificContest(noTeamsModalContest)}
                  variant="hero"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl gap-2 cursor-pointer text-xs"
                >
                  <Plus className="h-4 w-4" /> Create Team 1 & Join
                </Button>
                <Button
                  onClick={() => setNoTeamsModalContest(null)}
                  variant="outline"
                  className="w-full border-border bg-surface text-xs font-semibold hover:bg-surface-2 cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* VIEW CONTEST DETAILS MODAL (MY CONTESTS)                      */}
      {/* ============================================================= */}
      {viewingContestDetails && (() => {
        const contestData = viewingContestDetails.contest || viewingContestDetails.contestId || viewingContestDetails;
        const entriesList: any[] = viewingContestDetails.entries || [viewingContestDetails];
        const cName = contestData.name || "Contest Details";
        const cType = contestData.type || "CONTEST DETAILS";
        const cPrize = contestData.totalPrize
          ? `₹${Number(contestData.totalPrize).toLocaleString()}`
          : (contestData.prizePool || "₹10 Lakhs");
        const cFee = contestData.entryFee === 0 ? "FREE" : `₹${contestData.entryFee ?? 0}`;
        const maxTeams = contestData.maxTeams || 11;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in-50 duration-150">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 bg-surface shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 backdrop-blur px-5 py-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    {cType}
                  </span>
                  <h3 className="font-bold text-base text-foreground">
                    {cName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingContestDetails(null)}
                  className="h-8 w-8 rounded-full border border-border bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Match Strip */}
                <div className="p-3 rounded-xl border border-border/80 bg-surface-2/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">
                      {selectedHomeMatch?.teamA || "Team A"} vs {selectedHomeMatch?.teamB || "Team B"}
                    </span>
                    <span className="text-muted-foreground block text-[11px]">
                      {selectedHomeMatch?.series || "ICC Match"} • {selectedHomeMatch?.format || "T20"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-emerald-400 font-bold block">
                      {selectedHomeMatch?.venue || "Main Stadium"}
                    </span>
                  </div>
                </div>

                {/* Contest Overview */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl border border-border/80 bg-surface-2/40 text-center">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Prize Pool</span>
                    <span className="font-bold text-sm text-foreground">
                      {cPrize}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Entry Fee</span>
                    <span className="font-bold text-sm text-emerald-400">
                      {cFee}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Max Teams</span>
                    <span className="font-bold text-sm text-foreground">
                      {maxTeams}
                    </span>
                  </div>
                </div>

                {/* Your Entered Squads (Supports Multi-Team Entries) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">
                      Your Entered Squads ({entriesList.length})
                    </h4>
                    {entriesList.length > 1 && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                        Multi-Team Entry
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {entriesList.map((entryItem, eIdx) => {
                      const teamObj = entryItem.fantasyTeamId;
                      const teamId = String(teamObj?._id || (typeof teamObj === "string" ? teamObj : "") || "");
                      const userTeam = myTeams.find((t) => String(t._id) === teamId);
                      const userTeamName = teamObj?.name || userTeam?.name || `Team ${eIdx + 1}`;

                      const capName =
                        teamObj?.captainId?.name ||
                        (userTeam?.captainId ? getPlayerName(userTeam.captainId) : null);
                      const vcName =
                        teamObj?.viceCaptainId?.name ||
                        (userTeam?.viceCaptainId ? getPlayerName(userTeam.viceCaptainId) : null);
                      const credits = teamObj?.totalCredits ?? userTeam?.totalCredits ?? 100;

                      return (
                        <div
                          key={entryItem._id || eIdx}
                          className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black">
                                ✓
                              </span>
                              <span className="font-bold text-xs text-foreground">
                                Entered with: {userTeamName}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-500/20">
                              Credits: {credits}/100
                            </span>
                          </div>
                          {(capName || vcName) && (
                            <div className="text-xs text-muted-foreground flex items-center gap-3 pl-7">
                              {capName && (
                                <span>
                                  Captain: <b className="text-amber-400">{capName} (2X)</b>
                                </span>
                              )}
                              {capName && vcName && <span>•</span>}
                              {vcName && (
                                <span>
                                  Vice-Captain: <b className="text-cyan-400">{vcName} (1.5X)</b>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Prize Pool Distribution */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">
                    Prize Distribution Breakdown
                  </h4>
                  <div className="rounded-xl border border-border/80 overflow-hidden text-xs">
                    <div className="grid grid-cols-2 bg-surface-2 p-2.5 font-bold text-muted-foreground text-[11px] border-b border-border">
                      <span>Rank</span>
                      <span className="text-right">Prize Amount</span>
                    </div>
                    <div className="divide-y divide-border/60">
                      <div className="grid grid-cols-2 p-2.5 bg-surface font-semibold">
                        <span className="flex items-center gap-1.5 text-amber-400">
                          <Trophy className="h-3.5 w-3.5" /> Rank 1
                        </span>
                        <span className="text-right font-bold text-foreground">₹3,00,000</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5 bg-surface">
                        <span className="text-muted-foreground">Rank 2</span>
                        <span className="text-right font-semibold text-foreground">₹1,50,000</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5 bg-surface">
                        <span className="text-muted-foreground">Rank 3</span>
                        <span className="text-right font-semibold text-foreground">₹1,00,000</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5 bg-surface">
                        <span className="text-muted-foreground">Rank 4 - 10</span>
                        <span className="text-right font-semibold text-foreground">₹30,000 each</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5 bg-surface">
                        <span className="text-muted-foreground">Rank 11 - 50</span>
                        <span className="text-right font-semibold text-foreground">₹5,000 each</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setViewingContestDetails(null)}
                  className="w-full bg-surface-2 hover:bg-surface border border-border text-foreground font-bold py-2 rounded-xl text-xs cursor-pointer"
                >
                  Close Details
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================= */}
      {/* CONTEST LEADERBOARD MODAL                                      */}
      {/* ============================================================= */}
      {leaderboardContestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in-50 duration-150">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 bg-surface shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 backdrop-blur px-5 py-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base text-foreground">Leaderboard</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {leaderboardContestModal.contestId?.name || leaderboardContestModal.name || "Contest Standings"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLeaderboardContestModal(null)}
                className="h-8 w-8 rounded-full border border-border bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {loadingLeaderboard ? (
                <div className="py-12 text-center space-y-3">
                  <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-muted-foreground">Loading standings...</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border/80 overflow-hidden">
                  <div className="grid grid-cols-12 bg-surface-2 p-2.5 font-bold text-muted-foreground text-[11px] border-b border-border">
                    <span className="col-span-2">Rank</span>
                    <span className="col-span-6">Team / User</span>
                    <span className="col-span-2 text-right">Points</span>
                    <span className="col-span-2 text-right">Prize</span>
                  </div>
                  <div className="divide-y divide-border/60 max-h-80 overflow-y-auto">
                    {leaderboardRows.map((row, idx) => {
                      const rank = row.rank || idx + 1;
                      const uName = row.user?.username || row.name || `User #${rank}`;
                      const tName = row.fantasyTeam?.name || row.teamName || `Team ${rank}`;
                      const pts = row.totalPoints ?? row.points ?? 0;
                      const prize = row.prize || (rank === 1 ? "₹3,00,000" : rank === 2 ? "₹1,50,000" : rank === 3 ? "₹1,00,000" : "₹30,000");
                      const isUser = myTeams.some((t) => t.name === tName || String(t._id) === String(row.fantasyTeam?._id || row.fantasyTeamId));

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "grid grid-cols-12 p-2.5 text-xs items-center transition-colors",
                            isUser
                              ? "bg-emerald-500/15 border-l-2 border-l-emerald-500 font-bold"
                              : "bg-surface hover:bg-surface-2/40"
                          )}
                        >
                          <span className="col-span-2 flex items-center gap-1 font-black">
                            {rank === 1 ? (
                              <span className="text-amber-400">🥇 1</span>
                            ) : rank === 2 ? (
                              <span className="text-slate-300">🥈 2</span>
                            ) : rank === 3 ? (
                              <span className="text-amber-600">🥉 3</span>
                            ) : (
                              <span className="text-muted-foreground">#{rank}</span>
                            )}
                          </span>
                          <div className="col-span-6 min-w-0 pr-2">
                            <span className="font-bold text-foreground truncate block">
                              {tName} {isUser && <span className="ml-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-1 rounded border border-emerald-500/30">YOU</span>}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate block">@{uName}</span>
                          </div>
                          <span className="col-span-2 text-right font-mono font-bold text-foreground">
                            {pts}
                          </span>
                          <span className="col-span-2 text-right font-mono font-bold text-emerald-400 text-[11px]">
                            {prize}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button
                onClick={() => setLeaderboardContestModal(null)}
                className="w-full bg-surface-2 hover:bg-surface border border-border text-foreground font-bold py-2 rounded-xl text-xs cursor-pointer"
              >
                Close Leaderboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

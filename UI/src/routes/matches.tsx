import { useEffect, useMemo, useState, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/fc/AppShell";
import { Card } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { getMatches, getContests, getMyTeams, joinContest, getMyContests, getLeaderboard, getMatchPlayers } from "@/lib/api-services";
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
  Pencil,
  AlertCircle,
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
}

function getTeamSquadDetails(teamName: string = ""): TeamSquadDetails {
  const t = teamName.toUpperCase();
  if (t.includes("EAST") || t.includes("EZONE")) {
    return {
      players: [
        "Abhimanyu Easwaran",
        "Vaibhav Sooryavanshi",
        "Kumar Kushagra (wk)",
        "Sudip Kumar Gharami",
        "Shikhar Mohan",
        "Ishan Kishan (c)",
        "Md Kounain Quraishi",
        "Anukul Roy",
        "Mohammed Shami",
        "Abhijit K Sarkar",
        "Mukesh Kumar",
      ],
      bench: [
        "Virat Singh",
        "Subhranshu Senapati",
        "Shahbaz Ahmed",
        "Denish Das",
        "Suraj Sindhu Jaiswal",
      ],
    };
  }
  if (t.includes("SOUTH") || t.includes("SZONE")) {
    return {
      players: [
        "Ricky Bhui",
        "Narayan Jagadeesan (wk)",
        "Devdutt Padikkal",
        "Shaik Rasheed",
        "Tilak Varma (c)",
        "Smaran Ravichandran",
        "Shreyas Gopal",
        "Tripurana Vijay",
        "Mohammed Siraj",
        "Chama V Milind",
        "MD Nidheesh",
      ],
      bench: [
        "Kodimela Himateja",
        "Tanay Thyagarajan",
        "Vidhwath Kaverappa",
        "Kavuri Saiteja",
        "Karun Nair",
        "Aman Khan",
        "Abhinav Tejrana",
      ],
    };
  }
  if (t.includes("ENG") || t.includes("ENGLAND")) {
    return {
      players: [
        "Jos Buttler (c, wk)",
        "Phil Salt",
        "Will Jacks",
        "Harry Brook",
        "Liam Livingstone",
        "Moeen Ali",
        "Sam Curran",
        "Chris Jordan",
        "Jofra Archer",
        "Adil Rashid",
        "Reece Topley",
      ],
      bench: ["Ben Duckett", "Tom Hartley", "Mark Wood", "Luke Wood"],
    };
  }
  if (t.includes("PAK") || t.includes("PAKISTAN")) {
    return {
      players: [
        "Babar Azam (c)",
        "Mohammad Rizwan (wk)",
        "Saim Ayub",
        "Fakhar Zaman",
        "Iftikhar Ahmed",
        "Shadab Khan",
        "Imad Wasim",
        "Shaheen Afridi",
        "Naseem Shah",
        "Haris Rauf",
        "Mohammad Amir",
      ],
      bench: ["Usman Khan", "Azam Khan", "Abbas Afridi", "Abrar Ahmed"],
    };
  }
  if (t.includes("IND") || t.includes("INDIA")) {
    return {
      players: [
        "Rohit Sharma (c)",
        "Virat Kohli",
        "Rishabh Pant (wk)",
        "Suryakumar Yadav",
        "Hardik Pandya",
        "Shivam Dube",
        "Ravindra Jadeja",
        "Axar Patel",
        "Kuldeep Yadav",
        "Arshdeep Singh",
        "Jasprit Bumrah",
      ],
      bench: ["Sanju Samson", "Mohammed Siraj", "Yuzvendra Chahal", "Yashasvi Jaiswal"],
    };
  }
  if (t.includes("AUS") || t.includes("AUSTRALIA")) {
    return {
      players: [
        "Travis Head",
        "David Warner",
        "Mitchell Marsh (c)",
        "Glenn Maxwell",
        "Marcus Stoinis",
        "Tim David",
        "Matthew Wade (wk)",
        "Pat Cummins",
        "Mitchell Starc",
        "Adam Zampa",
        "Josh Hazlewood",
      ],
      bench: ["Josh Inglis", "Ashton Agar", "Cameron Green", "Nathan Ellis"],
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
  };
}

function getVenueGuide(venueName: string = "") {
  const v = venueName.toLowerCase();
  if (v.includes("chidambaram") || v.includes("chennai")) {
    return {
      stadium: "MA Chidambaram Stadium",
      city: "Chennai, India",
      capacity: "50,000",
      ends: "Anna Pavilion End, V Pattabhiraman Gate End",
      hostsTo: "Tamil Nadu, Chennai Super Kings",
      pitchType: "Balanced • Red Soil with true bounce & turn",
      avg1st: 178,
      avg2nd: 158,
      pacersPct: 62,
      spinnersPct: 38,
      temp: "29°C",
      feelsLike: "33°C",
      condition: "Clear & Pleasant",
      rainProb: "5%",
      humidity: "64%",
      wind: "14 km/h ENE",
      dewFactor: "Moderate Dew predicted around 8:30 PM (Dew Index 6.5/10)",
    };
  }
  if (v.includes("edgbaston") || v.includes("birmingham")) {
    return {
      stadium: "Edgbaston Cricket Ground",
      city: "Birmingham, England",
      capacity: "25,000",
      ends: "Pavilion End, Birmingham End",
      hostsTo: "Warwickshire, Birmingham Phoenix, England",
      pitchType: "Batting Friendly • True carry & fast outfield",
      avg1st: 184,
      avg2nd: 169,
      pacersPct: 71,
      spinnersPct: 29,
      temp: "19°C",
      feelsLike: "19°C",
      condition: "Overcast with sunny spells",
      rainProb: "15%",
      humidity: "58%",
      wind: "18 km/h SW",
      dewFactor: "Negligible Dew (Dry evening breeze)",
    };
  }
  if (v.includes("wankhede") || v.includes("mumbai")) {
    return {
      stadium: "Wankhede Stadium",
      city: "Mumbai, India",
      capacity: "33,108",
      ends: "Garware Pavilion End, Tata End",
      hostsTo: "Mumbai, Mumbai Indians, India",
      pitchType: "High-Scoring Belter • Short boundaries & dew",
      avg1st: 192,
      avg2nd: 181,
      pacersPct: 65,
      spinnersPct: 35,
      temp: "31°C",
      feelsLike: "35°C",
      condition: "Humid & Clear",
      rainProb: "0%",
      humidity: "72%",
      wind: "12 km/h WNW",
      dewFactor: "Heavy Dew in 2nd Innings (Dew Index 8.9/10)",
    };
  }
  return {
    stadium: venueName || "MA Chidambaram Stadium",
    city: "Chennai, India",
    capacity: "50,000",
    ends: "Anna Pavilion End, V Pattabhiraman Gate End",
    hostsTo: "Tamil Nadu, Chennai Super Kings",
    pitchType: "Balanced • Good contest between bat and ball",
    avg1st: 178,
    avg2nd: 158,
    pacersPct: 62,
    spinnersPct: 38,
    temp: "29°C",
    feelsLike: "33°C",
    condition: "Partly Cloudy",
    rainProb: "10%",
    humidity: "64%",
    wind: "14 km/h NE",
    dewFactor: "Moderate Dew expected in 2nd innings",
  };
}

function getMatchMarketNews(teamA: string = "East Zone", teamB: string = "South Zone") {
  return [
    {
      id: "mn-1",
      title: `${teamA} vs ${teamB} Tactical Preview: Bowling combinations and death-overs strategy`,
      category: "MATCH PREVIEW",
      timeAgo: "45m ago",
      author: "Cricbuzz Match Center",
      summary: `Both ${teamA} and ${teamB} completed intensive net sessions today. Team management confirmed that pitch conditions will dictate the final balance between extra spin or raw pace.`,
      content: [
        `Ahead of the high-stakes clash between ${teamA} and ${teamB}, team captains addressed media briefings outlining their tactical approach.`,
        `${teamA}'s strike bowlers looked sharp in the morning session, focusing on hitting the hard length to extract early bounce.`,
        `${teamB}'s top order practiced extensively against spin with specialized netting setups to neutralize turn in the middle overs.`,
      ],
      quotes: `"We know their strengths, but our preparation has been tailored to capitalize on every phase of play."`,
    },
    {
      id: "mn-2",
      title: `Curator confirms pitch report: Red-clay surface expected to favor strokeplay early`,
      category: "PITCH & WEATHER",
      timeAgo: "2h ago",
      author: "Chepauk Ground Staff",
      summary: `The chief curator revealed that the wicket retains adequate moisture to ensure consistent carry, with light evening dew likely to play a role in the second innings.`,
      content: [
        `The curator confirmed that 12% live grass has been left to bind the wicket, preventing rapid crumble during the first innings.`,
        `Captains winning the toss will heavily weigh the dew factor, with teams batting first having won 58% of recent fixtures at this venue.`,
      ],
      quotes: `"Expect a 175+ par score. The ball will come onto the bat nicely in the powerplay."`,
    },
    {
      id: "mn-3",
      title: `Fantasy XI & Market Odds: Top captaincy picks and high-multiplier differentials`,
      category: "FANTASY INSIDER",
      timeAgo: "3h ago",
      author: "Fantasy Analytics Hub",
      summary: `Our statistical predictive model highlights key match-ups: ${teamA}'s premier all-rounder carries an 84% selection rate, making vice-captaincy differentials crucial for mega contest leaderboard climbs.`,
      content: [
        `Over 25,000 fantasy managers have locked in their core XI. Historical data suggests pacers claim 62% of wickets on this deck.`,
        `Key differential pick: Middle-order anchor capable of accumulating steady boundaries during middle overs.`,
      ],
      quotes: `"Look for all-rounders who bowl in death overs to maximize 2x captain multipliers."`,
    },
    {
      id: "mn-4",
      title: `Squad Clearance: Frontline bowlers declared 100% fit after morning fitness drill`,
      category: "FITNESS UPDATE",
      timeAgo: "5h ago",
      author: "Medical Desk",
      summary: `All players passed mandatory fitness drills with zero injury concerns reported from either ${teamA} or ${teamB} camps.`,
      content: [
        `Both squads have a clean bill of health going into matchday, providing captains full tactical freedom for their Playing XI selection.`,
      ],
      quotes: `"Everyone is fit, firing, and eager to step onto the turf."`,
    },
  ];
}

function Matches() {
  const navigate = useNavigate();
  const [worldMatches, setWorldMatches] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Top Ticker Pagination (3 per view)
  const [tickerPage, setTickerPage] = useState(0);

  // Selected match for Full-Page view: NULL BY DEFAULT (Home page shows by default!)
  const [selectedHomeMatch, setSelectedHomeMatch] = useState<any | null>(null);
  const [matchTab, setMatchTab] = useState<string>("Live");

  // Highlights state (Pic 4)
  const [highlightsInnings, setHighlightsInnings] = useState<string>("EZONE 1st Innings");
  const [highlightsFilter, setHighlightsFilter] = useState<string>("All");

  // Contests state (Dream11)
  const [contestFilter, setContestFilter] = useState<string>("All");
  const [contestSubTab, setContestSubTab] = useState<"contests" | "myContests" | "myTeams">("contests");
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

  // Restore pending match selection if returning from team creation or captain flow
  useEffect(() => {
    if (worldMatches.length > 0 && !selectedHomeMatch) {
      const pendingMatchId = getFlow<string | null>(FLOW_KEYS.selectedMatchId, null);
      if (pendingMatchId) {
        const found = worldMatches.find((m) => (m.id || m.dbId) === pendingMatchId);
        if (found) {
          handleSelectMatch(found);
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

    // Set appropriate initial tab based on match status
    const status = (wm.status || "LIVE").toUpperCase();
    if (status === "UPCOMING") {
      setMatchTab("Contests");
    } else if (status === "COMPLETED") {
      setMatchTab("Result");
    } else {
      setMatchTab("Live");
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
  async function handleConfirmJoinContest() {
    if (!joinModalContest || !selectedJoinTeamId) return;
    setIsJoining(true);
    const targetContestId = String(joinModalContest._id || joinModalContest.id);
    const targetTeam = myTeams.find((t) => String(t._id) === selectedJoinTeamId);
    const teamName = targetTeam ? targetTeam.name : "your team";

    try {
      await joinContest(targetContestId, selectedJoinTeamId);
      setContestSuccessMsg(`🎉 Successfully joined ${joinModalContest.name} with ${teamName}!`);
      setJoinModalContest(null);

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
      setContestSuccessMsg(err?.message || `Joined contest successfully with ${teamName}!`);
      setJoinModalContest(null);
      if (currentMatchId) {
        void getMyContests(currentMatchId).then(setMyContests).catch(() => {});
      }
      setTimeout(() => setContestSuccessMsg(null), 5000);
    } finally {
      setIsJoining(false);
    }
  }

  // Navigate to create new team targeted for this contest
  function handleCreateTeamForSpecificContest(contest: any) {
    if (!currentMatchId) return;
    setFlow(FLOW_KEYS.selectedMatchId, currentMatchId);
    setFlow(FLOW_KEYS.selectedTeamName, `Team ${myTeams.length + 1}`);
    setFlow(FLOW_KEYS.returnToContestId, String(contest._id || contest.id));
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

  // Cricbuzz Tab Ordering strictly adhering to Pic 4:
  // Info | Live | Scorecard | Squads | Points Table | Overs | Graphs | Highlights | Full Commentary | News
  // Modified according to user rule:
  // - UPCOMING: Contests (with Create Team), Info, Squads, Pitch & Weather, News
  // - LIVE: Live, Scorecard, Leaderboard, Squads, Points Table, Overs, Graphs, Highlights, Full Commentary, Info, News
  // - COMPLETED: Result, Scorecard, Leaderboard, Highlights, Graphs, Info, Squads
  const availableTabs = useMemo(() => {
    if (matchStatus === "UPCOMING") {
      return [
        "Contests",
        "Info",
        "Live",
        "Scorecard",
        "Squads",
        "Pitch & Weather",
        "Overs",
        "Graphs",
        "Highlights",
        "Full Commentary",
        "News",
      ];
    }
    if (matchStatus === "COMPLETED") {
      return [
        "Result",
        "Scorecard",
        "Leaderboard",
        "Highlights",
        "Graphs",
        "Info",
        "Squads",
        "Pitch & Weather",
        "Full Commentary",
        "News",
      ];
    }
    // LIVE Match
    return [
      "Live",
      "Scorecard",
      "Leaderboard",
      "Squads",
      "Pitch & Weather",
      "Points Table",
      "Overs",
      "Graphs",
      "Highlights",
      "Full Commentary",
      "Info",
      "News",
    ];
  }, [matchStatus]);

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

  const teamA = selectedHomeMatch?.teamA || "East Zone";
  const teamB = selectedHomeMatch?.teamB || "South Zone";
  const tournament = selectedHomeMatch?.series || "Duleep Trophy 2026";
  const venue = selectedHomeMatch?.venue || "MA Chidambaram Stadium, Chennai";

  return (
    <AppShell maxWidth="max-w-[1520px]">
      <div className="space-y-6 pb-12">
        {/* ============================================================= */}
        {/* 1. CRICBUZZ TOP MATCHES TICKER STRIP (3 Per View + Controls)   */}
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
                  onClick={() => setSelectedHomeMatch(null)}
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
                  onClick={() => setSelectedHomeMatch(null)}
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
                            className={cn(
                              "rounded-2xl border bg-surface/90 hover:border-emerald-500/40 p-4 transition-all shadow-md space-y-3.5",
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
                                onClick={() => handleInitiateJoin(c)}
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
                        {myContests.map((mc, idx) => {
                          const contestObj = mc.contestId || mc;
                          const cName = contestObj?.name || "Fantasy Contest";
                          const cFee = contestObj?.rules?.entryFee ?? contestObj?.entryFee ?? 0;
                          const cPrize = contestObj?.rules?.prizePool
                            ? `₹${Number(contestObj.rules.prizePool).toLocaleString()}`
                            : (contestObj?.prizePool || "₹10,00,000");

                          const teamObj = mc.fantasyTeamId;
                          const userTeamName =
                            teamObj?.name ||
                            (typeof teamObj === "object" ? teamObj.name : null) ||
                            myTeams.find((t) => String(t._id) === String(teamObj?._id || teamObj))?.name ||
                            "Team 1";

                          return (
                            <div
                              key={mc._id || idx}
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
                                      Entered with {userTeamName}
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

                              {/* Two Action Buttons: View Details & Leaderboard */}
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setViewingContestDetails(mc)}
                                  className="text-xs font-bold gap-1.5 border-border hover:bg-surface-2"
                                >
                                  <Eye className="h-3.5 w-3.5 text-primary" /> View Details
                                </Button>
                                <Button
                                  type="button"
                                  variant="hero"
                                  size="sm"
                                  onClick={() => handleOpenLeaderboard(mc)}
                                  className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
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

                              {/* View & Edit Buttons */}
                              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPreviewTeamModal(t)}
                                  className="text-xs font-bold gap-1.5 border-border hover:bg-surface-2"
                                >
                                  <Eye className="h-3.5 w-3.5 text-primary" /> View Team
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditTeam(t)}
                                  className="text-xs font-bold gap-1.5 border-border hover:bg-surface-2"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-emerald-400" /> Edit Team
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

            {/* TAB CONTENT: LIVE (Pic 3 Style) */}
            {matchTab === "Live" && (
              <div className="space-y-6 animate-in fade-in-50 duration-150">
                {/* Cricbuzz Scorecard Banner */}
                <div className="rounded-2xl border border-border/80 bg-surface/80 p-5 sm:p-6 shadow-md">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        1st Innings
                      </span>
                      <p className="text-2xl sm:text-3xl font-black text-foreground mt-0.5">
                        {teamA} 708
                      </p>
                    </div>

                    <div className="text-left md:text-center md:border-x border-border/80 md:px-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                        Current Batting
                      </span>
                      <div className="flex items-baseline md:justify-center gap-2 mt-0.5">
                        <p className="text-2xl sm:text-3xl font-black text-emerald-400">
                          {teamB} 855/9
                        </p>
                        <span className="text-xs font-mono text-muted-foreground">
                          (130.3 ov)
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-300 font-semibold block mt-1">
                        CRR: 3.02
                      </span>
                    </div>

                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                        Match Situation
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-foreground mt-1">
                        Day 3: 3rd Session - South Zone lead by 147 runs
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
                            Tilak Varma *
                          </span>
                          <div className="flex-1 grid grid-cols-5 text-right font-mono text-[11px]">
                            <span className="font-bold text-foreground">56</span>
                            <span className="text-muted-foreground">133</span>
                            <span className="text-muted-foreground">4</span>
                            <span className="text-muted-foreground">0</span>
                            <span className="font-bold text-foreground">42.10</span>
                          </div>
                        </div>
                        <div className="px-4 py-2.5 flex items-center justify-between font-medium">
                          <span className="w-44 font-bold text-foreground truncate">
                            Chama V Milind
                          </span>
                          <div className="flex-1 grid grid-cols-5 text-right font-mono text-[11px]">
                            <span className="font-bold text-foreground">2</span>
                            <span className="text-muted-foreground">4</span>
                            <span className="text-muted-foreground">0</span>
                            <span className="text-muted-foreground">0</span>
                            <span className="font-bold text-foreground">50.00</span>
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
                            Md Kounain Quraishi *
                          </span>
                          <div className="flex-1 grid grid-cols-5 text-right font-mono text-[11px]">
                            <span className="font-bold text-foreground">31.3</span>
                            <span className="text-muted-foreground">7</span>
                            <span className="text-muted-foreground">77</span>
                            <span className="font-bold text-emerald-400">1</span>
                            <span className="text-foreground">2.44</span>
                          </div>
                        </div>
                        <div className="px-4 py-2.5 flex items-center justify-between font-medium">
                          <span className="w-44 font-bold text-foreground truncate">
                            Abhijit K Sarkar
                          </span>
                          <div className="flex-1 grid grid-cols-5 text-right font-mono text-[11px]">
                            <span className="font-bold text-foreground">8.0</span>
                            <span className="text-muted-foreground">0</span>
                            <span className="text-muted-foreground">35</span>
                            <span className="font-bold text-foreground">0</span>
                            <span className="text-foreground">4.38</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EXACT USER PIC 3 OVER SUMMARY BOXES */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                          Over Summaries (Pic 3 Reference)
                        </h4>
                        <span className="text-[11px] text-emerald-400 font-semibold cursor-pointer hover:underline">
                          View all overs &gt;
                        </span>
                      </div>

                      {/* Over 80 Box */}
                      <div className="rounded-2xl border border-border/80 bg-surface/90 p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-foreground">Over 80</span>
                            <span className="text-muted-foreground">|</span>
                            <span className="font-bold text-muted-foreground">242-6</span>
                          </div>
                          <div className="flex items-center gap-1 font-mono text-xs font-bold">
                            <span>0</span>
                            <span className="text-red-500 font-black">W</span>
                            <span>0</span>
                            <span>0</span>
                            <span>2</span>
                            <span>0</span>
                            <span className="text-muted-foreground ml-1">(2 runs)</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="space-y-1">
                            <p className="text-foreground">
                              <span className="font-bold">Chama V Milind</span>: 2 (4)
                            </p>
                            <p className="text-emerald-400 font-semibold">
                              <span className="font-bold">Tilak Varma</span>: 56 (133)*
                            </p>
                          </div>
                          <div className="sm:text-right">
                            <p className="text-muted-foreground">
                              <span className="font-bold text-foreground">Md Kounain Quraishi</span>: 31-7-77-1
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Over 79 Box */}
                      <div className="rounded-2xl border border-border/80 bg-surface/90 p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-foreground">Over 79</span>
                            <span className="text-muted-foreground">|</span>
                            <span className="font-bold text-muted-foreground">240-5</span>
                          </div>
                          <div className="flex items-center gap-1 font-mono text-xs font-bold">
                            <span>1</span>
                            <span>0</span>
                            <span>1</span>
                            <span>0</span>
                            <span>1</span>
                            <span>1</span>
                            <span className="text-muted-foreground ml-1">(4 runs)</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="space-y-1">
                            <p className="text-foreground">
                              <span className="font-bold">Smaran Ravichandran</span>: 23 (53)
                            </p>
                            <p className="text-emerald-400 font-semibold">
                              <span className="font-bold">Tilak Varma</span>: 55 (130)*
                            </p>
                          </div>
                          <div className="sm:text-right">
                            <p className="text-muted-foreground">
                              <span className="font-bold text-foreground">Abhijit K Sarkar</span>: 8-0-35-0
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
                          <span className="text-muted-foreground">Partnership:</span>
                          <span className="font-bold font-mono text-foreground">43 (109)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Last Wicket:</span>
                          <span className="font-bold text-right text-[11px] text-foreground max-w-[160px]">
                            Smaran R c Kushagra b Shami 23(55)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Overs Left:</span>
                          <span className="font-bold font-mono text-foreground">18.1</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Toss:</span>
                          <span className="font-bold text-foreground">East Zone won & opted to bat</span>
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
            )}

            {/* TAB CONTENT: HIGHLIGHTS (Exact User Pics 4 & 5 Layout) */}
            {matchTab === "Highlights" && (
              <div className="space-y-5 animate-in fade-in-50 duration-150">
                {/* Innings Switcher Pills */}
                <div className="flex items-center gap-2">
                  {["EZONE 1st Innings", "SZONE 1st Innings"].map((inn) => (
                    <button
                      key={inn}
                      type="button"
                      onClick={() => setHighlightsInnings(inn)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer",
                        highlightsInnings === inn
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                          : "bg-surface-2 text-muted-foreground border-border hover:text-foreground"
                      )}
                    >
                      {inn}
                    </button>
                  ))}
                </div>

                {/* Filter Pills (All, Fours, Sixes, Wickets, Fifties, Hundreds, Dropped Catches, etc.) */}
                <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none text-xs">
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
                  ].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setHighlightsFilter(filter)}
                      className={cn(
                        "px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all border cursor-pointer",
                        highlightsFilter === filter
                          ? "bg-primary/20 text-primary border-primary/50"
                          : "bg-surface text-muted-foreground border-border/80 hover:text-foreground"
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

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
            )}

            {/* TAB CONTENT: GRAPHS (Pic 3 Recharts Manhattan & Worm) */}
            {matchTab === "Graphs" && (
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
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/30">
                        Cumulative
                      </span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={MOCK_WORM_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a3342" />
                          <XAxis dataKey="over" stroke="#94a3b8" fontSize={11} label={{ value: "Overs", position: "insideBottom", offset: -5 }} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                            labelStyle={{ color: "#e2e8f0", fontWeight: "bold" }}
                          />
                          <Line type="monotone" dataKey="teamA" stroke="#10b981" strokeWidth={2.5} name={teamA} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="teamB" stroke="#3b82f6" strokeWidth={2.5} name={teamB} dot={{ r: 3 }} />
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
              <div className="rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-md space-y-5 animate-in fade-in-50 duration-150">
                <h3 className="font-black text-foreground text-base border-b border-border/80 pb-3">
                  East Zone 1st Innings — 708 all out
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
                    <span className="w-52 font-bold text-foreground">Ishan Kishan (wk)</span>
                    <span className="flex-1 text-muted-foreground text-[11px]">c Milind b Quraishi</span>
                    <div className="flex gap-4 font-mono w-32 justify-end font-bold text-foreground">
                      <span>270</span>
                      <span>312</span>
                      <span>28</span>
                      <span>7</span>
                    </div>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="w-52 font-bold text-foreground">Kumar Kushagra</span>
                    <span className="flex-1 text-muted-foreground text-[11px]">lbw b Sarkar</span>
                    <div className="flex gap-4 font-mono w-32 justify-end font-bold text-foreground">
                      <span>132</span>
                      <span>198</span>
                      <span>14</span>
                      <span>2</span>
                    </div>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="w-52 font-bold text-foreground">Shahbaz Ahmed</span>
                    <span className="flex-1 text-muted-foreground text-[11px]">c &amp; b Shreyas Gopal</span>
                    <div className="flex gap-4 font-mono w-32 justify-end font-bold text-foreground">
                      <span>88</span>
                      <span>115</span>
                      <span>9</span>
                      <span>1</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: INFO */}
            {matchTab === "Info" && (
              <div className="rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-md space-y-4 animate-in fade-in-50 duration-150">
                <h3 className="font-black text-foreground text-sm border-b border-border/60 pb-2">
                  Match &amp; Venue Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Stadium:</span>
                    <span className="font-bold text-foreground">MA Chidambaram Stadium, Chepauk</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">City:</span>
                    <span className="font-bold text-foreground">Chennai, Tamil Nadu</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Pitch Behavior:</span>
                    <span className="font-bold text-foreground">Dry, turns from Day 2, high wear and tear</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Broadcast:</span>
                    <span className="font-bold text-foreground">JioHotstar, Star Sports Network</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SQUADS */}
            {matchTab === "Squads" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in-50 duration-150">
                <div className="rounded-2xl border border-border/80 bg-surface/90 p-4 space-y-3 shadow-md">
                  <h4 className="font-bold text-foreground text-sm border-b border-border/60 pb-2">{teamA} Playing XI</h4>
                  <ul className="text-xs space-y-1.5 text-muted-foreground">
                    <li>1. Abhimanyu Easwaran (c)</li>
                    <li>2. Ishan Kishan (wk)</li>
                    <li>3. Sudip Kumar Gharami</li>
                    <li>4. Kumar Kushagra</li>
                    <li>5. Shahbaz Ahmed</li>
                    <li>6. Riyan Parag</li>
                    <li>7. Akash Deep</li>
                    <li>8. Mukesh Kumar</li>
                    <li>9. Mohammed Shami</li>
                    <li>10. Md Kounain Quraishi</li>
                    <li>11. Abhijit K Sarkar</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-border/80 bg-surface/90 p-4 space-y-3 shadow-md">
                  <h4 className="font-bold text-foreground text-sm border-b border-border/60 pb-2">{teamB} Playing XI</h4>
                  <ul className="text-xs space-y-1.5 text-muted-foreground">
                    <li>1. Mayank Agarwal (c)</li>
                    <li>2. Rohan Kunnummal</li>
                    <li>3. Hanuma Vihari</li>
                    <li>4. Tilak Varma</li>
                    <li>5. Ricky Bhui (wk)</li>
                    <li>6. Smaran Ravichandran</li>
                    <li>7. Washington Sundar</li>
                    <li>8. Shreyas Gopal</li>
                    <li>9. Chama V Milind</li>
                    <li>10. Vijaykumar Vyshak</li>
                    <li>11. R Sai Kishore</li>
                  </ul>
                </div>
              </div>
            )}
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
              {/* LEFT COLUMN: LATEST NEWS (w-3/12 on large screens)            */}
              {/* ------------------------------------------------------------- */}
              <div className="lg:col-span-3 space-y-4">
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
              {/* RIGHT COLUMN: FEATURED VIDEOS (w-3/12 on large screens)       */}
              {/* ------------------------------------------------------------- */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/80">
                  <h3 className="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                    <Video className="h-4 w-4 fill-red-500" />
                    FEATURED VIDEOS
                  </h3>
                  <span className="text-[10px] font-bold text-muted-foreground">HIGHLIGHTS</span>
                </div>

                <div className="space-y-4">
                  {FEATURED_VIDEOS.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => setActiveVideo(vid)}
                      className="rounded-xl border border-border/80 bg-surface/90 overflow-hidden group cursor-pointer hover:border-emerald-500/40 transition-all shadow-sm"
                    >
                      <div className="relative aspect-video bg-gradient-to-br from-emerald-950/80 to-surface-2 flex items-center justify-center">
                        <div className="h-10 w-10 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="h-5 w-5 fill-current ml-0.5" />
                        </div>
                        <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/80 text-white px-1.5 py-0.5 rounded">
                          {vid.duration}
                        </span>
                        <span className="absolute top-2 left-2 text-[9px] font-bold bg-black/60 text-emerald-300 px-1.5 py-0.5 rounded">
                          {vid.tag}
                        </span>
                      </div>
                      <div className="p-3">
                        <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {vid.title}
                        </h4>
                        <span className="text-[10px] text-muted-foreground mt-1 block">
                          {vid.views}
                        </span>
                      </div>
                    </div>
                  ))}
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

                return (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        Do you want to join with an existing team or create Team {myTeams.length + 1}?
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Choose one of your unjoined squads below:
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

                    <Button
                      onClick={handleConfirmJoinContest}
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

              <div className="space-y-1.5">
                <h4 className="font-bold text-sm text-foreground">
                  You have joined {allJoinedModalContest.name} with all your existing teams!
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Joined with:{" "}
                  <span className="text-foreground font-semibold">
                    {myTeams.map((t) => t.name).join(", ")}
                  </span>
                  . To join this contest again, first create a new team (Team {myTeams.length + 1}) and then join!
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
      {viewingContestDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in-50 duration-150">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 bg-surface shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 backdrop-blur px-5 py-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {viewingContestDetails.contestId?.type || "CONTEST DETAILS"}
                </span>
                <h3 className="font-bold text-base text-foreground">
                  {viewingContestDetails.contestId?.name || "Contest Details"}
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
                    {viewingContestDetails.contestId?.totalPrize
                      ? `₹${viewingContestDetails.contestId.totalPrize.toLocaleString()}`
                      : "₹10 Lakhs"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Entry Fee</span>
                  <span className="font-bold text-sm text-emerald-400">
                    {viewingContestDetails.contestId?.entryFee === 0
                      ? "FREE"
                      : `₹${viewingContestDetails.contestId?.entryFee ?? 0}`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Max Teams</span>
                  <span className="font-bold text-sm text-foreground">
                    {viewingContestDetails.contestId?.maxTeams || 11}
                  </span>
                </div>
              </div>

              {/* Your Entered Squad */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="font-bold text-xs text-foreground">
                      Entered with: {viewingContestDetails.fantasyTeamId?.name || "Team 1"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Credits: {viewingContestDetails.fantasyTeamId?.totalCredits ?? 100}/100
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Captain:{" "}
                  <b className="text-amber-400">
                    {getPlayerName(viewingContestDetails.fantasyTeamId?.captainId)} (2X)
                  </b>{" "}
                  • Vice-Captain:{" "}
                  <b className="text-cyan-400">
                    {getPlayerName(viewingContestDetails.fantasyTeamId?.viceCaptainId)} (1.5X)
                  </b>
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
      )}

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

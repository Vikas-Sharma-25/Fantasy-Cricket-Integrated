import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/fc/AppShell";
import { Card } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { getMatches } from "@/lib/api-services";
import type { Match } from "@/lib/api-types";
import { setFlow, FLOW_KEYS } from "@/lib/flow";
import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";
import heroCricket from "@/assets/hero-cricket.jpg";
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
} from "lucide-react";

export const Route = createFileRoute("/matches")({ component: Matches });

const TEAM_FLAGS: Record<string, string> = {
  IND: "🇮🇳",
  INDIA: "🇮🇳",
  AUS: "🇦🇺",
  AUSTRALIA: "🇦🇺",
  ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  ENGLAND: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  PAK: "🇵🇰",
  PAKISTAN: "🇵🇰",
  SA: "🇿🇦",
  "SOUTH AFRICA": "🇿🇦",
  NZ: "🇳🇿",
  "NEW ZEALAND": "🇳🇿",
  WI: "🌴",
  "WEST INDIES": "🌴",
  BAN: "🇧🇩",
  BANGLADESH: "🇧🇩",
  SL: "🇱🇰",
  "SRI LANKA": "🇱🇰",
  AFG: "🇦🇫",
  AFGHANISTAN: "🇦🇫",
  CSK: "🦁",
  MI: "🔵",
  RCB: "🔴",
  KKR: "💜",
  DC: "🐯",
  RR: "👑",
  PK: "🦅",
  PBKS: "🦅",
  SRH: "🦅",
  GT: "⚡",
  LSG: "🏏",
  EZONE: "🏏",
  SZONE: "🏏",
  YORKS: "🏏",
  ESS: "🏏",
  PAKW: "🇵🇰",
  HKGW: "🇭🇰",
  AMS: "🏏",
  MHK: "🏏",
  BANW: "🇧🇩",
  UAEW: "🇦🇪",
  GAW: "🌴",
  ABF: "🌴",
};

function getTeamFlag(name: string): string {
  if (!name) return "🏏";
  const upper = name.toUpperCase().trim();
  if (TEAM_FLAGS[upper]) return TEAM_FLAGS[upper];
  for (const [k, v] of Object.entries(TEAM_FLAGS)) {
    if (upper.includes(k)) return v;
  }
  return "🏏";
}

export interface NewsArticle {
  id: string;
  title: string;
  category: string;
  timeAgo: string;
  author: string;
  image: string;
  summary: string;
  content: string[];
  readTime?: string;
  quote?: {
    text: string;
    by: string;
  };
}

export interface VideoHighlight {
  id: string;
  title: string;
  duration: string;
  views: string;
  thumbnail: string;
  youtubeId: string;
  description: string;
}

// Full editorial stories matching user Pics 4 & 5
const FEATURED_ARTICLES: NewsArticle[] = [
  // Pic 5 Main Story
  {
    id: "art-duleep-kishan",
    title: "Duleep Trophy final: Advantage East Zone after Ishan Kishan's 270",
    category: "DOMESTIC CRICKET",
    timeAgo: "7h ago",
    author: "Somesh Sharma • Chennai",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80",
    summary: "Only for the third time in Chennai, a total in excess of 700 was registered in first-class cricket as East Zone seized complete control.",
    quote: {
      text: "We wanted to bat deep and tire out the bowling attack on days one and two. The wicket played true, and the boys executed brilliantly.",
      by: "Ishan Kishan, East Zone Captain",
    },
    content: [
      "Only for the third time in MA Chidambaram Stadium's storied first-class history, a team total in excess of 700 was registered as East Zone established absolute supremacy over South Zone in the 2026 Duleep Trophy final.",
      "Captain Ishan Kishan led from the front with a career-defining 270 off 342 deliveries, studded with 28 boundaries and six towering maximums over mid-wicket. He was supported by stellar centuries from Kumar Kushagra (164) and Shahbaz Ahmed (124*).",
      "In response, South Zone were rocked early by the pace duo of Mohammed Shami and Mukesh Kumar. Shami removed opener Narayan Jagadeesan and Shaik Rasheed before lunch, leaving South Zone reeling at 235/5 by the close of the afternoon session.",
      "Tilak Varma is currently leading South Zone's resistance, batting on 56 alongside Chama V Milind. However, South Zone still trail by a daunting 473 runs with East Zone pressing for an innings victory.",
    ],
  },
  // Pic 5 Story 2
  {
    id: "art-ben-stokes",
    title: "The defining moments of Ben Stokes' international career",
    category: "ENGLAND CRICKET",
    timeAgo: "Mon, Jun 29, 2026",
    author: "George Dobell • London",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=1200&q=80",
    summary: "From Headingley 2019 to Lord's World Cup triumph and the Bazball revolution: a tactical retrospect on England's ultimate talisman.",
    quote: {
      text: "Cricket isn't about stats; it is about feelings and memories you leave behind. Stokes gave English cricket its greatest ever afternoon.",
      by: "Nasser Hussain",
    },
    content: [
      "Few players in the 149-year chronicles of international cricket have carved as visceral an emotional imprint as Benjamin Andrew Stokes.",
      "Whether it was dragging England across the finish line with Jack Leach at Headingley in 2019, or his steely composure in the MCG final against Pakistan in 2022, Stokes has habitually transformed defeat into folklore.",
      "As his tenure reaches its twilight, England selectors must prepare for the unenviable task of filling the seismic void left in both batting and bowling all-rounder departments.",
    ],
  },
  // Pic 5 Story 3
  {
    id: "art-kane-williamson",
    title: "Kane Williamson retires: An era of quiet greatness concludes",
    category: "NEW ZEALAND CRICKET",
    timeAgo: "Fri, Jun 12, 2026",
    author: "Andrew Fidel Fernando • Auckland",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=80",
    summary: "The gentleman giant of modern cricket bids farewell to international formats with 32 Test hundreds and the inaugural World Test Championship trophy.",
    quote: {
      text: "Playing for New Zealand with this group of brothers has been the honor of my life. The game has given me far more than I could ever give back.",
      by: "Kane Williamson",
    },
    content: [
      "Kane Williamson, New Zealand's greatest modern batter and the visionary skipper who steered the Black Caps to World Test Championship glory in 2021, has formally brought down the curtains on his 16-year international career.",
      "Finishing with over 18,000 international runs and 32 Test centuries, Williamson's trademark late punch through backward point and unflappable temperament set him apart among the 'Fab Four'.",
      "Tributes have poured in from across the cricketing fraternity, with Virat Kohli calling him 'the purest technician and true ambassador of sportsmanship'.",
    ],
  },
  // Pic 5 Story 4
  {
    id: "art-t20-wc-celebrations",
    title: "2026 T20 World Cup final - India's celebrations & tactical review",
    category: "ICC TOURNAMENTS",
    timeAgo: "Sun, Mar 8, 2026",
    author: "Cricbuzz Staff • Ahmedabad",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1512719994953-eabf50895df7?auto=format&fit=crop&w=1200&q=80",
    summary: "How disciplined middle-overs bowling and death-overs execution earned Team India back-to-back global T20 titles in front of 110,000 fans.",
    content: [
      "The roar of 110,000 supporters at the Narendra Modi Stadium echoed through the Ahmedabad night as India defended 187 against Australia in a dramatic final over.",
      "Jasprit Bumrah's 19th over, yielding just 4 runs and the prized wicket of Travis Head, proved the tactical inflection point that sealed consecutive T20 World Cup triumphs.",
    ],
  },
  // Pic 5 Story 5
  {
    id: "art-bangladesh-australia",
    title: "When Bangladesh refused to let fear take over in Australia",
    category: "INTERNATIONAL",
    timeAgo: "1d ago",
    author: "Mohammad Isam • Melbourne",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80",
    summary: "Bangladesh's historic Test win in Australia was built on belief, resilience and a stronger bowling attack, proving their growth as a Test nation.",
    content: [
      "Facing a daunting fourth-innings chase against Cummins, Starc, and Hazlewood on a deteriorating Melbourne surface, Bangladesh held their nerve to script their most courageous Test victory.",
      "The performance silenced doubters and established the Tigers as genuine contenders in challenging away conditions.",
    ],
  },
  // Pic 5 Story 6
  {
    id: "art-ipl-fielding",
    title: "The duality of IPL fielding: Spectacular highlights, shaky basics",
    category: "IPL SPECIAL",
    timeAgo: "2d ago",
    author: "K. Shriniwas • Bengaluru",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=1200&q=80",
    summary: "From spectacular boundary relays to data-driven preparation, fielding has transformed. But IPL statistics reveal a worrying stagnation in basic ground catching.",
    content: [
      "While highlight reels are filled with flying one-handed boundary saves and acrobatic tip-toe relay catches, the overall catch conversion rate in the Powerplay dropped to 68% this season.",
      "Fielding coaches point to fatigue from congested travel schedules and higher ball speeds as key factors behind the split between elite acrobatics and straightforward regulation drops.",
    ],
  },
  // Pic 4 Story 1
  {
    id: "art-bumrah-hardik",
    title: "Injuries hit India's squad! Jasprit Bumrah returns while Hardik Pandya rested",
    category: "TEAM INDIA",
    timeAgo: "10h ago",
    author: "Rakesh Rao • Mumbai",
    readTime: "3 min read",
    image: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=80",
    summary: "Selection committee confirms squad rotation ahead of the crucial white-ball tri-series with Bumrah regaining full bowling loads.",
    content: [
      "India's pace spearhead Jasprit Bumrah has officially completed his rehabilitation protocols at the National Cricket Academy and is slated to return to action this week.",
      "All-rounder Hardik Pandya has been granted a precautionary rest period following high workload demands across recent T20 encounters.",
      "The selectors have also handed maiden call-ups to two standout domestic performers following impressive showings in the Syed Mushtaq Ali Trophy.",
    ],
  },
  // Pic 4 Story 2
  {
    id: "art-ca-bbl-investment",
    title: "Cricket Australia officially opens door to private investment in Big Bash",
    category: "BIG BASH LEAGUE",
    timeAgo: "4h ago",
    author: "Peter Lalor • Sydney",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80",
    summary: "Cricket Australia will invite bids from private investors for the Melbourne Renegades, with the view to entering under new global ownership.",
    content: [
      "Cricket Australia has formally ratified a landmark decision to permit private equity and commercial venture syndicates to purchase equity stakes in Big Bash League franchises starting next year.",
      "The initial pilot initiative will focus on Melbourne Renegades, with prospective investors from India's IPL groups expressing formal interest.",
    ],
  },
  // Story 9
  {
    id: "art-chapman-nz",
    title: "Chapman shifts to casual contract with New Zealand Cricket",
    category: "NEW ZEALAND CRICKET",
    timeAgo: "5h ago",
    author: "Cricbuzz Global Desk",
    readTime: "3 min read",
    image: "https://images.unsplash.com/photo-1512719994953-eabf50895df7?auto=format&fit=crop&w=1200&q=80",
    summary: "Left-handed white-ball specialist Mark Chapman has opted out of a full NZ central contract to pursue overseas franchise leagues.",
    content: [
      "Mark Chapman has joined a growing list of New Zealand cricketers opting for casual agreements, allowing him to participate in ILT20 and MLC tournaments.",
      "New Zealand Cricket confirmed that Chapman remains available for selection in marquee ICC tournaments and bilateral T20I series.",
    ],
  },
];

// Pic 4 Featured Videos
const FEATURED_VIDEOS: VideoHighlight[] = [
  {
    id: "vid-1",
    title: "Injuries hit India's squad! Bumrah returns... Where's Hardik?",
    duration: "02:56",
    views: "184K views",
    thumbnail: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80",
    youtubeId: "dQw4w9WgXcQ",
    description: "In-depth tactical analysis on India's pace bowling combinations with Bumrah returning and fitness reports on key all-rounders.",
  },
  {
    id: "vid-2",
    title: "Pakistan hit new low! 7 players sent home & new coach in",
    duration: "03:27",
    views: "312K views",
    thumbnail: "https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=600&q=80",
    youtubeId: "dQw4w9WgXcQ",
    description: "Comprehensive review of the PCB overhaul, selection changes, and tactical preview for their upcoming white-ball series.",
  },
  {
    id: "vid-3",
    title: "Impact Player Rule Debate: Stay or Go? Captains Speak Out",
    duration: "03:22",
    views: "95K views",
    thumbnail: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=600&q=80",
    youtubeId: "dQw4w9WgXcQ",
    description: "Leading T20 franchise coaches and players weigh in on how the Impact Player innovation has reshaped 200+ totals.",
  },
  {
    id: "vid-4",
    title: "Top 10 Unbelievable Catches in Modern Cricket History",
    duration: "04:15",
    views: "520K views",
    thumbnail: "https://images.unsplash.com/photo-1512719994953-eabf50895df7?auto=format&fit=crop&w=600&q=80",
    youtubeId: "dQw4w9WgXcQ",
    description: "Relive the greatest boundary-line acrobatics, relay catches, and diving blinders from international cricket.",
  },
];

async function fetchWorldMatches() {
  try {
    const res = await fetch("/api/v1/cricket/live");
    const json = await res.json();
    return json.data || [];
  } catch {
    try {
      const res2 = await fetch("/api/cricket/live");
      const json2 = await res2.json();
      return json2.data || [];
    } catch {
      return [];
    }
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
  const navigate = useNavigate();
  const [worldMatches, setWorldMatches] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [tickerPage, setTickerPage] = useState(0);

  // Selected Match on Home Page (expands details on home page, NO navigation to live match center)
  const [selectedHomeMatch, setSelectedHomeMatch] = useState<any | null>(null);

  // Full Article Reader Modal State (Clicking any headline opens full article)
  const [readingArticle, setReadingArticle] = useState<NewsArticle | null>(null);

  // Video Player Modal State
  const [activeVideo, setActiveVideo] = useState<VideoHighlight | null>(null);

  // Load world matches and cricket news
  useEffect(() => {
    fetchWorldMatches().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setWorldMatches(data);
      }
    });
    fetchCricketNews().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setNews(data);
      }
    });
  }, []);

  // Socket for real-time score updates
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

  // Clicking a match on the Home page toggles/shows details RIGHT ON HOME PAGE!
  function handleTickerMatchClick(wm: any) {
    if (selectedHomeMatch?.id === (wm.id || wm.dbId)) {
      setSelectedHomeMatch(null); // toggle off if clicked again
    } else {
      setSelectedHomeMatch(wm);
    }
  }

  const currentTickerMatches = sortedMatches.slice(
    tickerPage * PAGE_SIZE,
    tickerPage * PAGE_SIZE + PAGE_SIZE
  );

  const heroArticle: NewsArticle = FEATURED_ARTICLES[0]!; // Ishan Kishan 270 (Pic 5)
  const specialArticles = FEATURED_ARTICLES.slice(1, 5); // Pic 4 & 5 Special Features
  const editorialStories = FEATURED_ARTICLES.slice(5); // More editorial archives

  return (
    <AppShell maxWidth="max-w-[1520px]">
      <div className="space-y-6">
        {/* ============================================================= */}
        {/* 1. CRICBUZZ TOP MATCHES TICKER STRIP (3 Per View + Controls)   */}
        {/* ============================================================= */}
        <div className="rounded-2xl bg-gradient-to-r from-[#072d20] via-[#0b3d2b] to-[#072d20] border border-emerald-600/30 p-2.5 shadow-xl">
          <div className="flex items-center gap-3">
            {/* Left Static Header with Pulse */}
            <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 border-r border-emerald-500/20 shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-xs font-black tracking-wider text-emerald-400 uppercase hidden sm:inline">
                MATCHES
              </span>
            </div>

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
                currentTickerMatches.map((wm, i) => {
                  const isSelected = selectedHomeMatch?.id === (wm.id || wm.dbId);
                  return (
                    <div
                      key={wm.id || i}
                      onClick={() => handleTickerMatchClick(wm)}
                      className={cn(
                        "rounded-xl px-3.5 py-2.5 text-xs flex flex-col justify-between cursor-pointer transition-all duration-200 shadow-sm group",
                        isSelected
                          ? "bg-emerald-900/50 border-2 border-emerald-400 ring-2 ring-emerald-500/30 shadow-md"
                          : "bg-black/35 hover:bg-white/10 border border-emerald-500/20 hover:border-emerald-400/50"
                      )}
                    >
                      {/* Card Header: Series + Format */}
                      <div className="flex justify-between items-center text-[10px] text-emerald-300/80 font-bold uppercase tracking-wider pb-1 border-b border-white/5">
                        <span className="truncate max-w-[170px]">{wm.series || "World Series"}</span>
                        <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[9px] font-black">
                          {wm.format || "T20"}
                        </span>
                      </div>

                      {/* Team A vs Team B Scores */}
                      <div className="flex flex-col gap-1.5 my-2">
                        <div className="flex justify-between items-center font-bold">
                          <span className="flex items-center gap-1.5 truncate max-w-[170px]">
                            <span className="text-sm">{getTeamFlag(wm.teamA)}</span>
                            <span className="truncate group-hover:text-emerald-300 transition-colors">
                              {wm.teamACode || wm.teamA}
                            </span>
                          </span>
                          <span className="font-mono text-emerald-300 text-[12px] font-bold">
                            {wm.scoreA || ""}
                          </span>
                        </div>

                        <div className="flex justify-between items-center font-bold">
                          <span className="flex items-center gap-1.5 truncate max-w-[170px]">
                            <span className="text-sm">{getTeamFlag(wm.teamB)}</span>
                            <span className="truncate group-hover:text-emerald-300 transition-colors">
                              {wm.teamBCode || wm.teamB}
                            </span>
                          </span>
                          <span className="font-mono text-emerald-300 text-[12px] font-bold">
                            {wm.scoreB || ""}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer: Status text & Live Pulse Indicator */}
                      <div className="flex justify-between items-center border-t border-white/10 pt-1.5 text-[10px]">
                        <span className="text-emerald-200/90 truncate max-w-[190px] font-medium">
                          {wm.statusText || wm.status || "Match Scheduled"}
                        </span>
                        {wm.status === "LIVE" ? (
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
        {/* EXPANDED HOME MATCH DETAILS HUB (Shown when clicking a match)  */}
        {/* ============================================================= */}
        {selectedHomeMatch && (
          <div className="rounded-2xl border-2 border-emerald-500/60 bg-gradient-to-b from-surface via-surface/95 to-surface-2 p-5 shadow-2xl space-y-4 animate-in fade-in-50 duration-200">
            {/* Top Bar of Hub */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    {selectedHomeMatch.teamA} vs {selectedHomeMatch.teamB}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedHomeMatch.series} • {selectedHomeMatch.venue || "International Stadium"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="hero"
                  size="sm"
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Link
                    to="/live-match"
                    search={{ matchId: selectedHomeMatch.id || selectedHomeMatch.dbId } as any}
                  >
                    Open Full Match Center <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>

                <button
                  type="button"
                  onClick={() => setSelectedHomeMatch(null)}
                  title="Close match details"
                  aria-label="Close match details"
                  className="h-8 w-8 rounded-full bg-surface-2 hover:bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scorecard Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-2/60 border border-border/60 rounded-xl p-4">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase">1st Innings</p>
                <p className="text-lg font-black text-foreground">
                  {selectedHomeMatch.teamACode || selectedHomeMatch.teamA} {selectedHomeMatch.scoreA || "708"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-emerald-400 uppercase">Current Batting</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400">
                    {selectedHomeMatch.teamBCode || selectedHomeMatch.teamB}
                  </span>
                  <span className="text-2xl font-mono font-black text-white">
                    {selectedHomeMatch.scoreB || "242/6 (80.0 ov)"}
                  </span>
                </div>
              </div>

              <div className="space-y-1 md:text-right">
                <p className="text-[11px] font-bold text-red-400 uppercase">Match Situation</p>
                <p className="text-xs font-bold text-foreground">
                  {selectedHomeMatch.statusText || "Day 3: 3rd Session - South Zone trail by 466 runs"}
                </p>
              </div>
            </div>

            {/* EXACT PIC 3 OVER SUMMARY BOX */}
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
                {/* Batters */}
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

                {/* Bowler */}
                <div className="space-y-1.5 sm:border-l sm:border-border/60 sm:pl-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Md Kounain Quraishi</span>
                    <span className="font-mono font-bold text-foreground">31-7-77-1</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                    <span>Economy: 2.48</span>
                    <span>Maidens: 7</span>
                  </div>
                </div>
              </div>

              {/* Over summary action links */}
              <div className="px-4 py-2.5 bg-surface-2/30 flex items-center gap-6 text-xs font-semibold text-primary">
                <Link
                  to="/live-match"
                  search={{ matchId: selectedHomeMatch.id || selectedHomeMatch.dbId } as any}
                  className="hover:underline flex items-center gap-1"
                >
                  Over Summary <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/live-match"
                  search={{ matchId: selectedHomeMatch.id || selectedHomeMatch.dbId } as any}
                  className="hover:underline flex items-center gap-1"
                >
                  View all overs <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* 2. REAL-TIME LIVE CRICKET PULSE BANNER (NO ADS!)              */}
        {/* ============================================================= */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <Radio className="h-4 w-4 animate-pulse text-red-500" />
            <span>LIVE CRICKET UPDATES:</span>
            <span className="text-foreground font-normal">
              Duleep Trophy Final Day 3 • South Zone 242/6 • Tilak Varma 56* • Shami 3 wkts
            </span>
          </div>
          <Link
            to="/live-match"
            className="font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            Live Match Center <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* ============================================================= */}
        {/* 3. THREE-COLUMN CRICBUZZ LAYOUT (NO ADS ANYWHERE!)            */}
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
                  image: n.image || FEATURED_ARTICLES[i % FEATURED_ARTICLES.length].image,
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
                    {/* ONLY HEADING DISPLAYED - Clicking opens full article */}
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
                        {/* ONLY HEADING IS EMPHASIZED */}
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
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{story.summary}</p>
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
              <span className="text-[10px] text-muted-foreground font-bold uppercase">HIGHLIGHTS</span>
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
              {/* Modal Header */}
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

              {/* Title & Bylines */}
              <div className="space-y-3">
                <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground leading-tight">
                  {readingArticle.title}
                </h1>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground border-y border-border/40 py-2.5">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-3.5 w-3.5 text-primary" />
                    <span className="font-bold text-foreground">{readingArticle.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{readingArticle.timeAgo}</span>
                  </div>
                </div>
              </div>

              {/* Hero Image */}
              {readingArticle.image && (
                <div className="h-64 sm:h-80 w-full overflow-hidden rounded-2xl bg-surface-2 shadow-inner">
                  <img
                    src={readingArticle.image}
                    alt={readingArticle.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {/* Lead Summary Callout */}
              <div className="p-4 rounded-xl bg-surface-2/60 border-l-4 border-primary text-sm font-semibold text-foreground/90 leading-relaxed">
                {readingArticle.summary}
              </div>

              {/* Quote if available */}
              {readingArticle.quote && (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 italic text-emerald-200 text-sm">
                  "{readingArticle.quote.text}"
                  <p className="mt-2 text-xs font-bold text-emerald-400 not-italic">
                    — {readingArticle.quote.by}
                  </p>
                </div>
              )}

              {/* Full Multi-paragraph Body */}
              <div className="space-y-4 text-sm leading-relaxed text-foreground/90 divide-y divide-border/20">
                {readingArticle.content.map((p, idx) => (
                  <p key={idx} className="pt-3">
                    {p}
                  </p>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReadingArticle(null)}
                  className="font-bold"
                >
                  ← Back to Cricket News
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="hero"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    <Link to="/live-match">Go to Live Match Center</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIDEO PLAYER MODAL                                            */}
        {/* ============================================================= */}
        {activeVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-black uppercase text-foreground">
                    {activeVideo.duration} • {activeVideo.views}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveVideo(null)}
                  aria-label="Close video"
                  className="h-8 w-8 rounded-full bg-surface-2 hover:bg-surface text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={activeVideo.thumbnail}
                  alt={activeVideo.title}
                  className="h-full w-full object-cover opacity-70"
                />
                <div className="absolute flex flex-col items-center gap-2 text-white">
                  <div className="bg-red-600 rounded-full p-4 shadow-xl">
                    <Play className="h-8 w-8 fill-current" />
                  </div>
                  <span className="text-xs font-bold bg-black/70 px-2 py-1 rounded">
                    Streaming Highlights
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">{activeVideo.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {activeVideo.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

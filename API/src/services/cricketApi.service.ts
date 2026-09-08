import { env } from "../config/env";
import { Match } from "../models/Match";

interface CricketNewsItem {
  id: string;
  title: string;
  category: string;
  timeAgo: string;
  source?: string;
  imageUrl?: string;
}

interface WorldMatch {
  id: string;
  dbId?: string;
  teamA: string;
  teamB: string;
  teamACode: string;
  teamBCode: string;
  teamAFlag: string;
  teamBFlag: string;
  series: string;
  format: string;
  status: 'LIVE' | 'COMPLETED' | 'UPCOMING';
  venue?: string;
  scoreA?: string;
  scoreB?: string;
  statusText?: string;
  startTime?: string;
  providerData?: any;
}

const CACHE_TTL_MS = 15000;
let matchCache: WorldMatch[] | null = null;
let matchCacheTimestamp = 0;

const SIMULATED_NEWS: CricketNewsItem[] = [
  { id: "1", title: "Afghanistan to host Zimbabwe, Bangladesh in ODI tri-series", category: "News", timeAgo: "1h ago" },
  { id: "2", title: "Nahid Rana unlikely to get NOC for Big Bash League", category: "News", timeAgo: "2h ago" },
  { id: "3", title: "Rohit Yadav withdrawn from India U-19 squads due to age discrepancy", category: "News", timeAgo: "3h ago" },
  { id: "4", title: "Cricket Australia officially opens door to private investment in Big Bash", category: "News", timeAgo: "4h ago" },
  { id: "5", title: "Chapman shifts to casual contract with New Zealand", category: "News", timeAgo: "5h ago" },
  { id: "6", title: "Injuries hit India's squad! Bumrah returns... Where's Hardik?", category: "Analysis", timeAgo: "6h ago" },
  { id: "7", title: "Pakistan hit new low! 7 players sent home & new coach in", category: "News", timeAgo: "7h ago" },
  { id: "8", title: "Impact Player Rule Debate: Stay or Go?", category: "Opinion", timeAgo: "8h ago" },
  { id: "9", title: "Nashra Sandhu six-fer demolishes Hong Kong in Women's Asia Cup", category: "Match Report", timeAgo: "9h ago" },
  { id: "10", title: "Duleep Trophy 2026: East Zone dominate with mammoth 708", category: "Match Report", timeAgo: "10h ago" },
  { id: "11", title: "IPL 2027 Mega Auction: Key players who could go unsold", category: "Analysis", timeAgo: "11h ago" },
  { id: "12", title: "MS Dhoni retirement speculation grows after CSK season", category: "Opinion", timeAgo: "12h ago" },
  { id: "13", title: "Jasprit Bumrah named ICC Player of the Month", category: "News", timeAgo: "13h ago" },
  { id: "14", title: "England announce squad for T20 Tri-Series in South Africa", category: "News", timeAgo: "14h ago" },
  { id: "15", title: "BCCI confirms window for domestic T20 league expansion", category: "News", timeAgo: "15h ago" },
  { id: "16", title: "Virat Kohli closes in on 50th ODI century milestone", category: "News", timeAgo: "16h ago" },
  { id: "17", title: "Women's cricket gets standalone window in ICC FTP cycle", category: "News", timeAgo: "17h ago" }
];

export const getWorldLiveMatches = async (): Promise<WorldMatch[]> => {
  const now = Date.now();
  if (matchCache && now - matchCacheTimestamp < CACHE_TTL_MS) {
    return matchCache;
  }

  try {
    const dbMatches = await Match.find({}).sort({ status: 1, startTime: -1 });
    if (dbMatches && dbMatches.length > 0) {
      const mapped: WorldMatch[] = dbMatches.map((m: any) => {
        const pd = (m.providerData || {}) as any;
        return {
          id: m._id.toString(),
          dbId: m._id.toString(),
          teamA: m.teamA,
          teamB: m.teamB,
          teamACode: pd.teamACode || m.teamA.split(" ")[0].slice(0, 5).toUpperCase(),
          teamBCode: pd.teamBCode || m.teamB.split(" ")[0].slice(0, 5).toUpperCase(),
          teamAFlag: pd.teamAFlag || "",
          teamBFlag: pd.teamBFlag || "",
          series: pd.tournament || pd.series || "Cricket Series",
          format: pd.format || "T20",
          status: m.status,
          scoreA: pd.scoreA || (pd.firstInnings?.team === m.teamA ? pd.firstInnings.score : (pd.battingTeam === m.teamA ? `${pd.currentScore}/${pd.currentWickets}` : "")),
          scoreB: pd.scoreB || (pd.firstInnings?.team === m.teamB ? pd.firstInnings.score : (pd.battingTeam === m.teamB ? `${pd.currentScore}/${pd.currentWickets}` : "")),
          statusText: pd.statusText || m.status,
          venue: m.venue || pd.venue || "Stadium",
          providerData: pd,
        };
      });

      matchCache = mapped;
      matchCacheTimestamp = now;
      return mapped;
    }
  } catch (err) {
    console.error("[cricketApi] Could not read db matches, falling back to simulated", err);
  }

  return [];
};

export const getCricketNews = async (): Promise<CricketNewsItem[]> => {
  const shift = Math.floor(Date.now() / 300000) % SIMULATED_NEWS.length;
  return [...SIMULATED_NEWS.slice(shift), ...SIMULATED_NEWS.slice(0, shift)];
};

export const getMatchScorecard = async (matchId: string): Promise<any> => {
  try {
    let match = null;
    if (matchId.length === 24) {
      match = await Match.findById(matchId);
    }
    if (!match) {
      match = await Match.findOne({ providerMatchId: matchId });
    }
    if (match && match.providerData) {
      const pd = match.providerData as any;
      if (pd.scorecard) return pd.scorecard;
      return {
        matchId: match._id,
        firstInnings: pd.firstInnings || null,
        batsmen: pd.batsmen || [],
        bowlers: pd.bowlers || (pd.bowler ? [pd.bowler] : []),
        scoreA: pd.scoreA || "",
        scoreB: pd.scoreB || "",
      };
    }
  } catch (err) {
    console.error("[cricketApi] Error fetching scorecard:", err);
  }

  return {
    matchId,
    details: "Scorecard details unavailable",
    innings: []
  };
};

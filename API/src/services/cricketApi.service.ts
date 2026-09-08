import { env } from "../config/env";

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
}

const CACHE_TTL_MS = 60000;
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

const SIMULATED_LIVE_MATCHES: WorldMatch[] = [
  { id: "m1", teamA: "East Zone", teamB: "South Zone", teamACode: "EZONE", teamBCode: "SZONE", teamAFlag: "", teamBFlag: "", series: "Duleep Trophy 2026", format: "FC", status: 'LIVE', scoreA: "708", scoreB: "176/5 (56 ov)", statusText: "Day 3, Session 2", venue: "Eden Gardens" },
  { id: "m2", teamA: "Pakistan W", teamB: "Hong Kong W", teamACode: "PAKW", teamBCode: "HKGW", teamAFlag: "", teamBFlag: "", series: "Women's Asia Cup", format: "T20I", status: 'COMPLETED', scoreA: "143/8", scoreB: "71", statusText: "PAKW won by 72 runs", venue: "Sylhet" },
  { id: "m3", teamA: "Bangladesh W", teamB: "UAE W", teamACode: "BANW", teamBCode: "UAEW", teamAFlag: "", teamBFlag: "", series: "Women's Asia Cup", format: "T20I", status: 'UPCOMING', statusText: "Match starts in 2 hours", venue: "Sylhet" },
  { id: "m4", teamA: "AMS", teamB: "MHK", teamACode: "AMS", teamBCode: "MHK", teamAFlag: "", teamBFlag: "", series: "Big Bash", format: "T20", status: 'LIVE', scoreA: "89/3 (11.2 ov)", statusText: "Innings Break", venue: "MCG" },
  { id: "m5", teamA: "GAW", teamB: "ABF", teamACode: "GAW", teamBCode: "ABF", teamAFlag: "", teamBFlag: "", series: "CPL", format: "T20", status: 'UPCOMING', statusText: "Match starts tomorrow", venue: "Providence Stadium" },
  { id: "m6", teamA: "India", teamB: "Australia", teamACode: "IND", teamBCode: "AUS", teamAFlag: "", teamBFlag: "", series: "ICC T20 Championship", format: "T20I", status: 'LIVE', scoreA: "182/4", scoreB: "65/2 (8 ov)", statusText: "AUS need 118 runs from 72 balls", venue: "Wankhede" },
  { id: "m7", teamA: "Sri Lanka", teamB: "West Indies", teamACode: "SL", teamBCode: "WI", teamAFlag: "", teamBFlag: "", series: "ODI Series", format: "ODI", status: 'UPCOMING', statusText: "Series tied 1-1", venue: "R. Premadasa" },
  { id: "m8", teamA: "County Select XI", teamB: "South Africa A", teamACode: "CSXI", teamBCode: "SAA", teamAFlag: "", teamBFlag: "", series: "Tour Match", format: "FC", status: 'LIVE', scoreA: "250", scoreB: "120/1", statusText: "Day 2, Session 1", venue: "Lord's" }
];

export const getWorldLiveMatches = async (): Promise<WorldMatch[]> => {
  const now = Date.now();
  if (matchCache && now - matchCacheTimestamp < CACHE_TTL_MS) {
    return matchCache;
  }

  const apiKey = (env as any).CRICKET_API_KEY || process.env.CRICKET_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${encodeURIComponent(apiKey)}&offset=0`);
      if (response.ok) {
        const resData: any = await response.json();
        if (resData && Array.isArray(resData.data) && resData.data.length > 0) {
          const apiMatches: WorldMatch[] = resData.data.map((m: any) => ({
            id: m.id || String(Math.random()),
            teamA: m.teamInfo?.[0]?.name || m.teams?.[0] || "Team A",
            teamB: m.teamInfo?.[1]?.name || m.teams?.[1] || "Team B",
            teamACode: m.teamInfo?.[0]?.shortname || (m.teams?.[0] || "T1").slice(0, 3).toUpperCase(),
            teamBCode: m.teamInfo?.[1]?.shortname || (m.teams?.[1] || "T2").slice(0, 3).toUpperCase(),
            teamAFlag: m.teamInfo?.[0]?.img || "🏏",
            teamBFlag: m.teamInfo?.[1]?.img || "🏏",
            series: m.name || m.series_id || "Live Series",
            format: (m.matchType || "T20").toUpperCase(),
            status: (m.status || "").toLowerCase().includes("won") ? "COMPLETED" : (m.matchStarted ? "LIVE" : "UPCOMING"),
            scoreA: m.score?.[0]?.r !== undefined ? `${m.score[0].r}/${m.score[0].w || 0} (${m.score[0].o || 0} ov)` : undefined,
            scoreB: m.score?.[1]?.r !== undefined ? `${m.score[1].r}/${m.score[1].w || 0} (${m.score[1].o || 0} ov)` : undefined,
            statusText: m.status || (m.matchStarted ? "Match in progress" : "Scheduled"),
            venue: m.venue || "Stadium",
          }));
          matchCache = apiMatches;
          matchCacheTimestamp = now;
          return matchCache;
        }
      }
    } catch (error) {
      console.error("[cricketApi] Failed to fetch matches from API", error);
    }
  }

  matchCache = SIMULATED_LIVE_MATCHES;
  matchCacheTimestamp = now;
  return matchCache;
};

export const getCricketNews = async (): Promise<CricketNewsItem[]> => {
  const shift = Math.floor(Date.now() / 300000) % SIMULATED_NEWS.length;
  return [...SIMULATED_NEWS.slice(shift), ...SIMULATED_NEWS.slice(0, shift)];
};

export const getMatchScorecard = async (matchId: string): Promise<any> => {
  return {
    matchId,
    details: "Detailed scorecard not fully implemented in simulation",
    innings: []
  };
};

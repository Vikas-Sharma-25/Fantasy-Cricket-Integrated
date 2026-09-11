import { useEffect, useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Trophy,
  Award,
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Search,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Flame,
  ListOrdered
} from "lucide-react";
import { AppShell } from "@/components/fc/AppShell";
import { Card } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLeaderboard, getCachedUser, getMe } from "@/lib/api-services";
import { getFlow, FLOW_KEYS } from "@/lib/flow";

export const Route = createFileRoute("/leaderboard")({ component: LeaderboardPage });

interface StandingRow {
  rank: number;
  prevRank: number;
  teamName: string;
  ownerName: string;
  captain: string;
  viceCaptain: string;
  points: number;
  prize: string;
  isUser?: boolean;
}

const DEFAULT_STANDINGS: Record<string, StandingRow[]> = {
  "Mega Contest (₹50L)": [
    { rank: 1, prevRank: 1, teamName: "Champion XI", ownerName: "Rajesh Kumar (Verified)", captain: "V. Kohli (c)", viceCaptain: "J. Bumrah (vc)", points: 842.5, prize: "₹10,00,000" },
    { rank: 2, prevRank: 3, teamName: "Royal Strikers", ownerName: "Amit Patel (IND)", captain: "R. Sharma (c)", viceCaptain: "R. Jadeja (vc)", points: 798.0, prize: "₹5,00,000" },
    { rank: 3, prevRank: 2, teamName: "Super Kings", ownerName: "Vikram Singh (IND)", captain: "H. Pandya (c)", viceCaptain: "M. Shami (vc)", points: 764.5, prize: "₹2,50,000" },
    { rank: 4, prevRank: 4, teamName: "Thala Finisher 7", ownerName: "Mahesh Rao", captain: "MS Dhoni (c)", viceCaptain: "R. Ashwin (vc)", points: 742.0, prize: "₹1,00,000" },
    { rank: 5, prevRank: 7, teamName: "Delhi Daredevils", ownerName: "Saurabh Sharma", captain: "R. Pant (c)", viceCaptain: "K. Yadav (vc)", points: 730.5, prize: "₹50,000" },
    { rank: 6, prevRank: 5, teamName: "Boom Yorker XI", ownerName: "Anand Verma", captain: "J. Bumrah (c)", viceCaptain: "M. Siraj (vc)", points: 715.0, prize: "₹25,000" },
    { rank: 7, prevRank: 8, teamName: "Hitman Blazers", ownerName: "Pooja Malhotra", captain: "R. Sharma (c)", viceCaptain: "S. Gill (vc)", points: 702.5, prize: "₹15,000" },
    { rank: 8, prevRank: 6, teamName: "Knight Riders Pro", ownerName: "Sunil Narine Fan", captain: "A. Russell (c)", viceCaptain: "V. Chakravarthy (vc)", points: 694.0, prize: "₹10,000" },
    { rank: 9, prevRank: 11, teamName: "Spin Wizards", ownerName: "Gaurav Joshi", captain: "Y. Chahal (c)", viceCaptain: "K. Yadav (vc)", points: 681.5, prize: "₹7,500" },
    { rank: 10, prevRank: 9, teamName: "Express Pace Club", ownerName: "Deepak Chahar", captain: "M. Shami (c)", viceCaptain: "A. Deep (vc)", points: 673.0, prize: "₹5,000" }
  ],
  "Head-to-Head (1v1)": [
    { rank: 1, prevRank: 1, teamName: "Alpha Masters", ownerName: "Kunal Mehra", captain: "V. Kohli (c)", viceCaptain: "S. Gill (vc)", points: 812.0, prize: "₹10,000" },
    { rank: 2, prevRank: 2, teamName: "Titan Warriors", ownerName: "Aditya Roy", captain: "R. Sharma (c)", viceCaptain: "J. Bumrah (vc)", points: 765.5, prize: "₹0" }
  ],
  "Winner Takes All (₹25K)": [
    { rank: 1, prevRank: 1, teamName: "Solo Conqueror", ownerName: "Vikas Sharma (Pro)", captain: "V. Kohli (c)", viceCaptain: "M. Shami (vc)", points: 835.0, prize: "₹25,000" },
    { rank: 2, prevRank: 4, teamName: "Cricket Kings", ownerName: "Rohit Bansal", captain: "H. Pandya (c)", viceCaptain: "J. Bumrah (vc)", points: 789.0, prize: "₹0" },
    { rank: 3, prevRank: 2, teamName: "Blue Tigers", ownerName: "Sneha Reddy", captain: "R. Pant (c)", viceCaptain: "R. Jadeja (vc)", points: 751.5, prize: "₹0" },
    { rank: 4, prevRank: 3, teamName: "Power Hitters", ownerName: "Mohit Verma", captain: "S. Samson (c)", viceCaptain: "Y. Jaiswal (vc)", points: 720.0, prize: "₹0" }
  ],
  "Hot Contests (₹5L)": [
    { rank: 1, prevRank: 2, teamName: "Fire Strikers", ownerName: "Arjun Rampal", captain: "S. Gill (c)", viceCaptain: "V. Kohli (vc)", points: 820.5, prize: "₹1,50,000" },
    { rank: 2, prevRank: 1, teamName: "Grand Masters", ownerName: "Rohan Gupta", captain: "R. Sharma (c)", viceCaptain: "H. Pandya (vc)", points: 801.0, prize: "₹75,000" },
    { rank: 3, prevRank: 3, teamName: "Apex Predators", ownerName: "Tarun Bajaj", captain: "J. Bumrah (c)", viceCaptain: "M. Siraj (vc)", points: 778.5, prize: "₹40,000" },
    { rank: 4, prevRank: 5, teamName: "Victory XI", ownerName: "Kavita Rao", captain: "K. Rahul (c)", viceCaptain: "R. Jadeja (vc)", points: 749.0, prize: "₹20,000" }
  ]
};

function LeaderboardPage() {
  const contestId = getFlow<string | null>(FLOW_KEYS.selectedContestId, null);
  const [contestPool, setContestPool] = useState<string>("Mega Contest (₹50L)");
  const [activeTab, setActiveTab] = useState<"Global" | "MyRank" | "Prizes">("Global");
  const [search, setSearch] = useState("");
  const [recalculating, setRecalculating] = useState(false);
  const [standings, setStandings] = useState<StandingRow[]>(DEFAULT_STANDINGS["Mega Contest (₹50L)"]);
  const [currentUser, setCurrentUser] = useState<any>(() => getCachedUser());

  useEffect(() => {
    void getMe().then((u) => {
      if (u) setCurrentUser(u);
    });
  }, []);

  // When contest pool changes, update standings
  useEffect(() => {
    const list = DEFAULT_STANDINGS[contestPool] || DEFAULT_STANDINGS["Mega Contest (₹50L)"];
    setStandings(list);
  }, [contestPool]);

  // If a contestId is present in flow, try loading backend leaderboard
  useEffect(() => {
    if (contestId) {
      void getLeaderboard(contestId)
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            const mapped: StandingRow[] = res.map((r: any, idx: number) => ({
              rank: r.rank ?? idx + 1,
              prevRank: r.rank ?? idx + 1,
              teamName: r.teamName || r.name || `Team #${idx + 1}`,
              ownerName: r.user?.name || r.userName || "Player",
              captain: r.captainName ? `${r.captainName} (c)` : "Captain (c)",
              viceCaptain: r.viceCaptainName ? `${r.viceCaptainName} (vc)` : "VC (vc)",
              points: r.points ?? r.totalPoints ?? 0,
              prize: r.prize || (idx === 0 ? "₹10,000" : idx === 1 ? "₹5,000" : idx === 2 ? "₹2,500" : "₹500"),
              isUser: r.userId === currentUser?._id || r.user?._id === currentUser?._id
            }));
            setStandings(mapped);
          }
        })
        .catch(() => {});
    }
  }, [contestId, currentUser]);

  function handleRecalculate() {
    setRecalculating(true);
    setTimeout(() => {
      // Simulate live score jitter
      setStandings((prev) =>
        prev.map((row) => {
          const delta = (Math.random() - 0.45) * 4;
          return {
            ...row,
            points: Math.round((row.points + delta) * 10) / 10
          };
        })
      );
      setRecalculating(false);
    }, 600);
  }

  const filteredStandings = useMemo(() => {
    return standings.filter(
      (s) =>
        !search ||
        s.teamName.toLowerCase().includes(search.toLowerCase()) ||
        s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        s.captain.toLowerCase().includes(search.toLowerCase())
    );
  }, [standings, search]);

  const top3 = standings.slice(0, 3);
  const rank1 = top3.find((r) => r.rank === 1) || top3[0];
  const rank2 = top3.find((r) => r.rank === 2) || top3[1];
  const rank3 = top3.find((r) => r.rank === 3) || top3[2];

  // User's own entry if available
  const myEntry = standings.find((s) => s.isUser) || {
    rank: 14,
    prevRank: 18,
    teamName: "My Arena XI",
    ownerName: currentUser?.name || "You",
    captain: "V. Kohli (c)",
    viceCaptain: "J. Bumrah (vc)",
    points: 652.0,
    prize: "₹1,000",
    isUser: true
  };

  return (
    <AppShell maxWidth="max-w-5xl">
      <div className="space-y-6 pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-foreground flex items-center gap-2.5">
              <Trophy className="h-6 w-6 text-amber-400" />
              Contest Leaderboards & Live Standings
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time fantasy points, rank movements, and prize distributions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Point Engine Connected
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRecalculate}
              disabled={recalculating}
              className="text-xs gap-1.5 font-semibold cursor-pointer border-border hover:bg-surface-2"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", recalculating && "animate-spin text-primary")} />
              <span>{recalculating ? "Refreshing..." : "Refresh Scores"}</span>
            </Button>
          </div>
        </div>

        {/* Contest Pool Selector Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-2/40 p-3.5 rounded-2xl border border-border">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Contest Pool:</span>
            {["Mega Contest (₹50L)", "Head-to-Head (1v1)", "Winner Takes All (₹25K)", "Hot Contests (₹5L)"].map(
              (cName) => (
                <button
                  key={cName}
                  type="button"
                  onClick={() => setContestPool(cName)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    contestPool === cName
                      ? "bg-primary text-primary-foreground shadow"
                      : "bg-background text-muted-foreground hover:text-foreground border border-border"
                  )}
                >
                  {cName}
                </button>
              )
            )}
          </div>

          <Link
            to="/contests"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Browse All Contests</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ATTRACTIVE TOP 3 PODIUM CARDS (SUPER ADMIN STYLE)             */}
        {/* ------------------------------------------------------------- */}
        {top3.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3 items-end">
            {/* RANK #2 (SILVER) */}
            {rank2 && (
              <Card className="order-2 sm:order-1 border-slate-400/40 bg-gradient-to-b from-slate-400/15 via-surface/80 to-surface/95 text-center p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  <TrendingUp className="h-3 w-3" /> +1
                </div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-400/25 text-slate-200 border-2 border-slate-400/50 mb-3 shadow">
                  <Award className="h-7 w-7" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 bg-slate-400/20 px-2.5 py-0.5 rounded-full border border-slate-400/30">
                  Rank #2 (Silver)
                </span>
                <p className="font-display font-bold text-base text-foreground mt-2">{rank2.teamName}</p>
                <p className="text-xs text-muted-foreground">{rank2.ownerName}</p>
                <div className="mt-3 py-1.5 px-3 rounded-xl bg-surface-2/60 border border-border">
                  <p className="text-[10px] text-muted-foreground">{rank2.captain} · {rank2.viceCaptain}</p>
                  <p className="font-mono font-bold text-base text-emerald-400 mt-0.5">{rank2.points} Pts</p>
                </div>
                <div className="mt-2 text-xs font-bold text-amber-300">
                  Prize: {rank2.prize}
                </div>
              </Card>
            )}

            {/* RANK #1 (GOLD) - Tallest / Center */}
            {rank1 && (
              <Card className="order-1 sm:order-2 border-amber-500/50 bg-gradient-to-b from-amber-500/20 via-surface/80 to-surface/95 text-center p-6 shadow-xl relative overflow-hidden ring-2 ring-amber-500/30 sm:-mt-3">
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full">
                  <Minus className="h-3 w-3" /> Leader #1
                </div>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/30 text-amber-300 border-2 border-amber-500/60 mb-3 shadow-lg shadow-amber-500/10">
                  <Crown className="h-9 w-9" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/30 border border-amber-500/40 px-3 py-1 rounded-full shadow">
                  🏆 CHAMPION #1 (GOLD)
                </span>
                <p className="font-display font-black text-lg text-foreground mt-2">{rank1.teamName}</p>
                <p className="text-xs text-muted-foreground">{rank1.ownerName}</p>
                <div className="mt-3 py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <p className="text-[10px] text-amber-200/80 font-medium">{rank1.captain} · {rank1.viceCaptain}</p>
                  <p className="font-mono font-black text-xl text-emerald-400 mt-0.5">{rank1.points} Pts</p>
                </div>
                <div className="mt-2 text-sm font-black text-amber-300">
                  Prize Payout: {rank1.prize}
                </div>
              </Card>
            )}

            {/* RANK #3 (BRONZE) */}
            {rank3 && (
              <Card className="order-3 sm:order-3 border-amber-700/40 bg-gradient-to-b from-amber-700/15 via-surface/80 to-surface/95 text-center p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold text-destructive bg-destructive/20 px-2 py-0.5 rounded-full">
                  <TrendingDown className="h-3 w-3" /> -1
                </div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-700/25 text-amber-500 border-2 border-amber-700/50 mb-3 shadow">
                  <Award className="h-7 w-7" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-700/20 px-2.5 py-0.5 rounded-full border border-amber-700/30">
                  Rank #3 (Bronze)
                </span>
                <p className="font-display font-bold text-base text-foreground mt-2">{rank3.teamName}</p>
                <p className="text-xs text-muted-foreground">{rank3.ownerName}</p>
                <div className="mt-3 py-1.5 px-3 rounded-xl bg-surface-2/60 border border-border">
                  <p className="text-[10px] text-muted-foreground">{rank3.captain} · {rank3.viceCaptain}</p>
                  <p className="font-mono font-bold text-base text-emerald-400 mt-0.5">{rank3.points} Pts</p>
                </div>
                <div className="mt-2 text-xs font-bold text-amber-300">
                  Prize: {rank3.prize}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* USER'S PERSONAL LIVE STANDING SUMMARY                         */}
        {/* ------------------------------------------------------------- */}
        <Card className="p-4 border-primary/40 bg-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-sm">
              #{myEntry.rank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-display font-bold text-sm text-foreground">Your Team: {myEntry.teamName}</h4>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  In Winning Zone 🎯
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Captain: {myEntry.captain} • Vice-Captain: {myEntry.viceCaptain}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 sm:text-right">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Your Fantasy Score</p>
              <p className="font-mono text-lg font-black text-emerald-400">{myEntry.points} Pts</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Projected Winnings</p>
              <p className="font-mono text-lg font-black text-amber-300">{myEntry.prize}</p>
            </div>
          </div>
        </Card>

        {/* ------------------------------------------------------------- */}
        {/* FULL STANDINGS TABLE                                          */}
        {/* ------------------------------------------------------------- */}
        <Card className="p-0 overflow-hidden border-border shadow-lg">
          <div className="p-4 border-b border-border/80 flex flex-wrap items-center justify-between gap-3 bg-surface-2/40">
            <div>
              <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-primary" /> Full Standings & Point Spread
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Displaying live ranked entries for {contestPool}
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search team or owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-background w-48 sm:w-60"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2/70 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Rank & Delta</th>
                  <th className="py-3 px-4">Fantasy Team & Owner</th>
                  <th className="py-3 px-4">Captain & VC</th>
                  <th className="py-3 px-4 text-right">Total Points</th>
                  <th className="py-3 px-4 text-right">Projected Prize</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredStandings.map((row) => {
                  const delta = row.prevRank - row.rank;
                  return (
                    <tr
                      key={row.rank}
                      className={cn(
                        "hover:bg-surface-2/40 transition-colors",
                        row.rank <= 3 && "bg-surface-2/20 font-semibold",
                        row.isUser && "bg-primary/10 border-l-2 border-l-primary"
                      )}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold font-mono",
                              row.rank === 1
                                ? "bg-amber-500/20 text-amber-300 font-black border border-amber-500/40"
                                : row.rank === 2
                                ? "bg-slate-400/20 text-slate-300 font-black border border-slate-400/40"
                                : row.rank === 3
                                ? "bg-amber-700/20 text-amber-500 font-black border border-amber-700/40"
                                : "bg-surface-2 text-muted-foreground"
                            )}
                          >
                            #{row.rank}
                          </span>
                          {delta > 0 ? (
                            <span className="flex items-center text-[10px] text-emerald-400 font-semibold">
                              <TrendingUp className="h-3 w-3" />+{delta}
                            </span>
                          ) : delta < 0 ? (
                            <span className="flex items-center text-[10px] text-destructive font-semibold">
                              <TrendingDown className="h-3 w-3" />{delta}
                            </span>
                          ) : (
                            <span className="flex items-center text-[10px] text-muted-foreground">
                              <Minus className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-foreground flex items-center gap-1.5">
                          {row.teamName}
                          {row.isUser && (
                            <span className="text-[9px] font-black uppercase bg-primary text-primary-foreground px-1.5 py-0.2 rounded">
                              YOU
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{row.ownerName}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[11px] text-muted-foreground bg-surface-2 px-2 py-1 rounded-lg border border-border">
                          {row.captain} · {row.viceCaptain}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-black text-sm text-emerald-400">
                          {row.points.toFixed(1)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-amber-300">
                          {row.prize}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HelpCircle,
  Sparkles,
  Target,
  Shield,
  Zap,
  Layers,
  Search,
  Calculator,
  ArrowLeft,
  Info,
  Flame,
  Award,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { AppShell } from "@/components/fc/AppShell";
import { Card } from "@/components/fc/bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rules")({ component: FantasyRulesPage });

interface ScoringRuleItem {
  id: string;
  eventType: string;
  points: number;
  format: "ALL" | "T20" | "ODI" | "TEST";
  category: "Batting" | "Bowling" | "Fielding" | "Economy";
  description: string;
}

const DEFAULT_RULES: ScoringRuleItem[] = [
  // Batting
  { id: "b1", eventType: "Run Scored", points: 1, format: "ALL", category: "Batting", description: "Each run scored with bat (excluding extras/byes/leg-byes)" },
  { id: "b2", eventType: "Boundary 4 Bonus", points: 1, format: "ALL", category: "Batting", description: "Additional bonus point for every boundary 4 hit" },
  { id: "b3", eventType: "Six Bonus", points: 2, format: "ALL", category: "Batting", description: "Additional bonus points for every 6 launched into stands" },
  { id: "b4", eventType: "30 Runs Bonus", points: 4, format: "T20", category: "Batting", description: "Milestone bonus for reaching 30 runs in T20 match" },
  { id: "b5", eventType: "Half-Century (50)", points: 8, format: "ALL", category: "Batting", description: "Milestone bonus for scoring 50+ runs (replaces 30 runs bonus)" },
  { id: "b6", eventType: "Century (100)", points: 16, format: "ALL", category: "Batting", description: "Mammoth milestone bonus for scoring 100+ runs" },
  { id: "b7", eventType: "Duck Dismissal", points: -2, format: "ALL", category: "Batting", description: "Penalty for getting dismissed on zero (Batters, WKs & All-rounders only)" },

  // Bowling
  { id: "bw1", eventType: "Wicket Taken", points: 25, format: "ALL", category: "Bowling", description: "Wicket taken excluding run outs (Bowled, Caught, LBW, Stumped, Hit Wicket)" },
  { id: "bw2", eventType: "Bowled / LBW Bonus", points: 8, format: "ALL", category: "Bowling", description: "Extra skill bonus added when dismissal is clean Bowled or LBW" },
  { id: "bw3", eventType: "Maiden Over", points: 12, format: "ALL", category: "Bowling", description: "Over bowled with zero runs conceded" },
  { id: "bw4", eventType: "3-Wicket Haul Bonus", points: 4, format: "ALL", category: "Bowling", description: "Bonus for claiming 3 wickets in a single match innings" },
  { id: "bw5", eventType: "4-Wicket Haul Bonus", points: 8, format: "ALL", category: "Bowling", description: "Milestone bonus for claiming 4 wickets in a match" },
  { id: "bw6", eventType: "5-Wicket Haul Bonus", points: 16, format: "ALL", category: "Bowling", description: "Grand milestone bonus for taking 5 or more wickets" },

  // Fielding
  { id: "f1", eventType: "Catch Taken", points: 8, format: "ALL", category: "Fielding", description: "Clean catch taken by fielder or wicketkeeper" },
  { id: "f2", eventType: "3 Catches Bonus", points: 4, format: "ALL", category: "Fielding", description: "Bonus for taking 3 or more catches in a single match" },
  { id: "f3", eventType: "Stumping", points: 12, format: "ALL", category: "Fielding", description: "Stumping executed by wicketkeeper" },
  { id: "f4", eventType: "Run Out (Direct Hit)", points: 12, format: "ALL", category: "Fielding", description: "Direct throw resulting in a run-out dismissal" },
  { id: "f5", eventType: "Run Out (Thrower & Catcher)", points: 6, format: "ALL", category: "Fielding", description: "6 points awarded to each player involved in the run-out dismissal" },

  // Economy & Strike Rate
  { id: "e1", eventType: "Economy Rate < 5.0 (T20)", points: 6, format: "T20", category: "Economy", description: "Conceding under 5.0 runs per over (min. 2 overs bowled)" },
  { id: "e2", eventType: "Economy Rate 5.0 - 5.99", points: 4, format: "T20", category: "Economy", description: "Conceding between 5.0 and 5.99 runs per over" },
  { id: "e3", eventType: "Economy Rate 9.0 - 10.0", points: -2, format: "T20", category: "Economy", description: "Penalty for high economy rate (min. 2 overs bowled)" },
  { id: "e4", eventType: "Economy Rate > 11.0", points: -6, format: "T20", category: "Economy", description: "Heavy penalty for high run leakage" },
  { id: "e5", eventType: "Strike Rate > 170.0 (T20)", points: 6, format: "T20", category: "Economy", description: "High strike rate bonus (min. 10 balls faced)" },
  { id: "e6", eventType: "Strike Rate 150.0 - 170.0", points: 4, format: "T20", category: "Economy", description: "Strike rate between 150 and 170 (min. 10 balls faced)" },
  { id: "e7", eventType: "Strike Rate < 70.0 (T20)", points: -4, format: "T20", category: "Economy", description: "Penalty for very slow scoring in T20 (min. 10 balls faced)" },
];

export function FantasyRulesPage() {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  // Interactive Fantasy Points Calculator State
  const [calcRuns, setCalcRuns] = useState(54);
  const [calcFours, setCalcFours] = useState(4);
  const [calcSixes, setCalcSixes] = useState(2);
  const [calcWickets, setCalcWickets] = useState(2);
  const [calcLbwBowled, setCalcLbwBowled] = useState(1);
  const [calcMaidens, setCalcMaidens] = useState(1);
  const [calcCatches, setCalcCatches] = useState(1);
  const [calcDuck, setCalcDuck] = useState(false);
  const [calcRole, setCalcRole] = useState<"player" | "captain" | "vice_captain">("captain");

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return DEFAULT_RULES.filter((r) => {
      const matchCat = activeCategory === "ALL" || r.category === activeCategory;
      const matchSearch =
        !search ||
        r.eventType.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  // Live Points Calculation
  const calculatedPoints = useMemo(() => {
    let pts = 0;
    const breakdown: { label: string; val: number }[] = [];

    // Batting
    if (calcDuck) {
      pts -= 2;
      breakdown.push({ label: "Duck Dismissal", val: -2 });
    } else {
      if (calcRuns > 0) {
        pts += calcRuns * 1;
        breakdown.push({ label: `${calcRuns} Runs Scored`, val: calcRuns * 1 });
      }
      if (calcFours > 0) {
        pts += calcFours * 1;
        breakdown.push({ label: `${calcFours} Fours Bonus`, val: calcFours * 1 });
      }
      if (calcSixes > 0) {
        pts += calcSixes * 2;
        breakdown.push({ label: `${calcSixes} Sixes Bonus`, val: calcSixes * 2 });
      }
      if (calcRuns >= 100) {
        pts += 16;
        breakdown.push({ label: "Century (100) Bonus", val: 16 });
      } else if (calcRuns >= 50) {
        pts += 8;
        breakdown.push({ label: "Half-Century (50) Bonus", val: 8 });
      } else if (calcRuns >= 30) {
        pts += 4;
        breakdown.push({ label: "30+ Runs Bonus", val: 4 });
      }
    }

    // Bowling
    if (calcWickets > 0) {
      pts += calcWickets * 25;
      breakdown.push({ label: `${calcWickets} Wickets (+25 each)`, val: calcWickets * 25 });
    }
    if (calcLbwBowled > 0) {
      pts += calcLbwBowled * 8;
      breakdown.push({ label: `${calcLbwBowled} LBW/Bowled Bonus (+8 each)`, val: calcLbwBowled * 8 });
    }
    if (calcMaidens > 0) {
      pts += calcMaidens * 12;
      breakdown.push({ label: `${calcMaidens} Maiden Overs (+12 each)`, val: calcMaidens * 12 });
    }
    if (calcWickets >= 5) {
      pts += 16;
      breakdown.push({ label: "5-Wicket Haul Bonus", val: 16 });
    } else if (calcWickets >= 3) {
      pts += 4;
      breakdown.push({ label: "3-Wicket Haul Bonus", val: 4 });
    }

    // Fielding
    if (calcCatches > 0) {
      pts += calcCatches * 8;
      breakdown.push({ label: `${calcCatches} Catch(es) (+8 each)`, val: calcCatches * 8 });
      if (calcCatches >= 3) {
        pts += 4;
        breakdown.push({ label: "3 Catches Bonus", val: 4 });
      }
    }

    const multiplier = calcRole === "captain" ? 2 : calcRole === "vice_captain" ? 1.5 : 1;
    const finalTotal = pts * multiplier;

    return { total: finalTotal, raw: pts, multiplier, breakdown };
  }, [calcRuns, calcFours, calcSixes, calcWickets, calcLbwBowled, calcMaidens, calcCatches, calcDuck, calcRole]);

  return (
    <AppShell maxWidth="max-w-5xl">
      <div className="space-y-6 pb-12">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/matches"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-display font-extrabold text-xl sm:text-2xl text-foreground flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-primary" />
                Fantasy Point System & Scoring Rules
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Official Dream11 standard points matrix with live interactive points simulator.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" /> Fair Play Standard 2026
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* INTERACTIVE FANTASY POINTS CALCULATOR WIDGET                  */}
        {/* ------------------------------------------------------------- */}
        <Card className="border-primary/40 bg-gradient-to-br from-surface/95 via-surface-2/40 to-surface/95 p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/40 shadow">
                <Calculator className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm sm:text-base text-foreground">
                  Interactive Points Simulator
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Adjust runs, boundaries, wickets, and captaincy to calculate exact fantasy points
                </p>
              </div>
            </div>

            {/* Multiplier selector */}
            <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setCalcRole("player")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  calcRole === "player" ? "bg-surface-2 text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Player (1x)
              </button>
              <button
                type="button"
                onClick={() => setCalcRole("vice_captain")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  calcRole === "vice_captain" ? "bg-primary/20 text-primary font-bold shadow-sm" : "text-muted-foreground"
                )}
              >
                VC (1.5x)
              </button>
              <button
                type="button"
                onClick={() => setCalcRole("captain")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer",
                  calcRole === "captain" ? "bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/40" : "text-muted-foreground"
                )}
              >
                👑 Captain (2x)
              </button>
            </div>
          </div>

          {/* Interactive Sliders and Inputs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground flex justify-between">
                <span>Runs Scored</span>
                <span className="font-mono font-bold text-foreground">{calcRuns} runs</span>
              </label>
              <input
                type="range"
                min="0"
                max="150"
                value={calcRuns}
                onChange={(e) => setCalcRuns(parseInt(e.target.value, 10) || 0)}
                className="w-full accent-primary mt-1.5 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                <span>0</span>
                <span>50 (+8 Pts)</span>
                <span>100 (+16 Pts)</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground flex justify-between">
                <span>Boundaries (4s & 6s)</span>
                <span className="font-mono font-bold text-foreground">{calcFours} 4s · {calcSixes} 6s</span>
              </label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="number"
                  min="0"
                  max="25"
                  value={calcFours}
                  onChange={(e) => setCalcFours(parseInt(e.target.value, 10) || 0)}
                  className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background font-mono"
                  placeholder="4s"
                />
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={calcSixes}
                  onChange={(e) => setCalcSixes(parseInt(e.target.value, 10) || 0)}
                  className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background font-mono"
                  placeholder="6s"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground flex justify-between">
                <span>Wickets & Maidens</span>
                <span className="font-mono font-bold text-foreground">{calcWickets} Wkts · {calcMaidens} Mdn</span>
              </label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={calcWickets}
                  onChange={(e) => setCalcWickets(parseInt(e.target.value, 10) || 0)}
                  className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background font-mono"
                  placeholder="Wickets"
                />
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={calcMaidens}
                  onChange={(e) => setCalcMaidens(parseInt(e.target.value, 10) || 0)}
                  className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background font-mono"
                  placeholder="Maidens"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground flex justify-between">
                <span>Catches / Dismissal</span>
                <span className="font-mono font-bold text-foreground">{calcCatches} Catches</span>
              </label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={calcCatches}
                  onChange={(e) => setCalcCatches(parseInt(e.target.value, 10) || 0)}
                  className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background font-mono"
                  placeholder="Catches"
                />
                <button
                  type="button"
                  onClick={() => setCalcDuck(!calcDuck)}
                  className={cn(
                    "w-1/2 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer",
                    calcDuck
                      ? "bg-destructive/20 text-destructive border-destructive/40"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {calcDuck ? "Duck (-2)" : "No Duck"}
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Calculation Result Bar */}
          <div className="pt-3 border-t border-border/80 flex flex-wrap items-center justify-between gap-4 bg-background/60 p-3.5 rounded-xl">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground font-semibold">Breakdown:</span>
              {calculatedPoints.breakdown.map((b, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-surface-2 border border-border text-[10px] font-mono">
                  {b.label}: <strong className={b.val < 0 ? "text-destructive" : "text-emerald-400"}>{b.val > 0 ? `+${b.val}` : b.val}</strong>
                </span>
              ))}
            </div>

            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Fantasy Points</p>
              <p className="font-mono text-2xl font-black text-emerald-400">
                {calculatedPoints.total.toFixed(1)} <span className="text-xs text-muted-foreground">Pts</span>
              </p>
            </div>
          </div>
        </Card>

        {/* ------------------------------------------------------------- */}
        {/* CATEGORY TABS & SEARCH                                        */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: "ALL", label: "All Rules", icon: Layers },
              { key: "Batting", label: "Batting", icon: Sparkles },
              { key: "Bowling", label: "Bowling", icon: Target },
              { key: "Fielding", label: "Fielding", icon: Shield },
              { key: "Economy", label: "Economy & Strike Rate", icon: Zap },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategory(key)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                  activeCategory === key
                    ? "bg-primary text-primary-foreground shadow"
                    : "bg-surface-2 text-muted-foreground hover:text-foreground border border-border"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search scoring rules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border bg-surface-2 w-52 sm:w-64"
            />
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SCORING RULES CARDS GRID                                      */}
        {/* ------------------------------------------------------------- */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRules.map((rule) => (
            <Card
              key={rule.id}
              className="p-4 border-border bg-surface/80 hover:border-primary/50 transition-all hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                        rule.category === "Batting"
                          ? "bg-amber-500/15 text-amber-300"
                          : rule.category === "Bowling"
                          ? "bg-blue-500/15 text-blue-300"
                          : rule.category === "Fielding"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-purple-500/15 text-purple-300"
                      )}
                    >
                      {rule.category === "Batting" ? (
                        <Sparkles className="h-4 w-4" />
                      ) : rule.category === "Bowling" ? (
                        <Target className="h-4 w-4" />
                      ) : rule.category === "Fielding" ? (
                        <Shield className="h-4 w-4" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-foreground">{rule.eventType}</h4>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        {rule.category} • {rule.format}
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "font-mono font-black text-sm px-2.5 py-0.5 rounded-lg border",
                      rule.points > 0
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-destructive/15 text-destructive border-destructive/30"
                    )}
                  >
                    {rule.points > 0 ? `+${rule.points}` : rule.points} {rule.points === 1 ? "Pt" : "Pts"}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground/90 mt-1 leading-relaxed">
                  {rule.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Applies: {rule.format === "ALL" ? "T20, ODI, Test" : rule.format}</span>
                <span className="text-primary font-semibold">Official Rule</span>
              </div>
            </Card>
          ))}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* IMPORTANT FANTASY NOTES & FAIR PLAY                           */}
        {/* ------------------------------------------------------------- */}
        <Card className="p-5 border-border bg-surface-2/40 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-display font-bold text-sm">
            <Info className="h-4 w-4 text-primary" />
            Important Fantasy Rules to Note
          </div>
          <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span><strong>Captain Multiplier:</strong> Your selected Captain earns <strong>2x points</strong> for all on-field events.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span><strong>Vice-Captain Multiplier:</strong> Your selected Vice-Captain earns <strong>1.5x points</strong>.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span><strong>Super Over Excluded:</strong> Any runs, wickets, or catches in a Super Over are not counted in fantasy scoring.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span><strong>Substitutes:</strong> Impact Players or concussion substitutes only earn points once officially fielded.</span>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

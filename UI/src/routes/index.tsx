import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Trophy,
  Radio,
  Gift,
  ArrowRight,
  Play,
  Users,
  Headphones,
  LogIn,
  UserPlus,
  Sparkles,
  Clock,
  Zap,
  CheckCircle2,
  HelpCircle,
  Flame,
  Award,
  AlertTriangle,
  ChevronRight,
  Star,
  Lock,
  Check,
  TrendingUp,
} from "lucide-react";
import hero from "@/assets/hero-cricket.jpg";
import { Logo } from "@/components/fc/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { setFlow, FLOW_KEYS } from "@/lib/flow";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fantasy Cricket — India's Premier Fantasy Sports & Cash Contests Platform" },
      {
        name: "description",
        content:
          "Build your dream cricket XI, join mega cash contests, win real prizes, and enjoy instant 60-second withdrawals on India's most trusted fantasy sports platform.",
      },
      { property: "og:title", content: "Play Fantasy Cricket & Win Real Cash Daily" },
      {
        property: "og:description",
        content: "Select your dream team, join multi-crore mega contests, and withdraw real winnings instantly.",
      },
    ],
  }),
  component: Landing,
});

const trust = [
  { icon: ShieldCheck, title: "100% LEGAL & SECURE", sub: "Recognized Skill Game" },
  { icon: Zap, title: "INSTANT WITHDRAWAL", sub: "Direct UPI & Bank in 60s" },
  { icon: Trophy, title: "FAIR PLAY CERTIFIED", sub: "Anti-Fraud Bot Protection" },
];

const stats = [
  { icon: Users, value: "4 CRORE+", label: "Verified Players" },
  { icon: Trophy, value: "₹10 CRORE+", label: "Daily Cash Winnings" },
  { icon: Zap, value: "60 SECONDS", label: "Instant UPI Payouts" },
  { icon: ShieldCheck, value: "100%", label: "Fair Play & Legal" },
  { icon: Headphones, value: "24X7", label: "Live Support" },
];

const featuredMatches = [
  {
    id: "match-1",
    tournament: "ICC T20 Championship",
    team1: { name: "India", code: "IND", color: "from-blue-600 to-blue-800", flag: "🇮🇳" },
    team2: { name: "Australia", code: "AUS", color: "from-amber-500 to-yellow-600", flag: "🇦🇺" },
    prizePool: "₹5,00,00,000",
    firstPrize: "₹1,00,00,000",
    entryFee: "₹49",
    timeLeft: "02h 45m left",
    spotsFilled: "82%",
    totalSpots: "1,50,000 spots",
  },
  {
    id: "match-2",
    tournament: "Indian Premier T20 League",
    team1: { name: "Chennai", code: "CSK", color: "from-yellow-500 to-amber-600", flag: "🦁" },
    team2: { name: "Mumbai", code: "MI", color: "from-blue-600 to-indigo-800", flag: "⚡" },
    prizePool: "₹2,50,00,000",
    firstPrize: "₹50,00,000",
    entryFee: "₹39",
    timeLeft: "06h 15m left",
    spotsFilled: "68%",
    totalSpots: "80,000 spots",
  },
  {
    id: "match-3",
    tournament: "T20 Super League",
    team1: { name: "Bangalore", code: "RCB", color: "from-red-600 to-red-800", flag: "🔥" },
    team2: { name: "Kolkata", code: "KKR", color: "from-purple-600 to-indigo-900", flag: "⚔️" },
    prizePool: "₹1,00,00,000",
    firstPrize: "₹25,00,000",
    entryFee: "₹29",
    timeLeft: "Tomorrow 07:30 PM",
    spotsFilled: "45%",
    totalSpots: "40,000 spots",
  },
  {
    id: "match-4",
    tournament: "International T20 Series",
    team1: { name: "England", code: "ENG", color: "from-red-500 to-blue-700", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    team2: { name: "South Africa", code: "SA", color: "from-emerald-600 to-green-800", flag: "🇿🇦" },
    prizePool: "₹50,00,000",
    firstPrize: "₹10,00,000",
    entryFee: "₹19",
    timeLeft: "1d 04h left",
    spotsFilled: "35%",
    totalSpots: "30,000 spots",
  },
];

const howToPlaySteps = [
  {
    step: "01",
    title: "Select a Match",
    desc: "Pick any upcoming cricket fixture from international tours, IPL, or domestic T20 tournaments.",
    badge: "Match Selection",
  },
  {
    step: "02",
    title: "Create Your Dream XI",
    desc: "Use your cricket acumen to choose 11 players (WK, BAT, AR, BOWL) within 100 virtual credits.",
    badge: "Squad Building",
  },
  {
    step: "03",
    title: "Choose Captain & VC",
    desc: "Your Captain earns 2X points and Vice-Captain earns 1.5X points. The game-changing strategic decision!",
    badge: "Multipliers: 2X & 1.5X",
  },
  {
    step: "04",
    title: "Compete & Withdraw",
    desc: "Follow the live ball-by-ball leaderboard in real time and withdraw cash instantly via UPI to your bank.",
    badge: "Instant Payouts",
  },
];

const contestTypes = [
  {
    icon: Trophy,
    title: "Mega Contests",
    subtitle: "High Stakes, Massive Jackpots",
    desc: "Multi-crore guaranteed prize pools with tens of thousands of payout spots. Highest prizes going up to ₹1 Crore for rank 1.",
    tag: "Most Popular",
    tagColor: "bg-primary/20 text-primary border-primary/30",
  },
  {
    icon: Flame,
    title: "Head to Head (1 vs 1)",
    subtitle: "Double Your Money",
    desc: "A pure duel of sports knowledge. Battle one-on-one with a single opponent with a massive 50% winning probability.",
    tag: "Highest Win Rate",
    tagColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  {
    icon: Award,
    title: "Winner Takes All",
    subtitle: "Mini Leagues (3-4 Players)",
    desc: "Compete with 3 to 4 fantasy managers where the top-scoring player takes the entire accumulated prize pool.",
    tag: "High ROI",
    tagColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  {
    icon: Sparkles,
    title: "Practice & Free Leagues",
    subtitle: "Zero Risk Learning",
    desc: "Test new player combinations, practice your strategies, and build confidence with ₹0 entry fees before playing for cash.",
    tag: "100% Free",
    tagColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
];

const advantages = [
  {
    icon: Zap,
    title: "60-Second Instant Withdrawals",
    desc: "No waiting for hours or days. Transfer your winnings straight into your Bank Account or UPI (GPay, PhonePe, Paytm) in under a minute.",
  },
  {
    icon: ShieldCheck,
    title: "100% Legal & Recognized",
    desc: "Fantasy sports is officially recognized as a 'Game of Skill' under the Indian Constitution and protected by Supreme Court rulings.",
  },
  {
    icon: Lock,
    title: "Bank-Grade 256-Bit Security",
    desc: "All financial transactions, wallet balances, and user credentials are encrypted with end-to-end enterprise SSL security standards.",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Ball-by-Ball Scoring",
    desc: "Ultra-fast Socket.IO feeds update your player points, boundary bonuses, and live leaderboard rankings with zero delay.",
  },
  {
    icon: Users,
    title: "Zero Bot Fair Play Guarantee",
    desc: "Proprietary anti-fraud and device fingerprinting algorithms prevent botting and multi-accounting for 100% transparent competition.",
  },
  {
    icon: Headphones,
    title: "24x7 Dedicated VIP Support",
    desc: "Our responsive customer care desk is always ready to assist you round the clock via Live In-App Chat and priority WhatsApp.",
  },
];

const winners = [
  {
    name: "Rahul Sharma",
    location: "Jaipur, Rajasthan",
    won: "₹25,00,000",
    contest: "IND vs AUS Mega T20 League",
    quote: "I captained Hardik and vice-captained Bumrah! The instant UPI withdrawal was in my bank account in 2 minutes flat.",
    avatar: "RS",
  },
  {
    name: "Priya Patel",
    location: "Ahmedabad, Gujarat",
    won: "₹10,50,000",
    contest: "CSK vs MI Mega Derby",
    quote: "Transparent scoring and clean UI. Seeing my team climb to Rank 1 on the live leaderboard was an unforgettable thrill!",
    avatar: "PP",
  },
  {
    name: "Amit Verma",
    location: "Lucknow, Uttar Pradesh",
    won: "₹7,20,000",
    contest: "RCB vs KKR Super Cup",
    quote: "Started with just ₹49. Never experienced such smooth gameplay on any other fantasy site. Totally genuine platform.",
    avatar: "AV",
  },
];

const faqs = [
  {
    q: "Is playing Fantasy Cricket legal in India?",
    a: "Yes, 100% legal! The Supreme Court of India has expressly recognized fantasy cricket as a 'Game of Skill'. Success depends predominantly on the user's sports knowledge, statistical analysis, and team selection strategy, making it completely exempt from gambling and betting prohibitions under Section 12 of the Public Gambling Act, 1867.",
  },
  {
    q: "How do I withdraw my winnings to my bank account or UPI?",
    a: "Withdrawals are lightning fast! Simply go to your Wallet ➔ Withdraw ➔ Enter your preferred UPI ID (Google Pay, PhonePe, Paytm) or Bank Account details. Once verified, funds are transferred within 60 seconds directly into your account.",
  },
  {
    q: "How are fantasy cricket points calculated?",
    a: "Points are awarded based on your chosen 11 players' real-time on-field performance: Runs (1 pt), Boundaries (1 pt bonus for 4s, 2 pts for 6s), Wickets (25 pts), Catches (8 pts), Run-outs (12 pts), Maiden overs, and Strike Rate / Economy rate bonuses. Your Captain gets 2X points and Vice-Captain gets 1.5X points.",
  },
  {
    q: "What happens if a match is abandoned or interrupted by rain?",
    a: "If a match is abandoned without a single ball being bowled or cancelled due to bad weather, 100% of your entry fees are immediately and automatically refunded back into your fantasy wallet.",
  },
  {
    q: "Can I create and enter multiple teams in a single contest?",
    a: "Yes! In most Mega Contests, you can enter up to 20 different team combinations (Team 1, Team 2, etc.) to diversify your captain choices and maximize your probability of finishing on top of the leaderboard.",
  },
  {
    q: "Which payment modes are supported for deposits?",
    a: "We support all major payment methods across India with zero deposit fees: UPI (Google Pay, PhonePe, Paytm, BHIM), Debit & Credit Cards (Visa, Mastercard, RuPay), and Net Banking across 50+ national and private banks.",
  },
];

function Landing() {
  const navigate = useNavigate();
  const [realMatches, setRealMatches] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/v1/cricket/live")
      .then((res) => res.json())
      .then((json) => {
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          setRealMatches(json.data.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  function handleAction(msg: string) {
    setFlow(FLOW_KEYS.authPromptMsg, msg);
    navigate({ to: "/register" });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Background Hero Accent Visual */}
      <div className="pointer-events-none absolute right-0 top-0 h-[880px] w-full max-w-[1100px] overflow-hidden opacity-95 lg:w-[65%]">
        <img
          src={hero}
          alt="Fantasy cricket batsman playing an explosive shot under floodlights"
          className="h-full w-full object-cover object-center scale-100"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,var(--background)_25%,oklch(0.16_0.018_265/0.75)_50%,oklch(0.16_0.018_265/0.15)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(180deg,transparent,var(--background))]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ==================== 1. TOP NAVIGATION ==================== */}
        <header className="flex items-center justify-between border-b border-border/50 py-5">
          <div className="flex items-center gap-8">
            <Logo size="md" />
            <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground lg:flex">
              <a href="#matches" className="transition-colors hover:text-primary">
                Featured Matches
              </a>
              <a href="#how-to-play" className="transition-colors hover:text-primary">
                How To Play
              </a>
              <a href="#contests" className="transition-colors hover:text-primary">
                Contests
              </a>
              <a href="#why-us" className="transition-colors hover:text-primary">
                Why Us
              </a>
              <a href="#winners" className="transition-colors hover:text-primary">
                Winners
              </a>
              <a href="#faq" className="transition-colors hover:text-primary">
                FAQ
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="outlineGreen" size="sm" className="gap-2 tracking-wide font-bold sm:size-lg">
              <Link to="/login">
                <LogIn className="h-4 w-4" /> LOGIN
              </Link>
            </Button>
            <Button asChild variant="hero" size="sm" className="gap-2 tracking-wide font-bold sm:size-lg">
              <Link to="/register">
                <UserPlus className="h-4 w-4" /> REGISTER
              </Link>
            </Button>
          </div>
        </header>

        {/* ==================== 2. HERO SECTION ==================== */}
        <section className="max-w-2xl pb-16 pt-10 lg:pt-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              ₹10+ Crore Daily Prize Pool Live
            </span>
          </div>

          <h1 className="mt-7 font-display text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            Play Cricket.
            <br />
            <span className="text-primary">Predict Winners.</span>
            <br />
            Win Real Cash.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-foreground/80 sm:text-xl font-medium">
            Build your dream XI, join high-stakes mega contests, and withdraw real cash winnings instantly into your bank
            account.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            {trust.map(({ icon: Icon, title, sub }, i) => (
              <div key={title} className="flex items-center gap-3">
                {i > 0 && <span className="-ml-4 mr-1 hidden h-8 w-px bg-border sm:block" />}
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xs font-bold uppercase tracking-wide">{title}</p>
                  <p className="text-[11px] text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap gap-4">
            <Button
              type="button"
              onClick={() =>
                handleAction("🏏 Register now to join Mega Contests and compete for multi-crore cash prizes!")
              }
              variant="hero"
              size="xl"
              className="gap-3 font-bold shadow-xl shadow-primary/25"
            >
              <Trophy className="h-5 w-5" /> PLAY NOW & WIN CASH <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              asChild
              variant="outline"
              size="xl"
              className="gap-2 border-border/80 bg-surface/80 font-bold hover:bg-surface-2"
            >
              <a href="#how-to-play">
                <Play className="h-4 w-4 text-primary" /> HOW TO PLAY
              </a>
            </Button>
          </div>
        </section>

        {/* ==================== 3. STATS STRIP ==================== */}
        <section className="mb-20 grid grid-cols-2 gap-y-6 rounded-2xl border border-border/80 bg-surface/80 px-6 py-6 backdrop-blur sm:grid-cols-3 lg:grid-cols-5 shadow-xl">
          {stats.map(({ icon: Icon, value, label }, i) => (
            <div key={label} className="relative flex items-center justify-center gap-3 px-3">
              {i > 0 && <span className="absolute -left-0.5 hidden h-10 w-px bg-border/60 lg:block" />}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-display text-lg font-black tracking-tight">{value}</p>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ==================== 4. FEATURED MATCHES ==================== */}
        <section id="matches" className="mb-24 scroll-mt-24">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                <Flame className="h-3.5 w-3.5" /> MEGA CONTESTS LIVE
              </div>
              <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
                Featured Upcoming Matches
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Pick an active fixture, build your fantasy team, and grab your share of the prize pool.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => handleAction("🏏 Login or register to browse all domestic & international matches!")}
              variant="outlineGreen"
              size="sm"
              className="w-fit gap-2 font-bold"
            >
              VIEW ALL MATCHES <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(realMatches.length > 0 ? realMatches.slice(0, 3) : featuredMatches.slice(0, 3)).map((m: any, idx: number) => {
              const isReal = !!m.series;
              const title = isReal ? m.series : m.tournament;
              const team1Flag = isReal ? m.teamAFlag || "🏏" : m.team1.flag;
              const team1Code = isReal ? m.teamACode : m.team1.code;
              const team1Name = isReal ? m.teamA : m.team1.name;
              const team2Flag = isReal ? m.teamBFlag || "🏏" : m.team2.flag;
              const team2Code = isReal ? m.teamBCode : m.team2.code;
              const team2Name = isReal ? m.teamB : m.team2.name;
              const isLive = isReal ? m.status === "LIVE" : idx === 0;

              return (
                <div
                  key={m.id || idx}
                  onClick={() =>
                    handleAction(`🏏 To enjoy live match score and fantasy betting for ${team1Code} vs ${team2Code}, please register and login yourself!`)
                  }
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/80 bg-surface/90 p-6 transition-all duration-300 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/15"
                >
                  {/* Header tag & countdown */}
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate max-w-[180px]">
                      {title}
                    </span>
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-black text-red-400 border border-red-500/40">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" /> LIVE
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-amber-400">
                        <Clock className="h-3 w-3" /> {isReal ? (m.statusText || "TODAY") : m.timeLeft}
                      </div>
                    )}
                  </div>

                  {/* Team Vs Team visual */}
                  <div className="my-6 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-2xl shadow-inner border border-border/60">
                        {team1Flag}
                      </div>
                      <div>
                        <p className="font-display text-lg font-black tracking-tight">{team1Code}</p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[90px]">{team1Name}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center px-1">
                      {isReal && isLive && m.scoreA ? (
                        <div className="text-center">
                          <p className="font-mono text-xs font-black text-primary">{m.scoreA.split(" ")[0]}</p>
                          <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary">LIVE</span>
                        </div>
                      ) : (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-display text-xs font-black text-primary">
                          VS
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 text-right">
                      <div>
                        <p className="font-display text-lg font-black tracking-tight">{team2Code}</p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[90px]">{team2Name}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-2xl shadow-inner border border-border/60">
                        {team2Flag}
                      </div>
                    </div>
                  </div>

                  {/* Status / Prize pool banner */}
                  <div className="rounded-xl border border-border/60 bg-surface-2/60 p-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Prize Pool</p>
                        <p className="font-display text-lg font-black text-primary">₹50,000 Free Pool</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Match Status</p>
                        <p className="text-xs font-bold text-amber-400 truncate max-w-[130px]">
                          {isReal ? (m.statusText || (isLive ? "In Progress" : "Scheduled")) : "Mega League"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card CTA */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Free Entry &bull; Instant UPI
                    </span>
                    <Button
                      type="button"
                      variant="hero"
                      size="sm"
                      className="gap-1.5 font-bold shadow-md shadow-primary/20 text-xs"
                    >
                      {isLive ? "VIEW LIVE SCORE" : "JOIN CONTEST"} <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ==================== 5. HOW TO PLAY ==================== */}
        <section id="how-to-play" className="mb-24 scroll-mt-24 rounded-3xl border border-border/80 bg-surface/50 p-8 lg:p-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Play className="h-3.5 w-3.5" /> 4 SIMPLE STEPS
            </div>
            <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
              How To Play & Win Cash
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Turn your cricket insight into real cash earnings in just four simple moves.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {howToPlaySteps.map((s, idx) => (
              <div
                key={s.step}
                className="relative flex flex-col justify-between rounded-2xl border border-border/80 bg-surface p-6 shadow-lg transition-transform hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-4xl font-black text-primary/40">{s.step}</span>
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {s.badge}
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-primary">
                  <Check className="h-4 w-4" /> Step {idx + 1} of 4
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Button
              type="button"
              onClick={() => handleAction("🏏 Ready to create your Dream XI? Register now to get started!")}
              variant="hero"
              size="lg"
              className="gap-2 font-bold shadow-lg shadow-primary/20"
            >
              CREATE YOUR TEAM NOW <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* ==================== 6. CONTEST TYPES ==================== */}
        <section id="contests" className="mb-24 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-md bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-400">
              <Trophy className="h-3.5 w-3.5" /> GAME FORMATS
            </div>
            <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
              A Contest For Every Strategy
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Whether you prefer massive multi-crore tournaments or high-odds head-to-head duels, we have it all.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {contestTypes.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="flex flex-col justify-between rounded-2xl border border-border/80 bg-surface/90 p-6 transition-all hover:border-primary/50 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${c.tagColor}`}>
                        {c.tag}
                      </span>
                    </div>

                    <h3 className="mt-5 font-display text-xl font-bold tracking-tight">{c.title}</h3>
                    <p className="text-xs font-semibold text-primary mt-0.5">{c.subtitle}</p>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{c.desc}</p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => handleAction(`🏏 Register to play in ${c.title}!`)}
                    variant="outline"
                    size="sm"
                    className="mt-6 w-full font-bold border-border/80 hover:border-primary"
                  >
                    ENTER CONTEST
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ==================== 7. WHY CHOOSE US ==================== */}
        <section id="why-us" className="mb-24 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> THE PLATFORM ADVANTAGE
            </div>
            <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
              Why 4 Crore+ Players Trust Us
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Built with bank-grade security, instantaneous payouts, and unmatched cricket gameplay.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {advantages.map((adv) => {
              const Icon = adv.icon;
              return (
                <div
                  key={adv.title}
                  className="rounded-2xl border border-border/80 bg-surface/80 p-6 transition-all hover:border-primary/40 hover:bg-surface"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold">{adv.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{adv.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ==================== 8. CHAMPIONS WALL ==================== */}
        <section id="winners" className="mb-24 scroll-mt-24 rounded-3xl border border-border/80 bg-surface/60 p-8 lg:p-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
              <Award className="h-3.5 w-3.5" /> HALL OF FAME
            </div>
            <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
              Real Players. Real Winnings.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              See what our recent champions have to say about their tournament triumphs.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {winners.map((w) => (
              <div
                key={w.name}
                className="flex flex-col justify-between rounded-2xl border border-border/80 bg-surface p-6 shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">
                        {w.avatar}
                      </div>
                      <div>
                        <p className="font-display text-sm font-bold">{w.name}</p>
                        <p className="text-[11px] text-muted-foreground">{w.location}</p>
                      </div>
                    </div>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                  </div>

                  <div className="my-4 rounded-lg bg-surface-2 p-3">
                    <p className="text-[11px] text-muted-foreground font-medium">Won in {w.contest}</p>
                    <p className="font-display text-2xl font-black text-primary">{w.won}</p>
                  </div>

                  <p className="text-xs italic leading-relaxed text-muted-foreground">"{w.quote}"</p>
                </div>

                <div className="mt-5 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verified Winner
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==================== 9. FAQ ACCORDION ==================== */}
        <section id="faq" className="mb-24 scroll-mt-24 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <HelpCircle className="h-3.5 w-3.5" /> FREQUENTLY ASKED QUESTIONS
            </div>
            <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
              Got Questions? We Have Answers.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything you need to know about deposits, legality, withdrawals, and scoring rules.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-border/80 bg-surface/80 p-6 backdrop-blur shadow-xl">
            <Accordion type="single" collapsible className="w-full space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/60 last:border-none">
                  <AccordionTrigger className="text-left font-display text-sm font-bold sm:text-base hover:text-primary">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ==================== 10. RESPONSIBLE PLAY & 18+ ADVISORY ==================== */}
        <section className="mb-20 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-black text-amber-400">
                  18+ ONLY
                </span>
                <h3 className="font-display text-base font-bold text-amber-300">
                  Play Responsibly & Statutory Advisory
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                This game involves an element of financial risk and may be addictive. Please play responsibly and at your
                own risk. Fantasy cricket is strictly prohibited for persons under the age of 18. This service is not
                offered in states where local laws restrict skill gaming (including Assam, Odisha, Telangana, Nagaland,
                Sikkim, and Andhra Pradesh).
              </p>
            </div>
          </div>
        </section>

        {/* ==================== 11. FOOTER ==================== */}
        <footer className="border-t border-border/60 pt-12 pb-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
            {/* Col 1: Brand */}
            <div className="space-y-4 md:col-span-1">
              <Logo size="md" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                India's most trusted fantasy cricket platform. Build your dream squad, compete against real managers, and
                cash out instant winnings 24/7.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <ShieldCheck className="h-4 w-4" /> 100% Legal Game of Skill
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Quick Links</p>
              <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground font-medium">
                <li>
                  <a href="#matches" className="hover:text-primary transition-colors">
                    Featured Matches
                  </a>
                </li>
                <li>
                  <a href="#how-to-play" className="hover:text-primary transition-colors">
                    How To Play
                  </a>
                </li>
                <li>
                  <a href="#contests" className="hover:text-primary transition-colors">
                    Contest Types
                  </a>
                </li>
                <li>
                  <Link to="/login" className="hover:text-primary transition-colors">
                    Login / Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-primary transition-colors">
                    Create Free Account
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Legal & Safety */}
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Legal & Fair Play</p>
              <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground font-medium">
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">Terms & Conditions</span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">Responsible Gaming Policy</span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">Fair Play Certification</span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">Legality in India</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Payment Partners */}
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                Payment Partners
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Instant 60-second withdrawals supported across all major networks:
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["UPI", "GPay", "PhonePe", "Paytm", "RuPay", "Visa", "Mastercard", "NetBanking"].map((method) => (
                  <span
                    key={method}
                    className="rounded-lg border border-border/80 bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-foreground/80 shadow-sm"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 text-center text-xs text-muted-foreground md:flex-row">
            <p>© 2026 Fantasy Cricket Inc. All Rights Reserved.</p>
            <p className="text-[11px]">Designed for Sports Champions across India. Play Responsibly.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

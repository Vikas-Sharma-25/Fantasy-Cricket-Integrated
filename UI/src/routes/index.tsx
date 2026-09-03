import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Trophy,
  Gift,
  ArrowRight,
  Play,
  Users,
  Headphones,
  LogIn,
  UserPlus,
  Sparkles,
} from "lucide-react";
import hero from "@/assets/hero-cricket.jpg";
import { Logo } from "@/components/fc/Logo";
import { Button } from "@/components/ui/button";
import { setFlow, FLOW_KEYS } from "@/lib/flow";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fantasy Cricket — Play Fantasy Cricket & Win Exciting Prizes" },
      {
        name: "description",
        content:
          "Build your dream team, join daily contests and win exciting prizes on India's most trusted fantasy cricket platform.",
      },
      { property: "og:title", content: "Play Fantasy Cricket" },
      {
        property: "og:description",
        content: "Build your dream team, join contests, and win exciting prizes.",
      },
    ],
  }),
  component: Landing,
});

const trust = [
  { icon: ShieldCheck, title: "100% SECURE", sub: "Safe & Trusted" },
  { icon: Trophy, title: "FAIR PLAY", sub: "Transparent & Fair" },
  { icon: Gift, title: "EXCITING REWARDS", sub: "Win Big Every Day" },
];

const stats = [
  { icon: Users, value: "4 CRORE+", label: "Happy Users" },
  { icon: Trophy, value: "10 LAKH+", label: "Daily Contests" },
  { icon: ShieldCheck, value: "100%", label: "Secure & Fair Play" },
  { icon: Gift, value: "EXCITING", label: "Rewards" },
  { icon: Headphones, value: "24X7", label: "Customer Support" },
];

function Landing() {
  const navigate = useNavigate();

  function handleExploreMatches() {
    setFlow(
      FLOW_KEYS.authPromptMsg,
      "🏏 Please register or login first to explore live matches, join mega contests, and compete for real rewards!",
    );
    navigate({ to: "/register" });
  }

  function handleHowToPlay() {
    setFlow(
      FLOW_KEYS.authPromptMsg,
      "🏏 Please register yourself first to explore How to Play and start creating your winning fantasy team!",
    );
    navigate({ to: "/register" });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Hero background image: firmly held bat, high-definition action under floodlights */}
      <div className="pointer-events-none absolute right-0 top-0 h-[880px] w-full max-w-[1100px] overflow-hidden opacity-95 lg:w-[65%]">
        <img
          src={hero}
          alt="Fantasy cricket batsman playing an explosive shot with bat firmly gripped in hands"
          className="h-full w-full object-cover object-center scale-100"
        />
        {/* Soft edge blend so the left side text is effortlessly readable */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,var(--background)_25%,oklch(0.16_0.018_265/0.75)_50%,oklch(0.16_0.018_265/0.15)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(180deg,transparent,var(--background))]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        {/* Nav */}
        <header className="flex items-center justify-between py-7">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <span className="mr-1 hidden h-8 w-px bg-border sm:block" />
            <Button asChild variant="outlineGreen" size="lg" className="gap-2 tracking-wide font-bold">
              <Link to="/login">
                <LogIn className="h-4 w-4" /> LOGIN
              </Link>
            </Button>
            <Button asChild variant="hero" size="lg" className="gap-2 tracking-wide font-bold">
              <Link to="/register">
                <UserPlus className="h-4 w-4" /> REGISTER
              </Link>
            </Button>
          </div>
        </header>

        {/* Hero copy */}
        <section className="max-w-2xl pb-16 pt-10 lg:pt-16">
          <div className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/90">
              India's most trusted fantasy platform
            </span>
          </div>

          <h1 className="mt-8 font-display text-6xl font-black uppercase leading-[0.94] tracking-tight sm:text-7xl lg:text-8xl">
            Play Fantasy
            <span className="mt-1 block text-primary">Cricket</span>
          </h1>

          <p className="mt-7 max-w-lg text-xl leading-snug text-foreground/90 font-medium">
            Build your dream team, join contests,
            <br />
            and win <span className="font-bold text-primary">exciting real prizes!</span>
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
            {trust.map(({ icon: Icon, title, sub }, i) => (
              <div key={title} className="flex items-center gap-3">
                {i > 0 && <span className="-ml-4 mr-1 hidden h-9 w-px bg-border sm:block" />}
                <Icon className="h-7 w-7 text-primary" />
                <div>
                  <p className="font-display text-sm font-bold">{title}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button
              type="button"
              onClick={handleExploreMatches}
              variant="hero"
              size="xl"
              className="gap-3 font-bold shadow-lg shadow-primary/20"
            >
              <Trophy className="h-5 w-5" /> EXPLORE MATCHES <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              onClick={handleHowToPlay}
              variant="outline"
              size="xl"
              className="gap-3 border-border bg-surface/80 font-bold hover:bg-surface-2"
            >
              <Play className="h-5 w-5 text-primary" /> HOW TO PLAY
            </Button>
          </div>
        </section>

        {/* Stats strip */}
        <section className="mb-14 grid grid-cols-2 gap-y-8 rounded-2xl border border-border bg-surface/80 px-8 py-8 backdrop-blur sm:grid-cols-3 lg:grid-cols-5 shadow-lg">
          {stats.map(({ icon: Icon, value, label }, i) => (
            <div key={label} className="relative flex items-center justify-center gap-3 px-2">
              {i > 0 && (
                <span className="absolute -left-0.5 hidden h-10 w-px bg-border lg:block" />
              )}
              <Icon className="h-8 w-8 shrink-0 text-primary" />
              <div>
                <p className="font-display text-lg font-bold leading-tight">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

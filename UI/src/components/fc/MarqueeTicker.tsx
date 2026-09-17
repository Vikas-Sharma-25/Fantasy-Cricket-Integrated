import { memo } from "react";
import { Trophy, Zap, Gift, Users, ShieldCheck, Target, Activity, Flame, Headphones, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarqueeTickerProps {
  compact?: boolean;
  className?: string;
}

const TICKER_ITEMS = [
  {
    id: "f-1",
    icon: Trophy,
    iconColor: "text-amber-500 dark:text-amber-400",
    badge: "FANTASY CRICKET",
    badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300",
    text: "Build Your Dream 11: Select Batsmen, Bowlers, WK & All-Rounders and Score with Real Cricket",
  },
  {
    id: "f-2",
    icon: Flame,
    iconColor: "text-orange-500 dark:text-orange-400",
    badge: "WIN REAL CASH",
    badgeBg: "bg-orange-500/15 border-orange-500/30 text-orange-700 dark:text-orange-300",
    text: "Turn Your Cricket Knowledge Into Real Money with ₹10+ Crore Guaranteed Daily Prize Pools",
  },
  {
    id: "f-3",
    icon: Zap,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badge: "INSTANT WITHDRAWAL",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    text: "Instant 60-Second Cashouts Straight to Your Bank Account or UPI (GPay, PhonePe, Paytm)",
  },
  {
    id: "f-4",
    icon: Gift,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badge: "100% BONUS",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    text: "Register Now & Claim 100% Cash Bonus on Your First Deposit Directly in Your Wallet",
  },
  {
    id: "f-5",
    icon: Target,
    iconColor: "text-purple-500 dark:text-purple-400",
    badge: "CONTEST FORMATS",
    badgeBg: "bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300",
    text: "Play Mega Jackpots, Head-to-Head (1v1 Duels), Winner-Takes-All & 100% Free Practice Leagues",
  },
  {
    id: "f-6",
    icon: Users,
    iconColor: "text-blue-500 dark:text-blue-400",
    badge: "PRIVATE CONTESTS",
    badgeBg: "bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300",
    text: "Create Custom Private Leagues, Set Custom Entry Fees, and Challenge Friends & Family",
  },
  {
    id: "f-7",
    icon: Activity,
    iconColor: "text-red-500 dark:text-red-400",
    badge: "LIVE SCORING",
    badgeBg: "bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-300",
    text: "Ultra-Fast Ball-by-Ball Fantasy Points & Real-Time Dynamic Leaderboard Tracking with Zero Latency",
  },
  {
    id: "f-8",
    icon: ShieldCheck,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badge: "100% LEGAL & SECURE",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    text: "Officially Recognized Game of Skill by Supreme Court • 256-Bit Bank-Grade SSL Encryption",
  },
  {
    id: "f-9",
    icon: CheckCircle2,
    iconColor: "text-cyan-500 dark:text-cyan-400",
    badge: "FAIR PLAY GUARANTEE",
    badgeBg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-700 dark:text-cyan-300",
    text: "Zero-Bot Policy & Advanced Anti-Fraud Algorithms Ensure Transparent and Fair Competition",
  },
  {
    id: "f-10",
    icon: Headphones,
    iconColor: "text-amber-500 dark:text-amber-400",
    badge: "24/7 SUPPORT",
    badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300",
    text: "Round-the-Clock VIP Customer Assistance via Live In-App Chat and WhatsApp Helpline",
  },
];

export const MarqueeTicker = memo(function MarqueeTicker({
  compact = false,
  className,
}: MarqueeTickerProps) {
  // We duplicate the list to make the infinite scroll smooth without jumps
  const loopItems = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div
      className={cn(
        "group relative flex w-full items-center overflow-hidden border-y border-border select-none",
        compact
          ? "h-9 bg-surface-2/70 text-xs shadow-xs"
          : "h-11 bg-surface/95 backdrop-blur shadow-sm",
        className
      )}
      aria-label="Platform Highlights & Features Ticker"
    >
      {/* Left Static Indicator Badge */}
      <div
        className={cn(
          "z-20 flex h-full shrink-0 items-center gap-1.5 border-r border-border px-3 font-display font-black tracking-wider uppercase backdrop-blur",
          compact
            ? "bg-surface-2 text-[10px] text-foreground"
            : "bg-surface text-xs text-foreground"
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="hidden sm:inline">WHAT WE OFFER</span>
        <span className="sm:hidden">OFFERS</span>
      </div>

      {/* Left Edge Gradient Blur */}
      <div className="pointer-events-none absolute left-24 sm:left-36 top-0 z-10 h-full w-12 bg-gradient-to-r from-surface to-transparent" />

      {/* Infinite Scrolling Ticker Track */}
      <div className="flex w-full overflow-hidden">
        <div className="animate-marquee-infinite flex items-center py-1">
          {loopItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={`${item.id}-${idx}`}
                className="inline-flex items-center gap-2 px-6 text-foreground/90 whitespace-nowrap transition-colors hover:text-foreground"
              >
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-bold uppercase tracking-wider",
                    compact ? "text-[9px]" : "text-[10px]",
                    item.badgeBg
                  )}
                >
                  <Icon className={cn("shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5", item.iconColor)} />
                  {item.badge}
                </span>

                <span
                  className={cn(
                    "font-medium tracking-tight",
                    compact ? "text-xs" : "text-sm",
                    "text-foreground"
                  )}
                >
                  {item.text}
                </span>

                <span className="mx-3 inline-block h-1 w-1 rounded-full bg-border" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Edge Gradient Blur */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-surface to-transparent" />
    </div>
  );
});


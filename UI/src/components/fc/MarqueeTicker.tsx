import { memo } from "react";
import { Trophy, Zap, Radio, Gift, Award, Flame, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarqueeTickerProps {
  compact?: boolean;
  className?: string;
}

const TICKER_ITEMS = [
  {
    id: "t-1",
    icon: Trophy,
    iconColor: "text-amber-500 dark:text-amber-400",
    badge: "MEGA POOL",
    badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300",
    text: "₹10+ CRORE Daily Prize Pool • IND vs AUS Mega Contest Filling Fast!",
    highlight: "₹10+ CRORE",
  },
  {
    id: "t-2",
    icon: Zap,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badge: "INSTANT UPI",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    text: "Rahul S. (Delhi) withdrew ₹1,25,000 via UPI in 38 seconds!",
    highlight: "₹1,25,000 in 38s",
  },
  {
    id: "t-3",
    icon: Radio,
    iconColor: "text-red-500 animate-pulse",
    badge: "LIVE MATCH",
    badgeBg: "bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-300",
    text: "EZONE 708 vs SZONE 176/5 (56 ov) • Duleep Trophy Final Day 3",
    highlight: "LIVE SCORES",
  },
  {
    id: "t-4",
    icon: Award,
    iconColor: "text-yellow-500 dark:text-yellow-400",
    badge: "TOP WINNER",
    badgeBg: "bg-yellow-500/15 border-yellow-500/30 text-yellow-800 dark:text-yellow-300",
    text: "Priya Patel from Pune won ₹10,50,000 in Grand Mega T20 League!",
    highlight: "₹10,50,000 Winner",
  },
  {
    id: "t-5",
    icon: Gift,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badge: "BONUS ALERT",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    text: "Register now & get ₹100 Welcome Bonus Cash directly in your wallet!",
    highlight: "₹100 Bonus",
  },
  {
    id: "t-6",
    icon: Flame,
    iconColor: "text-orange-500 dark:text-orange-400",
    badge: "HOT CONTEST",
    badgeBg: "bg-orange-500/15 border-orange-500/30 text-orange-700 dark:text-orange-300",
    text: "CSK vs MI Mega Clash • ₹50 Lakhs First Prize • 85% Spots Reserved!",
    highlight: "₹50 Lakhs First Prize",
  },
  {
    id: "t-7",
    icon: ShieldCheck,
    iconColor: "text-blue-500 dark:text-blue-400",
    badge: "100% LEGAL",
    badgeBg: "bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300",
    text: "Recognized Skill Game by Supreme Court of India • 256-Bit Bank Security",
    highlight: "Certified Fair Play",
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
      aria-label="Live Cricket & Contest Updates Ticker"
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
        <span className="hidden sm:inline">LIVE UPDATES</span>
        <span className="sm:hidden">LIVE</span>
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


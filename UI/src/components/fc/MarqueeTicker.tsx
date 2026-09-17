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
    text: "Pick 11 Players & Win Real Cash",
  },
  {
    id: "f-2",
    icon: Zap,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badge: "INSTANT WITHDRAWAL",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    text: "60-Second UPI & Bank Payouts",
  },
  {
    id: "f-3",
    icon: Gift,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badge: "WELCOME BONUS",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    text: "100% Cash Bonus on 1st Deposit",
  },
  {
    id: "f-4",
    icon: Flame,
    iconColor: "text-orange-500 dark:text-orange-400",
    badge: "MEGA POOLS",
    badgeBg: "bg-orange-500/15 border-orange-500/30 text-orange-700 dark:text-orange-300",
    text: "₹10+ Crore Daily Prize Pools",
  },
  {
    id: "f-5",
    icon: Target,
    iconColor: "text-purple-500 dark:text-purple-400",
    badge: "CONTESTS",
    badgeBg: "bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300",
    text: "Mega, 1v1 Duels & Free Leagues",
  },
  {
    id: "f-6",
    icon: Users,
    iconColor: "text-blue-500 dark:text-blue-400",
    badge: "PRIVATE LEAGUES",
    badgeBg: "bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300",
    text: "Create & Play with Friends",
  },
  {
    id: "f-7",
    icon: Activity,
    iconColor: "text-red-500 dark:text-red-400",
    badge: "LIVE SCORING",
    badgeBg: "bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-300",
    text: "Ball-by-Ball Real-Time Points",
  },
  {
    id: "f-8",
    icon: ShieldCheck,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badge: "100% LEGAL",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    text: "Govt. Recognized Game of Skill",
  },
  {
    id: "f-9",
    icon: CheckCircle2,
    iconColor: "text-cyan-500 dark:text-cyan-400",
    badge: "FAIR PLAY",
    badgeBg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-700 dark:text-cyan-300",
    text: "Zero-Bot Guarantee & 256-Bit SSL",
  },
  {
    id: "f-10",
    icon: Headphones,
    iconColor: "text-amber-500 dark:text-amber-400",
    badge: "24/7 SUPPORT",
    badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300",
    text: "Live In-App Chat & VIP Helpline",
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


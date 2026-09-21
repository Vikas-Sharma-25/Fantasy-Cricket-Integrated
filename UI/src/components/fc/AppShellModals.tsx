import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  X,
  Gift,
  Trophy,
  Wallet,
  CalendarDays,
  BarChart3,
  ShieldCheck,
  Settings,
  LifeBuoy,
  Sparkles,
  Check,
  Copy,
  ChevronRight,
  Flame,
  ArrowRight,
  Radio,
  Zap,
  Send,
  HelpCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  Coins,
  Share2,
  Bell,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/api-services";

export type NavModalType =
  | "rewards"
  | "transactions"
  | "fixtures"
  | "stats"
  | "kyc"
  | "settings"
  | "support"
  | "notifications"
  | null;

interface AppShellModalsProps {
  activeModal: NavModalType;
  onClose: () => void;
  walletBalance?: number;
  user?: any;
  onWalletUpdated?: (newBalance: number) => void;
}

export function AppShellModals({
  activeModal,
  onClose,
  walletBalance = 100,
  user,
  onWalletUpdated,
}: AppShellModalsProps) {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0f172a] border border-emerald-500/30 text-slate-100 shadow-2xl shadow-emerald-950/50 p-4 sm:p-6 space-y-5 scrollbar-thin scrollbar-thumb-emerald-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700 shadow"
        >
          <X className="h-5 w-5" />
        </button>

        {activeModal === "rewards" && (
          <RewardsModal
            walletBalance={walletBalance}
            onWalletUpdated={onWalletUpdated}
            onClose={onClose}
          />
        )}
        {activeModal === "transactions" && (
          <TransactionsModal
            walletBalance={walletBalance}
            onClose={onClose}
          />
        )}
        {activeModal === "fixtures" && <FixturesModal onClose={onClose} />}
        {activeModal === "stats" && <MatchStatisticsModal onClose={onClose} />}
        {activeModal === "kyc" && <KycModal user={user} onClose={onClose} />}
        {activeModal === "settings" && <SettingsModal onClose={onClose} />}
        {activeModal === "support" && <HelpSupportModal onClose={onClose} />}
        {activeModal === "notifications" && <NotificationsModal onClose={onClose} />}
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 1. REWARDS & BONUSES MODAL                                                */
/* ========================================================================= */
function RewardsModal({
  walletBalance,
  onWalletUpdated,
  onClose,
}: {
  walletBalance: number;
  onWalletUpdated?: (b: number) => void;
  onClose: () => void;
}) {
  const [streakClaimed, setStreakClaimed] = useState(false);
  const [spinClaimed, setSpinClaimed] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const referralCode = "VIKAS-CRIC-2026";

  const handleClaimStreak = () => {
    if (streakClaimed) return;
    setStreakClaimed(true);
    const reward = 50;
    const newBal = walletBalance + reward;
    if (onWalletUpdated) onWalletUpdated(newBal);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("wallet-updated", { detail: { walletBalance: newBal } })
      );
    }
  };

  const handleSpin = () => {
    if (spinClaimed || isSpinning) return;
    setIsSpinning(true);
    setTimeout(() => {
      setIsSpinning(false);
      setSpinClaimed(true);
      const wonAmount = 50;
      setSpinResult("🎉 You won ₹50 Bonus Cash!");
      const newBal = walletBalance + wonAmount;
      if (onWalletUpdated) onWalletUpdated(newBal);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("wallet-updated", { detail: { walletBalance: newBal } })
        );
      }
    }, 1800);
  };

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (code === "WELCOME100" || code === "IPL2026" || code === "BONUS50") {
      const amt = code === "WELCOME100" ? 100 : 50;
      setPromoMessage(`✅ Code "${code}" applied! ₹${amt} Bonus added!`);
      const newBal = walletBalance + amt;
      if (onWalletUpdated) onWalletUpdated(newBal);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("wallet-updated", { detail: { walletBalance: newBal } })
        );
      }
      setPromoInput("");
    } else {
      setPromoMessage("❌ Invalid promo code. Try WELCOME100 or IPL2026");
    }
  };

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center gap-3 border-b border-emerald-500/30 pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 text-slate-950 font-black shadow-lg shadow-amber-500/20">
          <Gift className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            REWARDS & BONUSES ARENA
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
              Free Daily Rewards
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Earn bonus cash, daily login streaks, spin rewards, and invite friends.
          </p>
        </div>
      </div>

      {/* 1. Daily Login Streak */}
      <div className="rounded-2xl border border-border/80 bg-slate-900/90 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-400 animate-pulse" />
            <h3 className="font-bold text-sm text-white">7-Day Login Streak</h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
            Day 4 Active 🔥
          </span>
        </div>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1">
          {[
            { day: "D1", reward: "₹10", status: "claimed" },
            { day: "D2", reward: "₹20", status: "claimed" },
            { day: "D3", reward: "₹30", status: "claimed" },
            { day: "D4", reward: "₹50", status: streakClaimed ? "claimed" : "ready" },
            { day: "D5", reward: "₹75", status: "locked" },
            { day: "D6", reward: "₹100", status: "locked" },
            { day: "D7", reward: "₹250", status: "locked", mega: true },
          ].map((d, idx) => (
            <div
              key={idx}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl text-center border transition-all",
                d.status === "claimed"
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : d.status === "ready"
                  ? "bg-amber-500/20 border-amber-400/80 text-amber-200 ring-2 ring-amber-400/40 scale-105"
                  : "bg-slate-800/40 border-slate-700/50 text-slate-500 opacity-60"
              )}
            >
              <span className="text-[10px] font-bold">{d.day}</span>
              <span className="font-black text-xs my-0.5">{d.reward}</span>
              {d.status === "claimed" ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : d.status === "ready" ? (
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-spin-slow" />
              ) : (
                <span className="text-[9px]">🔒</span>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          disabled={streakClaimed}
          onClick={handleClaimStreak}
          className={cn(
            "w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg",
            streakClaimed
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default"
              : "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 hover:scale-[1.01]"
          )}
        >
          {streakClaimed ? (
            <>
              <Check className="h-4 w-4" /> Day 4 Streak Claimed (+₹50 Added)
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Claim Day 4 Reward (₹50 Free Cash)
            </>
          )}
        </button>
      </div>

      {/* 2. Lucky Spin Wheel */}
      <div className="rounded-2xl border border-border/80 bg-slate-900/90 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Daily Lucky Spin</h3>
          </div>
          <span className="text-xs text-slate-400">1 Free Spin Available</span>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-[#0d2218] to-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-sm font-black text-white">
              Spin to Win Up to ₹500 Bonus Cash
            </p>
            <p className="text-xs text-slate-400">
              Prizes: ₹25, ₹50, ₹100, Free Contest Ticket, 2x Multiplier.
            </p>
            {spinResult && (
              <p className="text-xs font-bold text-emerald-400 animate-bounce pt-1">
                {spinResult}
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={spinClaimed || isSpinning}
            onClick={handleSpin}
            className={cn(
              "px-6 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-lg",
              spinClaimed
                ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
                : isSpinning
                ? "bg-amber-500 text-slate-950 animate-pulse"
                : "bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 hover:scale-105"
            )}
          >
            {isSpinning ? "Spinning Wheel..." : spinClaimed ? "Spun Today ✓" : "SPIN NOW 🎡"}
          </button>
        </div>
      </div>

      {/* 3. Refer & Earn ₹500 */}
      <div className="rounded-2xl border border-border/80 bg-slate-900/90 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-teal-400" />
          <h3 className="font-bold text-sm text-white">Refer Friends & Earn ₹500</h3>
        </div>
        <p className="text-xs text-slate-400">
          Share your referral code. When a friend joins and verifies their account, you get ₹500 and they get ₹100!
        </p>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-950 border border-emerald-500/40 rounded-xl px-4 py-2.5 font-mono text-sm font-black text-emerald-400 tracking-wider">
            {referralCode}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copiedCode ? "Copied!" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* 4. Redeem Promo Code */}
      <div className="rounded-2xl border border-border/80 bg-slate-900/90 p-4 space-y-3">
        <h3 className="font-bold text-sm text-white">Redeem Coupon Code</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Try: WELCOME100, IPL2026"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            className="flex-1 rounded-xl bg-slate-950 border border-border px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 uppercase"
          />
          <button
            type="button"
            onClick={handleApplyPromo}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
          >
            Apply Code
          </button>
        </div>
        {promoMessage && (
          <p className="text-xs font-semibold text-slate-300">{promoMessage}</p>
        )}
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 2. MY TRANSACTIONS PASSBOOK MODAL                                          */
/* ========================================================================= */
function TransactionsModal({
  walletBalance,
  onClose,
}: {
  walletBalance: number;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<"ALL" | "DEPOSIT" | "WITHDRAWAL" | "CONTEST">("ALL");

  const transactions = [
    {
      id: "TXN-9842109",
      title: "Contest Winnings • Mega Grand League 1st Rank",
      type: "WINNING",
      amount: "+₹2,500",
      time: "Today, 01:15 PM",
      status: "SUCCESS",
      category: "CONTEST",
    },
    {
      id: "TXN-8472911",
      title: "Contest Entry Fee • East Zone vs South Zone",
      type: "ENTRY",
      amount: "-₹49",
      time: "Today, 11:30 AM",
      status: "SUCCESS",
      category: "CONTEST",
    },
    {
      id: "TXN-7392014",
      title: "UPI Instant Add Cash • Google Pay",
      type: "DEPOSIT",
      amount: "+₹500",
      time: "Yesterday, 06:40 PM",
      status: "SUCCESS",
      category: "DEPOSIT",
    },
    {
      id: "TXN-6184920",
      title: "Bank Payout • State Bank of India (IMPS)",
      type: "WITHDRAWAL",
      amount: "-₹1,200",
      time: "Sep 18, 04:10 PM",
      status: "SUCCESS",
      category: "WITHDRAWAL",
    },
    {
      id: "TXN-5092147",
      title: "Welcome Registration 2FA Bonus",
      type: "BONUS",
      amount: "+₹100",
      time: "Sep 17, 10:00 AM",
      status: "SUCCESS",
      category: "DEPOSIT",
    },
  ];

  const filtered = transactions.filter((t) => {
    if (filter === "ALL") return true;
    return t.category === filter;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-emerald-500/30 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            MY TRANSACTIONS & PASSBOOK
          </h2>
          <p className="text-xs text-slate-400">
            Audit history of your deposits, contest entries, winnings, and payouts.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-slate-400">Available Balance</p>
          <p className="text-lg font-mono font-black text-emerald-400">₹{walletBalance}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(["ALL", "DEPOSIT", "WITHDRAWAL", "CONTEST"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              filter === tab
                ? "bg-emerald-500 text-slate-950 shadow"
                : "bg-slate-800 text-slate-400 hover:text-white"
            )}
          >
            {tab === "ALL" ? "All History" : tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
        {filtered.map((t) => {
          const isPositive = t.amount.startsWith("+");
          return (
            <div key={t.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors">
              <div className="space-y-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-white truncate">{t.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>{t.id}</span>
                  <span>•</span>
                  <span>{t.time}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold uppercase">{t.status}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={cn(
                    "text-sm sm:text-base font-mono font-black",
                    isPositive ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {t.amount}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 flex justify-end">
        <Link
          to="/wallet"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
        >
          <span>Open Full Wallet / Add Cash</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 3. SERIES & FIXTURES MODAL                                                 */
/* ========================================================================= */
function FixturesModal({ onClose }: { onClose: () => void }) {
  const tournaments = [
    {
      title: "Duleep Trophy 2026 (Final)",
      dates: "Ongoing • Sep 17 - 21",
      venue: "MA Chidambaram Stadium, Chennai",
      format: "First Class",
      teams: "East Zone vs South Zone",
      status: "LIVE NOW",
      isLive: true,
    },
    {
      title: "Women's Asia Cup T20I",
      dates: "Sep 15 - 28, 2026",
      venue: "Rangiri Dambulla International Stadium",
      format: "T20I • 8 Nations",
      teams: "India W, Pakistan W, Sri Lanka W, Bangladesh W",
      status: "LIVE RADAR",
      isLive: true,
    },
    {
      title: "Big Bash League 2026 (BBL 15)",
      dates: "Dec 12, 2026 - Jan 28, 2027",
      venue: "Melbourne, Sydney, Adelaide, Perth",
      format: "T20 • 44 Matches",
      teams: "8 Franchise Teams",
      status: "UPCOMING",
    },
    {
      title: "ICC Champions Trophy 2026",
      dates: "Feb 19 - Mar 09, 2027",
      venue: "Lahore, Karachi, Rawalpindi",
      format: "ODI • 15 Matches",
      teams: "Top 8 World Cricket Nations",
      status: "UPCOMING",
    },
    {
      title: "Indian Premier League 2027 (IPL 20)",
      dates: "Mar 24 - May 28, 2027",
      venue: "12 Prime Indian Venues",
      format: "T20 • 74 Matches",
      teams: "10 IPL Franchises",
      status: "UPCOMING",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="border-b border-emerald-500/30 pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          CRICKET SERIES & FIXTURES 2026-27
        </h2>
        <p className="text-xs text-slate-400">
          Official international schedules, franchise leagues, and BCCI domestic tournaments.
        </p>
      </div>

      <div className="space-y-3">
        {tournaments.map((t, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 hover:border-emerald-500/40 transition-all space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white text-sm">{t.title}</span>
              {t.isLive ? (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-black animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {t.status}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  {t.status}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300">{t.teams}</p>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-800/80">
              <span>📅 {t.dates}</span>
              <span>📍 {t.venue}</span>
              <span>🏏 {t.format}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 flex justify-end">
        <Link
          to="/matches"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow hover:brightness-110"
        >
          <span>Explore Matches Arena</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 4. MATCH STATISTICS & RECORDS HUB MODAL                                   */
/* ========================================================================= */
function MatchStatisticsModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"RUNS" | "WICKETS" | "FANTASY">("RUNS");

  return (
    <div className="space-y-5">
      <div className="border-b border-emerald-500/30 pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          CRICKET STATS & RECORDS HUB
        </h2>
        <p className="text-xs text-slate-400">
          Tournament leaderboards, Orange Cap run scorers, Purple Cap wicket takers, and MVP fantasy points.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("RUNS")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            tab === "RUNS"
              ? "bg-amber-500 text-slate-950 shadow"
              : "bg-slate-800 text-slate-400 hover:text-white"
          )}
        >
          🟠 Orange Cap (Runs)
        </button>
        <button
          type="button"
          onClick={() => setTab("WICKETS")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            tab === "WICKETS"
              ? "bg-purple-600 text-white shadow"
              : "bg-slate-800 text-slate-400 hover:text-white"
          )}
        >
          🟣 Purple Cap (Wickets)
        </button>
        <button
          type="button"
          onClick={() => setTab("FANTASY")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            tab === "FANTASY"
              ? "bg-emerald-500 text-slate-950 shadow"
              : "bg-slate-800 text-slate-400 hover:text-white"
          )}
        >
          🌟 MVP Fantasy Points
        </button>
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
        {tab === "RUNS" && (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-800 text-slate-300 font-bold border-b border-slate-700">
              <tr>
                <th className="p-3">Rank & Player</th>
                <th className="p-3">Team</th>
                <th className="p-3 text-right">Runs</th>
                <th className="p-3 text-right">SR</th>
                <th className="p-3 text-right">4s / 6s</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {[
                { rank: "#1", name: "Ishan Kishan", team: "East Zone", runs: "270", sr: "86.5", b: "28 / 7" },
                { rank: "#2", name: "Tilak Varma", team: "South Zone", runs: "194", sr: "78.2", b: "18 / 4" },
                { rank: "#3", name: "Heinrich Klaasen", team: "AMS", runs: "189", sr: "192.8", b: "14 / 12" },
                { rank: "#4", name: "Rohit Sharma", team: "India", runs: "165", sr: "148.6", b: "16 / 8" },
                { rank: "#5", name: "Babar Azam", team: "Pakistan", runs: "148", sr: "128.4", b: "15 / 3" },
              ].map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <span className="text-amber-400">{r.rank}</span>
                    <span>{r.name}</span>
                  </td>
                  <td className="p-3 text-slate-400">{r.team}</td>
                  <td className="p-3 text-right font-mono font-bold text-amber-400">{r.runs}</td>
                  <td className="p-3 text-right font-mono text-slate-300">{r.sr}</td>
                  <td className="p-3 text-right font-mono text-slate-400">{r.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "WICKETS" && (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-800 text-slate-300 font-bold border-b border-slate-700">
              <tr>
                <th className="p-3">Rank & Player</th>
                <th className="p-3">Team</th>
                <th className="p-3 text-right">Wickets</th>
                <th className="p-3 text-right">Economy</th>
                <th className="p-3 text-right">Best</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {[
                { rank: "#1", name: "Mohammed Shami", team: "East Zone", wkts: "9", eco: "2.85", best: "5/38" },
                { rank: "#2", name: "Nashra Sandhu", team: "Pakistan W", wkts: "6", eco: "3.10", best: "6/15" },
                { rank: "#3", name: "Jasprit Bumrah", team: "India", wkts: "5", eco: "3.80", best: "4/18" },
                { rank: "#4", name: "Adam Zampa", team: "AMS", wkts: "5", eco: "6.10", best: "3/24" },
                { rank: "#5", name: "Shaheen Afridi", team: "Pakistan", wkts: "4", eco: "5.40", best: "3/29" },
              ].map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <span className="text-purple-400">{r.rank}</span>
                    <span>{r.name}</span>
                  </td>
                  <td className="p-3 text-slate-400">{r.team}</td>
                  <td className="p-3 text-right font-mono font-bold text-purple-400">{r.wkts}</td>
                  <td className="p-3 text-right font-mono text-slate-300">{r.eco}</td>
                  <td className="p-3 text-right font-mono text-slate-400">{r.best}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "FANTASY" && (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-800 text-slate-300 font-bold border-b border-slate-700">
              <tr>
                <th className="p-3">MVP Player</th>
                <th className="p-3">Role</th>
                <th className="p-3 text-right">Points</th>
                <th className="p-3 text-right">Credits</th>
                <th className="p-3 text-right">Selected %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {[
                { name: "Ishan Kishan", role: "WK-Batsman", pts: "348", cr: "10.0", sel: "88.4%" },
                { name: "Mohammed Shami", role: "Bowler", pts: "215", cr: "9.5", sel: "79.1%" },
                { name: "Nashra Sandhu", role: "Bowler", pts: "198", cr: "8.5", sel: "62.0%" },
                { name: "Heinrich Klaasen", role: "WK-Batsman", pts: "184", cr: "9.0", sel: "84.5%" },
                { name: "Hardik Pandya", role: "All-Rounder", pts: "162", cr: "9.5", sel: "76.2%" },
              ].map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <span className="text-emerald-400">#{idx + 1}</span>
                    <span>{r.name}</span>
                  </td>
                  <td className="p-3 text-slate-400">{r.role}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">{r.pts} pts</td>
                  <td className="p-3 text-right font-mono text-slate-300">{r.cr}</td>
                  <td className="p-3 text-right font-mono text-slate-400">{r.sel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 5. KYC / VERIFICATION MODAL                                               */
/* ========================================================================= */
function KycModal({ user, onClose }: { user?: any; onClose: () => void }) {
  return (
    <div className="space-y-5">
      <div className="border-b border-emerald-500/30 pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          KYC & COMPLIANCE VERIFICATION
        </h2>
        <p className="text-xs text-slate-400">
          Government certified player identity, bank account binding, and tax compliance.
        </p>
      </div>

      {/* Verified Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-[#0a281e] to-slate-900 border border-emerald-500/50 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">
            100% Verified Player Account • Tier 3 Certified
          </h3>
          <p className="text-xs text-emerald-300/90">
            Account verified for unlimited instant withdrawals up to ₹1,00,000/day.
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Mobile & Email 2FA</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.2 rounded font-bold">VERIFIED ✓</span>
            </p>
            <p className="text-[11px] text-slate-400">{user?.email || "vikaskumarsharma2106@gmail.com"}</p>
          </div>
          <Check className="h-5 w-5 text-emerald-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>PAN Card Identity</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.2 rounded font-bold">VERIFIED ✓</span>
            </p>
            <p className="text-[11px] text-slate-400 font-mono">ABCDE••••F (TDS Tax Compliant)</p>
          </div>
          <Check className="h-5 w-5 text-emerald-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Bank Account & UPI</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.2 rounded font-bold">LINKED ✓</span>
            </p>
            <p className="text-[11px] text-slate-400">State Bank of India (••••4829) & UPI Enabled</p>
          </div>
          <Check className="h-5 w-5 text-emerald-400" />
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between">
        <p className="text-[11px] text-slate-400">
          Protected under Income Tax Act Section 194B • 100% Legal in India
        </p>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 6. SETTINGS MODAL                                                         */
/* ========================================================================= */
function SettingsModal({ onClose }: { onClose: () => void }) {
  const [audioReel, setAudioReel] = useState(true);
  const [wicketAlerts, setWicketAlerts] = useState(true);
  const [payoutAlerts, setPayoutAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-emerald-500/30 pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          ACCOUNT & GAME SETTINGS
        </h2>
        <p className="text-xs text-slate-400">
          Configure notifications, stadium audio, privacy, and matchday experience.
        </p>
      </div>

      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white">4K Arena Motion Reel Audio</p>
            <p className="text-[11px] text-slate-400">Enable stadium background music & match sound reel</p>
          </div>
          <input
            type="checkbox"
            checked={audioReel}
            onChange={(e) => setAudioReel(e.target.checked)}
            className="h-4 w-4 accent-emerald-500 cursor-pointer"
          />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white">Live Match Wicket Push Alerts</p>
            <p className="text-[11px] text-slate-400">Receive instant notification on every wicket fallen</p>
          </div>
          <input
            type="checkbox"
            checked={wicketAlerts}
            onChange={(e) => setWicketAlerts(e.target.checked)}
            className="h-4 w-4 accent-emerald-500 cursor-pointer"
          />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white">Contest Winning Announcements</p>
            <p className="text-[11px] text-slate-400">Notify immediately when prize money credits to wallet</p>
          </div>
          <input
            type="checkbox"
            checked={payoutAlerts}
            onChange={(e) => setPayoutAlerts(e.target.checked)}
            className="h-4 w-4 accent-emerald-500 cursor-pointer"
          />
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between">
        {saved ? (
          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
            <Check className="h-4 w-4" /> Preferences Saved!
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow hover:brightness-110"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 7. HELP & SUPPORT DESK MODAL                                              */
/* ========================================================================= */
function HelpSupportModal({ onClose }: { onClose: () => void }) {
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setTicketSubmitted(true);
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-emerald-500/30 pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          24x7 HELP & SUPPORT DESK
        </h2>
        <p className="text-xs text-slate-400">
          Our dedicated fantasy sports concierge is active 24x7 for all queries.
        </p>
      </div>

      {/* Quick Helpline Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
          <p className="text-xs font-bold text-white">📞 Toll-Free Helpline</p>
          <p className="text-xs font-mono text-emerald-400 font-bold">1800-2026-CRIC</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
          <p className="text-xs font-bold text-white">💬 WhatsApp Chat</p>
          <p className="text-xs font-mono text-emerald-400 font-bold">+91 98765 43210</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
          <p className="text-xs font-bold text-white">✉️ Support Email</p>
          <p className="text-[11px] font-mono text-emerald-400 truncate">support@fantasycricket.com</p>
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
          Frequently Asked Questions
        </h3>
        <div className="space-y-2 text-xs">
          <details className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 cursor-pointer">
            <summary className="font-bold text-white">How are fantasy points calculated?</summary>
            <p className="mt-2 text-slate-400 leading-relaxed">
              Runs (+1), 4s (+1 bonus), 6s (+2 bonus), 50 runs (+8 bonus), 100 runs (+16 bonus). Wickets (+25 pts). Captain receives 2x points and Vice-Captain receives 1.5x points.
            </p>
          </details>
          <details className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 cursor-pointer">
            <summary className="font-bold text-white">How fast are bank withdrawals processed?</summary>
            <p className="mt-2 text-slate-400 leading-relaxed">
              Withdrawals are processed in 10-30 seconds via instant IMPS / UPI directly into your verified bank account.
            </p>
          </details>
        </div>
      </div>

      {/* Raise Support Ticket */}
      <form onSubmit={handleSubmitTicket} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
          <Send className="h-3.5 w-3.5 text-emerald-400" />
          Raise a Priority Support Ticket
        </h3>

        {ticketSubmitted ? (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold space-y-1">
            <p>✅ Ticket #TKT-84920 Created Successfully!</p>
            <p className="text-[11px] font-normal text-slate-300">
              Our support team has received your ticket and will respond via email within 15 minutes.
            </p>
          </div>
        ) : (
          <>
            <input
              type="text"
              required
              placeholder="Subject (e.g. Withdrawal enquiry, Contest scoring)"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-border px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <textarea
              required
              rows={3}
              placeholder="Describe your query or issue in detail..."
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-border px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow"
            >
              Submit Support Ticket
            </button>
          </>
        )}
      </form>
    </div>
  );
}

/* ========================================================================= */
/* 8. NOTIFICATIONS MODAL                                                    */
/* ========================================================================= */
interface NotifItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "contest" | "wallet" | "live" | "promo";
}

const DEFAULT_NOTIFS: NotifItem[] = [
  {
    id: "n-1",
    title: "Mega Contest ₹10 Lakhs Filling Fast",
    description: "East Zone vs South Zone Duleep Trophy final contest has only 12% spots left. Join now!",
    time: "5m ago",
    read: false,
    type: "contest",
  },
  {
    id: "n-2",
    title: "Daily Streak Bonus Ready",
    description: "Your Day 1 streak reward of ₹20 Bonus Cash has been credited to your wallet balance.",
    time: "25m ago",
    read: false,
    type: "wallet",
  },
  {
    id: "n-3",
    title: "Live Match Ticker Active",
    description: "East Zone 708 mammoth total in play. Track real-time ball-by-ball commentary in Live Center.",
    time: "1h ago",
    read: true,
    type: "live",
  },
  {
    id: "n-4",
    title: "KYC Compliance Verified",
    description: "Your government identity has been verified. Maximum instant withdrawal limits unlocked.",
    time: "1d ago",
    read: true,
    type: "promo",
  },
];

function NotificationsModal({ onClose }: { onClose: () => void }) {
  const [filter, setFilter] = useState<"all" | "contest" | "wallet" | "live" | "promo">("all");
  const [items, setItems] = useState<NotifItem[]>(() => {
    try {
      const saved = localStorage.getItem("fc_cached_notifs");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_NOTIFS;
  });

  useEffect(() => {
    getUserNotifications()
      .then((res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          let readSet = new Set<string>();
          try {
            const savedRead = localStorage.getItem("fc_read_notification_ids");
            if (savedRead) readSet = new Set(JSON.parse(savedRead));
          } catch {}

          const mapped: NotifItem[] = res.map((r: any) => {
            const id = String(r._id || r.id || `notif-${Date.now()}`);
            const t = String(r.type || "system").toLowerCase();
            return {
              id,
              title: r.title || "Notification",
              description: r.message || r.description || "",
              time: "Recently",
              read: Boolean(r.isRead) || readSet.has(id),
              type: t.includes("contest")
                ? "contest"
                : t.includes("wallet")
                ? "wallet"
                : t.includes("live")
                ? "live"
                : "promo",
            };
          });
          setItems(mapped);
          try {
            localStorage.setItem("fc_cached_notifs", JSON.stringify(mapped));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const unreadCount = items.filter((i) => !i.read).length;

  const handleMarkAllRead = () => {
    try {
      const ids = items.map((i) => i.id);
      localStorage.setItem("fc_read_notification_ids", JSON.stringify(ids));
      void markAllNotificationsAsRead();
    } catch {}
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  };

  const handleDismiss = (id: string) => {
    try {
      let set = new Set<string>();
      const saved = localStorage.getItem("fc_read_notification_ids");
      if (saved) set = new Set(JSON.parse(saved));
      set.add(id);
      localStorage.setItem("fc_read_notification_ids", JSON.stringify(Array.from(set)));
      void markNotificationAsRead(id);
    } catch {}
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const filteredItems = items.filter((i) => {
    if (filter === "all") return true;
    return i.type === filter;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base sm:text-lg font-black text-white flex items-center gap-2">
              Notifications &amp; Alerts
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[10px] font-black text-red-400">
                  {unreadCount} new
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">Stay updated with live scores, contest deadlines &amp; rewards</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer self-start sm:self-auto"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(["all", "contest", "wallet", "live", "promo"] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap",
              filter === cat
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            )}
          >
            {cat === "all" ? "All Alerts" : cat}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1 scrollbar-thin">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            No notifications in this category.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "rounded-2xl border p-3.5 transition-all relative group",
                item.read
                  ? "bg-slate-900/50 border-slate-800/80 opacity-80"
                  : "bg-slate-900/90 border-emerald-500/30 shadow-md shadow-emerald-950/30"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl shrink-0 border",
                    item.type === "contest"
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      : item.type === "wallet"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : item.type === "live"
                      ? "bg-red-500/15 text-red-400 border-red-500/30"
                      : "bg-purple-500/15 text-purple-400 border-purple-500/30"
                  )}>
                    {item.type === "contest" ? (
                      <Trophy className="h-4 w-4" />
                    ) : item.type === "wallet" ? (
                      <Wallet className="h-4 w-4" />
                    ) : item.type === "live" ? (
                      <Radio className="h-4 w-4" />
                    ) : (
                      <Megaphone className="h-4 w-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white truncate">{item.title}</p>
                      {!item.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 animate-ping" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{item.time}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDismiss(item.id)}
                  title="Dismiss"
                  className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-300 leading-relaxed pl-10">
                {item.description}
              </p>

              {/* Action link */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between pl-10 text-[11px]">
                <span className="capitalize font-mono text-[10px] text-slate-500">
                  Category: {item.type}
                </span>
                <Link
                  to={item.type === "contest" ? "/contests" : item.type === "wallet" ? "/wallet" : "/matches"}
                  onClick={onClose}
                  className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open {item.type === "contest" ? "Contests" : item.type === "wallet" ? "Wallet" : "Matches"}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
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
  Coins,
  Share2,
  Bell,
  Megaphone,
  Users2,
  Search,
  Filter,
  CheckCircle2,
  CreditCard,
  MessageSquare,
  Phone,
  Mail,
  Volume2,
  BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  claimBonusApi,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/api-services";

export type NavSectionType =
  | "rewards"
  | "transactions"
  | "fixtures"
  | "stats"
  | "players"
  | "kyc"
  | "settings"
  | "support"
  | "notifications"
  | null;

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "contest" | "wallet" | "live" | "promo";
  createdAt?: string;
}

interface AppShellSectionViewProps {
  section: NavSectionType;
  onBack: () => void;
  walletBalance?: number;
  user?: any;
  onWalletUpdated?: (newBalance: number) => void;
  notifications?: NotificationItem[];
  onNotificationUpdate?: (notifications: NotificationItem[]) => void;
}

export function AppShellSectionView({
  section,
  onBack,
  walletBalance = 100,
  user,
  onWalletUpdated,
  notifications = [],
  onNotificationUpdate,
}: AppShellSectionViewProps) {
  if (!section) return null;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Breadcrumb & Back Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/15 bg-surface/80 hover:bg-surface-2 text-xs font-bold text-foreground transition-all hover:scale-105 cursor-pointer shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 text-primary" />
          <span>← Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <span>Fantasy Arena</span>
          <span>/</span>
          <span className="text-primary font-bold capitalize">
            {section === "rewards"
              ? "Rewards & Bonuses"
              : section === "transactions"
              ? "My Transactions"
              : section === "fixtures"
              ? "Series & Fixtures"
              : section === "stats"
              ? "Match Statistics"
              : section === "players"
              ? "Teams & Players"
              : section === "kyc"
              ? "KYC / Verification"
              : section === "settings"
              ? "Settings"
              : section === "support"
              ? "Help & Support"
              : "Notifications"}
          </span>
        </div>
      </div>

      {/* Section Content Views */}
      <div className="rounded-3xl border border-border/80 bg-surface/95 p-4 sm:p-7 shadow-2xl backdrop-blur-md">
        {section === "rewards" && (
          <RewardsSection
            walletBalance={walletBalance}
            onWalletUpdated={onWalletUpdated}
            onBack={onBack}
          />
        )}
        {section === "transactions" && (
          <TransactionsSection walletBalance={walletBalance} onBack={onBack} />
        )}
        {section === "fixtures" && <FixturesSection onBack={onBack} />}
        {section === "stats" && <MatchStatisticsSection onBack={onBack} />}
        {section === "players" && <TeamsPlayersSection onBack={onBack} />}
        {section === "kyc" && <KycSection user={user} onBack={onBack} />}
        {section === "settings" && <SettingsSection onBack={onBack} />}
        {section === "support" && <HelpSupportSection onBack={onBack} />}
        {section === "notifications" && (
          <NotificationsSection
            notifications={notifications}
            onNotificationUpdate={onNotificationUpdate}
            onBack={onBack}
          />
        )}
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 1. REWARDS & BONUSES SECTION                                              */
/* ========================================================================= */
export function RewardsSection({
  walletBalance,
  onWalletUpdated,
  onBack,
}: {
  walletBalance: number;
  onWalletUpdated?: (b: number) => void;
  onBack?: () => void;
}) {
  const getTodayStr = () => new Date().toISOString().slice(0, 10);
  const todayStr = getTodayStr();

  const [streakClaimed, setStreakClaimed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("fc_streak_claimed_date") === todayStr;
    } catch {
      return false;
    }
  });

  const [spinClaimed, setSpinClaimed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("fc_spin_claimed_date") === todayStr;
    } catch {
      return false;
    }
  });

  const [isClaimingStreak, setIsClaimingStreak] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const referralCode = "VIKAS-CRIC-2026";

  const handleClaimStreak = async () => {
    if (streakClaimed || isClaimingStreak) return;
    setIsClaimingStreak(true);
    setClaimFeedback(null);

    const reward = 50;
    try {
      // Call backend API to add ₹50 Cash Bonus to authenticated user wallet
      const res = await claimBonusApi(reward, "Day 4 Daily Streak Reward");
      const newBal = res?.walletBalance ?? walletBalance + reward;

      localStorage.setItem("fc_streak_claimed_date", todayStr);
      setStreakClaimed(true);
      setClaimFeedback(`🎉 ₹${reward} Cash Bonus credited successfully! New Wallet Balance: ₹${newBal}`);

      if (onWalletUpdated) onWalletUpdated(newBal);
    } catch {
      // Offline fallback: update local storage wallet and state
      const newBal = walletBalance + reward;
      try {
        localStorage.setItem("fc_streak_claimed_date", todayStr);
        const saved = localStorage.getItem("fc_user_wallet");
        const parsed = saved ? JSON.parse(saved) : { deposited: 0, winnings: 0, bonus: 0 };
        parsed.bonus = (parsed.bonus || 0) + reward;
        localStorage.setItem("fc_user_wallet", JSON.stringify(parsed));
      } catch {}

      setStreakClaimed(true);
      setClaimFeedback(`🎉 ₹${reward} Cash Bonus credited to your wallet! Balance: ₹${newBal}`);
      if (onWalletUpdated) onWalletUpdated(newBal);
      window.dispatchEvent(new CustomEvent("wallet-updated", { detail: { walletBalance: newBal } }));
    } finally {
      setIsClaimingStreak(false);
    }
  };

  const handleSpin = async () => {
    if (spinClaimed || isSpinning) return;
    setIsSpinning(true);
    setSpinResult(null);

    setTimeout(async () => {
      setIsSpinning(false);
      const wonAmount = 50;
      setSpinClaimed(true);
      setSpinResult(`🎉 You won ₹${wonAmount} Cash Bonus!`);
      localStorage.setItem("fc_spin_claimed_date", todayStr);

      try {
        const res = await claimBonusApi(wonAmount, "Daily Lucky Spin Bonus");
        const newBal = res?.walletBalance ?? walletBalance + wonAmount;
        if (onWalletUpdated) onWalletUpdated(newBal);
      } catch {
        const newBal = walletBalance + wonAmount;
        if (onWalletUpdated) onWalletUpdated(newBal);
        window.dispatchEvent(new CustomEvent("wallet-updated", { detail: { walletBalance: newBal } }));
      }
    }, 1500);
  };

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (code === "WELCOME100" || code === "IPL2026" || code === "BONUS50") {
      const amt = code === "WELCOME100" ? 100 : 50;
      setPromoMessage(`✅ Coupon "${code}" verified! Crediting ₹${amt} Cash Bonus...`);

      try {
        const res = await claimBonusApi(amt, `Coupon Code ${code}`);
        const newBal = res?.walletBalance ?? walletBalance + amt;
        setPromoMessage(`✅ Code "${code}" applied! ₹${amt} Cash Bonus added! Wallet: ₹${newBal}`);
        if (onWalletUpdated) onWalletUpdated(newBal);
      } catch {
        const newBal = walletBalance + amt;
        setPromoMessage(`✅ Code "${code}" applied! ₹${amt} Bonus added! Balance: ₹${newBal}`);
        if (onWalletUpdated) onWalletUpdated(newBal);
      }
      setPromoInput("");
    } else {
      setPromoMessage("❌ Invalid coupon code. Try WELCOME100 or IPL2026");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
              REWARDS &amp; BONUSES ARENA
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
                Free Cash Bonus
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Claim daily login streaks, spin rewards, bonus cash &amp; invite friends.
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right bg-surface-2/60 border border-border px-4 py-2 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Current Wallet Balance</p>
          <p className="text-xl font-mono font-black text-emerald-400">₹{walletBalance.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {claimFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-in fade-in duration-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{claimFeedback}</span>
        </div>
      )}

      {/* 1. Daily Login Streak */}
      <div className="rounded-2xl border border-border bg-surface-2/40 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-400 animate-pulse" />
            <h3 className="font-bold text-sm sm:text-base text-foreground">7-Day Daily Login Streak</h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
            Day 4 Active 🔥
          </span>
        </div>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 pt-1">
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
                "flex flex-col items-center justify-center p-3 rounded-2xl text-center border transition-all",
                d.status === "claimed"
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-sm"
                  : d.status === "ready"
                  ? "bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 scale-105 shadow-md"
                  : "bg-surface/40 border-border text-muted-foreground opacity-60"
              )}
            >
              <span className="text-[10px] font-bold tracking-wider">{d.day}</span>
              <span className="font-black text-sm my-1">{d.reward}</span>
              {d.status === "claimed" ? (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400">
                  <Check className="h-3.5 w-3.5" /> Claimed
                </span>
              ) : d.status === "ready" ? (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 animate-pulse">
                  <Sparkles className="h-3.5 w-3.5" /> Ready!
                </span>
              ) : (
                <span className="text-[10px] opacity-70">🔒 Locked</span>
              )}
            </div>
          ))}
        </div>

        {/* Claim Streak Button */}
        <button
          type="button"
          disabled={streakClaimed || isClaimingStreak}
          onClick={handleClaimStreak}
          className={cn(
            "w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg",
            streakClaimed
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default opacity-90"
              : isClaimingStreak
              ? "bg-amber-500 text-slate-950 animate-pulse"
              : "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 hover:brightness-110 hover:scale-[1.008]"
          )}
        >
          {streakClaimed ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              <span>Claimed for Today ✓ (Next bonus unlocked tomorrow)</span>
            </>
          ) : isClaimingStreak ? (
            <>
              <Sparkles className="h-4 w-4 animate-spin" />
              <span>Crediting ₹50 Cash Bonus to Wallet...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Claim Day 4 Reward (₹50 Free Cash Bonus)</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Lucky Spin Wheel */}
      <div className="rounded-2xl border border-border bg-surface-2/40 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base text-foreground">Daily Lucky Spin</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {spinClaimed ? "Spun for Today ✓" : "1 Free Spin Available"}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-[#0d2218] to-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-sm font-black text-white">
              Spin to Win Up to ₹500 Cash Bonus
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

      {/* 3. Refer Friends & Earn */}
      <div className="rounded-2xl border border-border bg-surface-2/40 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-teal-400" />
          <h3 className="font-bold text-sm sm:text-base text-foreground">Refer Friends &amp; Earn ₹500</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Share your referral code. When a friend joins and verifies their account, you get ₹500 and they get ₹100!
        </p>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-surface border border-emerald-500/40 rounded-xl px-4 py-2.5 font-mono text-sm font-black text-emerald-400 tracking-wider">
            {referralCode}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
          </button>
        </div>
      </div>

      {/* 4. Redeem Coupon Code */}
      <div className="rounded-2xl border border-border bg-surface-2/40 p-5 space-y-3">
        <h3 className="font-bold text-sm text-foreground">Redeem Bonus Coupon Code</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Try: WELCOME100, IPL2026"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            className="flex-1 rounded-xl bg-surface border border-border px-3.5 py-2 text-xs font-mono uppercase text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={handleApplyPromo}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shrink-0 shadow"
          >
            Apply Code
          </button>
        </div>
        {promoMessage && (
          <p className="text-xs font-bold text-emerald-400">{promoMessage}</p>
        )}
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 2. TRANSACTIONS SECTION                                                   */
/* ========================================================================= */
export function TransactionsSection({
  walletBalance,
  onBack,
}: {
  walletBalance: number;
  onBack?: () => void;
}) {
  const [filter, setFilter] = useState<"ALL" | "DEPOSIT" | "WITHDRAWAL" | "CONTEST" | "BONUS">("ALL");

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
      title: "Daily Streak Day 4 Cash Bonus",
      type: "BONUS",
      amount: "+₹50",
      time: "Sep 17, 10:00 AM",
      status: "SUCCESS",
      category: "BONUS",
    },
  ];

  const filtered = transactions.filter((t) => {
    if (filter === "ALL") return true;
    return t.category === filter;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            MY TRANSACTIONS &amp; PASSBOOK
          </h2>
          <p className="text-xs text-muted-foreground">
            Complete audit trail of deposits, withdrawals, contest entries, and cash bonuses.
          </p>
        </div>
        <div className="text-left sm:text-right bg-surface-2/60 border border-border px-4 py-2 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Available Balance</p>
          <p className="text-lg font-mono font-black text-emerald-400">₹{walletBalance.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(["ALL", "DEPOSIT", "WITHDRAWAL", "CONTEST", "BONUS"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
              filter === tab
                ? "bg-emerald-500 text-slate-950 shadow"
                : "bg-surface-2 border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "ALL" ? "All History" : tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="divide-y divide-border rounded-2xl border border-border bg-surface-2/40 overflow-hidden">
        {filtered.map((t) => {
          const isPositive = t.amount.startsWith("+");
          return (
            <div
              key={t.id}
              className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-surface-2/70 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-foreground truncate">{t.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
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
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
        >
          <span>Open Full Wallet / Add Cash</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 3. SERIES & FIXTURES SECTION                                              */
/* ========================================================================= */
export function FixturesSection({ onBack }: { onBack?: () => void }) {
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
      <div className="border-b border-border pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
          CRICKET SERIES &amp; FIXTURES 2026-27
        </h2>
        <p className="text-xs text-muted-foreground">
          Official international schedules, franchise leagues, and BCCI domestic tournaments.
        </p>
      </div>

      <div className="space-y-3">
        {tournaments.map((t, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-border bg-surface-2/40 p-4 hover:border-emerald-500/40 transition-all space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground text-sm">{t.title}</span>
              {t.isLive ? (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-black animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {t.status}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  {t.status}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground">{t.teams}</p>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-medium pt-2 border-t border-border/80">
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
/* 4. MATCH STATISTICS SECTION                                               */
/* ========================================================================= */
export function MatchStatisticsSection({ onBack }: { onBack?: () => void }) {
  const [tab, setTab] = useState<"RUNS" | "WICKETS" | "FANTASY">("RUNS");

  return (
    <div className="space-y-5">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
          CRICKET STATS &amp; RECORDS HUB
        </h2>
        <p className="text-xs text-muted-foreground">
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
              : "bg-surface-2 border border-border text-muted-foreground hover:text-foreground"
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
              : "bg-surface-2 border border-border text-muted-foreground hover:text-foreground"
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
              : "bg-surface-2 border border-border text-muted-foreground hover:text-foreground"
          )}
        >
          🌟 MVP Fantasy Points
        </button>
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl border border-border bg-surface-2/40 overflow-hidden">
        {tab === "RUNS" && (
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-2 text-muted-foreground font-bold border-b border-border">
              <tr>
                <th className="p-3">Rank &amp; Player</th>
                <th className="p-3">Team</th>
                <th className="p-3 text-right">Runs</th>
                <th className="p-3 text-right">SR</th>
                <th className="p-3 text-right">4s / 6s</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { rank: "#1", name: "Ishan Kishan", team: "East Zone", runs: "270", sr: "86.5", b: "28 / 7" },
                { rank: "#2", name: "Tilak Varma", team: "South Zone", runs: "194", sr: "78.2", b: "18 / 4" },
                { rank: "#3", name: "Heinrich Klaasen", team: "AMS", runs: "189", sr: "192.8", b: "14 / 12" },
                { rank: "#4", name: "Rohit Sharma", team: "India", runs: "165", sr: "148.6", b: "16 / 8" },
                { rank: "#5", name: "Babar Azam", team: "Pakistan", runs: "148", sr: "128.4", b: "15 / 3" },
              ].map((r, idx) => (
                <tr key={idx} className="hover:bg-surface-2/50">
                  <td className="p-3 font-bold text-foreground flex items-center gap-2">
                    <span className="text-amber-400">{r.rank}</span>
                    <span>{r.name}</span>
                  </td>
                  <td className="p-3 text-muted-foreground">{r.team}</td>
                  <td className="p-3 text-right font-mono font-bold text-amber-400">{r.runs}</td>
                  <td className="p-3 text-right font-mono text-foreground">{r.sr}</td>
                  <td className="p-3 text-right font-mono text-muted-foreground">{r.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "WICKETS" && (
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-2 text-muted-foreground font-bold border-b border-border">
              <tr>
                <th className="p-3">Rank &amp; Player</th>
                <th className="p-3">Team</th>
                <th className="p-3 text-right">Wickets</th>
                <th className="p-3 text-right">Economy</th>
                <th className="p-3 text-right">Best</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { rank: "#1", name: "Mohammed Shami", team: "East Zone", wkts: "9", eco: "2.85", best: "5/38" },
                { rank: "#2", name: "Nashra Sandhu", team: "Pakistan W", wkts: "6", eco: "3.10", best: "6/15" },
                { rank: "#3", name: "Jasprit Bumrah", team: "India", wkts: "5", eco: "3.80", best: "4/18" },
                { rank: "#4", name: "Adam Zampa", team: "AMS", wkts: "5", eco: "6.10", best: "3/24" },
                { rank: "#5", name: "Shaheen Afridi", team: "Pakistan", wkts: "4", eco: "5.40", best: "3/29" },
              ].map((r, idx) => (
                <tr key={idx} className="hover:bg-surface-2/50">
                  <td className="p-3 font-bold text-foreground flex items-center gap-2">
                    <span className="text-purple-400">{r.rank}</span>
                    <span>{r.name}</span>
                  </td>
                  <td className="p-3 text-muted-foreground">{r.team}</td>
                  <td className="p-3 text-right font-mono font-bold text-purple-400">{r.wkts}</td>
                  <td className="p-3 text-right font-mono text-foreground">{r.eco}</td>
                  <td className="p-3 text-right font-mono text-muted-foreground">{r.best}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "FANTASY" && (
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-2 text-muted-foreground font-bold border-b border-border">
              <tr>
                <th className="p-3">MVP Player</th>
                <th className="p-3">Role</th>
                <th className="p-3 text-right">Points</th>
                <th className="p-3 text-right">Credits</th>
                <th className="p-3 text-right">Selected %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { name: "Ishan Kishan", role: "WK-Batsman", pts: "348", cr: "10.0", sel: "88.4%" },
                { name: "Mohammed Shami", role: "Bowler", pts: "215", cr: "9.5", sel: "79.1%" },
                { name: "Nashra Sandhu", role: "Bowler", pts: "198", cr: "8.5", sel: "62.0%" },
                { name: "Heinrich Klaasen", role: "WK-Batsman", pts: "184", cr: "9.0", sel: "84.5%" },
                { name: "Hardik Pandya", role: "All-Rounder", pts: "162", cr: "9.5", sel: "76.2%" },
              ].map((r, idx) => (
                <tr key={idx} className="hover:bg-surface-2/50">
                  <td className="p-3 font-bold text-foreground flex items-center gap-2">
                    <span className="text-emerald-400">#{idx + 1}</span>
                    <span>{r.name}</span>
                  </td>
                  <td className="p-3 text-muted-foreground">{r.role}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">{r.pts} pts</td>
                  <td className="p-3 text-right font-mono text-foreground">{r.cr}</td>
                  <td className="p-3 text-right font-mono text-muted-foreground">{r.sel}</td>
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
/* 5. TEAMS & PLAYERS DIRECTORY SECTION (Replaces Empty Section in Pic 3)    */
/* ========================================================================= */
export function TeamsPlayersSection({ onBack }: { onBack?: () => void }) {
  const [activeTab, setActiveTab] = useState<"ALL" | "INTERNATIONAL" | "IPL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeamCode, setSelectedTeamCode] = useState<string>("IND");

  const teams = [
    {
      code: "IND",
      name: "India",
      type: "INTERNATIONAL",
      flag: "🇮🇳",
      captain: "Rohit Sharma",
      venue: "Wankhede Stadium, Mumbai",
      players: [
        { name: "Rohit Sharma", role: "Batsman", credits: 10.0, stats: "52 Matches • 3,853 Runs", style: "Right-Hand Bat" },
        { name: "Virat Kohli", role: "Batsman", credits: 10.5, stats: "115 Matches • 4,008 Runs", style: "Right-Hand Bat" },
        { name: "Jasprit Bumrah", role: "Bowler", credits: 10.0, stats: "62 Matches • 74 Wickets", style: "Right-Arm Fast" },
        { name: "Hardik Pandya", role: "All-Rounder", credits: 9.5, stats: "92 Matches • 1,348 Runs • 73 Wkts", style: "Right-Arm Fast-Med" },
        { name: "Rishabh Pant", role: "Wicket-Keeper", credits: 9.0, stats: "66 Matches • 987 Runs", style: "Left-Hand Bat" },
        { name: "Ravindra Jadeja", role: "All-Rounder", credits: 9.0, stats: "64 Matches • 53 Wickets", style: "Slow Left-Arm Orth" },
        { name: "Mohammed Shami", role: "Bowler", credits: 9.0, stats: "23 Matches • 24 Wickets", style: "Right-Arm Fast" },
        { name: "Shubman Gill", role: "Batsman", credits: 8.5, stats: "14 Matches • 578 Runs", style: "Right-Hand Bat" },
      ],
    },
    {
      code: "AUS",
      name: "Australia",
      type: "INTERNATIONAL",
      flag: "🇦🇺",
      captain: "Pat Cummins",
      venue: "Melbourne Cricket Ground",
      players: [
        { name: "Travis Head", role: "Batsman", credits: 10.0, stats: "38 Matches • 1,092 Runs", style: "Left-Hand Bat" },
        { name: "Pat Cummins", role: "Bowler", credits: 9.5, stats: "52 Matches • 57 Wickets", style: "Right-Arm Fast" },
        { name: "Glenn Maxwell", role: "All-Rounder", credits: 9.5, stats: "106 Matches • 2,468 Runs • 40 Wkts", style: "Right-Arm Offbreak" },
        { name: "Mitchell Starc", role: "Bowler", credits: 9.5, stats: "60 Matches • 73 Wickets", style: "Left-Arm Fast" },
        { name: "Josh Inglis", role: "Wicket-Keeper", credits: 8.5, stats: "26 Matches • 679 Runs", style: "Right-Hand Bat" },
        { name: "Josh Hazlewood", role: "Bowler", credits: 9.0, stats: "45 Matches • 61 Wickets", style: "Right-Arm Fast-Med" },
        { name: "Mitchell Marsh", role: "All-Rounder", credits: 9.0, stats: "54 Matches • 1,432 Runs", style: "Right-Arm Medium" },
      ],
    },
    {
      code: "ENG",
      name: "England",
      type: "INTERNATIONAL",
      flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      captain: "Jos Buttler",
      venue: "Lord's Cricket Ground, London",
      players: [
        { name: "Jos Buttler", role: "Wicket-Keeper", credits: 10.0, stats: "114 Matches • 2,927 Runs", style: "Right-Hand Bat" },
        { name: "Harry Brook", role: "Batsman", credits: 9.0, stats: "29 Matches • 544 Runs", style: "Right-Hand Bat" },
        { name: "Liam Livingstone", role: "All-Rounder", credits: 9.0, stats: "38 Matches • 640 Runs • 21 Wkts", style: "Right-Arm Legbreak" },
        { name: "Jofra Archer", role: "Bowler", credits: 9.5, stats: "20 Matches • 25 Wickets", style: "Right-Arm Fast" },
        { name: "Sam Curran", role: "All-Rounder", credits: 8.5, stats: "46 Matches • 49 Wickets", style: "Left-Arm Fast-Med" },
        { name: "Adil Rashid", role: "Bowler", credits: 9.0, stats: "104 Matches • 110 Wickets", style: "Right-Arm Legbreak" },
      ],
    },
    {
      code: "CSK",
      name: "Chennai Super Kings",
      type: "IPL",
      flag: "🦁",
      captain: "Ruturaj Gaikwad",
      venue: "MA Chidambaram Stadium, Chepauk",
      players: [
        { name: "Ruturaj Gaikwad", role: "Batsman", credits: 9.5, stats: "52 Matches • 1,797 Runs", style: "Right-Hand Bat" },
        { name: "MS Dhoni", role: "Wicket-Keeper", credits: 9.0, stats: "250 Matches • 5,082 Runs", style: "Right-Hand Bat" },
        { name: "Ravindra Jadeja", role: "All-Rounder", credits: 9.5, stats: "226 Matches • 2,692 Runs • 152 Wkts", style: "Slow Left-Arm Orth" },
        { name: "Shivam Dube", role: "All-Rounder", credits: 9.0, stats: "51 Matches • 1,106 Runs", style: "Right-Arm Medium" },
        { name: "Matheesha Pathirana", role: "Bowler", credits: 9.0, stats: "14 Matches • 21 Wickets", style: "Right-Arm Fast" },
        { name: "Deepak Chahar", role: "Bowler", credits: 8.5, stats: "73 Matches • 72 Wickets", style: "Right-Arm Fast-Med" },
      ],
    },
    {
      code: "MI",
      name: "Mumbai Indians",
      type: "IPL",
      flag: "💙",
      captain: "Hardik Pandya",
      venue: "Wankhede Stadium, Mumbai",
      players: [
        { name: "Rohit Sharma", role: "Batsman", credits: 10.0, stats: "243 Matches • 6,211 Runs", style: "Right-Hand Bat" },
        { name: "Suryakumar Yadav", role: "Batsman", credits: 10.0, stats: "139 Matches • 3,249 Runs", style: "Right-Hand Bat" },
        { name: "Jasprit Bumrah", role: "Bowler", credits: 10.5, stats: "120 Matches • 145 Wickets", style: "Right-Arm Fast" },
        { name: "Hardik Pandya", role: "All-Rounder", credits: 9.5, stats: "123 Matches • 2,309 Runs • 53 Wkts", style: "Right-Arm Fast-Med" },
        { name: "Tilak Varma", role: "Batsman", credits: 8.5, stats: "25 Matches • 740 Runs", style: "Left-Hand Bat" },
        { name: "Ishan Kishan", role: "Wicket-Keeper", credits: 9.0, stats: "91 Matches • 2,324 Runs", style: "Left-Hand Bat" },
      ],
    },
    {
      code: "RCB",
      name: "Royal Challengers Bengaluru",
      type: "IPL",
      flag: "🔴",
      captain: "Faf du Plessis",
      venue: "M. Chinnaswamy Stadium, Bengaluru",
      players: [
        { name: "Virat Kohli", role: "Batsman", credits: 10.5, stats: "237 Matches • 7,263 Runs", style: "Right-Hand Bat" },
        { name: "Faf du Plessis", role: "Batsman", credits: 9.5, stats: "130 Matches • 4,133 Runs", style: "Right-Hand Bat" },
        { name: "Glenn Maxwell", role: "All-Rounder", credits: 9.5, stats: "124 Matches • 2,719 Runs", style: "Right-Arm Offbreak" },
        { name: "Mohammed Siraj", role: "Bowler", credits: 9.0, stats: "79 Matches • 78 Wickets", style: "Right-Arm Fast" },
        { name: "Rajat Patidar", role: "Batsman", credits: 8.5, stats: "12 Matches • 404 Runs", style: "Right-Hand Bat" },
        { name: "Dinesh Karthik", role: "Wicket-Keeper", credits: 8.5, stats: "242 Matches • 4,516 Runs", style: "Right-Hand Bat" },
      ],
    },
  ];

  const filteredTeams = teams.filter((t) => {
    if (activeTab === "ALL") return true;
    return t.type === activeTab;
  });

  const currentTeam = teams.find((t) => t.code === selectedTeamCode) || filteredTeams[0] || teams[0];

  const filteredPlayers = (currentTeam?.players || []).filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Directory Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shrink-0">
            <Users2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
              TEAMS &amp; PLAYERS DIRECTORY
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                Official Rosters
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Official player profiles, batting/bowling statistics, fantasy credits &amp; team squads.
            </p>
          </div>
        </div>

        {/* Quick Link to Join a Match */}
        <Link
          to="/matches"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold transition-all hover:scale-105 shadow-md self-start sm:self-auto shrink-0"
        >
          <span>Select Match to Pick Playing XI</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(["ALL", "INTERNATIONAL", "IPL"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === tab
                  ? "bg-emerald-500 text-slate-950 shadow"
                  : "bg-surface-2 border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "ALL" ? "All Teams" : tab === "INTERNATIONAL" ? "International" : "IPL Franchises"}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search players or roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-2 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Team Pills Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filteredTeams.map((t) => (
          <button
            key={t.code}
            type="button"
            onClick={() => setSelectedTeamCode(t.code)}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border shrink-0",
              selectedTeamCode === t.code
                ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm ring-1 ring-emerald-500/30"
                : "bg-surface-2/60 border-border text-muted-foreground hover:text-foreground hover:bg-surface-2"
            )}
          >
            <span className="text-base">{t.flag}</span>
            <span>{t.name}</span>
            <span className="text-[10px] font-mono opacity-70">({t.code})</span>
          </button>
        ))}
      </div>

      {/* Selected Team Card Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-surface-2 via-surface to-surface-2 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{currentTeam.flag}</span>
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              {currentTeam.name} Squad
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted-foreground">
                Captain: {currentTeam.captain}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">Home Venue: {currentTeam.venue}</p>
          </div>
        </div>
        <div className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
          {filteredPlayers.length} Active Players Listed
        </div>
      </div>

      {/* Player Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredPlayers.map((p, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-border bg-surface-2/40 p-4 hover:border-emerald-500/40 hover:bg-surface-2/70 transition-all flex items-center justify-between gap-3"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground truncate">{p.name}</span>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.2 rounded-md uppercase shrink-0 border",
                    p.role.includes("Batsman")
                      ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                      : p.role.includes("Bowler")
                      ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                      : p.role.includes("All-Rounder")
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  )}
                >
                  {p.role}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">{p.style} • {p.stats}</p>
            </div>

            <div className="text-right shrink-0">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Credits</span>
              <span className="font-display text-sm font-black text-emerald-400">
                {p.credits.toFixed(1)} Cr
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Call to Action */}
      <div className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-950/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <p className="text-xs font-bold text-emerald-300">Ready to build your team and win real cash prizes?</p>
          <p className="text-[11px] text-muted-foreground">Pick 11 players within 100 credits in the Matches Arena.</p>
        </div>
        <Link
          to="/matches"
          className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:brightness-110 transition-all cursor-pointer shrink-0 shadow"
        >
          Go to Matches Arena &rarr;
        </Link>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 6. NOTIFICATIONS SECTION (Matches Header Dropdown Exactly - Pic 4 Fix)    */
/* ========================================================================= */
export function NotificationsSection({
  notifications = [],
  onNotificationUpdate,
  onBack,
}: {
  notifications?: NotificationItem[];
  onNotificationUpdate?: (notifications: NotificationItem[]) => void;
  onBack?: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "contest" | "wallet" | "live" | "promo">("all");
  const [items, setItems] = useState<NotificationItem[]>(notifications);

  // Sync with prop updates
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      setItems(notifications);
    }
  }, [notifications]);

  // Fallback load if prop was empty
  useEffect(() => {
    if (!items || items.length === 0) {
      getUserNotifications()
        .then((res: any) => {
          if (Array.isArray(res) && res.length > 0) {
            let readSet = new Set<string>();
            try {
              const savedRead = localStorage.getItem("fc_read_notification_ids");
              if (savedRead) readSet = new Set(JSON.parse(savedRead));
            } catch {}

            const mapped: NotificationItem[] = res.map((r: any) => {
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
                createdAt: r.createdAt,
              };
            });
            setItems(mapped);
            if (onNotificationUpdate) onNotificationUpdate(mapped);
          }
        })
        .catch(() => {});
    }
  }, []);

  const unreadCount = items.filter((i) => !i.read).length;

  const handleMarkAllRead = () => {
    try {
      const ids = items.map((i) => i.id);
      localStorage.setItem("fc_read_notification_ids", JSON.stringify(ids));
      void markAllNotificationsAsRead();
    } catch {}
    const updated = items.map((i) => ({ ...i, read: true }));
    setItems(updated);
    if (onNotificationUpdate) onNotificationUpdate(updated);
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
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    if (onNotificationUpdate) onNotificationUpdate(updated);
  };

  const filteredItems = items.filter((i) => {
    if (filter === "all") return true;
    return i.type === filter;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow shrink-0">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              Notifications &amp; Alerts Hub
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[10px] font-black text-red-400">
                  {unreadCount} new
                </span>
              )}
            </h2>
            <p className="text-xs text-muted-foreground">
              Stay synchronized with live scores, contest deadlines, bonus cash &amp; broadcasts.
            </p>
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
                : "bg-surface-2 border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {cat === "all" ? "All Alerts" : cat}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
            No notifications in this category.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "rounded-2xl border p-4 transition-all relative group flex items-start justify-between gap-3",
                item.read
                  ? "bg-surface-2/40 border-border/80 opacity-85"
                  : "bg-surface-2 border-emerald-500/40 shadow-sm"
              )}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black shrink-0 border mt-0.5",
                    item.type === "contest"
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : item.type === "wallet"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : item.type === "live"
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : "bg-purple-500/20 text-purple-400 border-purple-500/30"
                  )}
                >
                  {item.type === "contest" && <Trophy className="h-4 w-4" />}
                  {item.type === "wallet" && <Wallet className="h-4 w-4" />}
                  {item.type === "live" && <Radio className="h-4 w-4" />}
                  {item.type === "promo" && <Gift className="h-4 w-4" />}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold text-xs sm:text-sm text-foreground truncate">{item.title}</p>
                    {!item.read && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  <span className="block text-[10px] text-muted-foreground/70 font-mono pt-1">
                    {item.time}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDismiss(item.id)}
                className="text-[11px] text-muted-foreground hover:text-red-400 font-bold transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-red-500/10 shrink-0"
              >
                Dismiss
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 7. KYC / VERIFICATION SECTION                                             */
/* ========================================================================= */
export function KycSection({ user, onBack }: { user?: any; onBack?: () => void }) {
  return (
    <div className="space-y-5">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
          KYC &amp; COMPLIANCE VERIFICATION
        </h2>
        <p className="text-xs text-muted-foreground">
          Government certified player identity, bank account binding, and tax compliance.
        </p>
      </div>

      {/* Verified Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-[#0a281e] to-surface-2 border border-emerald-500/50 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
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
        <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Mobile &amp; Email 2FA</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.2 rounded font-bold">VERIFIED ✓</span>
            </p>
            <p className="text-[11px] text-muted-foreground">{user?.email || "vikaskumarsharma2106@gmail.com"}</p>
          </div>
          <Check className="h-5 w-5 text-emerald-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>PAN Card Identity</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.2 rounded font-bold">VERIFIED ✓</span>
            </p>
            <p className="text-[11px] text-muted-foreground font-mono">ABCDE••••F (TDS Tax Compliant)</p>
          </div>
          <Check className="h-5 w-5 text-emerald-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Bank Account &amp; UPI</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.2 rounded font-bold">LINKED ✓</span>
            </p>
            <p className="text-[11px] text-muted-foreground">State Bank of India (••••4829) &amp; UPI Enabled</p>
          </div>
          <Check className="h-5 w-5 text-emerald-400" />
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          Protected under Income Tax Act Section 194B • 100% Legal in India
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface border border-border text-foreground text-xs font-bold transition-all cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 8. SETTINGS SECTION                                                       */
/* ========================================================================= */
export function SettingsSection({ onBack }: { onBack?: () => void }) {
  const [audioReel, setAudioReel] = useState(true);
  const [wicketAlerts, setWicketAlerts] = useState(true);
  const [payoutAlerts, setPayoutAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      if (onBack) onBack();
    }, 1200);
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
          ACCOUNT &amp; GAME SETTINGS
        </h2>
        <p className="text-xs text-muted-foreground">
          Configure notifications, stadium audio, privacy, and matchday experience.
        </p>
      </div>

      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-foreground">4K Arena Motion Reel Audio</p>
            <p className="text-[11px] text-muted-foreground">Enable stadium background music &amp; match sound reel</p>
          </div>
          <input
            type="checkbox"
            checked={audioReel}
            onChange={(e) => setAudioReel(e.target.checked)}
            className="h-4 w-4 accent-emerald-500 rounded cursor-pointer"
          />
        </div>

        <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-foreground">Live Match Wicket Push Alerts</p>
            <p className="text-[11px] text-muted-foreground">Receive instant notification on every wicket fallen</p>
          </div>
          <input
            type="checkbox"
            checked={wicketAlerts}
            onChange={(e) => setWicketAlerts(e.target.checked)}
            className="h-4 w-4 accent-emerald-500 rounded cursor-pointer"
          />
        </div>

        <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-foreground">Contest Winning Announcements</p>
            <p className="text-[11px] text-muted-foreground">Notify immediately when prize money credits to wallet</p>
          </div>
          <input
            type="checkbox"
            checked={payoutAlerts}
            onChange={(e) => setPayoutAlerts(e.target.checked)}
            className="h-4 w-4 accent-emerald-500 rounded cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        {saved ? (
          <span className="text-xs font-bold text-emerald-400 animate-in fade-in">
            ✓ Preferences saved successfully!
          </span>
        ) : <span />}

        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 9. HELP & SUPPORT SECTION                                                 */
/* ========================================================================= */
export function HelpSupportSection({ onBack }: { onBack?: () => void }) {
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubject("");
      setTicketMessage("");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
          HELP &amp; 24X7 CUSTOMER SUPPORT
        </h2>
        <p className="text-xs text-muted-foreground">
          Instant answers, withdrawal support, and round-the-clock fantasy assistance.
        </p>
      </div>

      {/* Support Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border text-center space-y-1">
          <MessageSquare className="h-5 w-5 text-emerald-400 mx-auto" />
          <p className="text-xs font-bold text-foreground">Live Chat Agent</p>
          <p className="text-[10px] text-muted-foreground">Average wait: 30 secs</p>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border text-center space-y-1">
          <Phone className="h-5 w-5 text-teal-400 mx-auto" />
          <p className="text-xs font-bold text-foreground">WhatsApp Hotline</p>
          <p className="text-[10px] text-muted-foreground">+91 98765 43210</p>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border text-center space-y-1">
          <Mail className="h-5 w-5 text-blue-400 mx-auto" />
          <p className="text-xs font-bold text-foreground">Email Support</p>
          <p className="text-[10px] text-muted-foreground">support@fantasycricket.com</p>
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
          Frequently Asked Questions
        </h3>
        <div className="space-y-2 text-xs">
          <details className="rounded-xl border border-border bg-surface-2/50 p-3 cursor-pointer">
            <summary className="font-bold text-foreground">How are fantasy points calculated?</summary>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              Runs (+1), 4s (+1 bonus), 6s (+2 bonus), 50 runs (+8 bonus), 100 runs (+16 bonus). Wickets (+25 pts). Captain receives 2x points and Vice-Captain receives 1.5x points.
            </p>
          </details>
          <details className="rounded-xl border border-border bg-surface-2/50 p-3 cursor-pointer">
            <summary className="font-bold text-foreground">How fast are bank withdrawals processed?</summary>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              Withdrawals are processed in 10-30 seconds via instant IMPS / UPI directly into your verified bank account.
            </p>
          </details>
        </div>
      </div>

      {/* Raise Support Ticket */}
      <form onSubmit={handleSubmitTicket} className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase text-foreground tracking-wider flex items-center gap-1.5">
          <Send className="h-3.5 w-3.5 text-emerald-400" />
          Raise a Priority Support Ticket
        </h3>

        {ticketSubmitted ? (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold space-y-1">
            <p>✅ Ticket #TKT-84920 Created Successfully!</p>
            <p className="text-[11px] font-normal text-muted-foreground">
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
              className="w-full rounded-xl bg-surface border border-border px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500"
            />
            <textarea
              required
              rows={3}
              placeholder="Describe your query or issue in detail..."
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              className="w-full rounded-xl bg-surface border border-border px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 resize-none"
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


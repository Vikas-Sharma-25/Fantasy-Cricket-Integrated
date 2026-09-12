import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/fc/AppShell";
import { Card } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { getCachedUser } from "@/lib/api-services";
import type { User } from "@/lib/api-types";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Zap,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
  Lock,
  X,
  CreditCard,
  Building,
  Smartphone,
  ChevronRight,
  TrendingUp,
  Award
} from "lucide-react";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "My Wallet & Passbook — Fantasy Cricket" },
      { name: "description", content: "View your fantasy wallet balance, deposit funds, and withdraw winnings instantly." },
    ],
  }),
  component: WalletPage,
});

interface Transaction {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "CONTEST_WINNING" | "ENTRY_FEE" | "BONUS";
  title: string;
  amount: number;
  date: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  refId: string;
}

function WalletPage() {
  const [user, setUser] = useState<User | null>(() => getCachedUser());
  const [wallet, setWallet] = useState(() => {
    try {
      const saved = localStorage.getItem("fc_user_wallet");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      deposited: 500,
      winnings: 750,
      bonus: 300,
    };
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem("fc_wallet_txs");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "tx-101",
        type: "CONTEST_WINNING",
        title: "Mega Contest Rank #3 Prize",
        amount: 500,
        date: "Today, 02:45 PM",
        status: "SUCCESS",
        refId: "WIN-98231",
      },
      {
        id: "tx-102",
        type: "DEPOSIT",
        title: "Added Cash via UPI (GPay)",
        amount: 200,
        date: "Yesterday, 07:15 PM",
        status: "SUCCESS",
        refId: "UPI-48190",
      },
      {
        id: "tx-103",
        type: "ENTRY_FEE",
        title: "Entry Fee: IND vs AUS Mega Contest",
        amount: -49,
        date: "Sep 10, 06:30 PM",
        status: "SUCCESS",
        refId: "FEE-77123",
      },
      {
        id: "tx-104",
        type: "BONUS",
        title: "Sign-Up Cash Bonus Credited",
        amount: 300,
        date: "Sep 08, 11:00 AM",
        status: "SUCCESS",
        refId: "BNS-00192",
      },
    ];
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [addAmount, setAddAmount] = useState<number>(200);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sync wallet to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("fc_user_wallet", JSON.stringify(wallet));
    } catch {}
  }, [wallet]);

  useEffect(() => {
    try {
      localStorage.setItem("fc_wallet_txs", JSON.stringify(transactions));
    } catch {}
  }, [transactions]);

  const totalBalance = wallet.deposited + wallet.winnings + wallet.bonus;

  function handleAddCash(amount: number) {
    setWallet((prev: any) => ({ ...prev, deposited: prev.deposited + amount }));
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: "DEPOSIT",
      title: `Added Cash via Instant UPI`,
      amount: amount,
      date: "Just now",
      status: "SUCCESS",
      refId: `UPI-${Math.floor(10000 + Math.random() * 90000)}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
    setShowAddModal(false);
    setFeedback(`₹${amount} added successfully to your wallet!`);
    setTimeout(() => setFeedback(null), 4000);
  }

  function handleWithdraw() {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (amt > wallet.winnings) {
      alert(`Maximum withdrawable amount is ₹${wallet.winnings.toLocaleString("en-IN")}`);
      return;
    }
    setWallet((prev: any) => ({ ...prev, winnings: prev.winnings - amt }));
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: "WITHDRAWAL",
      title: `Instant Bank/UPI Withdrawal`,
      amount: -amt,
      date: "Just now",
      status: "SUCCESS",
      refId: `WDL-${Math.floor(10000 + Math.random() * 90000)}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
    setShowWithdrawModal(false);
    setWithdrawAmount("");
    setFeedback(`Withdrawal of ₹${amt} sent instantly to your linked bank account!`);
    setTimeout(() => setFeedback(null), 4000);
  }

  return (
    <AppShell maxWidth="max-w-4xl">
      <div className="space-y-6 pb-12">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/30">
                <Wallet className="h-5 w-5" />
              </div>
              <span>My Wallet & Passbook</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage your deposited funds, contest winnings, bonus cash, and instant payouts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="hero"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="font-bold flex items-center gap-1.5 shadow-md shadow-primary/20"
            >
              <Plus className="h-4 w-4" /> Add Cash
            </Button>
            <Button
              type="button"
              variant="outlineGreen"
              size="sm"
              onClick={() => setShowWithdrawModal(true)}
              className="font-bold flex items-center gap-1.5 bg-surface"
            >
              <ArrowUpRight className="h-4 w-4" /> Withdraw
            </Button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold animate-in fade-in-50">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Total Wallet Balance Card */}
        <Card className="border-border bg-gradient-to-br from-surface via-surface-2/40 to-surface p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
            <div>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Total Account Balance
              </p>
              <h2 className="font-mono text-3xl sm:text-4xl font-black text-primary mt-1">
                ₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-full">
              <Zap className="h-3.5 w-3.5 text-emerald-500" />
              <span>Instant 60s Bank & UPI Payouts</span>
            </div>
          </div>

          {/* 3 Sub-Wallets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold">Deposited Cash</span>
                <ArrowDownLeft className="h-4 w-4 text-primary" />
              </div>
              <p className="font-mono text-xl sm:text-2xl font-black text-foreground">
                ₹{wallet.deposited.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground">Used to enter cash contests</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
                <span className="text-xs font-bold">Winnings Cash</span>
                <Award className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="font-mono text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{wallet.winnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground">Eligible for instant withdrawal</p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold">Cash Bonus</span>
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
              <p className="font-mono text-xl sm:text-2xl font-black text-foreground">
                ₹{wallet.bonus.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground">Discount applied on entry fees</p>
            </div>
          </div>
        </Card>

        {/* KYC & Fair Play Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">KYC & Identity Verified</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Your account is verified for real cash transactions and legal fantasy cricket contests.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Instant Bank / UPI Transfer</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Automated 24x7 payouts supported on GPay, PhonePe, Paytm, and all major Indian banks.
              </p>
            </div>
          </div>
        </div>

        {/* Passbook / Transaction History */}
        <Card className="border-border bg-surface p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Passbook / Recent Transactions
            </h3>
            <span className="text-xs text-muted-foreground font-mono">{transactions.length} entries</span>
          </div>

          <div className="divide-y divide-border/60">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${
                      tx.amount > 0
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-surface-2 text-muted-foreground border border-border"
                    }`}
                  >
                    {tx.amount > 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{tx.title}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {tx.date} • Ref: {tx.refId}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`font-mono text-sm font-bold ${
                      tx.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                    }`}
                  >
                    {tx.amount > 0 ? `+₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`}
                  </p>
                  <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Add Cash Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="max-w-md w-full rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" /> Add Cash to Wallet
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-7 w-7 rounded-full bg-surface-2 flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground">Select Amount (₹)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAddAmount(amt)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        addAmount === amt
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-surface-2 text-foreground hover:bg-surface"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <input
                    type="number"
                    value={addAmount}
                    onChange={(e) => setAddAmount(Math.max(10, parseInt(e.target.value) || 0))}
                    className="w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-mono font-bold text-foreground outline-none focus:border-primary"
                    placeholder="Enter custom amount"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> 100% Safe & Secure Payments via Razorpay / UPI
                </p>
                <Button
                  type="button"
                  variant="hero"
                  size="xl"
                  onClick={() => handleAddCash(addAmount)}
                  className="w-full font-bold shadow-lg shadow-primary/20"
                >
                  PROCEED TO PAY ₹{addAmount}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Cash Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="max-w-md w-full rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" /> Withdraw Winnings
                </h3>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="h-7 w-7 rounded-full bg-surface-2 flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                <span>Withdrawable Balance: </span>
                <span className="font-mono font-bold">₹{wallet.winnings.toLocaleString("en-IN")}</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Enter Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Min ₹50, Max ₹50,000"
                  className="w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-mono font-bold text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-emerald-500" /> Funds transferred directly to your verified UPI / Bank
                </p>
                <Button
                  type="button"
                  variant="hero"
                  size="xl"
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  onClick={handleWithdraw}
                  className="w-full font-bold shadow-lg shadow-primary/20"
                >
                  WITHDRAW INSTANTLY
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}


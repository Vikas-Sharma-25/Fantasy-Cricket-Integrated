import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
  X,
  Building,
  Award,
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
      if (saved) {
        const parsed = JSON.parse(saved);
        const currentWinnings = typeof parsed.winnings === "number" ? parsed.winnings : 200;
        return {
          deposited: 100,
          winnings: currentWinnings,
          bonus: 100,
        };
      }
    } catch {}
    return {
      deposited: 100,
      winnings: 200,
      bonus: 100,
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
        amount: 100,
        date: "Sep 08, 11:00 AM",
        status: "SUCCESS",
        refId: "BNS-00192",
      },
    ];
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [addAmountInput, setAddAmountInput] = useState<string>("200");
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

  // Listen to external wallet updates
  useEffect(() => {
    if (typeof window !== "undefined") {
      function handleWalletSync() {
        try {
          const saved = localStorage.getItem("fc_user_wallet");
          if (saved) {
            const parsed = JSON.parse(saved);
            const currentWinnings = typeof parsed.winnings === "number" ? parsed.winnings : 200;
            setWallet({
              deposited: 100,
              winnings: currentWinnings,
              bonus: 100,
            });
          }
        } catch {}
        try {
          const txs = localStorage.getItem("fc_wallet_txs");
          if (txs) setTransactions(JSON.parse(txs));
        } catch {}
      }

      window.addEventListener("storage", handleWalletSync);
      window.addEventListener("user-profile-updated", handleWalletSync);
      return () => {
        window.removeEventListener("storage", handleWalletSync);
        window.removeEventListener("user-profile-updated", handleWalletSync);
      };
    }
  }, []);

  const totalBalance = wallet.deposited + wallet.winnings + 100;
  const numAdd = parseInt(addAmountInput, 10) || 0;
  const maxAllowedWithdrawal = Math.max(0, wallet.winnings);
  const numWithdraw = parseFloat(withdrawAmount) || 0;

  function handleAddCash(amount: number) {
    if (amount < 10 || amount > 50000) return;
    const updatedWallet = { deposited: 100, winnings: wallet.winnings + amount, bonus: 100 };
    setWallet(updatedWallet);
    try {
      localStorage.setItem("fc_user_wallet", JSON.stringify(updatedWallet));
      const total = 100 + updatedWallet.winnings + 100;
      const cached = getCachedUser();
      if (cached) {
        cached.walletBalance = total;
        cached.winningsBalance = updatedWallet.winnings;
        cached.depositedBalance = 100;
        localStorage.setItem("user", JSON.stringify(cached));
      }
      window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: cached }));
      window.dispatchEvent(new Event("storage"));
    } catch {}
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
    setFeedback(`₹${amount.toLocaleString("en-IN")} added successfully to your wallet!`);
    setTimeout(() => setFeedback(null), 4000);
  }

  function handleWithdraw() {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (amt > maxAllowedWithdrawal) {
      alert(`You can't withdraw this amount. Minimum ₹100 must remain deposited for maintenance.`);
      return;
    }
    const updatedWallet = { deposited: 100, winnings: Math.max(0, wallet.winnings - amt), bonus: 100 };
    setWallet(updatedWallet);
    try {
      localStorage.setItem("fc_user_wallet", JSON.stringify(updatedWallet));
      const total = 100 + updatedWallet.winnings + 100;
      const cached = getCachedUser();
      if (cached) {
        cached.walletBalance = total;
        cached.winningsBalance = updatedWallet.winnings;
        cached.depositedBalance = 100;
        localStorage.setItem("user", JSON.stringify(cached));
      }
      window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: cached }));
      window.dispatchEvent(new Event("storage"));
    } catch {}
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
    setFeedback(`Withdrawal of ₹${amt.toLocaleString("en-IN")} sent instantly! ₹100 remained deposited for maintenance.`);
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
              onClick={() => {
                setAddAmountInput("200");
                setShowAddModal(true);
              }}
              className="font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Cash
            </Button>
            <Button
              type="button"
              variant="outlineGreen"
              size="sm"
              onClick={() => {
                setWithdrawAmount("");
                setShowWithdrawModal(true);
              }}
              className="font-bold flex items-center gap-1.5 bg-surface cursor-pointer"
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
                <Sparkles className="h-3.5 w-3.5 text-primary" /> TOTAL ACCOUNT BALANCE
              </p>
              <h2 className="font-mono text-3xl sm:text-4xl font-black text-emerald-400 mt-1">
                ₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 px-3.5 py-1.5 rounded-full">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              <span>Instant 60s Bank & UPI Payouts</span>
            </div>
          </div>

          {/* 3 Sub-Wallets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-surface/80 p-4 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold">Deposited Cash</span>
                <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="font-mono text-xl sm:text-2xl font-black text-foreground">
                ₹{wallet.deposited.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground">Fixed maintenance deposit reserve</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-xs font-bold">Winnings Cash</span>
                <Award className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="font-mono text-xl sm:text-2xl font-black text-emerald-400">
                ₹{wallet.winnings.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground">Eligible for instant withdrawal</p>
            </div>

            <div className="rounded-2xl border border-border bg-surface/80 p-4 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold">Cash Bonus</span>
                <Sparkles className="h-4 w-4 text-amber-400" />
              </div>
              <p className="font-mono text-xl sm:text-2xl font-black text-foreground">
                ₹100.00
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
                  className="h-7 w-7 rounded-full bg-surface-2 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
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
                      onClick={() => setAddAmountInput(amt.toString())}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        parseInt(addAmountInput, 10) === amt
                          ? "border-primary bg-primary/15 text-primary shadow-xs"
                          : "border-border bg-surface-2 text-foreground hover:bg-surface"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                <div className="pt-1 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Enter Custom Amount (₹)</label>
                  <input
                    type="number"
                    value={addAmountInput}
                    onChange={(e) => setAddAmountInput(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-mono font-bold text-foreground outline-none focus:border-primary"
                    placeholder="Enter amount (e.g. 5000)"
                  />
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <span className="text-primary font-bold">ℹ️</span>
                    <span>You can add max ₹50,000 at a time and ₹2,00,000 in a day</span>
                  </p>
                  {numAdd > 50000 && (
                    <p className="text-[11px] text-destructive font-bold">
                      Maximum ₹50,000 can be added at a time.
                    </p>
                  )}
                  {addAmountInput !== "" && numAdd > 0 && numAdd < 10 && (
                    <p className="text-[11px] text-amber-500 font-semibold">
                      Minimum deposit amount is ₹10.
                    </p>
                  )}
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
                  disabled={numAdd < 10 || numAdd > 50000}
                  onClick={() => handleAddCash(numAdd)}
                  className="w-full font-bold shadow-lg shadow-primary/20 cursor-pointer"
                >
                  PROCEED TO PAY ₹{numAdd > 0 ? numAdd.toLocaleString("en-IN") : 0}
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
                  className="h-7 w-7 rounded-full bg-surface-2 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Dynamic Withdrawable Balance Box */}
              {maxAllowedWithdrawal <= 0 ? (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>Withdrawable Balance:</span>
                    <span className="font-mono text-sm">₹0</span>
                  </div>
                  <p className="text-[11px] font-bold text-destructive">
                    You can't withdraw this amount. Minimum ₹100 must remain deposited for maintenance.
                  </p>
                </div>
              ) : numWithdraw > maxAllowedWithdrawal ? (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>Withdrawable Balance:</span>
                    <span className="font-mono text-sm">₹{maxAllowedWithdrawal.toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-[11px] font-bold text-destructive">
                    You can't withdraw this amount. Minimum ₹100 must remain deposited for maintenance.
                  </p>
                </div>
              ) : numWithdraw > 0 ? (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>Withdrawable Balance:</span>
                    <span className="font-mono text-sm">₹{maxAllowedWithdrawal.toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
                    Now you can only withdraw ₹{(maxAllowedWithdrawal - numWithdraw).toLocaleString("en-IN")} and ₹100 will be deposited for maintenance
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>Withdrawable Balance:</span>
                    <span className="font-mono text-sm">₹{maxAllowedWithdrawal.toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    First time you can withdraw only ₹{maxAllowedWithdrawal.toLocaleString("en-IN")} and ₹100 is deposited for maintenance.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Enter Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  placeholder={maxAllowedWithdrawal > 0 ? `e.g. 500 (Max ₹${maxAllowedWithdrawal.toLocaleString("en-IN")})` : "₹0 Withdrawable"}
                  disabled={maxAllowedWithdrawal <= 0}
                  className="w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-mono font-bold text-foreground outline-none focus:border-primary disabled:opacity-50"
                />
                <p className="text-[10.5px] text-muted-foreground">
                  {maxAllowedWithdrawal > 0
                    ? `Max withdrawable: ₹${maxAllowedWithdrawal.toLocaleString("en-IN")} • ₹100 retained for maintenance`
                    : `Minimum ₹100 maintenance deposit required before withdrawal`}
                </p>
              </div>

              {/* Demo Helper if balance depleted */}
              {maxAllowedWithdrawal <= 0 && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { deposited: 100, winnings: 600, bonus: 100 };
                      setWallet(updated);
                      localStorage.setItem("fc_user_wallet", JSON.stringify(updated));
                      const cached = getCachedUser();
                      if (cached) {
                        cached.walletBalance = 800;
                        cached.winningsBalance = 600;
                        cached.depositedBalance = 100;
                        localStorage.setItem("user", JSON.stringify(cached));
                      }
                      window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: cached }));
                      window.dispatchEvent(new Event("storage"));
                    }}
                    className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                  >
                    + Reset Demo Winnings to ₹600 (Total ₹800 with ₹100 Dep + ₹100 Bonus)
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-emerald-500" /> Funds transferred directly to your verified UPI / Bank
                </p>
                <Button
                  type="button"
                  variant="hero"
                  size="xl"
                  disabled={
                    maxAllowedWithdrawal <= 0 ||
                    numWithdraw <= 0 ||
                    numWithdraw > maxAllowedWithdrawal
                  }
                  onClick={handleWithdraw}
                  className="w-full font-bold shadow-lg shadow-primary/20 cursor-pointer"
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

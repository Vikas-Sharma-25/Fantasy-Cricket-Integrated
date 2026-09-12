import { useEffect, useState, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  LogOut,
  Bell,
  ChevronRight,
  Users,
  Trophy,
  Receipt,
  Gift,
  Settings,
  LifeBuoy,
  Camera,
  Loader2,
  CloudUpload,
  Eye,
  Trash2,
  RefreshCw,
  X,
  ShieldAlert,
  Crown,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Sparkles,
  HelpCircle,
  Plus
} from "lucide-react";
import { AppShell } from "@/components/fc/AppShell";
import { Card } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as apiServices from "@/lib/api-services";
import type { User } from "@/lib/api-types";

export const Route = createFileRoute("/profile")({ component: Profile });

const menu = [
  { icon: Users, label: "My Teams", to: "/my-teams" },
  { icon: Trophy, label: "My Contests", to: "/contests" },
  { icon: Receipt, label: "Match Results", to: "/results" },
  { icon: HelpCircle, label: "Fantasy Point Rules", to: "/rules" },
  { icon: Gift, label: "Refer & Earn (Win ₹100)", to: "/matches" },
  { icon: Bell, label: "Notifications & Alerts", to: "/matches" },
  { icon: LifeBuoy, label: "Help & Support 24x7", to: "/matches" }
];

interface WalletState {
  deposited: number;
  winnings: number;
  bonus: number;
}

const DEFAULT_WALLET: WalletState = {
  deposited: 500,
  winnings: 1000,
  bonus: 50
};

interface TransactionItem {
  id: string;
  type: "DEPOSIT" | "WINNING" | "BONUS" | "WITHDRAWAL";
  title: string;
  amount: number;
  date: string;
  status: "COMPLETED" | "PROCESSING";
}

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => apiServices.getCachedUser());
  const [avatarUrl, setAvatarUrl] = useState<string>(() => apiServices.getCachedUser()?.profileImage || "");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Interactive Wallet State
  const [wallet, setWallet] = useState<WalletState>(() => {
    try {
      const saved = localStorage.getItem("fc_user_wallet");
      return saved ? JSON.parse(saved) : DEFAULT_WALLET;
    } catch {
      return DEFAULT_WALLET;
    }
  });

  const [transactions, setTransactions] = useState<TransactionItem[]>([
    {
      id: "tx-1",
      type: "WINNING",
      title: "Mega Contest Rank #4 Payout",
      amount: 1000,
      date: "Today, 02:45 PM",
      status: "COMPLETED"
    },
    {
      id: "tx-2",
      type: "DEPOSIT",
      title: "UPI Deposit (Google Pay)",
      amount: 500,
      date: "Yesterday, 06:10 PM",
      status: "COMPLETED"
    },
    {
      id: "tx-3",
      type: "BONUS",
      title: "Welcome Signup Bonus",
      amount: 50,
      date: "3 days ago",
      status: "COMPLETED"
    }
  ]);

  const [showAddCashModal, setShowAddCashModal] = useState(false);
  const [addAmount, setAddAmount] = useState<number>(200);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);
  const [walletFeedback, setWalletFeedback] = useState<string | null>(null);

  useEffect(() => {
    const cached = apiServices.getCachedUser();
    if (cached) {
      setUser(cached);
      setAvatarUrl(cached.profileImage || "");
    }
    void apiServices
      .getMe()
      .then((data) => {
        if (data) {
          setUser(data);
          apiServices.setCachedUser(data);
          setAvatarUrl(data.profileImage || "");
        }
      })
      .catch(() => {
        navigate({ to: "/login" });
      });
  }, [navigate]);

  // Persist wallet changes
  useEffect(() => {
    try {
      localStorage.setItem("fc_user_wallet", JSON.stringify(wallet));
    } catch {}
  }, [wallet]);

  // Close camera menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  function handleCameraClick() {
    const currentImg = avatarUrl || user?.profileImage;
    if (currentImg) {
      setShowMenu((prev) => !prev);
    } else {
      fileInputRef.current?.click();
    }
  }

  function handleViewProfilePic() {
    setShowMenu(false);
    const currentImg = avatarUrl || user?.profileImage;
    if (currentImg) {
      window.open(currentImg, "_blank");
    }
  }

  function handleChangeProfilePic() {
    setShowMenu(false);
    fileInputRef.current?.click();
  }

  async function handleDeleteProfilePic() {
    setShowMenu(false);
    try {
      setUploading(true);
      setUploadMessage("Deleting profile picture...");
      const updatedUser = await apiServices.updateProfile({ profileImage: "" });
      setAvatarUrl("");
      const cleared = updatedUser || (user ? { ...user, profileImage: "" } : null);
      if (cleared) {
        setUser(cleared);
        apiServices.setCachedUser(cleared);
        window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: cleared }));
      }
      setUploadMessage("Profile picture deleted successfully!");
      setTimeout(() => setUploadMessage(""), 3000);
    } catch (err: any) {
      setUploadMessage(`Delete failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadMessage("Uploading to S3...");
      const s3Url = await apiServices.uploadFileToS3(file, "avatars");

      setAvatarUrl(s3Url);
      const optimisticUser = user ? { ...user, profileImage: s3Url } : null;
      if (optimisticUser) {
        setUser(optimisticUser);
        apiServices.setCachedUser(optimisticUser);
        window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: optimisticUser }));
      }

      const updatedUser = await apiServices.updateProfile({ profileImage: s3Url });
      const finalUser = updatedUser || optimisticUser;
      if (finalUser) {
        setUser(finalUser);
        apiServices.setCachedUser(finalUser);
        window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: finalUser }));
      }

      setUploadMessage("Uploaded successfully!");
      setTimeout(() => setUploadMessage(""), 4000);
    } catch (err: any) {
      setUploadMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleAddCash() {
    if (addAmount <= 0) return;
    setWallet((prev) => ({ ...prev, deposited: prev.deposited + addAmount }));
    setTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        type: "DEPOSIT",
        title: "Instant UPI Deposit",
        amount: addAmount,
        date: "Just now",
        status: "COMPLETED"
      },
      ...prev
    ]);
    setShowAddCashModal(false);
    setWalletFeedback(`Successfully added ₹${addAmount} to your wallet!`);
    setTimeout(() => setWalletFeedback(null), 4000);
  }

  function handleWithdraw() {
    if (withdrawAmount <= 0) return;
    if (withdrawAmount > wallet.winnings) {
      alert("Withdrawal amount cannot exceed your available Winnings balance.");
      return;
    }
    setWallet((prev) => ({ ...prev, winnings: prev.winnings - withdrawAmount }));
    setTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        type: "WITHDRAWAL",
        title: "Bank IMPS Withdrawal",
        amount: withdrawAmount,
        date: "Just now",
        status: "COMPLETED"
      },
      ...prev
    ]);
    setShowWithdrawModal(false);
    setWalletFeedback(`Withdrawal request of ₹${withdrawAmount} initiated to your linked bank account!`);
    setTimeout(() => setWalletFeedback(null), 4000);
  }

  async function logout() {
    await apiServices.logoutUser();
    navigate({ to: "/login" });
  }

  const currentAvatar = avatarUrl || user?.profileImage;
  const totalBalance = wallet.deposited + wallet.winnings + wallet.bonus;

  return (
    <AppShell maxWidth="max-w-4xl">
      <div className="space-y-6 pb-12">
        {/* Feedback Alert */}
        {walletFeedback && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-in fade-in-50">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{walletFeedback}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PROFILE HEADER CARD                                           */}
        {/* ------------------------------------------------------------- */}
        <Card className="flex flex-col gap-5 sm:flex-row sm:items-center p-6 border-border shadow-lg bg-surface/90">
          <div className="relative inline-block shrink-0" ref={menuRef}>
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt="Avatar"
                onClick={handleCameraClick}
                className="h-20 w-20 rounded-full border-2 border-primary object-cover cursor-pointer transition-opacity hover:opacity-90 shadow-md"
                title="Click for options"
              />
            ) : (
              <span
                onClick={handleCameraClick}
                className="flex h-20 w-20 items-center justify-center rounded-full gradient-primary font-display text-2xl font-bold text-primary-foreground shadow-md cursor-pointer"
              >
                {(user?.name || "U").slice(0, 2).toUpperCase()}
              </span>
            )}
            <button
              type="button"
              disabled={uploading}
              onClick={handleCameraClick}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 disabled:opacity-50 cursor-pointer"
              title="Profile Picture Options"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>

            {/* Profile Picture Popup Menu (View, Change, Delete) */}
            {showMenu && (
              <div className="absolute left-0 top-full mt-2 z-50 w-56 rounded-xl border border-border bg-surface-2 p-1.5 shadow-2xl backdrop-blur animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/60 mb-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Profile Photo
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMenu(false)}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleViewProfilePic}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-surface transition-colors cursor-pointer"
                >
                  <Eye className="h-4 w-4 text-primary" />
                  <span>View Profile Pic</span>
                </button>

                <button
                  type="button"
                  onClick={handleChangeProfilePic}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-surface transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4 text-emerald-400" />
                  <span>Change Profile</span>
                </button>

                <div className="my-1 h-px bg-border/60" />

                <button
                  type="button"
                  onClick={handleDeleteProfilePic}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span>Delete Profile Pic</span>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-xl font-bold text-foreground">
                {user?.name || "Player"}
              </h2>
              {user?.role === "super_admin" ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-purple-500/40 bg-purple-500/20 text-purple-300">
                  <Crown className="h-3.5 w-3.5 text-purple-400" /> Super Admin
                </span>
              ) : user?.role === "admin" ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 text-emerald-300">
                  <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" /> Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-primary/40 bg-primary/15 text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified Player
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
            {user?.mobile && (
              <p className="text-xs text-muted-foreground/80 font-mono">📱 +91 {user.mobile}</p>
            )}

            {uploadMessage && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-primary font-medium animate-pulse">
                <CloudUpload className="h-3.5 w-3.5" /> {uploadMessage}
              </p>
            )}
          </div>
        </Card>

        {/* ------------------------------------------------------------- */}
        {/* WALLET & PASSBOOK CARD (COMPREHENSIVE FANTASY WALLET)          */}
        {/* ------------------------------------------------------------- */}
        <Card className="border-border bg-gradient-to-br from-surface via-surface-2/30 to-surface p-6 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Total Wallet Balance
                </p>
                <h3 className="font-mono text-2xl sm:text-3xl font-black text-emerald-400">
                  ₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                size="sm"
                onClick={() => setShowAddCashModal(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold gap-1.5 text-xs shadow cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Cash
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowWithdrawModal(true)}
                className="border-border hover:bg-surface-2 text-foreground font-semibold gap-1.5 text-xs cursor-pointer"
              >
                <ArrowUpRight className="h-4 w-4 text-emerald-400" /> Withdraw
              </Button>
            </div>
          </div>

          {/* 3-Column Wallet Breakdown */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="p-4 rounded-xl bg-surface-2/60 border border-border">
              <p className="text-[11px] font-semibold text-muted-foreground">Unutilized Deposit</p>
              <p className="font-mono text-lg font-bold text-foreground mt-1">
                ₹{wallet.deposited.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Use 100% to join any contest</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-emerald-400">Winnings (Withdrawable)</p>
                <span className="text-[9px] font-bold text-emerald-300 uppercase px-1.5 py-0.5 rounded bg-emerald-500/20">
                  Instant
                </span>
              </div>
              <p className="font-mono text-lg font-black text-emerald-400 mt-1">
                ₹{wallet.winnings.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Direct to Bank / UPI</p>
            </div>

            <div className="p-4 rounded-xl bg-surface-2/60 border border-border">
              <p className="text-[11px] font-semibold text-muted-foreground">Cash Bonus</p>
              <p className="font-mono text-lg font-bold text-foreground mt-1">
                ₹{wallet.bonus.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Applicable up to 10% on entry fee</p>
            </div>
          </div>

          {/* Recent Passbook Transactions */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5 text-primary" /> Recent Wallet Activity
            </h4>
            <div className="divide-y divide-border/60 rounded-xl border border-border bg-background/50 overflow-hidden">
              {transactions.slice(0, 4).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 text-xs hover:bg-surface-2/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg",
                        tx.type === "WITHDRAWAL"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-emerald-500/15 text-emerald-400"
                      )}
                    >
                      {tx.type === "WITHDRAWAL" ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{tx.title}</p>
                      <p className="text-[10px] text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold">
                    <span
                      className={
                        tx.type === "WITHDRAWAL" ? "text-destructive" : "text-emerald-400"
                      }
                    >
                      {tx.type === "WITHDRAWAL" ? `-₹${tx.amount}` : `+₹${tx.amount}`}
                    </span>
                    <p className="text-[9px] text-muted-foreground font-sans font-normal uppercase">
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ------------------------------------------------------------- */}
        {/* ELEVATED ADMIN CONSOLE BANNER (if Admin or Super Admin)       */}
        {/* ------------------------------------------------------------- */}
        {(user?.role === "admin" || user?.role === "super_admin") && (
          <Card className="p-0 overflow-hidden border-border shadow-md">
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-3.5 px-5 py-4 text-sm font-bold transition-all cursor-pointer",
                user.role === "super_admin"
                  ? "bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-surface hover:from-purple-950/60 text-purple-200 border-l-4 border-l-purple-500"
                  : "bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-surface hover:from-emerald-950/60 text-emerald-200 border-l-4 border-l-emerald-500"
              )}
            >
              {user.role === "super_admin" ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">
                  <Crown className="h-5 w-5" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-bold text-base text-foreground">
                  {user.role === "super_admin" ? "Super Admin Authority Console" : "Admin Management Console"}
                </p>
                <p className="text-xs text-muted-foreground font-normal">
                  Manage matches, user roles, contest prize pools & live scoring rules
                </p>
              </div>
              <span
                className={cn(
                  "text-xs font-black uppercase px-3 py-1 rounded-xl border shadow",
                  user.role === "super_admin"
                    ? "border-purple-500/50 bg-purple-500/30 text-purple-200"
                    : "border-emerald-500/50 bg-emerald-500/30 text-emerald-200"
                )}
              >
                Access Console &rarr;
              </span>
            </Link>
          </Card>
        )}

        {/* ------------------------------------------------------------- */}
        {/* QUICK MENU NAVIGATION LINKS                                   */}
        {/* ------------------------------------------------------------- */}
        <Card className="p-0 overflow-hidden border-border shadow-md">
          {menu.map(({ icon: Icon, label, to }) => (
            <Link
              key={label}
              to={to}
              className="flex items-center gap-3.5 border-b border-border/70 px-5 py-4 text-sm font-medium last:border-0 hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-primary border border-border">
                <Icon className="h-4 w-4" />
              </div>
              <span className="flex-1 text-foreground font-semibold">{label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </Card>

        {/* LOGOUT BUTTON */}
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3.5 text-sm font-bold text-destructive transition-colors hover:bg-destructive/20 cursor-pointer"
        >
          <LogOut className="h-4 w-4" /> Logout from Fantasy Cricket
        </button>

        {/* ------------------------------------------------------------- */}
        {/* ADD CASH MODAL                                                */}
        {/* ------------------------------------------------------------- */}
        {showAddCashModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md p-6 bg-surface border-border shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-display font-bold text-base text-foreground">Add Cash to Wallet</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCashModal(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-semibold">Enter Amount (₹)</label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={addAmount}
                  onChange={(e) => setAddAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full mt-1.5 px-3 py-2.5 rounded-xl border border-border bg-background font-mono text-xl font-bold text-foreground"
                />
              </div>

              {/* Presets */}
              <div className="flex items-center gap-2">
                {[100, 200, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAddAmount(preset)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer",
                      addAmount === preset
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                        : "bg-surface-2 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    +₹{preset}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button variant="outline" size="sm" onClick={() => setShowAddCashModal(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddCash}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Add ₹{addAmount}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* WITHDRAW MODAL                                                */}
        {/* ------------------------------------------------------------- */}
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md p-6 bg-surface border-border shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-display font-bold text-base text-foreground">Withdraw Winnings</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                <p className="text-muted-foreground">Available Withdrawable Winnings:</p>
                <p className="font-mono text-lg font-black text-emerald-400">₹{wallet.winnings.toFixed(2)}</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-semibold">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  min="100"
                  max={wallet.winnings}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full mt-1.5 px-3 py-2.5 rounded-xl border border-border bg-background font-mono text-xl font-bold text-foreground"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button variant="outline" size="sm" onClick={() => setShowWithdrawModal(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleWithdraw}
                  disabled={wallet.winnings < 100}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Withdraw ₹{withdrawAmount}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

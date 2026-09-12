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
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  Phone,
  Mail,
  MessageSquare,
  Sparkles,
  Edit3,
  ExternalLink,
  ChevronDown,
  Info
} from "lucide-react";
import { AppShell } from "@/components/fc/AppShell";
import { Card } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as apiServices from "@/lib/api-services";
import type { User, AppNotification } from "@/lib/api-types";
import { setFlow, FLOW_KEYS } from "@/lib/flow";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile & Account — Fantasy Cricket" },
      { name: "description", content: "Manage your profile, fantasy teams, scoring rules, referrals and account preferences." },
    ],
  }),
  component: Profile,
});

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => apiServices.getCachedUser());
  const [avatarUrl, setAvatarUrl] = useState<string>(() => apiServices.getCachedUser()?.profileImage || "");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoMenuRef = useRef<HTMLDivElement>(null);

  // Stats
  const [teamCount, setTeamCount] = useState<number>(0);
  const [contestCount, setContestCount] = useState<number>(0);

  // Modals
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [showReferModal, setShowReferModal] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);

  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);
  const [ticketSubject, setTicketSubject] = useState("Withdrawal & Payments");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const cached = apiServices.getCachedUser();
    if (cached) {
      setUser(cached);
      setAvatarUrl(cached.profileImage || "");
      setEditName(cached.name || "");
      setEditMobile(cached.mobile || "");
    }
    void apiServices
      .getMe()
      .then((data) => {
        if (data) {
          setUser(data);
          apiServices.setCachedUser(data);
          setAvatarUrl(data.profileImage || "");
          setEditName(data.name || "");
          setEditMobile(data.mobile || "");
        }
      })
      .catch(() => {
        navigate({ to: "/login" });
      });

    // Load fantasy user stats
    void apiServices.getMyTeams().then((teams) => setTeamCount(teams.length)).catch(() => {});
    void apiServices.getMyContests().then((contests) => setContestCount(contests.length)).catch(() => {});
  }, [navigate]);

  // Close photo menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (photoMenuRef.current && !photoMenuRef.current.contains(e.target as Node)) {
        setShowPhotoMenu(false);
      }
    }
    if (showPhotoMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPhotoMenu]);

  // Load notifications when modal opens
  useEffect(() => {
    if (showNotifModal) {
      setLoadingNotifs(true);
      void apiServices
        .getUserNotifications()
        .then((items) => {
          if (Array.isArray(items) && items.length > 0) {
            setNotifications(items);
          } else {
            setNotifications([
              {
                id: "notif-1",
                title: "Welcome to Fantasy Cricket Arena!",
                message: "Your profile is KYC verified and ready for real cash contests.",
                isRead: true,
                createdAt: new Date().toISOString(),
              },
              {
                id: "notif-2",
                title: "Mega Contest ₹50,000 Announcement",
                message: "New high-roller contests added with 100% guaranteed prize pools.",
                isRead: false,
                createdAt: new Date(Date.now() - 3600000).toISOString(),
              }
            ]);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingNotifs(false));
    }
  }, [showNotifModal]);

  function handleCameraClick() {
    const currentImg = avatarUrl || user?.profileImage;
    if (currentImg) {
      setShowPhotoMenu((prev) => !prev);
    } else {
      fileInputRef.current?.click();
    }
  }

  function handleViewProfilePic() {
    setShowPhotoMenu(false);
    const currentImg = avatarUrl || user?.profileImage;
    if (currentImg) {
      window.open(currentImg, "_blank");
    }
  }

  function handleChangeProfilePic() {
    setShowPhotoMenu(false);
    fileInputRef.current?.click();
  }

  async function handleDeleteProfilePic() {
    setShowPhotoMenu(false);
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
      showToast("Profile picture removed successfully");
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadMessage("");
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadMessage("Uploading to cloud...");
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

      showToast("Profile photo updated successfully!");
    } catch (err: any) {
      showToast(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadMessage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim()) return;
    try {
      setSavingProfile(true);
      const updated = await apiServices.updateProfile({
        name: editName.trim(),
        mobile: editMobile.trim() || undefined,
      });
      if (updated) {
        setUser(updated);
        apiServices.setCachedUser(updated);
        window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: updated }));
      }
      setShowEditProfileModal(false);
      showToast("Profile details updated successfully!");
    } catch (err: any) {
      showToast(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function logout() {
    const confirmed = window.confirm("Are you sure you want to log out from Fantasy Cricket Arena?");
    if (!confirmed) return;
    await apiServices.logoutUser();
    navigate({ to: "/login" });
  }

  const currentAvatar = avatarUrl || user?.profileImage;
  const referralCode = `FC-${(user?.name || "PLAYER").replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "CRIC"}${String(user?._id || "2026").slice(-4).toUpperCase()}`;

  const handleCopyReferral = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(referralCode);
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 3000);
      showToast("Referral code copied to clipboard!");
    }
  };

  const handleShareWhatsApp = () => {
    const text = `🏏 Join me on Fantasy Cricket Arena! Use my code *${referralCode}* to get ₹100 instant bonus cash: ${typeof window !== "undefined" ? window.location.origin : ""}/login`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareTelegram = () => {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const text = `Join Fantasy Cricket Arena and claim ₹100 Cash Bonus! Referral code: ${referralCode}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setTicketMessage("");
      setShowSupportModal(false);
      showToast("Support ticket raised! Our team will respond within 15 minutes.");
    }, 1500);
  };

  const menuSections = [
    {
      id: "my-teams",
      icon: Users,
      iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
      label: "My Teams",
      description: "View and manage your created fantasy teams and pitch lineups",
      to: "/my-teams",
      badge: teamCount > 0 ? `${teamCount} Saved` : undefined,
    },
    {
      id: "my-contests",
      icon: Trophy,
      iconColor: "text-amber-500 bg-amber-500/10 border-amber-500/30",
      label: "My Contests",
      description: "Track your joined contests, live rankings and leaderboard payouts",
      to: "/contests",
      search: { tab: "my-contests" },
      badge: contestCount > 0 ? `${contestCount} Active` : undefined,
    },
    {
      id: "match-results",
      icon: Receipt,
      iconColor: "text-cyan-500 bg-cyan-500/10 border-cyan-500/30",
      label: "Match Results",
      description: "Final scores, fantasy match point summaries and past contest winners",
      to: "/results",
    },
    {
      id: "rules",
      icon: HelpCircle,
      iconColor: "text-blue-500 bg-blue-500/10 border-blue-500/30",
      label: "Fantasy Point Rules",
      description: "Scoring system for T20, ODI and Test cricket boundaries, wickets and economy",
      to: "/rules",
    },
    {
      id: "refer-earn",
      icon: Gift,
      iconColor: "text-pink-500 bg-pink-500/10 border-pink-500/30",
      label: "Refer & Earn (Win ₹100)",
      description: "Invite your cricket buddies and earn ₹100 cash bonus per referral",
      badge: "Win ₹100",
      badgeColor: "bg-pink-500/15 text-pink-400 border-pink-500/30",
      onClick: () => setShowReferModal(true),
    },
    {
      id: "notifications",
      icon: Bell,
      iconColor: "text-purple-500 bg-purple-500/10 border-purple-500/30",
      label: "Notifications & Alerts",
      description: "Live match announcements, contest reminders and prize broadcasts",
      onClick: () => setShowNotifModal(true),
    },
    {
      id: "support",
      icon: LifeBuoy,
      iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
      label: "Help & Support 24x7",
      description: "Dedicated customer support, frequently asked questions and ticket raising",
      badge: "Online 24x7",
      badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      onClick: () => setShowSupportModal(true),
    },
  ];

  return (
    <AppShell maxWidth="max-w-4xl">
      <div className="space-y-6 pb-12">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-4 z-50 flex items-center gap-2.5 rounded-xl border border-primary/40 bg-surface/95 px-4 py-3 text-xs font-bold text-foreground shadow-2xl backdrop-blur animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 1. AESTHETIC PROFILE HERO CARD                                 */}
        {/* ------------------------------------------------------------- */}
        <Card className="relative overflow-hidden border-border bg-gradient-to-br from-surface via-surface-2/40 to-surface p-6 sm:p-7 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar with Camera Trigger */}
              <div className="relative shrink-0" ref={photoMenuRef}>
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt={user?.name || "User Avatar"}
                    onClick={handleCameraClick}
                    className="h-20 w-20 sm:h-22 sm:w-22 rounded-2xl border-2 border-primary/50 object-cover shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                    title="Click for photo options"
                  />
                ) : (
                  <div
                    onClick={handleCameraClick}
                    className="flex h-20 w-20 sm:h-22 sm:w-22 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 font-display text-2xl sm:text-3xl font-black text-primary-foreground shadow-md cursor-pointer"
                  >
                    {(user?.name || "U").slice(0, 2).toUpperCase()}
                  </div>
                )}

                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleCameraClick}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer border border-surface"
                  title="Photo options"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>

                {/* Profile Picture Popup Menu */}
                {showPhotoMenu && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-52 rounded-xl border border-border bg-surface-2 p-1.5 shadow-2xl backdrop-blur animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/60 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Profile Photo
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPhotoMenu(false)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleViewProfilePic}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-foreground hover:bg-surface transition-colors cursor-pointer"
                    >
                      <Eye className="h-4 w-4 text-primary" />
                      <span>View Full Picture</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleChangeProfilePic}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-foreground hover:bg-surface transition-colors cursor-pointer"
                    >
                      <RefreshCw className="h-4 w-4 text-emerald-400" />
                      <span>Change Photo</span>
                    </button>

                    <div className="my-1 h-px bg-border/60" />

                    <button
                      type="button"
                      onClick={handleDeleteProfilePic}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span>Remove Picture</span>
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

              {/* User Bio Information */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl sm:text-2xl font-black text-foreground">
                    {user?.name || "Fantasy Master"}
                  </h2>
                  {user?.role === "super_admin" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-purple-500/40 bg-purple-500/20 text-purple-300 shadow-xs">
                      <Crown className="h-3 w-3 text-purple-400" /> Super Admin
                    </span>
                  ) : user?.role === "admin" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-xs">
                      <ShieldAlert className="h-3 w-3 text-emerald-400" /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-primary/40 bg-primary/15 text-primary shadow-xs">
                      <ShieldCheck className="h-3 w-3 text-primary" /> Verified Player
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">{user?.email || "No email provided"}</p>
                {user?.mobile && (
                  <p className="text-xs text-muted-foreground/80 font-mono">📱 +91 {user.mobile}</p>
                )}

                {uploadMessage && (
                  <p className="text-xs font-semibold text-primary animate-pulse flex items-center gap-1.5">
                    <CloudUpload className="h-3.5 w-3.5" /> {uploadMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Edit Profile Button */}
            <div className="flex items-center sm:self-start">
              <Button
                type="button"
                variant="outlineGreen"
                size="sm"
                onClick={() => setShowEditProfileModal(true)}
                className="gap-2 font-bold text-xs"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            </div>
          </div>

          {/* Quick Performance & Verification Stats Banner */}
          <div className="mt-6 pt-5 border-t border-border/70 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-surface-2/60 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Teams Built</p>
              <p className="font-display text-lg font-black text-foreground mt-0.5">{teamCount}</p>
            </div>

            <div className="rounded-xl border border-border bg-surface-2/60 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contests Joined</p>
              <p className="font-display text-lg font-black text-primary mt-0.5">{contestCount}</p>
            </div>

            <div className="rounded-xl border border-border bg-surface-2/60 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">KYC Verification</p>
              <p className="font-display text-xs font-black text-emerald-400 mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Certified
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface-2/60 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fair Play Shield</p>
              <p className="font-display text-xs font-black text-foreground mt-1 flex items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3 text-primary" /> 100% Protected
              </p>
            </div>
          </div>
        </Card>

        {/* ------------------------------------------------------------- */}
        {/* 2. SUPER ADMIN AUTHORITY CONSOLE BANNER                       */}
        {/* ------------------------------------------------------------- */}
        {(user?.role === "admin" || user?.role === "super_admin") && (
          <Card className="p-0 overflow-hidden border-border shadow-md">
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-4 px-5 py-4 text-sm font-bold transition-all cursor-pointer group",
                user.role === "super_admin"
                  ? "bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-surface hover:from-purple-950/60 text-purple-200 border-l-4 border-l-purple-500"
                  : "bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-surface hover:from-emerald-950/60 text-emerald-200 border-l-4 border-l-emerald-500"
              )}
            >
              {user.role === "super_admin" ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Crown className="h-5 w-5" />
                </div>
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-base text-foreground">
                  {user.role === "super_admin" ? "Super Admin Authority Console" : "Admin Management Console"}
                </p>
                <p className="text-xs text-muted-foreground font-normal truncate mt-0.5">
                  Manage matches, live scoring rules, contest prize distribution & user management
                </p>
              </div>
              <span
                className={cn(
                  "text-xs font-black uppercase px-3 py-1.5 rounded-xl border shadow-sm shrink-0",
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
        {/* 3. AESTHETIC PROFILE MENU SECTIONS (FROM PIC 2)                */}
        {/* ------------------------------------------------------------- */}
        <Card className="p-0 overflow-hidden border-border shadow-xl divide-y divide-border/70 bg-surface">
          {menuSections.map((item) => {
            const Icon = item.icon;
            const content = (
              <div className="flex items-center gap-4 px-5 py-4 hover:bg-surface-2/60 transition-all cursor-pointer group">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 transition-transform group-hover:scale-105", item.iconColor)}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.label}
                    </p>
                    {item.badge && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border",
                          item.badgeColor || "bg-primary/10 text-primary border-primary/20"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            );

            if (item.to) {
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  search={item.search as any}
                  onClick={() => {
                    if (item.id === "my-contests") {
                      setFlow("contests_default_tab", "My Contests");
                    }
                  }}
                  className="block"
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="w-full text-left"
              >
                {content}
              </button>
            );
          })}
        </Card>

        {/* ------------------------------------------------------------- */}
        {/* 4. LOGOUT BUTTON                                              */}
        {/* ------------------------------------------------------------- */}
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm font-black text-destructive transition-all hover:bg-destructive/20 hover:border-destructive/50 cursor-pointer shadow-sm active:scale-[0.99]"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout from Fantasy Cricket</span>
        </button>

        {/* ============================================================= */}
        {/* MODAL 1: EDIT PROFILE MODAL                                   */}
        {/* ============================================================= */}
        {showEditProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Edit3 className="h-4 w-4" />
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground">Edit Profile Information</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Mobile Number (Optional)
                  </label>
                  <div className="flex items-center rounded-xl border border-border bg-background overflow-hidden focus-within:border-primary">
                    <span className="px-3 text-xs font-mono font-bold text-muted-foreground border-r border-border bg-surface-2">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value.replace(/\D/g, ""))}
                      placeholder="10-digit mobile number"
                      className="w-full px-3 py-2.5 text-sm font-mono font-semibold text-foreground bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Email (Account ID)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="w-full rounded-xl border border-border/60 bg-surface-2/60 px-3.5 py-2.5 text-sm font-medium text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Email is tied to your account identity.</p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditProfileModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="hero"
                    size="sm"
                    disabled={savingProfile || !editName.trim()}
                    className="gap-1.5 font-bold"
                  >
                    {savingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* MODAL 2: REFER & EARN MODAL (WIN ₹100)                        */}
        {/* ============================================================= */}
        {showReferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-md rounded-3xl border border-pink-500/30 bg-surface p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 shadow-sm">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">Refer & Earn ₹100</h3>
                    <p className="text-[11px] text-muted-foreground">Invite friends & get instant cash bonus</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReferModal(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Reward Announcement Banner */}
              <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 p-4 text-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-pink-400 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30">
                  Unlimited Referrals
                </span>
                <p className="font-display text-2xl font-black text-foreground pt-1">
                  Earn <span className="text-pink-400">₹100</span> Per Friend
                </p>
                <p className="text-xs text-muted-foreground">
                  Your friend gets ₹100 bonus on registration, and you get ₹100 when they join their first contest!
                </p>
              </div>

              {/* Referral Code Box */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Your Unique Referral Code
                </label>
                <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/5 p-3">
                  <span className="font-mono text-lg font-black tracking-widest text-primary">
                    {referralCode}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCopyReferral}
                    className="gap-1.5 font-bold text-xs bg-primary text-primary-foreground shadow"
                  >
                    {copiedReferral ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy Code
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Direct Share Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-3 text-xs font-bold transition-all shadow cursor-pointer active:scale-95"
                >
                  <MessageSquare className="h-4 w-4" /> Share on WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleShareTelegram}
                  className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white py-2.5 px-3 text-xs font-bold transition-all shadow cursor-pointer active:scale-95"
                >
                  <ExternalLink className="h-4 w-4" /> Share on Telegram
                </button>
              </div>

              {/* 3 Steps Guide */}
              <div className="rounded-xl border border-border bg-surface-2/40 p-3.5 space-y-2.5 text-xs">
                <p className="font-bold text-foreground text-[11px] uppercase tracking-wider">How it works:</p>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="space-y-1">
                    <span className="flex h-6 w-6 mx-auto items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">1</span>
                    <p className="text-muted-foreground font-medium">Share your code</p>
                  </div>
                  <div className="space-y-1">
                    <span className="flex h-6 w-6 mx-auto items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">2</span>
                    <p className="text-muted-foreground font-medium">Friend registers</p>
                  </div>
                  <div className="space-y-1">
                    <span className="flex h-6 w-6 mx-auto items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">3</span>
                    <p className="text-emerald-400 font-bold">Both get ₹100</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* MODAL 3: NOTIFICATIONS & ALERTS MODAL                         */}
        {/* ============================================================= */}
        {showNotifModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">Notifications & Alerts</h3>
                    <p className="text-[11px] text-muted-foreground">Match announcements, contest updates and alerts</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifModal(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Notification List Body */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {loadingNotifs && (
                  <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Loading latest announcements...</span>
                  </div>
                )}

                {!loadingNotifs && notifications.map((notif) => (
                  <div
                    key={notif.id || notif._id}
                    className="rounded-xl border border-border bg-surface-2/50 p-3.5 space-y-1 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-display text-xs font-bold text-foreground">{notif.title}</p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(notif.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {notif.message || notif.description}
                    </p>
                  </div>
                ))}

                {!loadingNotifs && notifications.length === 0 && (
                  <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                    <Bell className="h-8 w-8 mx-auto text-muted-foreground/40" />
                    <p>No unread notifications at this time.</p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-border shrink-0 flex items-center justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNotifModal(false)}
                  className="text-xs font-bold"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* MODAL 4: HELP & SUPPORT 24x7 MODAL                            */}
        {/* ============================================================= */}
        {showSupportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <LifeBuoy className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">Help & Support 24x7</h3>
                    <p className="text-[11px] text-muted-foreground">Instant resolution for withdrawals, scoring & KYC</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                {/* 3 Direct Contact Cards */}
                <div className="grid grid-cols-3 gap-2.5">
                  <a
                    href="https://wa.me/919876543210?text=Hi%20Fantasy%20Cricket%20Support"
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-center hover:bg-emerald-500/10 transition-colors"
                  >
                    <MessageSquare className="h-5 w-5 text-emerald-400 mb-1" />
                    <span className="text-[11px] font-bold text-foreground">WhatsApp</span>
                    <span className="text-[9px] text-emerald-400 font-bold">Fast Reply</span>
                  </a>

                  <a
                    href="mailto:support@fantasycricketarena.com"
                    className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-2/60 p-3 text-center hover:bg-surface-2 transition-colors"
                  >
                    <Mail className="h-5 w-5 text-primary mb-1" />
                    <span className="text-[11px] font-bold text-foreground">Email Desk</span>
                    <span className="text-[9px] text-muted-foreground">24h SLA</span>
                  </a>

                  <a
                    href="tel:18002003268"
                    className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-2/60 p-3 text-center hover:bg-surface-2 transition-colors"
                  >
                    <Phone className="h-5 w-5 text-amber-400 mb-1" />
                    <span className="text-[11px] font-bold text-foreground">Toll-Free</span>
                    <span className="text-[9px] text-muted-foreground">1800-200-FC</span>
                  </a>
                </div>

                {/* FAQ Accordion */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Frequently Asked Questions
                  </h4>

                  {[
                    {
                      q: "How fast are winnings withdrawals processed?",
                      a: "Withdrawals to verified Indian bank accounts or UPI IDs are processed instantly via automated IMPS gateways, usually arriving within 60 seconds.",
                    },
                    {
                      q: "How are fantasy cricket points calculated?",
                      a: "Points are awarded in real time ball-by-ball based on runs, boundaries (4s & 6s), wickets taken, maidens, catches, and economy rates according to official ICC scoring standards.",
                    },
                    {
                      q: "Is Fantasy Cricket legal in India?",
                      a: "Yes, Fantasy Cricket is legally recognized as a 'Game of Skill' protected under Article 19(1)(g) of the Indian Constitution, as affirmed by the Supreme Court of India.",
                    },
                    {
                      q: "Can I modify my team after creating it?",
                      a: "You can edit your 11 players, Captain, and Vice-Captain as many times as you like until the official match toss / scheduled start time.",
                    },
                  ].map((faq, idx) => {
                    const isOpen = faqOpenIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-border bg-surface-2/40 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                          className="w-full flex items-center justify-between p-3 text-left text-xs font-bold text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
                        >
                          <span>{faq.q}</span>
                          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                        </button>
                        {isOpen && (
                          <div className="px-3 pb-3 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-2 bg-surface/40">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submit a Quick Query Ticket */}
                <form onSubmit={handleTicketSubmit} className="space-y-3 pt-2 border-t border-border">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Raise a Support Inquiry
                  </h4>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">Issue Category</label>
                    <select
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
                    >
                      <option>Withdrawal & Payments</option>
                      <option>Contest Payouts & Leaderboard</option>
                      <option>KYC & Bank Verification</option>
                      <option>Scoring & Live Points</option>
                      <option>Other Technical Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">Describe Your Issue</label>
                    <textarea
                      required
                      rows={2}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Please explain the problem..."
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="sm"
                    disabled={ticketSubmitted || !ticketMessage.trim()}
                    className="w-full font-bold text-xs"
                  >
                    {ticketSubmitted ? "Sending Inquiry..." : "Submit Inquiry to Support"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

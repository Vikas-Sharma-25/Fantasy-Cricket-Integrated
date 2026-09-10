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
  X
} from "lucide-react";
import { AppShell } from "@/components/fc/AppShell";
import { Card } from "@/components/fc/bits";
import * as apiServices from "@/lib/api-services";
import type { User } from "@/lib/api-types";

export const Route = createFileRoute("/profile")({ component: Profile });

const menu = [
  { icon: Users, label: "My Teams", to: "/create-team" },
  { icon: Trophy, label: "My Contests", to: "/contests" },
  { icon: Receipt, label: "Results", to: "/results" },
  { icon: Gift, label: "Refer & Earn", to: "/matches" },
  { icon: Bell, label: "Notifications", to: "/matches" },
  { icon: Settings, label: "Settings", to: "/admin" },
  { icon: LifeBuoy, label: "Help & Support", to: "/matches" }
];

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => apiServices.getCachedUser());
  const [avatarUrl, setAvatarUrl] = useState<string>(() => apiServices.getCachedUser()?.profileImage || "");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
        // User session expired or logged out -> redirect to login
        navigate({ to: "/login" });
      });
  }, [navigate]);

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

      // Instantly show image in profile and side navigation (< 1s)
      setAvatarUrl(s3Url);
      const optimisticUser = user ? { ...user, profileImage: s3Url } : null;
      if (optimisticUser) {
        setUser(optimisticUser);
        apiServices.setCachedUser(optimisticUser);
        window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: optimisticUser }));
      }

      // Permanently save avatar in MongoDB database
      const updatedUser = await apiServices.updateProfile({ profileImage: s3Url });
      const finalUser = updatedUser || optimisticUser;
      if (finalUser) {
        setUser(finalUser);
        apiServices.setCachedUser(finalUser);
        // Broadcast to update AppShell sidebar avatar immediately (< 1 sec)
        window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: finalUser }));
      }

      setUploadMessage("Uploaded successfully!");
      setTimeout(() => setUploadMessage(""), 4000);
    } catch (err: any) {
      setUploadMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      // Reset input value so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function logout() {
    await apiServices.logoutUser();
    navigate({ to: "/login" });
  }

  const currentAvatar = avatarUrl || user?.profileImage;

  return (
    <AppShell>
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative inline-block" ref={menuRef}>
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt="Avatar"
              onClick={handleCameraClick}
              className="h-16 w-16 rounded-full border-2 border-primary object-cover cursor-pointer transition-opacity hover:opacity-90"
              title="Click for options"
            />
          ) : (
            <span
              onClick={handleCameraClick}
              className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary font-display text-xl font-bold text-primary-foreground shadow-md cursor-pointer"
            >
              {(user?.name || "U").slice(0, 2).toUpperCase()}
            </span>
          )}
          <button
            type="button"
            disabled={uploading}
            onClick={handleCameraClick}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 disabled:opacity-50"
            title="Profile Picture Options"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
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
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleViewProfilePic}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-surface transition-colors"
              >
                <Eye className="h-4 w-4 text-primary" />
                <span>View Profile Pic</span>
              </button>

              <button
                type="button"
                onClick={handleChangeProfilePic}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-surface transition-colors"
              >
                <RefreshCw className="h-4 w-4 text-emerald-400" />
                <span>Change Profile</span>
              </button>

              <div className="my-1 h-px bg-border/60" />

              <button
                type="button"
                onClick={handleDeleteProfilePic}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
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

        <div className="flex-1">
          <p className="font-display text-lg font-bold">{user?.name || "Loading..."}</p>
          <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
          {uploadMessage && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-primary font-medium">
              <CloudUpload className="h-3.5 w-3.5" /> {uploadMessage}
            </p>
          )}
        </div>
      </Card>

      <Card className="mt-4 p-0">
        {menu.map(({ icon: Icon, label, to }) => (
          <Link
            key={label}
            to={to}
            className="flex items-center gap-3 border-b border-border px-4 py-4 text-sm last:border-0 hover:bg-surface-2"
          >
            <Icon className="h-4 w-4 text-primary" />
            <span className="flex-1 font-medium">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </Card>

      <button
        onClick={() => void logout()}
        className="mt-4 flex w-full items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20"
      >
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </AppShell>
  );
}

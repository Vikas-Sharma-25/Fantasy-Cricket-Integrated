import { useEffect, useState, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Bell, ChevronRight, Users, Trophy, Receipt, Gift, Settings, LifeBuoy, Camera, Loader2, CloudUpload } from "lucide-react";
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
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void apiServices
      .getMe()
      .then((data) => {
        setUser(data);
        if (data?.profileImage) {
          setAvatarUrl(data.profileImage);
        }
      })
      .catch(() => {
        // User session expired or logged out -> redirect to login
        navigate({ to: "/login" });
      });
  }, [navigate]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadMessage("Uploading to S3...");
      const s3Url = await apiServices.uploadFileToS3(file, "avatars");
      setAvatarUrl(s3Url);

      // Permanently save avatar in MongoDB database
      const updatedUser = await apiServices.updateProfile({ profileImage: s3Url });
      if (updatedUser) {
        setUser(updatedUser);
      }
      // Broadcast to update AppShell sidebar avatar immediately
      window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: updatedUser || { ...user, profileImage: s3Url } }));

      setUploadMessage("Uploaded successfully!");
      setTimeout(() => setUploadMessage(""), 4000);
    } catch (err: any) {
      setUploadMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function logout() {
    await apiServices.logoutUser();
    navigate({ to: "/login" });
  }

  return (
    <AppShell>
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative inline-block">
          {avatarUrl || user?.profileImage ? (
            <img
              src={avatarUrl || user?.profileImage}
              alt="Avatar"
              className="h-16 w-16 rounded-full border-2 border-primary object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary font-display text-xl font-bold text-primary-foreground shadow-md">
              {(user?.name || "U").slice(0, 2).toUpperCase()}
            </span>
          )}
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 disabled:opacity-50"
            title="Upload avatar to S3"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>
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

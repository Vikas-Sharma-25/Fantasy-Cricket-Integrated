import { api } from "./api";
import type { Contest, FantasyTeam, Match, MatchPlayer, User } from "./api-types";

export async function registerUser(input: { name: string; email: string; mobile?: string; password: string }) {
  return api.post<{ email: string; otpToken?: string }>("/auth/register", input);
}

export async function verifyAccount(otp: string, otpToken?: string) {
  return api.post<{ message?: string }>("/auth/verify-account", { otp, otpToken });
}

export async function loginUser(input: { email: string; password: string }) {
  return api.post<{ message?: string; otpToken?: string; email?: string }>("/auth/login", input);
}

export function getCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("cached_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedUser(user: User | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem("cached_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("cached_user");
  }
}

export async function verifyLoginOtp(otp: string, otpToken?: string) {
  const result = await api.post<{ accessToken: string; user: User }>("/auth/verify-otp", { otp, otpToken });
  if (typeof window !== "undefined") {
    localStorage.setItem("accessToken", result.accessToken);
    if (result.user) setCachedUser(result.user);
  }
  return result;
}

export async function resendOtp(otpToken?: string) {
  return api.post<{ otpExpiresAt: string; otpToken?: string }>("/auth/resend-otp", { otpToken });
}

export async function logoutUser() {
  try {
    await api.post("/auth/logout", {});
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      setCachedUser(null);
    }
  }
}

export async function getMe() {
  const user = await api.get<User>("/users/me");
  if (user) setCachedUser(user);
  return user;
}

export async function updateProfile(data: Partial<User>) {
  const user = await api.patch<User>("/users/me", data);
  if (user) setCachedUser(user);
  return user;
}

export async function getMatches(status?: string) {
  const params = new URLSearchParams({ page: "1", limit: "50" });
  if (status) params.set("status", status);
  return api.get<Match[]>(`/matches?${params.toString()}`);
}

export async function getMatch(matchId: string) {
  return api.get<Match>(`/matches/${matchId}`);
}

export async function getMatchPlayers(matchId: string) {
  return api.get<MatchPlayer[]>(`/matches/${matchId}/players`);
}

export async function getMatchLive(matchId: string) {
  return api.get<any>(`/matches/${matchId}/live`);
}

export async function getMyTeams(matchId?: string) {
  const query = matchId ? `?matchId=${encodeURIComponent(matchId)}` : "";
  return api.get<FantasyTeam[]>(`/teams/my${query}`);
}

export async function createTeam(input: {
  matchId: string;
  name: string;
  playerIds: string[];
  captainId: string;
  viceCaptainId: string;
}) {
  return api.post<FantasyTeam>("/teams", input);
}

export async function updateTeam(
  teamId: string,
  input: {
    name?: string;
    playerIds?: string[];
    captainId?: string;
    viceCaptainId?: string;
  }
) {
  return api.patch<FantasyTeam>(`/teams/${teamId}`, input);
}

export async function getTeam(teamId: string) {
  return api.get<FantasyTeam>(`/teams/${teamId}`);
}

export async function deleteTeam(teamId: string) {
  return api.delete<{ deleted: boolean }>(`/teams/${teamId}`);
}

export async function getContests(matchId?: string) {
  const query = matchId ? `?matchId=${encodeURIComponent(matchId)}&page=1&limit=50` : "?page=1&limit=50";
  return api.get<Contest[]>(`/contests${query}`);
}

export async function joinContest(contestId: string, fantasyTeamId: string) {
  return api.post(`/contests/${contestId}/join`, { fantasyTeamId });
}

export async function getMyContests(matchId?: string) {
  const query = matchId ? `?matchId=${encodeURIComponent(matchId)}` : "";
  return api.get<Contest[]>(`/contests/my${query}`);
}

export async function getLeaderboard(contestId: string) {
  return api.get<any[]>(`/leaderboards/${contestId}`);
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  key: string;
  fileUrl: string;
  expiresIn: number;
  isMock?: boolean;
}

export async function getPresignedUploadUrl(
  fileName: string,
  fileType: string,
  folder = "avatars"
): Promise<PresignedUploadResponse> {
  return api.post<PresignedUploadResponse>("/media/upload-url", {
    fileName,
    fileType,
    folder
  });
}

export async function uploadFileToS3(file: File, folder = "avatars"): Promise<string> {
  const data = await getPresignedUploadUrl(file.name, file.type, folder);
  if (!data.isMock) {
    const uploadRes = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type
      },
      body: file
    });
    if (!uploadRes.ok) {
      throw new Error(`Failed to upload file to S3: ${uploadRes.statusText}`);
    }
  }
  return data.fileUrl;
}

export async function updateUserRole(userId: string, role: "user" | "admin" | "super_admin") {
  return api.patch<User>(`/admin/users/${userId}/role`, { role });
}

export async function suspendUser(userId: string) {
  return api.patch<User>(`/admin/users/${userId}/suspend`, {});
}

export async function restoreUser(userId: string) {
  return api.patch<User>(`/admin/users/${userId}/restore`, {});
}

export interface AppNotification {
  _id: string;
  id?: string;
  type: string;
  title: string;
  message: string;
  description?: string;
  isRead: boolean;
  read?: boolean;
  createdAt: string;
  time?: string;
}

export async function getUserNotifications(): Promise<AppNotification[]> {
  try {
    const res = await api.get<any>("/users/me/notifications?page=1&limit=30");
    const data = res?.items || res?.data || res;
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {
    // If not authenticated or error, fall back to announcements
  }

  try {
    const res2 = await api.get<any>("/users/announcements?limit=30");
    const data2 = res2?.data || res2;
    if (Array.isArray(data2)) {
      return data2;
    }
  } catch {}

  return [];
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await api.patch(`/users/me/notifications/${notificationId}/read`);
  } catch {}
}

export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    await api.patch("/users/me/notifications/read-all");
  } catch {}
}

export function getLocalWalletBalance(): number {
  try {
    const saved = localStorage.getItem("fc_user_wallet");
    if (saved) {
      const parsed = JSON.parse(saved);
      const total = (parsed.deposited || 0) + (parsed.winnings || 0) + (parsed.bonus || 0);
      if (typeof total === "number" && !isNaN(total)) return total;
    }
  } catch {}
  return 3000;
}

export function deductLocalWallet(amount: number, contestName: string): number {
  if (amount <= 0) return getLocalWalletBalance();
  try {
    const saved = localStorage.getItem("fc_user_wallet");
    const parsed = saved ? JSON.parse(saved) : null;
    const currentTotal = parsed ? ((parsed.deposited || 0) + (parsed.winnings || 0) + (parsed.bonus || 0)) : 700;
    const newTotal = Math.max(0, currentTotal - amount);
    const newWallet = {
      deposited: 100,
      winnings: Math.max(0, newTotal - 100),
      bonus: 0,
    };
    localStorage.setItem("fc_user_wallet", JSON.stringify(newWallet));

    // Add passbook transaction
    const txsSaved = localStorage.getItem("fc_wallet_txs");
    const txs = txsSaved ? JSON.parse(txsSaved) : [];
    txs.unshift({
      id: `tx-${Date.now()}`,
      type: "ENTRY_FEE",
      title: `Contest Entry: ${contestName}`,
      amount: -amount,
      date: "Just now",
      status: "SUCCESS",
      refId: `FEE-${Math.floor(10000 + Math.random() * 90000)}`,
    });
    localStorage.setItem("fc_wallet_txs", JSON.stringify(txs));

    const cached = getCachedUser();
    if (cached) {
      const updatedUser = { ...cached, walletBalance: newTotal, winningsBalance: newWallet.winnings, depositedBalance: 100 };
      setCachedUser(updatedUser);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: updatedUser }));
      }
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
    return newTotal;
  } catch {
    return 700;
  }
}
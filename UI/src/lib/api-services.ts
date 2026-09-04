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

export async function verifyLoginOtp(otp: string, otpToken?: string) {
  const result = await api.post<{ accessToken: string; user: User }>("/auth/verify-otp", { otp, otpToken });
  if (typeof window !== "undefined") localStorage.setItem("accessToken", result.accessToken);
  return result;
}

export async function resendOtp(otpToken?: string) {
  return api.post<{ otpExpiresAt: string; otpToken?: string }>("/auth/resend-otp", { otpToken });
}

export async function logoutUser() {
  try {
    await api.post("/auth/logout", {});
  } finally {
    if (typeof window !== "undefined") localStorage.removeItem("accessToken");
  }
}

export async function getMe() {
  return api.get<User>("/users/me");
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
export const FLOW_KEYS = {
  pendingRegisterEmail: "pendingRegisterEmail",
  otpToken: "otpToken",
  selectedMatchId: "selectedMatchId",
  selectedContestId: "selectedContestId",
  selectedPlayerIds: "selectedPlayerIds",
  selectedTeamName: "selectedTeamName",
  captainId: "captainId",
  viceCaptainId: "viceCaptainId",
  editingTeamId: "editingTeamId",
  authPromptMsg: "authPromptMsg",
  returnToContestId: "returnToContestId",
  autoOpenJoinContestId: "autoOpenJoinContestId",
};

export function setFlow(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function getFlow<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = sessionStorage.getItem(key);
    return value === null ? fallback : (JSON.parse(value) as T);
  } catch {
    return fallback;
  }
}

export function removeFlow(key: string) {
  if (typeof window !== "undefined") sessionStorage.removeItem(key);
}

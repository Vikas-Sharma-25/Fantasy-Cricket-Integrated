/**
 * Canonical Socket.IO event names (SRS section 12), kept in one place so
 * emitters/listeners on both API and future UI stay in sync.
 */
export const SOCKET_EVENTS = {
  MATCH_STATUS: "match:status",
  MATCH_EVENT: "match:event",
  PLAYER_POINTS: "player:points",
  CONTEST_LEADERBOARD: "contest:leaderboard",
  NOTIFICATION_NEW: "notification:new",
  ADMIN_ANNOUNCEMENT: "admin:announcement"
} as const;

export interface User {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role?: string;
  status?: string;
  isVerified?: boolean;
}

export interface Match {
  _id: string;
  providerMatchId: string;
  teamA: string;
  teamB: string;
  venue?: string;
  startTime: string;
  fantasyDeadline: string;
  status: "UPCOMING" | "LIVE" | "COMPLETED" | "ABANDONED" | "SUSPENDED";
  providerData?: Record<string, any>;
}

export interface MatchPlayer {
  _id?: string;
  matchPlayerId: string | null;
  playerId: string;
  name: string;
  realTeam: string | null;
  role: string;
  credits: number | null;
  isPlayingXI: boolean;
  /** false when the player exists in the Players table but isn't part of this match's squad (MatchPlayer row). */
  isAvailable: boolean;
}

export interface FantasyTeam {
  _id: string;
  matchId: string;
  name: string;
  playerIds: any[];
  captainId: any;
  viceCaptainId: any;
  totalCredits: number;
  isLocked: boolean;
}

export interface Contest {
  _id: string;
  matchId: string;
  name: string;
  type?: string;
  maxSlots: number;
  status?: string;
  rules?: Record<string, any>;
  [key: string]: any;
}
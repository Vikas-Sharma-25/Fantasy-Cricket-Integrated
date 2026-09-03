export interface ProviderMatch {
  providerMatchId: string;

  teamA: string;
  teamB: string;

  venue?: string;

  startTime: Date;
  fantasyDeadline: Date;

  status:
    | "UPCOMING"
    | "LIVE"
    | "COMPLETED"
    | "ABANDONED"
    | "SUSPENDED";

  providerData?: Record<string, unknown>;
}

export interface ProviderLiveMatch {
  providerMatchId: string;

  status:
    | "UPCOMING"
    | "LIVE"
    | "COMPLETED"
    | "ABANDONED"
    | "SUSPENDED";

  score?: unknown;

  providerData?: Record<string, unknown>;
}

export interface CricketProvider {
  getMatches(): Promise<ProviderMatch[]>;

  getLiveMatch(
    providerMatchId: string
  ): Promise<ProviderLiveMatch>;
}
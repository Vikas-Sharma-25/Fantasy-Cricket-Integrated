/**
 * Background worker skeleton for polling the licensed cricket data provider
 * (when webhooks aren't available) and feeding events into the scoring
 * pipeline via scoring.service.ingestPlayerEvent().
 *
 * Run separately from the API process in production, e.g.:
 *   ts-node-dev --respawn src/workers/scoringWorker.ts
 *
 * Left intentionally provider-agnostic since SRS section 18 specifies the
 * actual licensed provider integration is a separate, pluggable concern.
 */
import { connectDB } from "../config/db";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { Match } from "../models/Match";
import { ingestPlayerEvent } from "../services/scoring.service";

const POLL_INTERVAL_MS = 15_000;

async function pollProvider() {
  if (!env.CRICKET_PROVIDER_BASE_URL) {
    logger.warn("[worker] CRICKET_PROVIDER_BASE_URL not configured - skipping poll cycle");
    return;
  }

  const liveMatches = await Match.find({ status: "LIVE" });
  for (const match of liveMatches) {
    try {
      // Placeholder: replace with the actual licensed provider API call, e.g.
      // const events = await fetchProviderEvents(match.providerMatchId, env.CRICKET_PROVIDER_API_KEY);
      const events: Array<{
        providerEventId: string;
        playerId: string;
        eventType: string;
        eventData?: Record<string, unknown>;
        eventTime: string;
      }> = [];

      for (const evt of events) {
        await ingestPlayerEvent({
          matchId: match._id.toString(),
          playerId: evt.playerId,
          providerEventId: evt.providerEventId,
          eventType: evt.eventType,
          eventData: evt.eventData,
          eventTime: new Date(evt.eventTime)
        });
      }
    } catch (err) {
      logger.error(`[worker] Failed to poll/process match ${match._id.toString()}`, { err });
    }
  }
}

async function start() {
  await connectDB();
  logger.info("[worker] Scoring worker started");
  setInterval(() => {
    pollProvider().catch((err) => logger.error("[worker] Poll cycle failed", { err }));
  }, POLL_INTERVAL_MS);
}

start();

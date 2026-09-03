import { Match } from "../models/Match";
import { CricketProvider } from "../providers/cricket.provider";

export async function syncMatches(
  provider: CricketProvider
) {
  const providerMatches =
    await provider.getMatches();

  let created = 0;
  let updated = 0;

  for (const data of providerMatches) {
    const existing = await Match.findOne({
      providerMatchId: data.providerMatchId
    });

    if (!existing) {
      await Match.create({
        providerMatchId: data.providerMatchId,

        teamA: data.teamA,
        teamB: data.teamB,

        venue: data.venue,

        startTime: data.startTime,
        fantasyDeadline: data.fantasyDeadline,

        status: data.status,

        providerData:
          data.providerData || {}
      });

      created++;
      continue;
    }

    existing.teamA = data.teamA;
    existing.teamB = data.teamB;

    existing.venue = data.venue;

    existing.startTime = data.startTime;
    existing.fantasyDeadline =
      data.fantasyDeadline;

    existing.status = data.status;

    existing.providerData =
      data.providerData || {};

    await existing.save();

    updated++;
  }

  return {
    created,
    updated,
    total: providerMatches.length
  };
}
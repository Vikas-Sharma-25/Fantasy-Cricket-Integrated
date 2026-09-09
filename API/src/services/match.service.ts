import { Types } from "mongoose";
import { Match, IMatch } from "../models/Match";
import { MatchPlayer } from "../models/MatchPlayer";
import { Player } from "../models/Player";
import { ApiError } from "../utils/apiError";

interface ListMatchesParams {
  status?: string;
  page: number;
  limit: number;
}

/**
 * DB role strings aren't always spelled/hyphenated consistently
 * ("All Rounder" vs "All-Rounder", "wicket keeper" vs "Wicket-Keeper", etc.).
 * The UI filters players into exactly 4 role tabs, so normalize every role
 * to one of those 4 canonical labels here — otherwise a valid, available
 * player can silently vanish from its tab because the string didn't match.
 */
const normalizeRole = (role: string): string => {
  const r = (role || "").toLowerCase().replace(/[\s-]+/g, "");
  if (r.includes("wicket")) return "Wicket-Keeper";
  if (r.includes("allround")) return "All-Rounder";
  if (r.includes("bowl")) return "Bowler";
  if (r.includes("bat")) return "Batsman";
  return role;
};

export const createMatch = async (payload: Partial<IMatch>) => {
  return Match.create(payload);
};

export const listMatches = async ({ status, page, limit }: ListMatchesParams) => {
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status.toUpperCase();

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Match.find(filter).sort({ startTime: 1 }).skip(skip).limit(limit),
    Match.countDocuments(filter),
  ]);

  return { items, total };
};

export const getMatchById = async (matchId: string) => {
  let match = null;
  if (Types.ObjectId.isValid(matchId)) {
    match = await Match.findById(matchId);
  }
  if (!match) {
    match = await Match.findOne({ providerMatchId: matchId });
  }
  if (!match) throw new ApiError(404, "Match not found");
  return match;
};

export const updateMatch = async (matchId: string, payload: Partial<IMatch>) => {
  if (!Types.ObjectId.isValid(matchId)) throw new ApiError(400, "Invalid matchId");

  const allowedFields = ["teamA", "teamB", "venue", "startTime", "fantasyDeadline", "status", "providerData"];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if ((payload as any)[key] !== undefined) updates[key] = (payload as any)[key];
  }

  const match = await Match.findByIdAndUpdate(matchId, updates, { new: true, runValidators: true });
  if (!match) throw new ApiError(404, "Match not found");
  return match;
};

export const deleteMatch = async (matchId: string) => {
  if (!Types.ObjectId.isValid(matchId)) throw new ApiError(400, "Invalid matchId");

  const match = await Match.findByIdAndDelete(matchId);
  if (!match) throw new ApiError(404, "Match not found");

  // Prevent orphan bridge rows once the match is gone
  await MatchPlayer.deleteMany({ matchId });

  return { deleted: true };
};

interface RosterPlayer {
  name: string;
  role: "Wicket-Keeper" | "Batsman" | "All-Rounder" | "Bowler";
  credits: number;
}

const TEAM_ROSTERS: Record<string, RosterPlayer[]> = {
  ENG: [
    { name: "Jos Buttler", role: "Wicket-Keeper", credits: 9.5 },
    { name: "Phil Salt", role: "Wicket-Keeper", credits: 9.0 },
    { name: "Harry Brook", role: "Batsman", credits: 9.0 },
    { name: "Will Jacks", role: "Batsman", credits: 8.5 },
    { name: "Ben Duckett", role: "Batsman", credits: 8.5 },
    { name: "Liam Livingstone", role: "All-Rounder", credits: 9.0 },
    { name: "Sam Curran", role: "All-Rounder", credits: 8.5 },
    { name: "Moeen Ali", role: "All-Rounder", credits: 8.5 },
    { name: "Jofra Archer", role: "Bowler", credits: 9.0 },
    { name: "Adil Rashid", role: "Bowler", credits: 9.0 },
    { name: "Mark Wood", role: "Bowler", credits: 8.5 },
  ],
  PAK: [
    { name: "Mohammad Rizwan", role: "Wicket-Keeper", credits: 9.5 },
    { name: "Usman Khan", role: "Wicket-Keeper", credits: 8.0 },
    { name: "Babar Azam", role: "Batsman", credits: 10.0 },
    { name: "Fakhar Zaman", role: "Batsman", credits: 9.0 },
    { name: "Saim Ayub", role: "Batsman", credits: 8.5 },
    { name: "Shadab Khan", role: "All-Rounder", credits: 9.0 },
    { name: "Iftikhar Ahmed", role: "All-Rounder", credits: 8.5 },
    { name: "Imad Wasim", role: "All-Rounder", credits: 8.5 },
    { name: "Shaheen Afridi", role: "Bowler", credits: 9.5 },
    { name: "Haris Rauf", role: "Bowler", credits: 9.0 },
    { name: "Naseem Shah", role: "Bowler", credits: 8.5 },
  ],
  IND: [
    { name: "Rishabh Pant", role: "Wicket-Keeper", credits: 9.5 },
    { name: "Sanju Samson", role: "Wicket-Keeper", credits: 8.5 },
    { name: "Rohit Sharma", role: "Batsman", credits: 10.0 },
    { name: "Virat Kohli", role: "Batsman", credits: 10.0 },
    { name: "Suryakumar Yadav", role: "Batsman", credits: 9.5 },
    { name: "Hardik Pandya", role: "All-Rounder", credits: 9.5 },
    { name: "Ravindra Jadeja", role: "All-Rounder", credits: 9.0 },
    { name: "Axar Patel", role: "All-Rounder", credits: 8.5 },
    { name: "Jasprit Bumrah", role: "Bowler", credits: 10.0 },
    { name: "Kuldeep Yadav", role: "Bowler", credits: 8.5 },
    { name: "Arshdeep Singh", role: "Bowler", credits: 8.5 },
  ],
  AUS: [
    { name: "Josh Inglis", role: "Wicket-Keeper", credits: 9.0 },
    { name: "Matthew Wade", role: "Wicket-Keeper", credits: 8.5 },
    { name: "Travis Head", role: "Batsman", credits: 9.5 },
    { name: "Mitchell Marsh", role: "Batsman", credits: 9.0 },
    { name: "David Warner", role: "Batsman", credits: 9.0 },
    { name: "Glenn Maxwell", role: "All-Rounder", credits: 9.5 },
    { name: "Marcus Stoinis", role: "All-Rounder", credits: 8.5 },
    { name: "Cameron Green", role: "All-Rounder", credits: 8.5 },
    { name: "Pat Cummins", role: "Bowler", credits: 9.5 },
    { name: "Mitchell Starc", role: "Bowler", credits: 9.0 },
    { name: "Adam Zampa", role: "Bowler", credits: 9.0 },
  ],
  SA: [
    { name: "Quinton de Kock", role: "Wicket-Keeper", credits: 9.5 },
    { name: "Heinrich Klaasen", role: "Wicket-Keeper", credits: 9.5 },
    { name: "Aiden Markram", role: "Batsman", credits: 9.0 },
    { name: "David Miller", role: "Batsman", credits: 9.0 },
    { name: "Reeza Hendricks", role: "Batsman", credits: 8.5 },
    { name: "Marco Jansen", role: "All-Rounder", credits: 9.0 },
    { name: "Keshav Maharaj", role: "All-Rounder", credits: 8.5 },
    { name: "Kagiso Rabada", role: "Bowler", credits: 9.5 },
    { name: "Anrich Nortje", role: "Bowler", credits: 9.0 },
    { name: "Tabraiz Shamsi", role: "Bowler", credits: 8.5 },
    { name: "Lungi Ngidi", role: "Bowler", credits: 8.5 },
  ],
  BANW: [
    { name: "Nigar Sultana", role: "Wicket-Keeper", credits: 9.0 },
    { name: "Shamima Sultana", role: "Wicket-Keeper", credits: 8.0 },
    { name: "Sobhana Mostary", role: "Batsman", credits: 8.5 },
    { name: "Murshida Khatun", role: "Batsman", credits: 8.5 },
    { name: "Fargana Hoque", role: "Batsman", credits: 8.5 },
    { name: "Ritu Moni", role: "All-Rounder", credits: 8.5 },
    { name: "Shorna Akter", role: "All-Rounder", credits: 8.5 },
    { name: "Fahima Khatun", role: "All-Rounder", credits: 8.5 },
    { name: "Nahida Akter", role: "Bowler", credits: 9.0 },
    { name: "Marufa Akter", role: "Bowler", credits: 8.5 },
    { name: "Rabeya Khan", role: "Bowler", credits: 8.5 },
  ],
  UAEW: [
    { name: "Theertha Satish", role: "Wicket-Keeper", credits: 8.5 },
    { name: "Heena Hotchandani", role: "Wicket-Keeper", credits: 8.0 },
    { name: "Esha Oza", role: "Batsman", credits: 9.5 },
    { name: "Rinitha Rajith", role: "Batsman", credits: 8.0 },
    { name: "Kavisha Egodage", role: "Batsman", credits: 8.5 },
    { name: "Samaira Dharnidharka", role: "All-Rounder", credits: 8.5 },
    { name: "Lavanya Keny", role: "All-Rounder", credits: 8.0 },
    { name: "Khushi Sharma", role: "All-Rounder", credits: 8.5 },
    { name: "Vaishnave Mahesh", role: "Bowler", credits: 8.5 },
    { name: "Indhuja Nandakumar", role: "Bowler", credits: 8.5 },
    { name: "Suraksha Kotte", role: "Bowler", credits: 8.0 },
  ],
  GAW: [
    { name: "Shai Hope", role: "Wicket-Keeper", credits: 9.0 },
    { name: "Azam Khan", role: "Wicket-Keeper", credits: 8.5 },
    { name: "Shimron Hetmyer", role: "Batsman", credits: 9.5 },
    { name: "Saim Ayub", role: "Batsman", credits: 9.0 },
    { name: "Kevlon Anderson", role: "Batsman", credits: 8.0 },
    { name: "Romario Shepherd", role: "All-Rounder", credits: 9.0 },
    { name: "Keemo Paul", role: "All-Rounder", credits: 8.5 },
    { name: "Dwaine Pretorius", role: "All-Rounder", credits: 8.5 },
    { name: "Imran Tahir", role: "Bowler", credits: 9.0 },
    { name: "Gudakesh Motie", role: "Bowler", credits: 8.5 },
    { name: "Shamar Joseph", role: "Bowler", credits: 8.5 },
  ],
  ABF: [
    { name: "Sam Billings", role: "Wicket-Keeper", credits: 9.0 },
    { name: "Jewel Andrew", role: "Wicket-Keeper", credits: 8.0 },
    { name: "Fakhar Zaman", role: "Batsman", credits: 9.5 },
    { name: "Kofi James", role: "Batsman", credits: 8.0 },
    { name: "Teddy Bishop", role: "Batsman", credits: 8.0 },
    { name: "Chris Green", role: "All-Rounder", credits: 9.0 },
    { name: "Fabian Allen", role: "All-Rounder", credits: 8.5 },
    { name: "Roshon Primus", role: "All-Rounder", credits: 8.0 },
    { name: "Mohammad Amir", role: "Bowler", credits: 9.0 },
    { name: "Hayden Walsh", role: "Bowler", credits: 8.5 },
    { name: "Shamar Springer", role: "Bowler", credits: 8.5 },
  ],
  RCB: [
    { name: "Dinesh Karthik", role: "Wicket-Keeper", credits: 8.5 },
    { name: "Anuj Rawat", role: "Wicket-Keeper", credits: 8.0 },
    { name: "Virat Kohli", role: "Batsman", credits: 10.0 },
    { name: "Faf du Plessis", role: "Batsman", credits: 9.5 },
    { name: "Rajat Patidar", role: "Batsman", credits: 8.5 },
    { name: "Glenn Maxwell", role: "All-Rounder", credits: 9.5 },
    { name: "Cameron Green", role: "All-Rounder", credits: 9.0 },
    { name: "Will Jacks", role: "All-Rounder", credits: 8.5 },
    { name: "Mohammed Siraj", role: "Bowler", credits: 9.0 },
    { name: "Lockie Ferguson", role: "Bowler", credits: 8.5 },
    { name: "Yash Dayal", role: "Bowler", credits: 8.0 },
  ],
  KKR: [
    { name: "Phil Salt", role: "Wicket-Keeper", credits: 9.0 },
    { name: "Rahmanullah Gurbaz", role: "Wicket-Keeper", credits: 8.5 },
    { name: "Shreyas Iyer", role: "Batsman", credits: 9.0 },
    { name: "Rinku Singh", role: "Batsman", credits: 9.0 },
    { name: "Venkatesh Iyer", role: "Batsman", credits: 8.5 },
    { name: "Andre Russell", role: "All-Rounder", credits: 10.0 },
    { name: "Sunil Narine", role: "All-Rounder", credits: 9.5 },
    { name: "Ramandeep Singh", role: "All-Rounder", credits: 8.0 },
    { name: "Mitchell Starc", role: "Bowler", credits: 9.0 },
    { name: "Varun Chakaravarthy", role: "Bowler", credits: 9.0 },
    { name: "Harshit Rana", role: "Bowler", credits: 8.5 },
  ],
};

function resolveTeamCode(teamName: string, explicitCode?: string): string {
  if (explicitCode && explicitCode.trim().length >= 2) return explicitCode.trim().toUpperCase();
  const lower = (teamName || "").toLowerCase();
  if (lower.includes("england")) return "ENG";
  if (lower.includes("pakistan")) return "PAK";
  if (lower.includes("india")) return "IND";
  if (lower.includes("australia")) return "AUS";
  if (lower.includes("south africa")) return "SA";
  if (lower.includes("bangladesh")) return "BANW";
  if (lower.includes("emirates") || lower.includes("uae")) return "UAEW";
  if (lower.includes("guyana")) return "GAW";
  if (lower.includes("antigua") || lower.includes("falcon")) return "ABF";
  if (lower.includes("bangalore") || lower.includes("rcb")) return "RCB";
  if (lower.includes("kolkata") || lower.includes("kkr")) return "KKR";
  return teamName.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "TEAM";
}

function generateRosterForTeam(teamName: string, code: string): RosterPlayer[] {
  if (TEAM_ROSTERS[code]) return TEAM_ROSTERS[code];
  return [
    { name: `${teamName} Keeper 1`, role: "Wicket-Keeper", credits: 9.0 },
    { name: `${teamName} Keeper 2`, role: "Wicket-Keeper", credits: 8.5 },
    { name: `${teamName} Batter 1`, role: "Batsman", credits: 9.5 },
    { name: `${teamName} Batter 2`, role: "Batsman", credits: 9.0 },
    { name: `${teamName} Batter 3`, role: "Batsman", credits: 8.5 },
    { name: `${teamName} All-Rounder 1`, role: "All-Rounder", credits: 9.0 },
    { name: `${teamName} All-Rounder 2`, role: "All-Rounder", credits: 8.5 },
    { name: `${teamName} All-Rounder 3`, role: "All-Rounder", credits: 8.5 },
    { name: `${teamName} Bowler 1`, role: "Bowler", credits: 9.0 },
    { name: `${teamName} Bowler 2`, role: "Bowler", credits: 8.5 },
    { name: `${teamName} Bowler 3`, role: "Bowler", credits: 8.5 },
  ];
}

async function ensureMatchSquad(match: any) {
  const codeA = resolveTeamCode(match.teamA, match.providerData?.teamACode);
  const codeB = resolveTeamCode(match.teamB, match.providerData?.teamBCode);

  const squadA = generateRosterForTeam(match.teamA, codeA);
  const squadB = generateRosterForTeam(match.teamB, codeB);

  const allPlayersToSeed = [
    ...squadA.map((p) => ({ ...p, teamCode: codeA })),
    ...squadB.map((p) => ({ ...p, teamCode: codeB })),
  ];

  for (const item of allPlayersToSeed) {
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const providerPlayerId = `p-${slug}`;

    const playerDoc = await Player.findOneAndUpdate(
      { providerPlayerId },
      {
        $setOnInsert: {
          providerPlayerId,
          name: item.name,
          role: item.role,
          nationality: item.teamCode,
        },
      },
      { upsert: true, new: true }
    );

    await MatchPlayer.findOneAndUpdate(
      { matchId: match._id, playerId: playerDoc._id },
      {
        $set: {
          realTeam: item.teamCode,
          role: item.role,
          credits: item.credits,
          isAvailable: true,
          isPlayingXI: true,
        },
      },
      { upsert: true }
    );
  }
}

export const getMatchPlayers = async (matchId: string) => {
  if (!Types.ObjectId.isValid(matchId)) throw new ApiError(400, "Invalid matchId");

  const match = await Match.findById(matchId);
  if (!match) throw new ApiError(404, "Match not found");

  // If match is upcoming and deadline has passed or is near, move deadline forward so team creation works
  if (match.status === "UPCOMING" && match.fantasyDeadline.getTime() <= Date.now()) {
    match.fantasyDeadline = new Date(Date.now() + 48 * 3600 * 1000);
    match.startTime = new Date(Date.now() + 48.5 * 3600 * 1000);
    await match.save();
  }

  // Ensure 22 players exist in MatchPlayer for this match
  const count = await MatchPlayer.countDocuments({ matchId: match._id });
  if (count < 22) {
    await ensureMatchSquad(match);
  }

  // Return the squad players for this match
  const matchPlayers = await MatchPlayer.find({ matchId: match._id }).populate("playerId");

  const merged = matchPlayers.map((mp: any) => {
    const player = mp.playerId;
    return {
      matchPlayerId: mp._id,
      playerId: player ? player._id : mp.playerId,
      name: player ? player.name : "Player",
      realTeam: mp.realTeam,
      role: normalizeRole(mp.role || (player ? player.role : "Batsman")),
      credits: mp.credits ?? 8.5,
      isPlayingXI: mp.isPlayingXI !== false,
      isAvailable: mp.isAvailable !== false,
    };
  });

  // Squad players first (grouped by role, highest credits first)
  merged.sort((a, b) => {
    if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
    if (a.role !== b.role) return a.role.localeCompare(b.role);
    return (b.credits ?? 0) - (a.credits ?? 0);
  });

  return merged;
};

export const getMatchLive = async (matchId: string) => {
  let match = null;
  if (Types.ObjectId.isValid(matchId)) {
    match = await Match.findById(matchId);
  }
  if (!match) {
    match = await Match.findOne({
      $or: [
        { providerMatchId: matchId },
        { providerMatchId: `INT-LIVE-${matchId}` },
        { teamA: new RegExp(matchId, "i") },
      ],
    });
  }
  if (!match) {
    match = await Match.findOne({ status: "LIVE" }) || await Match.findOne({});
  }
  if (!match) throw new ApiError(404, "Match not found");

  return {
    matchId: match._id,
    providerMatchId: match.providerMatchId,
    teamA: match.teamA,
    teamB: match.teamB,
    venue: match.venue,
    startTime: match.startTime,
    fantasyDeadline: match.fantasyDeadline,
    status: match.status,
    providerData: match.providerData ?? {},
  };
};
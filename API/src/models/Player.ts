import { Schema, model, Document, Types } from "mongoose";

/**
 * Per-format stat line, used for both batting and bowling career summaries.
 * Not every field applies to both — irrelevant ones are simply left undefined.
 */
export interface IFormatStats {
  matches?: number;
  innings?: number;

  // Batting-specific
  runs?: number;
  balls?: number;
  highest?: string; // string because scores like "22*" (not out) need the asterisk
  average?: number;
  strikeRate?: number;
  notOuts?: number;
  fours?: number;
  sixes?: number;
  ducks?: number;
  fifties?: number;
  hundreds?: number;
  doubleHundreds?: number;

  // Bowling-specific
  ballsBowled?: number;
  runsConceded?: number;
  maidens?: number;
  wickets?: number;
  bowlingAverage?: number;
  economy?: number;
  bowlingStrikeRate?: number;
  bestBowlingInnings?: string; // e.g. "6/15"
  bestBowlingMatch?: string; // e.g. "9/190"
  fourWickets?: number;
  fiveWickets?: number;
  tenWickets?: number;
}

export interface ICareerStats {
  test?: IFormatStats;
  odi?: IFormatStats;
  t20?: IFormatStats;
  ipl?: IFormatStats;
}

export interface IRankingEntry {
  currentRank?: number;
  bestRank?: number;
}

export interface IIccRankings {
  batting?: {
    test?: IRankingEntry;
    odi?: IRankingEntry;
    t20?: IRankingEntry;
  };
  bowling?: {
    test?: IRankingEntry;
    odi?: IRankingEntry;
    t20?: IRankingEntry;
  };
  allRounder?: {
    test?: IRankingEntry;
    odi?: IRankingEntry;
    t20?: IRankingEntry;
  };
}

export interface IPlayer extends Document {
  _id: Types.ObjectId;

  providerPlayerId: string;

  name: string;
  role: string; // Batsman | Bowler | All-Rounder | Wicket-Keeper
  nationality?: string;

  // Profile / bio
  dateOfBirth?: Date;
  birthPlace?: string;
  battingStyle?: string; // e.g. "Right Handed Bat"
  bowlingStyle?: string; // e.g. "Right-arm fast"

  teams?: string[];

  iccRankings?: IIccRankings;

  battingCareer?: ICareerStats;
  bowlingCareer?: ICareerStats;

  createdAt: Date;
  updatedAt: Date;
}

const formatStatsSchema = new Schema<IFormatStats>(
  {
    matches: Number,
    innings: Number,

    runs: Number,
    balls: Number,
    highest: String,
    average: Number,
    strikeRate: Number,
    notOuts: Number,
    fours: Number,
    sixes: Number,
    ducks: Number,
    fifties: Number,
    hundreds: Number,
    doubleHundreds: Number,

    ballsBowled: Number,
    runsConceded: Number,
    maidens: Number,
    wickets: Number,
    bowlingAverage: Number,
    economy: Number,
    bowlingStrikeRate: Number,
    bestBowlingInnings: String,
    bestBowlingMatch: String,
    fourWickets: Number,
    fiveWickets: Number,
    tenWickets: Number
  },
  { _id: false }
);

const careerStatsSchema = new Schema<ICareerStats>(
  {
    test: formatStatsSchema,
    odi: formatStatsSchema,
    t20: formatStatsSchema,
    ipl: formatStatsSchema
  },
  { _id: false }
);

const rankingEntrySchema = new Schema<IRankingEntry>(
  {
    currentRank: Number,
    bestRank: Number
  },
  { _id: false }
);

const rankingByFormatSchema = new Schema(
  {
    test: rankingEntrySchema,
    odi: rankingEntrySchema,
    t20: rankingEntrySchema
  },
  { _id: false }
);

const iccRankingsSchema = new Schema<IIccRankings>(
  {
    batting: rankingByFormatSchema,
    bowling: rankingByFormatSchema,
    allRounder: rankingByFormatSchema
  },
  { _id: false }
);

const playerSchema = new Schema<IPlayer>(
  {
    providerPlayerId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    name: { type: String, required: true, trim: true },
    role: { type: String, required: true },
    nationality: { type: String, trim: true },

    dateOfBirth: { type: Date },
    birthPlace: { type: String, trim: true },
    battingStyle: { type: String, trim: true },
    bowlingStyle: { type: String, trim: true },

    teams: [{ type: String, trim: true }],

    iccRankings: iccRankingsSchema,

    battingCareer: careerStatsSchema,
    bowlingCareer: careerStatsSchema
  },
  { timestamps: true }
);

export const Player = model<IPlayer>("Player", playerSchema);

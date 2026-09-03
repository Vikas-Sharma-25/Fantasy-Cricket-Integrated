import { Schema, model, Document, Types } from "mongoose";

/** Bridge table between Match and Player: match-specific fantasy availability. */
export interface IMatchPlayer extends Document {
  _id: Types.ObjectId;
  matchId: Types.ObjectId;
  playerId: Types.ObjectId;
  realTeam: string;
  role: string;
  credits: number;
  isAvailable: boolean;
  isPlayingXI: boolean;
  stats?: Record<string, unknown>;
  createdAt: Date;
}

const matchPlayerSchema = new Schema<IMatchPlayer>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: "Match", required: true, index: true },
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true, index: true },
    realTeam: { type: String, required: true },
    role: { type: String, required: true },
    credits: { type: Number, required: true, default: 8 },
    isAvailable: { type: Boolean, default: true },
    isPlayingXI: { type: Boolean, default: false },
    stats: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

matchPlayerSchema.index({ matchId: 1, playerId: 1 }, { unique: true });

export const MatchPlayer = model<IMatchPlayer>("MatchPlayer", matchPlayerSchema);

import { Schema, model, Document, Types } from "mongoose";

export interface IFantasyPoint extends Document {
  _id: Types.ObjectId;
  matchId: Types.ObjectId;
  playerId: Types.ObjectId;
  playerEventId: Types.ObjectId;
  scoringRuleId: Types.ObjectId;
  basePoints: number;
  multiplier: number;
  finalPoints: number;
  createdAt: Date;
}

const fantasyPointSchema = new Schema<IFantasyPoint>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: "Match", required: true, index: true },
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true, index: true },
    playerEventId: { type: Schema.Types.ObjectId, ref: "PlayerEvent", required: true },
    scoringRuleId: { type: Schema.Types.ObjectId, ref: "ScoringRule", required: true },
    basePoints: { type: Number, required: true },
    multiplier: { type: Number, required: true, default: 1 },
    finalPoints: { type: Number, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

fantasyPointSchema.index({ playerEventId: 1 }, { unique: true });

export const FantasyPoint = model<IFantasyPoint>("FantasyPoint", fantasyPointSchema);

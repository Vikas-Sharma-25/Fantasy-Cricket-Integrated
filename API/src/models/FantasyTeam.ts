import { Schema, model, Document, Types } from "mongoose";

export interface IFantasyTeam extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  matchId: Types.ObjectId;
  name: string;
  playerIds: Types.ObjectId[];
  captainId: Types.ObjectId;
  viceCaptainId: Types.ObjectId;
  totalCredits: number;
  isLocked: boolean;
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const fantasyTeamSchema = new Schema<IFantasyTeam>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    matchId: { type: Schema.Types.ObjectId, ref: "Match", required: true, index: true },
    name: { type: String, required: true, trim: true },
    playerIds: [{ type: Schema.Types.ObjectId, ref: "Player", required: true }],
    captainId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    viceCaptainId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    totalCredits: { type: Number, required: true },
    isLocked: { type: Boolean, default: false },
    lockedAt: { type: Date }
  },
  { timestamps: true }
);

fantasyTeamSchema.index({ userId: 1, matchId: 1 });

export const FantasyTeam = model<IFantasyTeam>("FantasyTeam", fantasyTeamSchema);

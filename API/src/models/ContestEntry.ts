import { Schema, model, Document, Types } from "mongoose";

export type ContestEntryStatus = "joined" | "withdrawn";

export interface IContestEntry extends Document {
  _id: Types.ObjectId;
  contestId: Types.ObjectId;
  userId: Types.ObjectId;
  fantasyTeamId: Types.ObjectId;
  joinedAt: Date;
  status: ContestEntryStatus;
}

const contestEntrySchema = new Schema<IContestEntry>(
  {
    contestId: { type: Schema.Types.ObjectId, ref: "Contest", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fantasyTeamId: { type: Schema.Types.ObjectId, ref: "FantasyTeam", required: true },
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["joined", "withdrawn"], default: "joined" }
  },
  { timestamps: false }
);

contestEntrySchema.index({ contestId: 1, userId: 1, fantasyTeamId: 1 }, { unique: true });

export const ContestEntry = model<IContestEntry>("ContestEntry", contestEntrySchema);

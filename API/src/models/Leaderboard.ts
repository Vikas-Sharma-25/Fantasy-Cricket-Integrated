import { Schema, model, Document, Types } from "mongoose";

export interface ILeaderboard extends Document {
  _id: Types.ObjectId;
  contestId: Types.ObjectId;
  userId: Types.ObjectId;
  fantasyTeamId: Types.ObjectId;
  totalPoints: number;
  rank: number;
  previousRank?: number;
  status: "live" | "final";
  updatedAt: Date;
}

const leaderboardSchema = new Schema<ILeaderboard>(
  {
    contestId: { type: Schema.Types.ObjectId, ref: "Contest", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fantasyTeamId: { type: Schema.Types.ObjectId, ref: "FantasyTeam", required: true },
    totalPoints: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    previousRank: { type: Number },
    status: { type: String, enum: ["live", "final"], default: "live" }
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

leaderboardSchema.index({ contestId: 1, userId: 1, fantasyTeamId: 1 }, { unique: true });
leaderboardSchema.index({ contestId: 1, totalPoints: -1 });

export const Leaderboard = model<ILeaderboard>("Leaderboard", leaderboardSchema);

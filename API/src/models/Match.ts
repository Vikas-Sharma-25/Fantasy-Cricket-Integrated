import { Schema, model, Document, Types } from "mongoose";

export type MatchStatus =
  | "UPCOMING"
  | "LIVE"
  | "COMPLETED"
  | "ABANDONED"
  | "SUSPENDED";

export interface IMatch extends Document {
  _id: Types.ObjectId;

  providerMatchId: string;

  teamA: string;
  teamB: string;

  venue?: string;

  startTime: Date;
  fantasyDeadline: Date;

  status: MatchStatus;

  providerData?: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<IMatch>(
  {
    providerMatchId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    teamA: {
      type: String,
      required: true,
      trim: true
    },

    teamB: {
      type: String,
      required: true,
      trim: true
    },

    venue: {
      type: String,
      trim: true
    },

    startTime: {
      type: Date,
      required: true,
      index: true
    },

    fantasyDeadline: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: [
        "UPCOMING",
        "LIVE",
        "COMPLETED",
        "ABANDONED",
        "SUSPENDED"
      ],
      default: "UPCOMING",
      index: true
    },

    providerData: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export const Match = model<IMatch>("Match", matchSchema);
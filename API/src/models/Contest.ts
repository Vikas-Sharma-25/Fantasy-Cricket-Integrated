import { Schema, model, Document, Types } from "mongoose";

export type ContestType = "PUBLIC" | "PRIVATE";

export type ContestStatus =
  | "OPEN"
  | "FULL"
  | "LOCKED"
  | "COMPLETED"
  | "CANCELLED";

export interface IContest extends Document {
  _id: Types.ObjectId;
  matchId: Types.ObjectId;
  createdBy?: Types.ObjectId;

  name: string;
  type: ContestType;

  maxSlots: number;
  joinedSlots: number;

  rules?: Record<string, unknown>;

  inviteCode?: string;

  status: ContestStatus;

  createdAt: Date;
  updatedAt: Date;
}

const contestSchema = new Schema<IContest>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      index: true
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: ["PUBLIC", "PRIVATE"],
      default: "PUBLIC"
    },

    maxSlots: {
      type: Number,
      required: true,
      min: 1
    },

    joinedSlots: {
      type: Number,
      default: 0,
      min: 0
    },

    rules: {
      type: Schema.Types.Mixed,
      default: {}
    },

    inviteCode: {
      type: String,
      index: true,
      sparse: true,
      unique: true
    },

    status: {
      type: String,
      enum: [
        "OPEN",
        "FULL",
        "LOCKED",
        "COMPLETED",
        "CANCELLED"
      ],
      default: "OPEN",
      index: true
    }
  },
  {
    timestamps: true
  }
);

contestSchema.index({
  matchId: 1,
  status: 1
});

export const Contest = model<IContest>(
  "Contest",
  contestSchema
);
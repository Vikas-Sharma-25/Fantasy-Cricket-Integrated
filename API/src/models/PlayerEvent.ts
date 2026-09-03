import { Schema, model, Document, Types } from "mongoose";

export type ProcessingStatus = "pending" | "processed" | "reversed" | "failed";

// Fixed list of allowed cricket event types.
// Add more here (e.g. "NO_BALL", "WIDE", "LBW", "RUN_OUT_NON_STRIKER") as needed.
export const EVENT_TYPES = [
  "SINGLE",   // 1 run
  "DOUBLE",   // 2 runs
  "THREE",    // 3 runs
  "FOUR",     // boundary - 4 runs
  "SIX",      // boundary - 6 runs
  "WICKET",
  "CATCH",
  "STUMPING",
  "RUN_OUT",
  "DOT_BALL"
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface IPlayerEvent extends Document {
  _id: Types.ObjectId;
  matchId: Types.ObjectId;
  playerId: Types.ObjectId;
  providerEventId: string;
  eventType: EventType;
  eventData?: Record<string, unknown>;
  eventTime: Date;
  processingStatus: ProcessingStatus;
  createdAt: Date;
}

const playerEventSchema = new Schema<IPlayerEvent>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: "Match", required: true, index: true },
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true, index: true },
    providerEventId: { type: String, required: true },
    eventType: {
      type: String,
      required: true,
      enum: EVENT_TYPES, // <-- ab sirf isi list ke values allowed honge
      set: (v: string) => (typeof v === "string" ? v.trim().toUpperCase() : v)
      // "Six", "six", " Six " -- sab automatically "SIX" ban jayenge save hone se pehle,
      // isse Postman se "Six"/"six" bhejne par bhi validation pass ho jayega.
    },
    eventData: { type: Schema.Types.Mixed, default: {} },
    eventTime: { type: Date, required: true },
    processingStatus: {
      type: String,
      enum: ["pending", "processed", "reversed", "failed"],
      default: "pending",
      index: true
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Idempotency: same provider event for same match must not be processed twice.
playerEventSchema.index({ matchId: 1, providerEventId: 1 }, { unique: true });

// A player can have multiple events of the SAME type in one match (e.g. many FOURs) -
// that's fine, since uniqueness is on providerEventId, not eventType. No change needed there.

export const PlayerEvent = model<IPlayerEvent>("PlayerEvent", playerEventSchema);
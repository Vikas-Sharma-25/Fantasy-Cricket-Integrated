import { Schema, model, Document, Types } from "mongoose";

export interface IScoringRule extends Document {
  _id: Types.ObjectId;
  version: number;
  ruleName: string;
  eventType: string;
  points: number;
  multiplier: number;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdAt: Date;
}

const scoringRuleSchema = new Schema<IScoringRule>(
  {
    version: { type: Number, required: true },
    ruleName: { type: String, required: true },
    eventType: { type: String, required: true, index: true },
    points: { type: Number, required: true },
    multiplier: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true, index: true },
    effectiveFrom: { type: Date, default: Date.now },
    effectiveTo: { type: Date }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ScoringRule = model<IScoringRule>("ScoringRule", scoringRuleSchema);

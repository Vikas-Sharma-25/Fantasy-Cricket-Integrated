import { Schema, model, Document, Types } from "mongoose";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface ISupportTicket extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  subject: string;
  description: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  adminReply?: string;
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: "general" },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true
    },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    adminReply: { type: String }
  },
  { timestamps: true }
);

export const SupportTicket = model<ISupportTicket>("SupportTicket", supportTicketSchema);

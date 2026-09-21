import { Schema, model, Document, Types } from "mongoose";

export type WalletTransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "CONTEST_ENTRY"
  | "CONTEST_WINNING"
  | "BONUS";

export type WalletTransactionStatus = "SUCCESS" | "PENDING" | "FAILED";

export interface IWalletTransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: WalletTransactionType;
  title: string;
  amount: number; // positive for credits, negative for debits
  balanceAfter: number;
  status: WalletTransactionStatus;
  refId: string;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["DEPOSIT", "WITHDRAWAL", "CONTEST_ENTRY", "CONTEST_WINNING", "BONUS"],
      required: true
    },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    status: {
      type: String,
      enum: ["SUCCESS", "PENDING", "FAILED"],
      default: "SUCCESS"
    },
    refId: { type: String, required: true, index: true },
    paymentMethod: { type: String, default: "UPI" }
  },
  { timestamps: true }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });

export const WalletTransaction = model<IWalletTransaction>(
  "WalletTransaction",
  walletTransactionSchema,
  "wallettransactions"
);


import { Types } from "mongoose";
import { User } from "../models/User";
import { WalletTransaction, IWalletTransaction } from "../models/WalletTransaction";
import { ApiError } from "../utils/apiError";

function formatRelativeDate(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export async function getWallet(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw ApiError.badRequest("Invalid user id");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const deposited = typeof user.depositedBalance === "number" ? user.depositedBalance : 0;
  const winnings = typeof user.winningsBalance === "number" ? user.winningsBalance : 0;
  const bonus = typeof user.bonusBalance === "number" ? user.bonusBalance : 0;
  const total = deposited + winnings + bonus;

  // Reconcile user.walletBalance if out of sync
  if (user.walletBalance !== total) {
    user.walletBalance = total;
    await user.save();
  }

  const rawTransactions = await WalletTransaction.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  const transactions = rawTransactions.map((tx: IWalletTransaction) => ({
    id: tx._id.toString(),
    type: tx.type,
    title: tx.title,
    amount: tx.amount,
    balanceAfter: tx.balanceAfter,
    date: formatRelativeDate(tx.createdAt),
    status: tx.status,
    refId: tx.refId,
    createdAt: tx.createdAt
  }));

  return {
    walletBalance: total,
    depositedBalance: deposited,
    winningsBalance: winnings,
    bonusBalance: bonus,
    transactions
  };
}

export async function addCash(userId: string, amount: number, paymentMethod = "UPI") {
  if (!Types.ObjectId.isValid(userId)) {
    throw ApiError.badRequest("Invalid user id");
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 10 || numAmount > 50000) {
    throw ApiError.badRequest("Deposit amount must be between ₹10 and ₹50,000");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const currentDep = typeof user.depositedBalance === "number" ? user.depositedBalance : 0;
  const currentWin = typeof user.winningsBalance === "number" ? user.winningsBalance : 0;
  const currentBon = typeof user.bonusBalance === "number" ? user.bonusBalance : 0;

  user.depositedBalance = currentDep + numAmount;
  user.walletBalance = (user.depositedBalance || 0) + currentWin + currentBon;
  await user.save();

  const refId = `UPI-${Math.floor(10000 + Math.random() * 90000)}`;
  await WalletTransaction.create({
    userId: user._id,
    type: "DEPOSIT",
    title: `Added Cash via Instant UPI`,
    amount: numAmount,
    balanceAfter: user.walletBalance,
    status: "SUCCESS",
    refId,
    paymentMethod
  });

  return getWallet(userId);
}

export async function withdraw(userId: string, amount: number, withdrawTo = "Bank/UPI") {
  if (!Types.ObjectId.isValid(userId)) {
    throw ApiError.badRequest("Invalid user id");
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw ApiError.badRequest("Please enter a valid withdrawal amount");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const currentDep = typeof user.depositedBalance === "number" ? user.depositedBalance : 0;
  const currentWin = typeof user.winningsBalance === "number" ? user.winningsBalance : 0;
  const currentBon = typeof user.bonusBalance === "number" ? user.bonusBalance : 0;
  const total = currentDep + currentWin + currentBon;

  // Minimum ₹100 maintenance reserve must remain
  const maxWithdrawable = Math.max(0, total - 100);
  if (numAmount > maxWithdrawable) {
    throw ApiError.badRequest(
      `You cannot withdraw this amount. Minimum ₹100 must remain deposited for maintenance. Max withdrawable: ₹${maxWithdrawable}`
    );
  }

  let rem = numAmount;
  // Deduct from winnings first
  const deductWinnings = Math.min(currentWin, rem);
  user.winningsBalance = currentWin - deductWinnings;
  rem -= deductWinnings;

  // Deduct remaining from deposited balance (above 100 maintenance reserve)
  if (rem > 0) {
    const excessDep = Math.max(0, currentDep - 100);
    const deductDep = Math.min(excessDep, rem);
    user.depositedBalance = 100 + (excessDep - deductDep);
    rem -= deductDep;
  }

  // Deduct remaining from bonus if any left
  if (rem > 0) {
    const deductBonus = Math.min(currentBon, rem);
    user.bonusBalance = currentBon - deductBonus;
  }

  user.walletBalance = (user.depositedBalance || 0) + (user.winningsBalance || 0) + (user.bonusBalance || 0);
  await user.save();

  const refId = `WDL-${Math.floor(10000 + Math.random() * 90000)}`;
  await WalletTransaction.create({
    userId: user._id,
    type: "WITHDRAWAL",
    title: `Instant Bank/UPI Withdrawal`,
    amount: -numAmount,
    balanceAfter: user.walletBalance,
    status: "SUCCESS",
    refId,
    paymentMethod: withdrawTo
  });

  return getWallet(userId);
}

export async function recordContestEntryTransaction(
  userId: Types.ObjectId | string,
  contestName: string,
  fee: number,
  balanceAfter: number
) {
  try {
    const refId = `FEE-${Math.floor(10000 + Math.random() * 90000)}`;
    await WalletTransaction.create({
      userId: new Types.ObjectId(userId),
      type: "CONTEST_ENTRY",
      title: `Contest Entry: ${contestName}`,
      amount: -Math.abs(fee),
      balanceAfter,
      status: "SUCCESS",
      refId
    });
  } catch (err) {
    console.error("[wallet] Failed to record contest entry transaction:", err);
  }
}

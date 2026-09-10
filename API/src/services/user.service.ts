import { Types } from "mongoose";
import { User } from "../models/User";
import { Notification } from "../models/Notification";
import { ApiError } from "../utils/apiError";
import { sanitizeUser } from "./auth.service";

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");
  return sanitizeUser(user);
}

export async function updateMe(
  userId: string,
  updates: Partial<{ name: string; mobile: string; profileImage: string; preferences: Record<string, unknown> }>
) {
  const updateDoc: Record<string, unknown> = {};
  if (updates.name !== undefined) updateDoc.name = updates.name;
  if (updates.mobile !== undefined) updateDoc.mobile = updates.mobile;
  if (updates.profileImage !== undefined) updateDoc.profileImage = updates.profileImage;
  if (updates.preferences !== undefined) updateDoc.preferences = updates.preferences;

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateDoc },
    { new: true, runValidators: false }
  );
  if (!user) throw ApiError.notFound("User not found");
  return sanitizeUser(user);
}

export async function getMyNotifications(userId: string, page = 1, limit = 20) {
  const filter = { userId: new Types.ObjectId(userId) };
  const [items, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter)
  ]);
  return { items, total };
}

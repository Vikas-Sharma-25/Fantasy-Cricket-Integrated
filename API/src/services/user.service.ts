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

export async function getRecentAnnouncements(limit = 20) {
  const items = await Notification.find({})
    .sort({ createdAt: -1 })
    .limit(limit);

  const seen = new Set<string>();
  const uniqueItems = [];
  for (const item of items) {
    const key = `${item.title}::${item.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  }
  return uniqueItems;
}

export async function getMyNotifications(userId: string, page = 1, limit = 20) {
  const filter = {
    $or: [
      { userId: new Types.ObjectId(userId) },
      { userId: null },
      { userId: { $exists: false } }
    ]
  };
  const [items, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter)
  ]);

  const seen = new Set<string>();
  const uniqueItems = [];
  for (const item of items) {
    const key = `${item.title}::${item.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  }

  return { items: uniqueItems, total };
}

export async function markNotificationRead(userId: string, notificationId: string) {
  await Notification.updateOne(
    { _id: notificationId, $or: [{ userId: new Types.ObjectId(userId) }, { userId: null }] },
    { $set: { isRead: true } }
  );
}

export async function markAllNotificationsRead(userId: string) {
  await Notification.updateMany(
    { $or: [{ userId: new Types.ObjectId(userId) }, { userId: null }] },
    { $set: { isRead: true } }
  );
}

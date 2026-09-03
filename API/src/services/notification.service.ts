import { Notification } from "../models/Notification";
import { emitToUser } from "../sockets";

export async function pushNotification(input: {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const notification = await Notification.create(input);
  emitToUser(input.userId, "notification:new", {
    id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    createdAt: notification.createdAt
  });
  return notification;
}

export async function markAsRead(userId: string, notificationId: string) {
  await Notification.updateOne({ _id: notificationId, userId }, { $set: { isRead: true } });
}

import type { RequestHandler } from "express";
import {
  listUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service.js";
import { notificationParamsSchema } from "../validators/notification.validators.js";

export const listNotifications: RequestHandler = async (request, response) => {
  const result = await listUserNotifications(request.authUser!.id);
  response.status(200).json({ success: true, data: result });
};

export const readNotification: RequestHandler = async (request, response) => {
  const { notificationId } = notificationParamsSchema.parse(request.params);
  const notification = await markNotificationRead(notificationId, request.authUser!.id);
  response.status(200).json({ success: true, data: { notification } });
};

export const readAllNotifications: RequestHandler = async (request, response) => {
  const updatedCount = await markAllNotificationsRead(request.authUser!.id);
  response.status(200).json({ success: true, data: { updatedCount } });
};

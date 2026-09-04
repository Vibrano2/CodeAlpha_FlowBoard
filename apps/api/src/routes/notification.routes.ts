import { Router } from "express";
import {
  listNotifications,
  readAllNotifications,
  readNotification,
} from "../controllers/notification.controller.js";
import { requireAuthentication } from "../middleware/auth.middleware.js";

export const notificationRouter = Router();

notificationRouter.use(requireAuthentication);
notificationRouter.get("/", listNotifications);
notificationRouter.patch("/read-all", readAllNotifications);
notificationRouter.patch("/:notificationId/read", readNotification);

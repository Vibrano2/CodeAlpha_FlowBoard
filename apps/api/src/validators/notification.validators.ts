import { z } from "zod";

export const notificationParamsSchema = z.object({
  notificationId: z.uuid("Notification ID must be a valid UUID."),
}).strict();

import { z } from "zod";

export const activityQuerySchema = z.object({
  taskId: z.uuid("Task ID must be a valid UUID.").optional(),
}).strict();

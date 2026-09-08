import { z } from "zod";

export const projectMemberParamsSchema = z.object({
  projectId: z.uuid("Project ID must be a valid UUID."),
}).strict();

export const memberParamsSchema = projectMemberParamsSchema.extend({
  userId: z.uuid("User ID must be a valid UUID."),
});

export const addMemberSchema = z.object({
  userId: z.uuid("User ID must be a valid UUID."),
}).strict();

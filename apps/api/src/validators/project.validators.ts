import { z } from "zod";

const projectNameSchema = z
  .string()
  .trim()
  .min(2, "Project name must contain at least 2 characters.")
  .max(100, "Project name must contain at most 100 characters.");

const projectDescriptionSchema = z
  .string()
  .trim()
  .max(2000, "Description must contain at most 2000 characters.")
  .nullable();

export const projectIdParamsSchema = z.object({
  projectId: z.uuid("Project ID must be a valid UUID."),
}).strict();

export const createProjectSchema = z.object({
  name: projectNameSchema,
  description: projectDescriptionSchema.optional(),
}).strict();

export const updateProjectSchema = z
  .object({
    name: projectNameSchema.optional(),
    description: projectDescriptionSchema.optional(),
  })
  .strict()
  .refine((input) => input.name !== undefined || input.description !== undefined, {
    message: "Provide at least one project field to update.",
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

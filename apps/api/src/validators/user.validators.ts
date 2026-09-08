import { z } from "zod";

const profileEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254, "Email must contain at most 254 characters.")
  .transform((email) => email.toLowerCase());

const avatarUrlSchema = z
  .string()
  .trim()
  .url("Avatar URL must be a valid URL.")
  .max(2048, "Avatar URL must contain at most 2048 characters.")
  .refine((value) => new URL(value).protocol === "https:", {
    message: "Avatar URL must use HTTPS.",
  });

export const searchUsersQuerySchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Enter at least 3 email characters.")
    .max(254, "Email search is too long.")
    .transform((email) => email.toLowerCase()),
}).strict();

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters.")
    .max(100, "Name must contain at most 100 characters."),
  email: profileEmailSchema,
  avatarUrl: avatarUrlSchema.nullable(),
}).strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

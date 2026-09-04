import { z } from "zod";

export const searchUsersQuerySchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Enter at least 3 email characters.")
    .max(254, "Email search is too long.")
    .transform((email) => email.toLowerCase()),
});

import { z } from "zod";

export const createSearchJobSchema = z.object({
  industry: z
    .string()
    .trim()
    .min(2, "Industry must be at least 2 characters long"),
  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters long"),
  region: z.string().trim().optional(),
  country: z
    .string()
    .trim()
    .min(2, "Country must be at least 2 characters long"),
  serviceTrack: z
    .string()
    .trim()
    .optional()
    .default("creative+technical"),
  limit: z
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(50, "Limit cannot exceed 50")
    .default(10),
  keyword: z.string().trim().optional(),
});

export type CreateSearchJobInput = z.infer<typeof createSearchJobSchema>;


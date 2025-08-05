import { z } from "zod";

export const BucketCreationSchema = z.object({
  title: z
    .string()
    .min(1, "Bucket name is required")
    .max(50, "Bucket name must be less than 50 characters"),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid color format")
    .default("#00BCD4"),
  labId: z.string().min(1, "Lab ID is required"),
});

export type BucketCreationInput = z.infer<typeof BucketCreationSchema>;
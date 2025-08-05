import { z } from "zod";

export const TaskCreationSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(100, "Task title must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED", "BLOCKED"] as const)
    .describe("Please select a status")
    .default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const)
    .describe("Please select a priority")
    .default("MEDIUM"),
  projectId: z.string().optional(), // Changed from studyId to projectId
  assigneeIds: z.array(z.string()).default([]),
  dueDate: z.string().optional(),
});

export type TaskCreationInput = z.infer<typeof TaskCreationSchema>;
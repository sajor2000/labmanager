import { z } from "zod";

// Study status enum
export const StudyStatusSchema = z.enum([
  "PLANNING",
  "IRB_SUBMISSION",
  "IRB_APPROVED",
  "DATA_COLLECTION",
  "ANALYSIS",
  "MANUSCRIPT",
  "UNDER_REVIEW",
  "PUBLISHED",
  "ON_HOLD",
  "CANCELLED",
]);

// Study priority enum
export const StudyPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

// Funding source enum
export const FundingSourceSchema = z.enum([
  "NIH",
  "NSF",
  "INDUSTRY_SPONSORED",
  "INTERNAL",
  "FOUNDATION",
  "OTHER",
]);

// ORA Number validation pattern
const ORA_NUMBER_PATTERN = /^ORA-\d{4}-\d{3}$/;

// Study creation form schema
export const StudyCreationSchema = z.object({
  studyName: z
    .string()
    .min(3, "Study name must be at least 3 characters")
    .max(200, "Study name must be less than 200 characters")
    .trim(),
  
  oraNumber: z
    .string()
    .regex(ORA_NUMBER_PATTERN, "ORA number must be in format ORA-YYYY-NNN")
    .optional()
    .or(z.literal("")),
  
  status: StudyStatusSchema.default("PLANNING"),
  
  priority: StudyPrioritySchema.default("MEDIUM"),
  
  bucket: z
    .string()
    .min(1, "Please select a bucket")
    .optional(),
  
  fundingSource: FundingSourceSchema.optional().or(z.literal("")),
  
  studyType: z
    .string()
    .min(2, "Study type must be at least 2 characters")
    .max(100, "Study type must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  
  dueDate: z
    .string()
    .refine((date) => {
      if (!date) return true;
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime()) && parsedDate > new Date();
    }, "Due date must be in the future")
    .optional()
    .or(z.literal("")),
  
  externalCollaborators: z
    .string()
    .max(500, "External collaborators must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  
  notes: z
    .string()
    .max(2000, "Notes must be less than 2000 characters")
    .optional()
    .or(z.literal("")),
});

// Study update schema (partial, for PATCH operations)
export const StudyUpdateSchema = StudyCreationSchema.partial();

// Study search/filter schema
export const StudyFilterSchema = z.object({
  status: z.array(StudyStatusSchema).optional(),
  priority: z.array(StudyPrioritySchema).optional(),
  bucketIds: z.array(z.string()).optional(),
  assigneeIds: z.array(z.string()).optional(),
  fundingSources: z.array(FundingSourceSchema).optional(),
  dateRange: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .refine((range) => range.start <= range.end, "Start date must be before end date")
    .optional(),
  searchQuery: z.string().max(200).optional(),
});

// Type exports
export type StudyCreationInput = z.infer<typeof StudyCreationSchema>;
export type StudyUpdateInput = z.infer<typeof StudyUpdateSchema>;
export type StudyFilterInput = z.infer<typeof StudyFilterSchema>;
export type StudyStatus = z.infer<typeof StudyStatusSchema>;
export type StudyPriority = z.infer<typeof StudyPrioritySchema>;
export type FundingSource = z.infer<typeof FundingSourceSchema>;
import { z } from 'zod';

// Common validation schemas
export const idSchema = z.string().cuid('Invalid ID format');

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

export const urlSchema = z
  .string()
  .url('Invalid URL')
  .trim();

export const dateSchema = z
  .string()
  .datetime('Invalid date format')
  .or(z.date());

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Sanitization helpers
export const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
};

export const sanitizeHtml = (html: string): string => {
  // In production, use a proper HTML sanitizer like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '') // Remove event handlers
    .replace(/on\w+\s*=\s*'[^']*'/gi, '');
};

// Project validation schemas
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(200, 'Project name too long')
    .transform(sanitizeString),
  description: z
    .string()
    .max(5000, 'Description too long')
    .optional()
    .transform((val) => val ? sanitizeString(val) : undefined),
  oraNumber: z
    .string()
    .regex(/^ORA-\d{4}-\d{3}$/, 'Invalid ORA number format')
    .optional(),
  status: z.enum([
    'PLANNING',
    'IRB_SUBMISSION',
    'IRB_APPROVED',
    'DATA_COLLECTION',
    'ANALYSIS',
    'MANUSCRIPT',
    'UNDER_REVIEW',
    'PUBLISHED',
    'ON_HOLD',
    'CANCELLED',
  ]).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  bucketId: idSchema.optional(),
  dueDate: dateSchema.optional(),
  startDate: dateSchema.optional(),
  fundingSource: z.enum([
    'NIH',
    'NSF',
    'INDUSTRY',
    'INTERNAL',
    'FOUNDATION',
    'OTHER',
  ]).optional(),
  externalCollaborators: z
    .string()
    .max(1000)
    .optional()
    .transform((val) => val ? sanitizeString(val) : undefined),
  notes: z
    .string()
    .max(10000)
    .optional()
    .transform((val) => val ? sanitizeHtml(val) : undefined),
  assigneeIds: z.array(idSchema).optional(),
  labId: idSchema,
});

export const updateProjectSchema = createProjectSchema.partial();

// Task validation schemas
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(200, 'Task title too long')
    .transform(sanitizeString),
  description: z
    .string()
    .max(2000)
    .optional()
    .transform((val) => val ? sanitizeString(val) : undefined),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'REVIEW']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  projectId: idSchema.optional(),
  assigneeId: idSchema.optional(),
  dueDate: dateSchema.optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

// User validation schemas
export const createUserSchema = z.object({
  email: emailSchema,
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .transform(sanitizeString),
  role: z.enum([
    'PRINCIPAL_INVESTIGATOR',
    'CO_PRINCIPAL_INVESTIGATOR',
    'RESEARCH_MEMBER',
    'LAB_ADMINISTRATOR',
    'EXTERNAL_COLLABORATOR',
    'GUEST',
  ]).default('RESEARCH_MEMBER'),
  avatarUrl: urlSchema.optional(),
  expertise: z.array(z.string().max(50)).max(20).optional(),
  capacity: z.number().min(0).max(60).optional(),
});

export const updateUserSchema = createUserSchema.partial();

// Idea validation schemas
export const createIdeaSchema = z.object({
  title: z
    .string()
    .min(1, 'Idea title is required')
    .max(200, 'Title too long')
    .transform(sanitizeString),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description too long')
    .transform(sanitizeHtml),
  category: z.enum(['RESEARCH', 'PROCESS', 'TOOL', 'OTHER']).default('RESEARCH'),
  tags: z.array(z.string().max(30)).max(10).optional(),
  attachments: z.array(urlSchema).max(5).optional(),
  labId: idSchema,
});

export const voteIdeaSchema = z.object({
  ideaId: idSchema,
  vote: z.enum(['up', 'down']),
});

// Deadline validation schemas
export const createDeadlineSchema = z.object({
  title: z
    .string()
    .min(1, 'Deadline title is required')
    .max(200, 'Title too long')
    .transform(sanitizeString),
  description: z
    .string()
    .max(2000)
    .optional()
    .transform((val) => val ? sanitizeString(val) : undefined),
  type: z.enum(['IRB', 'GRANT', 'PUBLICATION', 'MILESTONE', 'OTHER']).default('OTHER'),
  dueDate: dateSchema,
  reminderDays: z.number().min(0).max(365).default(7),
  projectId: idSchema.optional(),
  assigneeIds: z.array(idSchema).optional(),
  labId: idSchema,
});

// Standup validation schemas
export const createStandupSchema = z.object({
  date: dateSchema.default(() => new Date()),
  duration: z.number().min(1).max(180).optional(), // minutes
  participants: z.array(idSchema).min(1, 'At least one participant required'),
  summary: z
    .string()
    .max(5000)
    .optional()
    .transform((val) => val ? sanitizeHtml(val) : undefined),
  actionItems: z.array(z.object({
    description: z.string().max(500).transform(sanitizeString),
    assigneeId: idSchema.optional(),
    dueDate: dateSchema.optional(),
  })).optional(),
  blockers: z.array(z.string().max(500).transform(sanitizeString)).optional(),
  labId: idSchema,
});

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().max(255),
  mimetype: z.string().regex(/^[\w-]+\/[\w-]+$/),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
});

// Request validation middleware
export async function validateRequest<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors for better readability
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      throw new ValidationError('Validation failed', formattedErrors);
    }
    throw error;
  }
}

// Custom validation error class
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Query parameter validation
export function validateQueryParams(
  searchParams: URLSearchParams,
  schema: z.ZodSchema
) {
  const params: Record<string, string | string[]> = {};
  
  searchParams.forEach((value, key) => {
    if (params[key]) {
      // Handle multiple values for the same key
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value);
      } else {
        params[key] = [params[key] as string, value];
      }
    } else {
      params[key] = value;
    }
  });
  
  return schema.parse(params);
}
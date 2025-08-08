import { z } from 'zod';

// Common field validations
const nameSchema = z.string().min(1).max(255).trim();
const descriptionSchema = z.string().max(5000).optional();
const uuidSchema = z.string().uuid();
const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/);
const idSchema = z.union([uuidSchema, cuidSchema]);

// Status enums
export const ProjectStatus = z.enum([
  'PLANNING',
  'IRB_SUBMISSION', 
  'IRB_APPROVED',
  'DATA_COLLECTION',
  'ANALYSIS',
  'MANUSCRIPT',
  'UNDER_REVIEW',
  'PUBLISHED',
  'ON_HOLD',
  'CANCELLED'
]);

export const Priority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const TaskStatus = z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']);

// Lab schema
export const LabSchema = z.object({
  name: nameSchema,
  shortName: z.string().min(1).max(20).trim(),
  description: descriptionSchema,
  adminIds: z.array(idSchema).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const LabUpdateSchema = LabSchema.partial();

// Project/Study schema
export const ProjectSchema = z.object({
  name: nameSchema,
  oraNumber: z.string().regex(/^ORA-\d{4}-\d{3}$/).optional(),
  status: ProjectStatus,
  priority: Priority,
  bucketId: idSchema.optional(),
  fundingSource: z.string().max(255).optional(),
  studyType: z.string().max(255).optional(),
  dueDate: z.string().datetime().optional(),
  externalCollaborators: z.string().max(2000).optional(),
  notes: z.string().max(10000).optional(),
  assigneeIds: z.array(idSchema).optional(),
});

export const ProjectUpdateSchema = ProjectSchema.partial();

// Bucket schema
export const BucketSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  labId: idSchema,
  order: z.number().int().min(0).optional(),
});

export const BucketUpdateSchema = BucketSchema.partial();

// Task schema
export const TaskSchema = z.object({
  title: nameSchema,
  description: descriptionSchema,
  status: TaskStatus,
  priority: Priority,
  projectId: idSchema,
  assigneeIds: z.array(idSchema).optional(),
  dueDate: z.string().datetime().optional(),
  labels: z.array(z.string().max(50)).max(10).optional(),
  completedAt: z.string().datetime().optional(),
});

export const TaskUpdateSchema = TaskSchema.partial();

// Idea schema
export const IdeaSchema = z.object({
  title: nameSchema,
  description: z.string().min(1).max(10000),
  category: z.string().max(100).optional(),
  impact: z.number().min(1).max(10).optional(),
  feasibility: z.number().min(1).max(10).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const IdeaUpdateSchema = IdeaSchema.partial();

// Standup schema
export const StandupSchema = z.object({
  transcript: z.string().max(50000),
  summary: z.string().max(5000).optional(),
  actionItems: z.array(z.object({
    text: z.string().max(500),
    assigneeId: idSchema.optional(),
    dueDate: z.string().datetime().optional(),
  })).optional(),
  blockers: z.array(z.string().max(500)).optional(),
  projectIds: z.array(idSchema).optional(),
});

// User schema
export const UserSchema = z.object({
  email: z.string().email(),
  name: nameSchema,
  role: z.string().max(100).optional(),
  bio: z.string().max(1000).optional(),
  expertise: z.array(z.string().max(50)).max(20).optional(),
});

export const UserUpdateSchema = UserSchema.partial();

// Pagination schema
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Search schema
export const SearchSchema = z.object({
  q: z.string().max(200).optional(),
  filters: z.record(z.unknown()).optional(),
});

// Batch operation schema
export const BatchOperationSchema = z.object({
  ids: z.array(idSchema).min(1).max(100),
  action: z.enum(['delete', 'archive', 'update']),
  data: z.record(z.unknown()).optional(),
});

// Export validation helper
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

// Sanitization helper
export function sanitizeOutput<T>(data: T): T {
  if (typeof data === 'string') {
    // Remove any potential XSS vectors from output
    return data
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;') as T;
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeOutput) as T;
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      sanitized[key] = sanitizeOutput((data as any)[key]);
    }
    return sanitized;
  }
  
  return data;
}
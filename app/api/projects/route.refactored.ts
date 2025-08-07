import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  handleApiError, 
  ErrorCode,
  AppError,
  paginationMeta 
} from '@/lib/api/response';
import { 
  createProjectSchema, 
  validateRequest,
  paginationSchema,
  validateQueryParams
} from '@/lib/api/validation';
import { 
  withMiddleware, 
  withLogging, 
  withTransaction,
  withCache 
} from '@/lib/api/middleware';
import { getCurrentUser } from '@/lib/utils/get-current-user';
import type { Prisma } from '@prisma/client';

// GET /api/projects - Get all projects with filters, pagination, and caching
export const GET = withMiddleware(
  withLogging(
    async (request: NextRequest) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, 'Authentication required');
      }

      // Validate and parse query parameters
      const searchParams = request.nextUrl.searchParams;
      const filters = validateQueryParams(searchParams, paginationSchema.extend({
        labId: z.string().optional(),
        bucketId: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
      }));

      const { page, limit, sortBy = 'updatedAt', sortOrder, ...where } = filters;

      // Build Prisma where clause
      const whereClause: Prisma.ProjectWhereInput = {
        labId: where.labId || user.currentLabId,
        isActive: true,
        ...(where.bucketId && { bucketId: where.bucketId }),
        ...(where.status && { status: where.status }),
        ...(where.search && {
          OR: [
            { name: { contains: where.search, mode: 'insensitive' } },
            { description: { contains: where.search, mode: 'insensitive' } },
            { oraNumber: { contains: where.search, mode: 'insensitive' } },
          ],
        }),
      };

      // Ensure user has access to the lab
      const labAccess = await prisma.labMember.findFirst({
        where: {
          labId: whereClause.labId as string,
          userId: user.id,
        },
      });

      if (!labAccess) {
        throw new AppError(ErrorCode.FORBIDDEN, 'Access denied to this lab');
      }

      // Cache key for this specific query
      const cacheKey = `projects:${JSON.stringify({ whereClause, page, limit, sortBy, sortOrder })}`;

      // Fetch with caching
      const result = await withCache(
        cacheKey,
        async () => {
          // Execute count and data queries in parallel
          const [total, projects] = await Promise.all([
            prisma.project.count({ where: whereClause }),
            prisma.project.findMany({
              where: whereClause,
              include: {
                lab: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                bucket: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        initials: true,
                      },
                    },
                  },
                },
                tasks: {
                  where: { isActive: true },
                  select: {
                    id: true,
                    status: true,
                  },
                },
                _count: {
                  select: {
                    tasks: { where: { isActive: true } },
                    milestones: { where: { isActive: true } },
                    documents: { where: { isActive: true } },
                    comments: true,
                  },
                },
              },
              orderBy: {
                [sortBy]: sortOrder,
              },
              skip: (page - 1) * limit,
              take: limit,
            }),
          ]);

          // Transform the data for frontend consumption
          const transformedProjects = projects.map(project => ({
            id: project.id,
            name: project.name,
            description: project.description,
            oraNumber: project.oraNumber,
            status: project.status,
            priority: project.priority,
            projectType: project.projectType,
            studyType: project.studyType,
            fundingSource: project.fundingSource,
            startDate: project.startDate,
            dueDate: project.dueDate,
            completedDate: project.completedDate,
            lab: project.lab,
            bucket: project.bucket,
            members: project.members.map(m => ({
              ...m.user,
              role: m.role,
              allocation: m.allocation,
            })),
            metrics: {
              taskCount: project._count.tasks,
              completedTasks: project.tasks.filter(t => t.status === 'COMPLETED').length,
              milestoneCount: project._count.milestones,
              documentCount: project._count.documents,
              commentCount: project._count.comments,
              progress: calculateProgress(project.tasks),
            },
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
          }));

          return {
            projects: transformedProjects,
            total,
          };
        },
        30 // Cache for 30 seconds
      );

      return successResponse(
        result.projects,
        paginationMeta(page, limit, result.total)
      );
    }
  ),
  {
    requireAuth: true,
    rateLimit: { requests: 100, window: 60 },
    validateMethod: ['GET'],
  }
);

// POST /api/projects - Create a new project with validation and transactions
export const POST = withMiddleware(
  withLogging(
    async (request: NextRequest) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, 'Authentication required');
      }

      // Parse and validate request body
      const body = await request.json();
      const validatedData = await validateRequest(body, createProjectSchema);

      // Verify lab access
      const labMember = await prisma.labMember.findFirst({
        where: {
          labId: validatedData.labId,
          userId: user.id,
          role: {
            in: ['ADMIN', 'MANAGER', 'OWNER'],
          },
        },
      });

      if (!labMember) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          'You do not have permission to create projects in this lab'
        );
      }

      // Create project in a transaction
      const project = await withTransaction(async (tx) => {
        // Generate ORA number if not provided
        let oraNumber = validatedData.oraNumber;
        if (!oraNumber) {
          const year = new Date().getFullYear();
          const count = await tx.project.count({
            where: {
              oraNumber: {
                startsWith: `ORA-${year}`,
              },
            },
          });
          oraNumber = `ORA-${year}-${String(count + 1).padStart(3, '0')}`;
        }

        // Create the project
        const newProject = await tx.project.create({
          data: {
            ...validatedData,
            oraNumber,
            createdById: user.id,
            members: {
              create: [
                // Add creator as project owner
                {
                  userId: user.id,
                  role: 'ACCOUNTABLE',
                  allocation: 100,
                },
                // Add other members if provided
                ...(validatedData.assigneeIds?.map((userId: string) => ({
                  userId,
                  role: 'RESPONSIBLE' as const,
                  allocation: 20,
                })) || []),
              ],
            },
          },
          include: {
            lab: true,
            bucket: true,
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        });

        // Create initial milestone
        await tx.milestone.create({
          data: {
            projectId: newProject.id,
            title: 'Project Kickoff',
            description: 'Initial project setup and planning',
            targetDate: validatedData.startDate || new Date(),
            type: 'PLANNING',
            createdById: user.id,
          },
        });

        // Create activity log
        await tx.activityLog.create({
          data: {
            projectId: newProject.id,
            userId: user.id,
            action: 'PROJECT_CREATED',
            details: {
              projectName: newProject.name,
              oraNumber: newProject.oraNumber,
            },
          },
        });

        // Send notifications to team members
        if (validatedData.assigneeIds?.length) {
          await tx.notification.createMany({
            data: validatedData.assigneeIds.map((userId: string) => ({
              userId,
              type: 'PROJECT_ASSIGNMENT',
              title: 'New Project Assignment',
              message: `You have been assigned to project: ${newProject.name}`,
              metadata: {
                projectId: newProject.id,
                projectName: newProject.name,
              },
            })),
          });
        }

        return newProject;
      });

      // Clear relevant caches
      clearApiCache('projects');

      return successResponse(project, undefined, 201);
    }
  ),
  {
    requireAuth: true,
    rateLimit: { requests: 20, window: 60 },
    validateMethod: ['POST'],
  }
);

// Helper function to calculate project progress
function calculateProgress(tasks: Array<{ status: string }>): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;
  return Math.round((completed / tasks.length) * 100);
}

// Import necessary modules at the top
import { z } from 'zod';
import { clearApiCache } from '@/hooks/use-api';
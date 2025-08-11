import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating a view
const CreateViewSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['TABLE', 'KANBAN', 'CALENDAR', 'GALLERY', 'TIMELINE', 'GANTT', 'FORM']),
  workspaceId: z.string(),
  tableId: z.string(),
  configuration: z.object({
    filters: z.array(z.any()).optional(),
    sortRules: z.array(z.any()).optional(),
    groupSettings: z.any().optional(),
    visibleFields: z.array(z.string()).optional(),
    fieldWidths: z.record(z.number()).optional(),
    rowHeight: z.enum(['compact', 'normal', 'comfortable']).optional(),
    showGridLines: z.boolean().optional(),
    alternateRowColors: z.boolean().optional(),
    wrapText: z.boolean().optional(),
    cardSize: z.enum(['small', 'medium', 'large']).optional(),
    coverField: z.string().optional(),
    colorField: z.string().optional(),
    permissions: z.object({
      canEdit: z.boolean(),
      canDelete: z.boolean(),
      canShare: z.boolean(),
      canDuplicate: z.boolean(),
    }).optional(),
  }).optional(),
  isDefault: z.boolean().default(false),
  isShared: z.boolean().default(false),
  createdById: z.string().optional(),
});

// GET /api/views - Get views for a workspace/table
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');
    const tableId = searchParams.get('tableId');
    const userId = request.headers.get('x-selected-user-id');

    if (!workspaceId || !tableId) {
      return NextResponse.json(
        { error: 'workspaceId and tableId are required' },
        { status: 400 }
      );
    }

    // Get views for the workspace/table
    // Since we don't have a View model in the schema, we'll simulate with Projects for now
    // In production, you'd add a View model to the Prisma schema
    const views = await prisma.project.findMany({
      where: {
        labId: workspaceId,
        // Filter by user's access if needed
        ...(userId && {
          OR: [
            { createdById: userId },
            { bucket: { lab: { members: { some: { userId } } } } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Transform to view format
    const transformedViews = views.map(view => ({
      id: view.id,
      name: view.name,
      type: 'TABLE', // Default type
      workspaceId,
      tableId,
      configuration: {
        filters: [],
        sortRules: [],
        visibleFields: [],
        showGridLines: true,
        alternateRowColors: true,
        wrapText: true,
        rowHeight: 'normal',
        permissions: {
          canEdit: true,
          canDelete: true,
          canShare: true,
          canDuplicate: true,
        },
      },
      isDefault: false,
      isShared: false,
      createdById: view.createdBy?.id,
      createdAt: view.createdAt,
      updatedAt: view.updatedAt,
    }));

    return NextResponse.json(transformedViews);
  } catch (error) {
    console.error('Error fetching views:', error);
    return NextResponse.json(
      { error: 'Failed to fetch views' },
      { status: 500 }
    );
  }
}

// POST /api/views - Create a new view
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-selected-user-id');

    // Validate the request body
    const validatedData = CreateViewSchema.parse(body);

    // For now, we'll store view configurations as Projects
    // In production, create a proper View model
    const newView = await prisma.project.create({
      data: {
        name: validatedData.name,
        labId: validatedData.workspaceId,
        bucketId: validatedData.tableId, // Using bucketId as tableId proxy
        description: JSON.stringify(validatedData.configuration),
        status: validatedData.isDefault ? 'ACTIVE' : 'PLANNING',
        createdById: validatedData.createdById || userId || undefined,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Transform to view format
    const transformedView = {
      id: newView.id,
      name: newView.name,
      type: validatedData.type,
      workspaceId: validatedData.workspaceId,
      tableId: validatedData.tableId,
      configuration: validatedData.configuration || {},
      isDefault: validatedData.isDefault,
      isShared: validatedData.isShared,
      createdById: newView.createdBy?.id,
      createdAt: newView.createdAt,
      updatedAt: newView.updatedAt,
    };

    return NextResponse.json(transformedView, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating view:', error);
    return NextResponse.json(
      { error: 'Failed to create view' },
      { status: 500 }
    );
  }
}
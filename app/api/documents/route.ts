import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import DocumentService from '@/lib/services/document.service';
import { AttachableType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// POST /api/documents - Upload a document
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as AttachableType;
    const entityId = formData.get('entityId') as string;
    const labId = formData.get('labId') as string;
    const description = formData.get('description') as string | null;
    const tags = formData.get('tags') as string | null;

    // Validate required fields
    if (!file || !entityType || !entityId || !labId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, entityType, entityId, labId' },
        { status: 400 }
      );
    }

    // Validate entity type
    const validEntityTypes: AttachableType[] = ['TASK', 'IDEA', 'DEADLINE', 'PROJECT', 'COMMENT', 'ACTION_ITEM'];
    if (!validEntityTypes.includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      );
    }

    // Check if user is a member of the lab
    const labMembership = await prisma.labMember.findFirst({
      where: {
        userId: user.id,
        labId,
        isActive: true
      }
    });

    if (!labMembership) {
      return NextResponse.json(
        { error: 'You must be a member of this lab to upload documents' },
        { status: 403 }
      );
    }

    // Verify the entity exists and belongs to the lab
    let entityExists = false;
    switch (entityType) {
      case 'TASK':
        const task = await prisma.task.findFirst({
          where: { id: entityId, project: { labId } }
        });
        entityExists = !!task;
        break;
      case 'IDEA':
        const idea = await prisma.idea.findFirst({
          where: { id: entityId, labId }
        });
        entityExists = !!idea;
        break;
      case 'DEADLINE':
        const deadline = await prisma.deadline.findFirst({
          where: { 
            id: entityId,
            OR: [
              { labId },
              { project: { labId } }
            ]
          }
        });
        entityExists = !!deadline;
        break;
      case 'PROJECT':
        const project = await prisma.project.findFirst({
          where: { id: entityId, labId }
        });
        entityExists = !!project;
        break;
      case 'ACTION_ITEM':
        const actionItem = await prisma.actionItem.findFirst({
          where: { id: entityId }
        });
        entityExists = !!actionItem;
        break;
      case 'COMMENT':
        const comment = await prisma.comment.findFirst({
          where: { id: entityId }
        });
        entityExists = !!comment;
        break;
    }

    if (!entityExists) {
      return NextResponse.json(
        { error: `${entityType} not found or does not belong to this lab` },
        { status: 404 }
      );
    }

    // Parse tags if provided
    const parsedTags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined;

    // Upload the document
    const result = await DocumentService.uploadDocument(
      file,
      entityType,
      entityId,
      labId,
      user.id,
      {
        description: description || undefined,
        tags: parsedTags,
        compress: true // Enable compression by default
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      document: result.document,
      message: result.message,
      fileSize: result.fileSize,
      compressed: result.compressed
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// GET /api/documents - Get documents for an entity
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') as AttachableType;
    const entityId = searchParams.get('entityId');
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    // Get documents
    const documents = await DocumentService.getDocuments(
      entityType,
      entityId,
      includeDeleted
    );

    return NextResponse.json(documents);

  } catch (error) {
    console.error('Document fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
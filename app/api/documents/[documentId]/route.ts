import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import DocumentService from '@/lib/services/document.service';
import { prisma } from '@/lib/prisma';

// GET /api/documents/[documentId] - Download a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    // Check if document exists and user has access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        labId: true,
        isDeleted: true,
        filename: true,
        mimeType: true
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.isDeleted) {
      return NextResponse.json(
        { error: 'Document has been deleted' },
        { status: 404 }
      );
    }

    // Check if user is a member of the lab
    const labMembership = await prisma.labMember.findFirst({
      where: {
        userId: user.id,
        labId: document.labId,
        isActive: true
      }
    });

    if (!labMembership) {
      return NextResponse.json(
        { error: 'You do not have access to this document' },
        { status: 403 }
      );
    }

    // Download the document
    const result = await DocumentService.downloadDocument(documentId, user.id);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to download document' },
        { status: 500 }
      );
    }

    // Return the file as a download
    return new NextResponse(result.data, {
      headers: {
        'Content-Type': result.mimeType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      }
    });

  } catch (error) {
    console.error('Document download error:', error);
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[documentId] - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    // Check if document exists and user has permission to delete
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        labId: true,
        uploadedById: true,
        isDeleted: true
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.isDeleted) {
      return NextResponse.json(
        { error: 'Document already deleted' },
        { status: 400 }
      );
    }

    // Check if user is a member of the lab (any lab member can delete)
    const labMembership = await prisma.labMember.findFirst({
      where: {
        userId: user.id,
        labId: document.labId,
        isActive: true
      }
    });

    if (!labMembership) {
      return NextResponse.json(
        { error: 'You must be a member of this lab to delete documents' },
        { status: 403 }
      );
    }

    // Delete the document
    const result = await DocumentService.deleteDocument(documentId, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
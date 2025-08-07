import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

// Cache configuration
const CACHE_TTL = 300; // 5 minutes cache for buckets

// Optimized select for buckets with minimal project data
const bucketSelectOptimized = {
  id: true,
  name: true,
  description: true,
  color: true,
  labId: true,
  position: true,
  createdAt: true,
  updatedAt: true,
  lab: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: {
      projects: true,
    },
  },
};

// Validation schema for creating a bucket
const CreateBucketSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#00BCD4'),
  labId: z.string(),
  position: z.number().optional(),
});

// GET /api/buckets - Get all buckets with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const labId = searchParams.get('labId');
    
    const where: Prisma.BucketWhereInput = {};
    if (labId) where.labId = labId;

    const buckets = await prisma.bucket.findMany({
      where,
      select: bucketSelectOptimized,
      orderBy: {
        position: 'asc',
      },
    });

    // Map name to title for backward compatibility
    const bucketsWithTitle = buckets.map(bucket => ({
      ...bucket,
      title: bucket.name,
    }));

    // Set cache headers for performance
    const response = NextResponse.json(bucketsWithTitle);
    response.headers.set('Cache-Control', `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=600`);
    response.headers.set('CDN-Cache-Control', `public, s-maxage=${CACHE_TTL}`);
    return response;
  } catch (error) {
    console.error('Error fetching buckets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buckets' },
      { status: 500 }
    );
  }
}

// POST /api/buckets - Create a new bucket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = CreateBucketSchema.parse(body);
    
    // Get the max position for this lab to add new bucket at the end
    const maxPositionBucket = await prisma.bucket.findFirst({
      where: { labId: validatedData.labId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    
    const position = validatedData.position ?? ((maxPositionBucket?.position ?? -1) + 1);
    
    // Create the bucket (map title to name)
    const { title, ...rest } = validatedData;
    const bucket = await prisma.bucket.create({
      data: {
        name: title,
        ...rest,
        position,
      },
      select: bucketSelectOptimized,
    });

    return NextResponse.json(bucket, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating bucket:', error);
    return NextResponse.json(
      { error: 'Failed to create bucket' },
      { status: 500 }
    );
  }
}

// PUT /api/buckets - Update a bucket
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, ...rest } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Bucket ID is required' },
        { status: 400 }
      );
    }

    // Update the bucket (map title to name if provided)
    const updateData = title !== undefined 
      ? { name: title, ...rest }
      : rest;
    
    const bucket = await prisma.bucket.update({
      where: { id },
      data: updateData,
      include: {
        lab: true,
        projects: true,
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    return NextResponse.json(bucket);
  } catch (error) {
    console.error('Error updating bucket:', error);
    return NextResponse.json(
      { error: 'Failed to update bucket' },
      { status: 500 }
    );
  }
}

// DELETE /api/buckets - Delete a bucket
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Bucket ID is required' },
        { status: 400 }
      );
    }
    
    // Check if bucket has projects
    const bucket = await prisma.bucket.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });
    
    if (!bucket) {
      return NextResponse.json(
        { error: 'Bucket not found' },
        { status: 404 }
      );
    }
    
    if (bucket._count.projects > 0) {
      return NextResponse.json(
        { error: 'Cannot delete bucket with projects. Please move or delete projects first.' },
        { status: 400 }
      );
    }

    await prisma.bucket.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bucket:', error);
    return NextResponse.json(
      { error: 'Failed to delete bucket' },
      { status: 500 }
    );
  }
}

// PATCH /api/buckets/reorder - Reorder buckets
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bucketOrders } = body; // Array of { id, order }
    
    if (!Array.isArray(bucketOrders)) {
      return NextResponse.json(
        { error: 'bucketOrders must be an array' },
        { status: 400 }
      );
    }
    
    // Update all bucket orders in a transaction
    await prisma.$transaction(
      bucketOrders.map(({ id, position }) =>
        prisma.bucket.update({
          where: { id },
          data: { position },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering buckets:', error);
    return NextResponse.json(
      { error: 'Failed to reorder buckets' },
      { status: 500 }
    );
  }
}
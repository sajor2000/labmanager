import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const labId = searchParams.get('labId') || session.user.labs?.[0]?.id;

    if (!labId) {
      return NextResponse.json({ error: 'No lab selected' }, { status: 400 });
    }

    const buckets = await prisma.bucket.findMany({
      where: {
        labId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            projects: true
          }
        }
      },
      orderBy: {
        position: 'asc'
      }
    });

    // Transform the data
    const transformedBuckets = buckets.map((bucket) => ({
      id: bucket.id,
      name: bucket.name,
      description: bucket.description,
      color: bucket.color || '#3B82F6',
      projectCount: bucket._count.projects,
      createdAt: bucket.createdAt,
      updatedAt: bucket.updatedAt,
    }));

    return NextResponse.json(transformedBuckets);
  } catch (error) {
    console.error('Error fetching buckets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buckets' },
      { status: 500 }
    );
  }
}
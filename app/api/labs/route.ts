import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const labs = await prisma.lab.findMany({
      select: {
        id: true,
        name: true,
        shortName: true,
        description: true,
        isActive: true,
        _count: {
          select: {
            projects: true,
            members: true,
            buckets: true,
          }
        }
      },
      orderBy: {
        shortName: 'asc'
      }
    });
    
    return NextResponse.json(labs);
  } catch (error) {
    console.error('Error fetching labs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labs' },
      { status: 500 }
    );
  }
}

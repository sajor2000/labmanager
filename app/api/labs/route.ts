import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/labs - Get all labs
export async function GET() {
  try {
    const labs = await prisma.lab.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            projects: true,
            buckets: true,
            members: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
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

// POST /api/labs - Create a new lab
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, shortName, description, logo } = body;
    
    if (!name || !shortName) {
      return NextResponse.json(
        { error: 'Name and shortName are required' },
        { status: 400 }
      );
    }

    const lab = await prisma.lab.create({
      data: {
        name,
        shortName,
        description,
        logo,
      },
      include: {
        _count: {
          select: {
            projects: true,
            buckets: true,
            members: true,
          },
        },
      },
    });

    return NextResponse.json(lab, { status: 201 });
  } catch (error) {
    console.error('Error creating lab:', error);
    return NextResponse.json(
      { error: 'Failed to create lab' },
      { status: 500 }
    );
  }
}
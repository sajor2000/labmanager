import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProjectTypeLabel } from '@/lib/constants/project-types';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'project' | 'bucket' | 'task' | 'idea' | 'user' | 'deadline';
  url: string;
  metadata?: Record<string, any>;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim();
    const labId = searchParams.get('labId');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const searchQuery = `%${query}%`;
    const results: SearchResult[] = [];

    // Search Projects
    const projects = await prisma.project.findMany({
      where: {
        AND: [
          labId ? { labId } : {},
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { oraNumber: { contains: query, mode: 'insensitive' } },
              { notes: { contains: query, mode: 'insensitive' } },
              { externalCollaborators: { contains: query, mode: 'insensitive' } },
            ],
          },
          { isActive: true },
        ],
      },
      select: {
        id: true,
        name: true,
        status: true,
        projectType: true,
        bucket: {
          select: {
            name: true,
            color: true,
          },
        },
      },
      take: limit,
    });

    projects.forEach(project => {
      results.push({
        id: project.id,
        title: project.name,
        subtitle: `${project.status.replace(/_/g, ' ')} • ${getProjectTypeLabel(project.projectType)}`,
        type: 'project',
        url: `/studies`,
        metadata: {
          status: project.status,
          bucket: project.bucket.name,
          bucketColor: project.bucket.color,
        },
      });
    });

    // Search Buckets
    const buckets = await prisma.bucket.findMany({
      where: {
        AND: [
          labId ? { labId } : {},
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          { isActive: true },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        _count: {
          select: {
            projects: true,
          },
        },
      },
      take: limit,
    });

    buckets.forEach(bucket => {
      results.push({
        id: bucket.id,
        title: bucket.name,
        subtitle: `${bucket._count.projects} projects`,
        type: 'bucket',
        url: `/buckets`,
        metadata: {
          color: bucket.color,
          projectCount: bucket._count.projects,
        },
      });
    });

    // Search Tasks
    const tasks = await prisma.task.findMany({
      where: {
        AND: [
          labId ? { project: { labId } } : {},
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          { isActive: true },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        project: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
    });

    tasks.forEach(task => {
      results.push({
        id: task.id,
        title: task.title,
        subtitle: `${task.project.name} • ${task.status.replace(/_/g, ' ')}`,
        type: 'task',
        url: `/tasks`,
        metadata: {
          status: task.status,
          priority: task.priority,
          projectName: task.project.name,
        },
      });
    });

    // Search Ideas
    const ideas = await prisma.idea.findMany({
      where: {
        AND: [
          labId ? { labId } : {},
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          { isActive: true },
        ],
      },
      select: {
        id: true,
        title: true,
        category: true,
        stage: true,
        voteScore: true,
      },
      take: limit,
    });

    ideas.forEach(idea => {
      results.push({
        id: idea.id,
        title: idea.title,
        subtitle: `${idea.category.replace(/_/g, ' ')} • ${idea.stage} • ${idea.voteScore} votes`,
        type: 'idea',
        url: `/ideas`,
        metadata: {
          category: idea.category,
          stage: idea.stage,
          voteScore: idea.voteScore,
        },
      });
    });

    // Search Users
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { expertise: { hasSome: [query] } },
            ],
          },
          { isActive: true },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        initials: true,
      },
      take: limit,
    });

    users.forEach(user => {
      results.push({
        id: user.id,
        title: user.name,
        subtitle: `${user.role.replace(/_/g, ' ')} • ${user.email}`,
        type: 'user',
        url: `/team`,
        metadata: {
          email: user.email,
          role: user.role,
          initials: user.initials,
        },
      });
    });

    // Search Deadlines
    const deadlines = await prisma.deadline.findMany({
      where: {
        AND: [
          labId ? { labId } : {},
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          { isActive: true },
        ],
      },
      select: {
        id: true,
        title: true,
        type: true,
        dueDate: true,
        priority: true,
        status: true,
      },
      take: limit,
    });

    deadlines.forEach(deadline => {
      const dueDate = new Date(deadline.dueDate);
      const isOverdue = dueDate < new Date() && deadline.status !== 'COMPLETED';
      
      results.push({
        id: deadline.id,
        title: deadline.title,
        subtitle: `${deadline.type.replace(/_/g, ' ')} • Due ${dueDate.toLocaleDateString()}${isOverdue ? ' • OVERDUE' : ''}`,
        type: 'deadline',
        url: `/deadlines`,
        metadata: {
          type: deadline.type,
          dueDate: deadline.dueDate,
          priority: deadline.priority,
          status: deadline.status,
          isOverdue,
        },
      });
    });

    // Sort results by relevance (title matches first)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === query.toLowerCase();
      const bExact = b.title.toLowerCase() === query.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const aStarts = a.title.toLowerCase().startsWith(query.toLowerCase());
      const bStarts = b.title.toLowerCase().startsWith(query.toLowerCase());
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return 0;
    });

    return NextResponse.json(results.slice(0, limit * 2)); // Return more results than requested for better coverage
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
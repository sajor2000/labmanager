import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Middleware to check if user is authenticated
 * Returns user info if authenticated, null otherwise
 */
export async function getAuthUser(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

/**
 * Middleware to require authentication
 * Returns 401 response if not authenticated
 */
export async function requireAuth(request: NextRequest) {
  const user = await getAuthUser(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  return user;
}

/**
 * Check if user is a member of a specific lab
 */
export async function isLabMember(userId: string, labId: string) {
  const membership = await prisma.labMember.findFirst({
    where: {
      userId,
      labId,
    },
  });
  
  return !!membership;
}

/**
 * Check if user is an admin of a specific lab
 */
export async function isLabAdmin(userId: string, labId: string) {
  const membership = await prisma.labMember.findFirst({
    where: {
      userId,
      labId,
      isAdmin: true,
    },
  });
  
  return !!membership;
}

/**
 * Require user to be a lab member
 */
export async function requireLabMember(request: NextRequest, labId: string) {
  const authResult = await requireAuth(request);
  
  // If requireAuth returned a Response, return it
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const user = authResult;
  const isMember = await isLabMember(user.id, labId);
  
  if (!isMember) {
    return NextResponse.json(
      { error: 'You must be a member of this lab' },
      { status: 403 }
    );
  }
  
  return user;
}

/**
 * Require user to be a lab admin
 */
export async function requireLabAdmin(request: NextRequest, labId: string) {
  const authResult = await requireAuth(request);
  
  // If requireAuth returned a Response, return it
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const user = authResult;
  const isAdmin = await isLabAdmin(user.id, labId);
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Admin privileges required' },
      { status: 403 }
    );
  }
  
  return user;
}

/**
 * Check if user owns a resource
 */
export async function isResourceOwner(userId: string, resourceType: string, resourceId: string) {
  switch (resourceType) {
    case 'task':
      const task = await prisma.task.findUnique({
        where: { id: resourceId },
        select: { assigneeId: true, createdById: true },
      });
      return task?.assigneeId === userId || task?.createdById === userId;
      
    case 'idea':
      const idea = await prisma.idea.findUnique({
        where: { id: resourceId },
        select: { createdById: true },
      });
      return idea?.createdById === userId;
      
    case 'comment':
      const comment = await prisma.comment.findUnique({
        where: { id: resourceId },
        select: { authorId: true },
      });
      return comment?.authorId === userId;
      
    default:
      return false;
  }
}

/**
 * Require user to own a resource or be a lab admin
 */
export async function requireResourceOwnerOrAdmin(
  request: NextRequest,
  resourceType: string,
  resourceId: string,
  labId?: string
) {
  const authResult = await requireAuth(request);
  
  // If requireAuth returned a Response, return it
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const user = authResult;
  const isOwner = await isResourceOwner(user.id, resourceType, resourceId);
  
  if (isOwner) {
    return user;
  }
  
  // Check if user is lab admin if labId is provided
  if (labId) {
    const isAdmin = await isLabAdmin(user.id, labId);
    if (isAdmin) {
      return user;
    }
  }
  
  return NextResponse.json(
    { error: 'You do not have permission to modify this resource' },
    { status: 403 }
  );
}
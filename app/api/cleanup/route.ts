import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('🧹 Starting cleanup of fake/test lab members...');
    
    const results = {
      deletedLabMembers: 0,
      deletedLabs: 0,
      deletedUsers: 0,
      errors: [] as string[],
    };

    // 1. First, find and delete TRL lab and all its members
    try {
      const trlLab = await prisma.lab.findFirst({
        where: { shortName: 'TRL' }
      });
      
      if (trlLab) {
        // Delete all lab members for TRL
        const deletedTRLMembers = await prisma.labMember.deleteMany({
          where: { labId: trlLab.id }
        });
        results.deletedLabMembers += deletedTRLMembers.count;
        
        // Delete all projects in TRL (this will cascade delete tasks, etc.)
        await prisma.project.deleteMany({
          where: { labId: trlLab.id }
        });
        
        // Delete all buckets in TRL
        await prisma.bucket.deleteMany({
          where: { labId: trlLab.id }
        });
        
        // Delete all ideas in TRL
        await prisma.idea.deleteMany({
          where: { labId: trlLab.id }
        });
        
        // Delete all standups in TRL
        await prisma.standup.deleteMany({
          where: { labId: trlLab.id }
        });
        
        // Delete all deadlines in TRL
        await prisma.deadline.deleteMany({
          where: { labId: trlLab.id }
        });
        
        // Finally delete the TRL lab itself
        await prisma.lab.delete({
          where: { id: trlLab.id }
        });
        results.deletedLabs++;
        
        console.log(`✅ Deleted TRL lab and ${deletedTRLMembers.count} associated memberships`);
      }
    } catch (error) {
      console.error('Error deleting TRL lab:', error);
      results.errors.push('Failed to delete TRL lab');
    }
    
    // 2. Find and delete test users and their memberships
    try {
      // Find test users
      const testUsers = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: 'test' } },
            { email: { contains: 'demo' } },
            { email: { contains: 'example' } },
            { email: { equals: 'test@example.com' } },
            { name: { contains: 'Test' } },
            { name: { contains: 'Demo' } },
          ]
        }
      });
      
      for (const user of testUsers) {
        // Delete lab memberships
        const deletedMemberships = await prisma.labMember.deleteMany({
          where: { userId: user.id }
        });
        results.deletedLabMembers += deletedMemberships.count;
        
        // Delete project memberships
        await prisma.projectMember.deleteMany({
          where: { userId: user.id }
        });
        
        // Delete task assignments
        await prisma.taskAssignee.deleteMany({
          where: { userId: user.id }
        });
        
        // Delete the user
        await prisma.user.delete({
          where: { id: user.id }
        });
        results.deletedUsers++;
        
        console.log(`✅ Deleted test user: ${user.email}`);
      }
    } catch (error) {
      console.error('Error deleting test users:', error);
      results.errors.push('Failed to delete some test users');
    }
    
    // 3. Clean up any remaining suspicious lab memberships
    try {
      // Get all users with test-like emails
      const suspiciousUsers = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: '@test' } },
            { email: { contains: '@demo' } },
            { email: { contains: '@example' } },
          ]
        },
        select: { id: true }
      });
      
      if (suspiciousUsers.length > 0) {
        const userIds = suspiciousUsers.map(u => u.id);
        const deletedSuspicious = await prisma.labMember.deleteMany({
          where: { userId: { in: userIds } }
        });
        results.deletedLabMembers += deletedSuspicious.count;
        console.log(`✅ Deleted ${deletedSuspicious.count} suspicious lab memberships`);
      }
    } catch (error) {
      console.error('Error deleting suspicious memberships:', error);
      results.errors.push('Failed to delete some suspicious memberships');
    }
    
    // 4. Remove inactive lab memberships (optional - commented out for safety)
    // Uncomment if you want to also remove inactive members
    /*
    try {
      const deletedInactive = await prisma.labMember.deleteMany({
        where: { isActive: false }
      });
      results.deletedLabMembers += deletedInactive.count;
      console.log(`✅ Deleted ${deletedInactive.count} inactive lab memberships`);
    } catch (error) {
      console.error('Error deleting inactive memberships:', error);
      results.errors.push('Failed to delete inactive memberships');
    }
    */
    
    // 5. Get final statistics
    const [finalLabs, finalUsers, finalMembers] = await Promise.all([
      prisma.lab.count(),
      prisma.user.count(),
      prisma.labMember.count(),
    ]);
    
    // Get remaining lab details
    const remainingLabs = await prisma.lab.findMany({
      select: {
        shortName: true,
        name: true,
        _count: {
          select: {
            members: true,
            projects: true,
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      deleted: results,
      remaining: {
        labs: finalLabs,
        users: finalUsers,
        labMembers: finalMembers,
        labDetails: remainingLabs
      }
    });
    
  } catch (error) {
    console.error('Cleanup failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to perform cleanup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to preview what would be deleted
export async function GET() {
  try {
    // Find TRL lab
    const trlLab = await prisma.lab.findFirst({
      where: { shortName: 'TRL' },
      include: {
        _count: {
          select: {
            members: true,
            projects: true,
            buckets: true,
          }
        }
      }
    });
    
    // Find test users
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { email: { contains: 'demo' } },
          { email: { contains: 'example' } },
          { email: { equals: 'test@example.com' } },
          { name: { contains: 'Test' } },
          { name: { contains: 'Demo' } },
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        _count: {
          select: {
            labs: true,
          }
        }
      }
    });
    
    // Count inactive memberships
    const inactiveMemberships = await prisma.labMember.count({
      where: { isActive: false }
    });
    
    return NextResponse.json({
      toBeDeleted: {
        trlLab: trlLab ? {
          name: trlLab.name,
          shortName: trlLab.shortName,
          members: trlLab._count.members,
          projects: trlLab._count.projects,
          buckets: trlLab._count.buckets,
        } : null,
        testUsers: testUsers.map(u => ({
          email: u.email,
          name: u.name,
          labMemberships: u._count.labs
        })),
        inactiveMemberships,
      },
      summary: {
        labsToDelete: trlLab ? 1 : 0,
        usersToDelete: testUsers.length,
        membershipsToDelete: (trlLab?._count.members || 0) + testUsers.reduce((sum, u) => sum + u._count.labs, 0),
      }
    });
  } catch (error) {
    console.error('Preview failed:', error);
    return NextResponse.json(
      { error: 'Failed to preview cleanup' },
      { status: 500 }
    );
  }
}
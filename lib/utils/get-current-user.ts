import { prisma } from '@/lib/prisma';

// Get current user (mock for now)
export async function getCurrentUser() {
  try {
    // For now, return a mock user or the first user
    // In production, this would use authentication
    const user = await prisma.user.findFirst({
      include: {
        labs: {
          include: {
            lab: true,
          },
        },
      },
    });
    
    if (!user) {
      // Create a default user if none exists
      const defaultUser = await prisma.user.create({
        data: {
          email: 'dr.johnson@rush.edu',
          name: 'Dr. Johnson',
          role: 'PRINCIPAL_INVESTIGATOR',
          initials: 'DJ',
        },
        include: {
          labs: {
            include: {
              lab: true,
            },
          },
        },
      });
      return defaultUser;
    }
    
    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}
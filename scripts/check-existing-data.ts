import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking existing database content...\n');

  try {
    // Check existing users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role} - Created: ${user.createdAt.toISOString()}`);
    });

    // Check existing labs
    const labs = await prisma.lab.findMany({
      include: {
        _count: {
          select: {
            members: true,
            projects: true,
            buckets: true,
          },
        },
      },
    });

    console.log(`\nFound ${labs.length} labs:`);
    labs.forEach(lab => {
      console.log(`  - ${lab.name} (${lab.shortName})`);
      console.log(`    Members: ${lab._count.members}, Projects: ${lab._count.projects}, Buckets: ${lab._count.buckets}`);
    });

    // Check lab memberships
    const memberships = await prisma.labMember.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        lab: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`\nFound ${memberships.length} lab memberships:`);
    memberships.forEach(m => {
      console.log(`  - ${m.user.name} -> ${m.lab.name} (Admin: ${m.isAdmin})`);
    });

    // Check projects
    const projects = await prisma.project.findMany({
      include: {
        lab: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
    });

    console.log(`\nFound ${projects.length} projects:`);
    projects.forEach(p => {
      console.log(`  - ${p.name} (${p.status}) - Lab: ${p.lab.name}`);
      console.log(`    Tasks: ${p._count.tasks}, Members: ${p._count.members}`);
    });

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up fake data...\n');

  try {
    // Delete fake users (those with @research.lab emails)
    const fakeUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: '@research.lab'
        }
      }
    });

    console.log(`Found ${fakeUsers.length} fake users to delete:`);
    fakeUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email})`);
    });

    // Delete their lab memberships first
    await prisma.labMember.deleteMany({
      where: {
        user: {
          email: {
            contains: '@research.lab'
          }
        }
      }
    });

    // Delete the fake users
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          contains: '@research.lab'
        }
      }
    });

    console.log(`\nDeleted ${deletedUsers.count} fake users and their memberships`);

    // Delete fake labs (the ones I created)
    const fakeLabs = await prisma.lab.findMany({
      where: {
        OR: [
          { shortName: 'HERL' },
          { shortName: 'DHIL' }
        ]
      }
    });

    console.log(`\nFound ${fakeLabs.length} fake labs to delete:`);
    fakeLabs.forEach(lab => {
      console.log(`  - ${lab.name} (${lab.shortName})`);
    });

    // Delete buckets from fake labs first
    await prisma.bucket.deleteMany({
      where: {
        lab: {
          OR: [
            { shortName: 'HERL' },
            { shortName: 'DHIL' }
          ]
        }
      }
    });

    // Delete the fake labs
    const deletedLabs = await prisma.lab.deleteMany({
      where: {
        OR: [
          { shortName: 'HERL' },
          { shortName: 'DHIL' }
        ]
      }
    });

    console.log(`Deleted ${deletedLabs.count} fake labs and their buckets`);

    // Check remaining real data
    const realUsers = await prisma.user.count();
    const realLabs = await prisma.lab.count();
    const realMemberships = await prisma.labMember.count();

    console.log(`\n✅ Cleanup complete!`);
    console.log(`Remaining real data:`);
    console.log(`  - Users: ${realUsers}`);
    console.log(`  - Labs: ${realLabs}`);
    console.log(`  - Lab memberships: ${realMemberships}`);

  } catch (error) {
    console.error('Error cleaning up database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
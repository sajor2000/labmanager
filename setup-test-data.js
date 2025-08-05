// Setup test data for standup feature
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupTestData() {
  try {
    console.log('Setting up test data...\n');

    // 1. Check/create user
    let user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          initials: 'TU',
          role: 'RESEARCH_MEMBER'
        }
      });
      console.log('✓ Created user:', user.name);
    } else {
      console.log('✓ Found existing user:', user.name);
    }

    // 2. Check/create lab
    let lab = await prisma.lab.findUnique({
      where: { id: 'test-lab' }
    });

    if (!lab) {
      lab = await prisma.lab.create({
        data: {
          id: 'test-lab',
          name: 'Test Research Lab',
          shortName: 'TRL',
          description: 'Lab for testing standup features'
        }
      });
      console.log('✓ Created lab:', lab.name);
    } else {
      console.log('✓ Found existing lab:', lab.name);
    }

    // 3. Add user to lab as member
    const membership = await prisma.labMember.findFirst({
      where: {
        userId: user.id,
        labId: lab.id
      }
    });

    if (!membership) {
      await prisma.labMember.create({
        data: {
          userId: user.id,
          labId: lab.id,
          isAdmin: true
        }
      });
      console.log('✓ Added user to lab as admin');
    } else {
      console.log('✓ User already member of lab');
    }

    console.log('\nTest data setup complete!');
    console.log('Lab ID:', lab.id);
    console.log('User ID:', user.id);

    return { lab, user };
  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData();
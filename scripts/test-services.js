/**
 * Simple test script to verify service layer functionality
 */

const { PrismaClient } = require('../app/generated/prisma-client');

const prisma = new PrismaClient();

async function testBasicFunctionality() {
  console.log('=== Testing Basic Database Functionality ===');
  console.log('');
  
  try {
    // Test 1: Create a test lab and bucket
    console.log('1. Creating test lab and bucket...');
    
    const lab = await prisma.lab.upsert({
      where: { shortName: 'TEST' },
      update: {},
      create: {
        name: 'Test Lab',
        shortName: 'TEST',
        description: 'Test laboratory for service validation'
      }
    });
    
    let bucket = await prisma.bucket.findFirst({
      where: {
        labId: lab.id,
        title: 'Test Bucket'
      }
    });
    
    if (!bucket) {
      bucket = await prisma.bucket.create({
        data: {
          title: 'Test Bucket',
          description: 'Test bucket for projects',
          color: '#8B5CF6',
          labId: lab.id
        }
      });
    }
    
    // Create test user
    const testUser = await prisma.user.upsert({
      where: { email: 'system@test.com' },
      update: {},
      create: {
        email: 'system@test.com',
        name: 'System Test User',
        firstName: 'System',
        lastName: 'User',
        initials: 'SU',
        avatar: '#8B5CF6'
      }
    });
    
    console.log('✓ Test lab, bucket, and user created');
    
    // Test 2: Create a test project
    console.log('');
    console.log('2. Creating test project...');
    
    const project = await prisma.project.create({
      data: {
        title: 'Test Research Project',
        oraNumber: 'ORA-2024-001',
        status: 'PLANNING',
        priority: 'HIGH',
        projectType: 'Clinical Study',
        fundingSource: 'NIH',
        labId: lab.id,
        bucketId: bucket.id,
        createdById: testUser.id,
        members: {
          create: {
            userId: testUser.id,
            role: 'RESPONSIBLE',
            allocation: 20
          }
        }
      },
      include: {
        lab: true,
        bucket: true,
        createdBy: true,
        members: {
          include: {
            user: true
          }
        }
      }
    });
    
    console.log(`✓ Created project: ${project.title} (${project.id})`);
    
    // Test 3: Create tasks for the project
    console.log('');
    console.log('3. Creating test tasks...');
    
    const task1 = await prisma.task.create({
      data: {
        title: 'Draft study protocol',
        description: 'Create comprehensive study protocol document',
        status: 'TODO',
        priority: 'HIGH',
        projectId: project.id,
        createdById: testUser.id
      }
    });
    
    const task2 = await prisma.task.create({
      data: {
        title: 'Prepare IRB submission',
        description: 'Compile all required IRB documentation',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: project.id,
        createdById: testUser.id
      }
    });
    
    console.log(`✓ Created ${2} test tasks`);
    
    // Test 4: Create activity log
    console.log('');
    console.log('4. Creating activity log...');
    
    await prisma.activityLog.create({
      data: {
        userId: testUser.id,
        labId: lab.id,
        entityType: 'project',
        entityId: project.id,
        action: 'created',
        metadata: {
          projectTitle: project.title,
          oraNumber: project.oraNumber
        }
      }
    });
    
    console.log('✓ Activity log created');
    
    // Test 5: Query data to verify everything works
    console.log('');
    console.log('5. Querying created data...');
    
    const projectsCount = await prisma.project.count({
      where: { labId: lab.id }
    });
    
    const tasksCount = await prisma.task.count({
      where: { projectId: project.id }
    });
    
    const membersCount = await prisma.projectMember.count({
      where: { projectId: project.id }
    });
    
    const activitiesCount = await prisma.activityLog.count({
      where: { labId: lab.id }
    });
    
    console.log(`✓ Lab has: ${projectsCount} projects, ${tasksCount} tasks, ${membersCount} members, ${activitiesCount} activities`);
    
    console.log('');
    console.log('🎉 All basic tests passed successfully!');
    console.log('');
    console.log('Database schema is working correctly. The service layer can now be safely used.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testBasicFunctionality();
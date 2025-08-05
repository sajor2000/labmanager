/**
 * Test script to verify service layer functionality
 */

const { PrismaClient } = require('../app/generated/prisma-client');
const { ProjectService } = require('../lib/services/project.service');
const { UserService } = require('../lib/services/user.service');
const { DashboardService } = require('../lib/services/dashboard.service');

const prisma = new PrismaClient();

async function testServices() {
  console.log('=== Testing Service Layer ===');
  console.log('');
  
  try {
    // Create service context
    const context = {
      userId: 'test-user',
      currentLabId: 'test-lab',
      userRole: 'RESEARCH_MEMBER'
    };
    
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
    
    context.userId = testUser.id;
    context.currentLabId = lab.id;
    console.log('✓ Test lab, bucket, and user created');
    
    // Test 2: ProjectService
    console.log('');
    console.log('2. Testing ProjectService...');
    
    const projectService = new ProjectService(context);
    
    // Generate ORA number
    const oraNumber = await projectService.generateORANumber();
    console.log(`✓ Generated ORA number: ${oraNumber}`);
    
    // Create a test project
    const project = await projectService.createProject({
      name: 'Test Research Project',
      projectType: 'Clinical Study',
      bucketId: bucket.id,
      priority: 'HIGH',
      fundingSource: 'NIH',
      autoCreateTasks: true,
      memberIds: [context.userId]
    });
    
    console.log(`✓ Created project: ${project.title} (${project.id})`);
    
    // Test project status update
    await projectService.updateStatus(project.id, 'IRB_SUBMISSION');
    console.log('✓ Updated project status to IRB_SUBMISSION');
    
    // Test 3: UserService
    console.log('');
    console.log('3. Testing UserService...');
    
    const userService = new UserService(context);
    
    // Create test user
    const user = await userService.createTeamMember({
      email: 'test.researcher@example.com',
      firstName: 'Test',
      lastName: 'Researcher',
      role: 'RESEARCH_MEMBER',
      labId: lab.id
    });
    
    console.log(`✓ Created team member: ${user.name} (${user.initials})`);
    
    // Get lab members
    const members = await userService.getLabMembers(lab.id);
    console.log(`✓ Retrieved ${members.length} lab members`);
    
    // Test 4: DashboardService
    console.log('');
    console.log('4. Testing DashboardService...');
    
    const dashboardService = new DashboardService(context);
    
    // Get dashboard stats
    const stats = await dashboardService.getDashboardStats(lab.id);
    console.log(`✓ Dashboard stats: ${stats.totalLabs.count} labs, ${stats.activeProjects.total} projects`);
    
    // Get team workload
    const workload = await dashboardService.getTeamWorkload(lab.id);
    console.log(`✓ Team workload for ${workload.length} members calculated`);
    
    // Test 5: Kanban View
    console.log('');
    console.log('5. Testing Kanban view...');
    
    const kanbanData = await projectService.getKanbanView(lab.id);
    console.log(`✓ Kanban view: ${kanbanData.length} buckets with projects`);
    
    console.log('');
    console.log('🎉 All service tests passed successfully!');
    console.log('');
    console.log('Service layer is ready for use. You can now:');
    console.log('1. Update your UI components to use the new project-actions.ts');
    console.log('2. Replace study-related UI with project-related UI');
    console.log('3. Test the complete application workflow');
    
  } catch (error) {
    console.error('❌ Service test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testServices();
}

module.exports = { testServices };
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteTestLabs() {
  try {
    console.log('Searching for test labs...');
    
    // Find all labs with "Test" in the name
    const testLabs = await prisma.lab.findMany({
      where: {
        OR: [
          { name: { contains: 'Test', mode: 'insensitive' } },
          { name: { contains: 'test', mode: 'insensitive' } },
          { shortName: { contains: 'TEST', mode: 'insensitive' } },
          { shortName: { contains: 'test', mode: 'insensitive' } }
        ]
      }
    });

    if (testLabs.length === 0) {
      console.log('No test labs found.');
      return;
    }

    console.log(`Found ${testLabs.length} test lab(s):`);
    testLabs.forEach(lab => {
      console.log(`  - ${lab.name} (${lab.shortName}) - ID: ${lab.id}`);
    });

    // Delete each test lab
    for (const lab of testLabs) {
      console.log(`\nDeleting lab: ${lab.name}...`);
      
      // Delete related data first due to foreign key constraints
      // Delete lab members
      await prisma.labMember.deleteMany({
        where: { labId: lab.id }
      });
      console.log('  - Deleted lab members');

      // Delete ideas
      await prisma.idea.deleteMany({
        where: { labId: lab.id }
      });
      console.log('  - Deleted ideas');

      // Delete standups
      await prisma.standup.deleteMany({
        where: { labId: lab.id }
      });
      console.log('  - Deleted standups');

      // Get all projects for this lab to delete their tasks
      const projects = await prisma.project.findMany({
        where: { labId: lab.id },
        select: { id: true }
      });
      
      // Delete tasks associated with projects
      if (projects.length > 0) {
        const projectIds = projects.map(p => p.id);
        
        // Delete task dependencies first
        await prisma.taskDependency.deleteMany({
          where: { 
            OR: [
              { taskId: { in: projectIds } },
              { dependsOnId: { in: projectIds } }
            ]
          }
        });
        
        // Delete task assignees
        await prisma.taskAssignee.deleteMany({
          where: { 
            task: { projectId: { in: projectIds } }
          }
        });
        
        // Delete task comments
        await prisma.taskComment.deleteMany({
          where: { 
            task: { projectId: { in: projectIds } }
          }
        });
        
        // Delete tasks
        await prisma.task.deleteMany({
          where: { projectId: { in: projectIds } }
        });
        console.log('  - Deleted tasks and related data');
      }

      // Delete project members
      await prisma.projectMember.deleteMany({
        where: { 
          project: { labId: lab.id }
        }
      });
      console.log('  - Deleted project members');

      // Delete projects
      await prisma.project.deleteMany({
        where: { labId: lab.id }
      });
      console.log('  - Deleted projects');

      // Finally delete the lab
      await prisma.lab.delete({
        where: { id: lab.id }
      });
      console.log(`  ✓ Lab "${lab.name}" deleted successfully`);
    }

    console.log('\n✅ All test labs have been deleted.');
  } catch (error) {
    console.error('Error deleting test labs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestLabs();
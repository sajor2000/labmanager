/**
 * Data Migration Script: Study to Project
 * 
 * This script migrates existing Study data to the new Project model
 * and updates related references.
 */

const { PrismaClient } = require('../app/generated/prisma-client');

const prisma = new PrismaClient();

async function migrateStudyToProject() {
  console.log('Starting Study to Project migration...');
  
  try {
    await prisma.$transaction(async (tx: any) => {
      // 1. Check if there are any existing studies to migrate
      const existingStudies = await tx.study.findMany({
        include: {
          assignees: true,
          tasks: true,
          ideas: true
        }
      });
      
      if (existingStudies.length === 0) {
        console.log('No existing studies found to migrate.');
        return;
      }
      
      console.log(`Found ${existingStudies.length} studies to migrate.`);
      
      // 2. For each study, create a corresponding project
      for (const study of existingStudies) {
        console.log(`Migrating study: ${study.title} (${study.id})`);
        
        // Create the project
        const project = await tx.project.create({
          data: {
            id: study.id, // Keep the same ID
            title: study.title,
            oraNumber: study.oraNumber,
            status: study.status,
            priority: study.priority,
            projectType: study.studyType, // Renamed field
            fundingSource: study.fundingSource,
            fundingDetails: study.fundingDetails,
            externalCollaborators: study.externalCollaborators,
            dueDate: study.dueDate,
            notes: study.notes,
            progress: study.progress,
            createdAt: study.createdAt,
            updatedAt: study.updatedAt,
            labId: study.labId,
            bucketId: study.bucketId,
            createdById: study.createdById
          }
        });
        
        // 3. Migrate study assignees to project members
        for (const assignee of study.assignees) {
          await tx.projectMember.create({
            data: {
              projectId: project.id,
              userId: assignee.userId,
              role: 'CONTRIBUTOR', // Default role
              allocation: 20, // Default allocation
              assignedAt: assignee.assignedAt
            }
          });
        }
        
        // 4. Update task projectId (they were previously studyId)
        await tx.task.updateMany({
          where: { studyId: study.id },
          data: { 
            projectId: study.id,
            studyId: null // Clear the old studyId
          }
        });
        
        // 5. Update idea convertedToProjectId (they were previously convertedToStudyId)
        await tx.idea.updateMany({
          where: { convertedToStudyId: study.id },
          data: { 
            convertedToProjectId: study.id,
            convertedToStudyId: null // Clear the old field
          }
        });
        
        console.log(`✓ Migrated study ${study.title} to project`);
      }
      
      // 6. Clean up: Remove old study assignees
      await tx.studyAssignee.deleteMany({});
      
      // 7. Clean up: Remove old studies
      await tx.study.deleteMany({});
      
      console.log('✓ All studies successfully migrated to projects');
      
      // 8. Create activity log entries for the migration
      for (const study of existingStudies) {
        await tx.activityLog.create({
          data: {
            userId: 'system',
            labId: study.labId,
            entityType: 'project',
            entityId: study.id,
            action: 'migrated_from_study',
            metadata: {
              originalStudyId: study.id,
              migratedAt: new Date().toISOString()
            }
          }
        });
      }
      
      console.log('✓ Migration activity logged');
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to update User model with firstName/lastName
async function updateUserModel() {
  console.log('Updating User model with firstName/lastName...');
  
  try {
    const users = await prisma.user.findMany();
    
    for (const user of users) {
      if (!user.firstName || !user.lastName) {
        // Split the name into firstName and lastName
        const nameParts = user.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';
        
        // Generate initials
        const initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName,
            lastName,
            initials: initials || user.initials
          }
        });
        
        console.log(`✓ Updated user ${user.name} with firstName/lastName`);
      }
    }
    
    console.log('✓ User model updates completed');
  } catch (error) {
    console.error('User model update failed:', error);
    throw error;
  }
}

// Main migration function
async function runMigration() {
  console.log('=== Lab Management System Migration ===');
  console.log('Migrating from Study-based to Project-based architecture');
  console.log('');
  
  try {
    // Step 1: Update user model
    await updateUserModel();
    console.log('');
    
    // Step 2: Migrate studies to projects
    await migrateStudyToProject();
    console.log('');
    
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update your frontend components to use the new Project model');
    console.log('2. Update any remaining references from Study to Project');
    console.log('3. Test the application thoroughly');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration, migrateStudyToProject, updateUserModel };
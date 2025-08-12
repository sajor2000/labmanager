#!/usr/bin/env tsx

/**
 * Script to remove ALL fake data from database
 * Run with: npx tsx scripts/clean-fake-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanFakeData() {
  console.log('🧹 Cleaning Fake Data from Database\n');
  console.log('================================================\n');

  // Define the ONLY allowed real labs and users
  const ALLOWED_LAB_SHORT_NAMES = ['RICCC', 'RHEDAS'];
  const ALLOWED_USER_EMAILS = [
    'juan_rojas@rush.edu',
    'kevin_buell@rush.edu',
    'mia_r_mcclintic@rush.edu',
    'jason_stanghelle@rush.edu',
    'mehersapna_masanpally@rush.edu',
    'vaishvik_chaudhari@rush.edu',
    'hoda_masterifarahani@rush.edu',
    'jada_j_sherrod@rush.edu',
    'connor_p_lafeber@rush.edu',
    'kianmokhlesi@gmail.com',
    'dariushmokhlesi@gmail.com',
  ];

  // Step 1: Delete fake labs
  console.log('🗑️  Removing fake labs...');
  const fakeLabs = await prisma.lab.findMany({
    where: {
      shortName: {
        notIn: ALLOWED_LAB_SHORT_NAMES
      }
    }
  });

  for (const lab of fakeLabs) {
    console.log(`   Deleting fake lab: ${lab.shortName} - ${lab.name}`);
    
    // Delete all related data first
    await prisma.project.deleteMany({ where: { labId: lab.id } });
    await prisma.bucket.deleteMany({ where: { labId: lab.id } });
    await prisma.labMember.deleteMany({ where: { labId: lab.id } });
    await prisma.auditLog.deleteMany({ where: { labId: lab.id } });
    
    // Delete the lab
    await prisma.lab.delete({ where: { id: lab.id } });
  }
  console.log(`   ✅ Removed ${fakeLabs.length} fake lab(s)\n`);

  // Step 2: Delete fake users
  console.log('🗑️  Removing fake users...');
  const fakeUsers = await prisma.user.findMany({
    where: {
      email: {
        notIn: ALLOWED_USER_EMAILS
      }
    }
  });

  for (const user of fakeUsers) {
    console.log(`   Deleting fake user: ${user.name} (${user.email})`);
    
    // Delete all related data first
    await prisma.task.deleteMany({ where: { createdById: user.id } });
    await prisma.taskAssignee.deleteMany({ where: { userId: user.id } });
    await prisma.idea.deleteMany({ where: { createdById: user.id } });
    await prisma.deadline.deleteMany({ where: { createdById: user.id } });
    await prisma.comment.deleteMany({ where: { authorId: user.id } });
    await prisma.labMember.deleteMany({ where: { userId: user.id } });
    await prisma.project.deleteMany({ where: { createdById: user.id } });
    await prisma.document.deleteMany({ where: { uploadedById: user.id } });
    await prisma.auditLog.deleteMany({ where: { userId: user.id } });
    
    // Delete the user
    await prisma.user.delete({ where: { id: user.id } });
  }
  console.log(`   ✅ Removed ${fakeUsers.length} fake user(s)\n`);

  // Step 3: Verify final state
  console.log('🔍 Verifying final state...\n');
  
  const finalLabs = await prisma.lab.count();
  const finalUsers = await prisma.user.count();
  
  console.log(`Final lab count: ${finalLabs} (expected: 2)`);
  console.log(`Final user count: ${finalUsers} (expected: 11)`);
  
  if (finalLabs === 2 && finalUsers === 11) {
    console.log('\n✅ SUCCESS: All fake data has been removed!');
    console.log('Database now contains only REAL Rush labs and team members.');
  } else {
    console.log('\n⚠️  WARNING: Count mismatch after cleanup');
    console.log('Please run the seed script to restore real data.');
  }
}

cleanFakeData()
  .catch((error) => {
    console.error('Error cleaning fake data:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
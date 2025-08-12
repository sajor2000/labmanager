#!/usr/bin/env tsx

/**
 * Script to update RICCC lab name to the correct full name
 * Run with: npx tsx scripts/update-riccc-name.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateRICCCName() {
  console.log('📝 Updating RICCC Lab Name\n');
  console.log('================================================\n');

  const correctName = 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science';
  
  // Update RICCC lab name
  const updated = await prisma.lab.update({
    where: { shortName: 'RICCC' },
    data: { 
      name: correctName 
    }
  });

  console.log('✅ Updated RICCC lab name to:');
  console.log(`   ${updated.name}`);
  console.log(`   Short name: ${updated.shortName}`);
  
  // Verify all labs
  console.log('\n📋 All Labs in Database:');
  console.log('========================');
  const allLabs = await prisma.lab.findMany({
    orderBy: { shortName: 'asc' }
  });
  
  allLabs.forEach(lab => {
    console.log(`${lab.shortName}: ${lab.name}`);
  });
}

updateRICCCName()
  .catch((error) => {
    console.error('Error updating RICCC name:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
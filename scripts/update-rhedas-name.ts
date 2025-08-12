#!/usr/bin/env tsx

/**
 * Script to update RHEDAS lab name to the correct full name
 * Run with: npx tsx scripts/update-rhedas-name.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateRHEDASName() {
  console.log('📝 Updating RHEDAS Lab Name\n');
  console.log('================================================\n');

  const correctName = 'Rush Health Equity Analytics Studio';
  
  // Update RHEDAS lab name
  const updated = await prisma.lab.update({
    where: { shortName: 'RHEDAS' },
    data: { 
      name: correctName 
    }
  });

  console.log('✅ Updated RHEDAS lab name to:');
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

updateRHEDASName()
  .catch((error) => {
    console.error('Error updating RHEDAS name:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
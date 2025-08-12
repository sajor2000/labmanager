#!/usr/bin/env ts-node

/**
 * Script to verify only REAL Rush labs exist in database
 * Run with: npx ts-node scripts/verify-real-labs.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyRealLabs() {
  console.log('🔍 Verifying Only Real Rush Labs Exist in Database\n');
  console.log('================================================\n');

  // Define the ONLY allowed real labs
  const ALLOWED_LABS = [
    'RICCC',
    'RHEDAS'
  ];

  // Get all labs from database
  const allLabs = await prisma.lab.findMany({
    select: {
      id: true,
      name: true,
      shortName: true,
      isActive: true,
      _count: {
        select: {
          members: true,
          projects: true,
          buckets: true,
        }
      }
    }
  });

  console.log(`Found ${allLabs.length} lab(s) in database:\n`);

  let hasInvalidLabs = false;

  for (const lab of allLabs) {
    const isValid = ALLOWED_LABS.includes(lab.shortName);
    const icon = isValid ? '✅' : '❌';
    
    console.log(`${icon} ${lab.shortName}: ${lab.name}`);
    console.log(`   Status: ${lab.isActive ? 'Active' : 'Inactive'}`);
    console.log(`   Members: ${lab._count.members}`);
    console.log(`   Projects: ${lab._count.projects}`);
    console.log(`   Buckets: ${lab._count.buckets}`);
    console.log('');

    if (!isValid) {
      hasInvalidLabs = true;
      console.log(`   ⚠️  WARNING: "${lab.shortName}" is NOT an allowed lab!`);
      console.log(`   ⚠️  This lab should be removed from the database.\n`);
    }
  }

  // Check for any fake lab references
  console.log('🔍 Checking for Fake Lab References:\n');
  
  const bannedNames = ['Health Equity Labs', 'HEL', 'Test Lab', 'Demo Lab'];
  
  for (const bannedName of bannedNames) {
    const count = await prisma.lab.count({
      where: {
        OR: [
          { name: { contains: bannedName, mode: 'insensitive' } },
          { shortName: { contains: bannedName, mode: 'insensitive' } }
        ]
      }
    });
    
    if (count > 0) {
      console.log(`❌ Found ${count} lab(s) containing banned name: "${bannedName}"`);
      hasInvalidLabs = true;
    } else {
      console.log(`✅ No labs found with banned name: "${bannedName}"`);
    }
  }

  // Verify user count
  console.log('\n🔍 Verifying User Count:\n');
  
  const totalUsers = await prisma.user.count();
  const expectedUsers = 11; // Exactly 11 real team members
  
  if (totalUsers === expectedUsers) {
    console.log(`✅ User count is correct: ${totalUsers} users (expected ${expectedUsers})`);
  } else {
    console.log(`⚠️  User count mismatch: ${totalUsers} users (expected ${expectedUsers})`);
    
    // List all users to identify extras
    const users = await prisma.user.findMany({
      select: {
        name: true,
        email: true,
        role: true,
      }
    });
    
    console.log('\nAll users in database:');
    users.forEach(u => {
      console.log(`   - ${u.name} (${u.email}) - ${u.role}`);
    });
  }

  // Final verdict
  console.log('\n' + '='.repeat(50));
  if (hasInvalidLabs) {
    console.log('\n❌ FAILED: Invalid labs found in database!');
    console.log('Please remove all non-RICCC/RHEDAS labs.');
    process.exit(1);
  } else if (allLabs.length !== ALLOWED_LABS.length) {
    console.log(`\n⚠️  WARNING: Expected ${ALLOWED_LABS.length} labs, found ${allLabs.length}`);
    process.exit(1);
  } else {
    console.log('\n✅ SUCCESS: Database contains only REAL Rush labs!');
    console.log('- RICCC: Rush Interdisciplinary Consortium for Critical Care Trials and Data Science');
    console.log('- RHEDAS: Rush Health Equity Analytics Studio');
  }
}

verifyRealLabs()
  .catch((error) => {
    console.error('Error verifying labs:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
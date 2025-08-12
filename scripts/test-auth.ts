#!/usr/bin/env ts-node

/**
 * Test script to verify all team members can authenticate successfully
 * Run with: npx ts-node scripts/test-auth.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// List of all regular team members to test
const regularMembers = [
  { email: 'Jason_Stanghelle@rush.edu', name: 'Jason Stanghelle' },
  { email: 'Jada_J_Sherrod@rush.edu', name: 'Jada Sherrod' },
  { email: 'MeherSapna_Masanpally@rush.edu', name: 'Meher Sapna Masanpally' },
  { email: 'kianmokhlesi@gmail.com', name: 'Kian Mokhlesi' },
  { email: 'dariushmokhlesi@gmail.com', name: 'Dariush Mokhlesi' },
  { email: 'Connor_P_Lafeber@rush.edu', name: 'Connor Lafeber' },
  { email: 'Vaishvik_Chaudhari@rush.edu', name: 'Vaishvik Chaudhari' },
  { email: 'Hoda_MasteriFarahani@rush.edu', name: 'Hoda Masteri' },
];

// Admin members
const adminMembers = [
  { email: 'Juan_rojas@rush.edu', name: 'J.C. Rojas' },
  { email: 'Kevin_Buell@rush.edu', name: 'Kevin Buell' },
  { email: 'Mia_R_McClintic@rush.edu', name: 'Mia McClintic' },
];

const testPassword = 'LabSync2025!';

async function testUserAuth() {
  console.log('🔐 Testing Authentication for All Team Members\n');
  console.log('================================================\n');

  // Test regular members
  console.log('👥 Testing Regular Members:');
  console.log('---------------------------');
  
  for (const member of regularMembers) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: member.email.toLowerCase() },
        include: {
          labs: {
            include: {
              lab: true,
            },
          },
        },
      });

      if (!user) {
        console.log(`❌ ${member.name}: User not found in database`);
        continue;
      }

      if (!user.password) {
        console.log(`❌ ${member.name}: No password set`);
        continue;
      }

      // Test password
      const isValidPassword = await bcrypt.compare(testPassword, user.password);
      
      if (isValidPassword) {
        const labAccess = user.labs.map(l => l.lab.name).join(', ');
        console.log(`✅ ${member.name}: Can login | Labs: ${labAccess || 'None'} | Role: ${user.role}`);
      } else {
        console.log(`❌ ${member.name}: Invalid password`);
      }
    } catch (error) {
      console.log(`❌ ${member.name}: Error - ${error}`);
    }
  }

  console.log('\n🔑 Testing Admin Members:');
  console.log('-------------------------');
  
  for (const member of adminMembers) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: member.email.toLowerCase() },
        include: {
          labs: {
            include: {
              lab: true,
            },
          },
        },
      });

      if (!user) {
        console.log(`❌ ${member.name}: User not found in database`);
        continue;
      }

      if (!user.password) {
        console.log(`❌ ${member.name}: No password set`);
        continue;
      }

      // Test password
      const isValidPassword = await bcrypt.compare(testPassword, user.password);
      
      if (isValidPassword) {
        const labAccess = user.labs.map(l => `${l.lab.name}${l.isAdmin ? ' (Admin)' : ''}`).join(', ');
        console.log(`✅ ${member.name}: Can login | Labs: ${labAccess || 'None'} | Role: ${user.role}`);
      } else {
        console.log(`❌ ${member.name}: Invalid password`);
      }
    } catch (error) {
      console.log(`❌ ${member.name}: Error - ${error}`);
    }
  }

  // Summary statistics
  console.log('\n📊 Summary:');
  console.log('-----------');
  
  const totalUsers = await prisma.user.count();
  const activeUsers = await prisma.user.count({ where: { isActive: true } });
  const usersWithPassword = await prisma.user.count({ 
    where: { 
      password: { not: null },
      isActive: true
    } 
  });
  const labMemberships = await prisma.labMember.count();
  const adminCount = await prisma.labMember.count({ where: { isAdmin: true } });

  console.log(`Total users: ${totalUsers}`);
  console.log(`Active users: ${activeUsers}`);
  console.log(`Users with password set: ${usersWithPassword}`);
  console.log(`Lab memberships: ${labMemberships}`);
  console.log(`Admin memberships: ${adminCount}`);

  // Check for any users without lab access
  const usersWithoutLabs = await prisma.user.findMany({
    where: {
      isActive: true,
      labs: {
        none: {},
      },
    },
    select: {
      name: true,
      email: true,
    },
  });

  if (usersWithoutLabs.length > 0) {
    console.log('\n⚠️  Users without lab access:');
    usersWithoutLabs.forEach(u => {
      console.log(`   - ${u.name} (${u.email})`);
    });
  }

  console.log('\n✅ Authentication test completed!');
}

testUserAuth()
  .catch((error) => {
    console.error('Error running auth test:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
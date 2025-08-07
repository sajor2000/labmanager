#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

// Direct database connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function analyzeLabMembers() {
  console.log('🔍 Analyzing Lab Members...\n');
  console.log('=' .repeat(80));
  
  try {
    // Get all lab members with full details
    const labMembers = await prisma.labMember.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
          }
        },
        lab: {
          select: {
            name: true,
            shortName: true,
            description: true,
          }
        }
      },
      orderBy: [
        { lab: { shortName: 'asc' } },
        { user: { name: 'asc' } }
      ]
    });

    // Group by lab for better readability
    const labGroups = labMembers.reduce((acc, member) => {
      const labName = member.lab.shortName;
      if (!acc[labName]) {
        acc[labName] = {
          labInfo: member.lab,
          members: []
        };
      }
      acc[labName].members.push(member);
      return acc;
    }, {} as Record<string, any>);

    // Display findings
    console.log(`📊 SUMMARY: Found ${labMembers.length} total lab memberships across ${Object.keys(labGroups).length} labs\n`);
    console.log('=' .repeat(80));

    // Identify suspicious entries
    const suspiciousMembers: any[] = [];
    
    for (const [labShortName, group] of Object.entries(labGroups)) {
      console.log(`\n🏢 LAB: ${group.labInfo.name} (${labShortName})`);
      console.log(`   ${group.labInfo.description || 'No description'}`);
      console.log('-'.repeat(80));
      
      console.log('MEMBERS:');
      for (const member of group.members) {
        const user = member.user;
        const suspicious = [];
        
        // Check for test/fake indicators
        if (user.email.includes('test') || user.email.includes('demo') || user.email.includes('example')) {
          suspicious.push('TEST EMAIL');
        }
        if (user.name.toLowerCase().includes('test') || user.name.toLowerCase().includes('demo')) {
          suspicious.push('TEST NAME');
        }
        if (labShortName === 'TRL' || labShortName === 'TEST') {
          suspicious.push('TEST LAB');
        }
        if (!user.isActive) {
          suspicious.push('INACTIVE');
        }
        
        const roleLabel = {
          'PRINCIPAL_INVESTIGATOR': 'PI',
          'CO_PRINCIPAL_INVESTIGATOR': 'Co-PI',
          'RESEARCH_MEMBER': 'Member',
          'LAB_ADMINISTRATOR': 'Admin',
          'EXTERNAL_COLLABORATOR': 'External',
          'GUEST': 'Guest'
        }[user.role] || user.role;
        
        const adminLabel = member.isAdmin ? '👑 Admin' : '👤 Member';
        const suspiciousLabel = suspicious.length > 0 ? ` ⚠️ [${suspicious.join(', ')}]` : '';
        
        console.log(`  ${adminLabel} | ${user.name.padEnd(30)} | ${user.email.padEnd(35)} | ${roleLabel.padEnd(8)} | Joined: ${member.joinedAt.toLocaleDateString()}${suspiciousLabel}`);
        
        if (suspicious.length > 0) {
          suspiciousMembers.push({
            ...member,
            suspiciousReasons: suspicious,
            labShortName
          });
        }
      }
    }
    
    // Report suspicious members
    if (suspiciousMembers.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('⚠️  SUSPICIOUS LAB MEMBERS FOUND (Potential test/fake data):');
      console.log('='.repeat(80));
      
      for (const member of suspiciousMembers) {
        console.log(`\n❌ RECOMMEND DELETION:`);
        console.log(`   User: ${member.user.name} (${member.user.email})`);
        console.log(`   Lab: ${member.lab.name} (${member.labShortName})`);
        console.log(`   Reasons: ${member.suspiciousReasons.join(', ')}`);
        console.log(`   Member ID: ${member.id}`);
        console.log(`   User ID: ${member.userId}`);
        console.log(`   Lab ID: ${member.labId}`);
      }
      
      console.log('\n' + '='.repeat(80));
      console.log('📝 TO DELETE THESE MEMBERS:');
      console.log('1. Use Prisma Studio at http://localhost:5556');
      console.log('2. Go to the LabMember table');
      console.log('3. Search for the Member IDs listed above');
      console.log('4. Delete each suspicious entry');
      console.log('\nOR run this SQL:');
      console.log('-'.repeat(80));
      
      const deleteIds = suspiciousMembers.map(m => `'${m.id}'`).join(', ');
      console.log(`DELETE FROM "LabMember" WHERE id IN (${deleteIds});`);
    } else {
      console.log('\n✅ No obviously suspicious lab members found!');
    }
    
    // Additional analysis
    console.log('\n' + '='.repeat(80));
    console.log('📈 ADDITIONAL STATISTICS:');
    console.log('='.repeat(80));
    
    // Count by role
    const roleCounts = labMembers.reduce((acc, member) => {
      const role = member.user.role;
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\nMembers by Role:');
    for (const [role, count] of Object.entries(roleCounts)) {
      console.log(`  ${role}: ${count}`);
    }
    
    // Count admins per lab
    console.log('\nAdmins per Lab:');
    for (const [labShortName, group] of Object.entries(labGroups)) {
      const adminCount = group.members.filter((m: any) => m.isAdmin).length;
      const totalCount = group.members.length;
      console.log(`  ${labShortName}: ${adminCount} admins out of ${totalCount} members`);
    }
    
    // Inactive users
    const inactiveMembers = labMembers.filter(m => !m.user.isActive);
    if (inactiveMembers.length > 0) {
      console.log(`\n⚠️  Found ${inactiveMembers.length} inactive user memberships that should be reviewed`);
    }
    
  } catch (error) {
    console.error('❌ Error analyzing lab members:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeLabMembers()
  .then(() => {
    console.log('\n✅ Analysis complete!');
    console.log('\n💡 TIP: Run Prisma Studio to manage members visually:');
    console.log('   DATABASE_URL="postgres://..." npx prisma studio');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });
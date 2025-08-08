import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// Team roster with all the information
const teamRoster = [
  {
    name: 'J.C. Rojas',
    email: 'Juan_rojas@rush.edu',
    initials: 'JCR',
    role: UserRole.PRINCIPAL_INVESTIGATOR,
    labs: ['RICCC', 'RHEDAS']
  },
  {
    name: 'Kevin Buell',
    email: 'Kevin_Buell@rush.edu',
    initials: 'KB',
    role: UserRole.PRINCIPAL_INVESTIGATOR,
    labs: ['RICCC']
  },
  {
    name: 'Mia Mcclintic',
    email: 'Mia_R_McClintic@rush.edu',
    initials: 'MRM',
    role: UserRole.REGULATORY_COORDINATOR,
    labs: ['RICCC']
  },
  {
    name: 'Jason Stanghelle',
    email: 'Jason_Stanghelle@rush.edu',
    initials: 'JS',
    role: UserRole.DATA_ANALYST,
    labs: ['RHEDAS']
  },
  {
    name: 'Jada Sherrod',
    email: 'Jada_J_Sherrod@rush.edu',
    initials: 'JJS',
    role: UserRole.STAFF_COORDINATOR,
    labs: ['RHEDAS']
  },
  {
    name: 'Meher Sapna Masanpally',
    email: 'MeherSapna_Masanpally@rush.edu',
    initials: 'MSM',
    role: UserRole.DATA_ANALYST,
    labs: ['RHEDAS']
  },
  {
    name: 'Kian Mokhlesi',
    email: 'kianmokhlesi@gmail.com',
    initials: 'KM',
    role: UserRole.MEDICAL_STUDENT,
    labs: ['RICCC']
  },
  {
    name: 'Dariush Mokhlesi',
    email: 'dariushmokhlesi@gmail.com',
    initials: 'DM',
    role: UserRole.MEDICAL_STUDENT,
    labs: ['RICCC']
  },
  {
    name: 'Connor P Lafeber',
    email: 'Connor_P_Lafeber@rush.edu',
    initials: 'CPL',
    role: UserRole.FELLOW,
    labs: ['RICCC']
  },
  {
    name: 'Vaishvik Chaudhary',
    email: 'Vaishvik_Chaudhari@rush.edu',
    initials: 'VC',
    role: UserRole.DATA_SCIENTIST,
    labs: ['RICCC']
  },
  {
    name: 'Hoda Masteri',
    email: 'Hoda_MasteriFarahani@rush.edu',
    initials: 'HM',
    role: UserRole.DATA_ANALYST,
    labs: ['RICCC']
  }
];

async function seedTeam() {
  console.log('🌱 Starting team roster seeding...');
  
  try {
    // First ensure labs exist
    const labs = await Promise.all([
      prisma.lab.upsert({
        where: { shortName: 'RICCC' },
        update: {},
        create: {
          name: 'Rush Institute for Critical Care & Community Health Research',
          shortName: 'RICCC',
          description: 'Critical care research focusing on health equity and community outcomes',
          color: '#2C5234', // Rush green
          icon: 'flask',
          isActive: true
        }
      }),
      prisma.lab.upsert({
        where: { shortName: 'RHEDAS' },
        update: {},
        create: {
          name: 'Rush Health Equity Data Analytics & Statistics',
          shortName: 'RHEDAS',
          description: 'Data science and analytics for health equity research',
          color: '#1A5F7A', // Rush blue
          icon: 'chart-bar',
          isActive: true
        }
      })
    ]);
    
    console.log('✅ Labs created/verified');
    
    // Create users and lab memberships
    for (const member of teamRoster) {
      // Create or update user
      const user = await prisma.user.upsert({
        where: { email: member.email.toLowerCase() },
        update: {
          name: member.name,
          initials: member.initials,
          role: member.role
        },
        create: {
          email: member.email.toLowerCase(),
          name: member.name,
          initials: member.initials,
          role: member.role,
          isActive: true
        }
      });
      
      console.log(`✅ User created/updated: ${member.name} (${member.role})`);
      
      // Create lab memberships
      for (const labShortName of member.labs) {
        const lab = labs.find(l => l.shortName === labShortName);
        if (!lab) continue;
        
        // Check if membership already exists
        const existingMembership = await prisma.labMember.findFirst({
          where: {
            userId: user.id,
            labId: lab.id
          }
        });
        
        if (!existingMembership) {
          await prisma.labMember.create({
            data: {
              userId: user.id,
              labId: lab.id,
              role: member.role,
              isAdmin: member.role === UserRole.PRINCIPAL_INVESTIGATOR,
              isActive: true,
              joinedAt: new Date()
            }
          });
          
          console.log(`  ↳ Added to ${labShortName}`);
        }
      }
    }
    
    // Create some sample buckets for organization
    const ricccLab = labs.find(l => l.shortName === 'RICCC');
    const rhedasLab = labs.find(l => l.shortName === 'RHEDAS');
    
    if (ricccLab) {
      const ricccBuckets = [
        { name: 'Abbott Foundation', color: '#00BCD4', description: 'Abbott Foundation funded studies' },
        { name: 'NIH R01', color: '#4CAF50', description: 'NIH R01 grant funded projects' },
        { name: 'Pilot Studies', color: '#FF9800', description: 'Pilot and feasibility studies' },
        { name: 'Industry Sponsored', color: '#9C27B0', description: 'Industry sponsored trials' }
      ];
      
      for (let i = 0; i < ricccBuckets.length; i++) {
        await prisma.bucket.upsert({
          where: {
            labId_name: {
              labId: ricccLab.id,
              name: ricccBuckets[i].name
            }
          },
          update: {},
          create: {
            ...ricccBuckets[i],
            labId: ricccLab.id,
            position: i,
            icon: 'folder',
            isActive: true
          }
        });
      }
      console.log('✅ RICCC buckets created');
    }
    
    if (rhedasLab) {
      const rhedasBuckets = [
        { name: 'Health Equity Analytics', color: '#2196F3', description: 'Health equity data analysis projects' },
        { name: 'Community Health', color: '#FF5722', description: 'Community health research' },
        { name: 'COVID-19 Research', color: '#795548', description: 'COVID-19 related studies' },
        { name: 'Quality Improvement', color: '#607D8B', description: 'QI and process improvement projects' }
      ];
      
      for (let i = 0; i < rhedasBuckets.length; i++) {
        await prisma.bucket.upsert({
          where: {
            labId_name: {
              labId: rhedasLab.id,
              name: rhedasBuckets[i].name
            }
          },
          update: {},
          create: {
            ...rhedasBuckets[i],
            labId: rhedasLab.id,
            position: i,
            icon: 'folder',
            isActive: true
          }
        });
      }
      console.log('✅ RHEDAS buckets created');
    }
    
    console.log('\n🎉 Team roster seeding completed successfully!');
    
    // Display summary
    const userCount = await prisma.user.count();
    const labMemberCount = await prisma.labMember.count();
    const bucketCount = await prisma.bucket.count();
    
    console.log('\n📊 Database Summary:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Lab Memberships: ${labMemberCount}`);
    console.log(`   - Buckets: ${bucketCount}`);
    
  } catch (error) {
    console.error('❌ Error seeding team roster:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedTeam()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
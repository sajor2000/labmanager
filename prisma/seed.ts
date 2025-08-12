import { PrismaClient, UserRole, ProjectStatus, Priority, FundingSource } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed with REAL team members and REAL labs only...');

  // Create REAL Rush labs only - NO FAKE LABS
  const ricccLab = await prisma.lab.upsert({
    where: { shortName: 'RICCC' },
    update: {},
    create: {
      name: 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science',
      shortName: 'RICCC',
      description: 'Advancing critical care through innovative research and collaboration focused on health equity and community outcomes',
      isActive: true,
    },
  });

  const rhedasLab = await prisma.lab.upsert({
    where: { shortName: 'RHEDAS' },
    update: {},
    create: {
      name: 'Rush Health Equity Data Analytics & Science',
      shortName: 'RHEDAS',
      description: 'Data science and analytics for health equity research, focusing on disparities and social determinants of health',
      isActive: true,
    },
  });

  console.log('Created REAL labs:', ricccLab.name, 'and', rhedasLab.name);

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('LabSync2025!', 10);

  // Create REAL team members only - NO FAKE USERS
  const users = [
    // Principal Investigators (Admins)
    {
      email: 'Juan_rojas@rush.edu',
      firstName: 'J.C.',
      lastName: 'Rojas',
      name: 'J.C. Rojas',
      initials: 'JCR',
      role: UserRole.PRINCIPAL_INVESTIGATOR,
      expertise: ['Critical Care', 'Clinical Research', 'Grant Writing', 'Health Equity'],
      isAdmin: true,
      labs: ['RICCC', 'RHEDAS'], // Both labs
    },
    {
      email: 'Kevin_Buell@rush.edu',
      firstName: 'Kevin',
      lastName: 'Buell',
      name: 'Kevin Buell',
      initials: 'KB',
      role: UserRole.PRINCIPAL_INVESTIGATOR,
      expertise: ['Critical Care', 'Medical Education', 'Clinical Research'],
      isAdmin: true,
      labs: ['RICCC'], // RICCC only
    },
    // Regulatory Coordinator (Admin)
    {
      email: 'Mia_R_McClintic@rush.edu',
      firstName: 'Mia',
      lastName: 'McClintic',
      name: 'Mia R. McClintic',
      initials: 'MRM',
      role: UserRole.REGULATORY_COORDINATOR,
      expertise: ['IRB Submissions', 'Regulatory Compliance', 'Documentation', 'FDA Regulations'],
      isAdmin: true,
      labs: ['RICCC'], // RICCC only
    },
    // Data Team (Regular Members)
    {
      email: 'Jason_Stanghelle@rush.edu',
      firstName: 'Jason',
      lastName: 'Stanghelle',
      name: 'Jason Stanghelle',
      initials: 'JS',
      role: UserRole.DATA_ANALYST,
      expertise: ['Statistical Analysis', 'Data Visualization', 'Health Equity Research'],
      isAdmin: false,
      labs: ['RHEDAS'], // RHEDAS only
    },
    {
      email: 'MeherSapna_Masanpally@rush.edu',
      firstName: 'Meher Sapna',
      lastName: 'Masanpally',
      name: 'Meher Sapna Masanpally',
      initials: 'MSM',
      role: UserRole.DATA_ANALYST,
      expertise: ['Data Analysis', 'Machine Learning', 'Predictive Modeling'],
      isAdmin: false,
      labs: ['RHEDAS'], // RHEDAS only
    },
    {
      email: 'Vaishvik_Chaudhari@rush.edu',
      firstName: 'Vaishvik',
      lastName: 'Chaudhari',
      name: 'Vaishvik Chaudhari',
      initials: 'VC',
      role: UserRole.DATA_SCIENTIST,
      expertise: ['Machine Learning', 'AI/LLM', 'Predictive Modeling', 'Deep Learning'],
      isAdmin: false,
      labs: ['RICCC'], // RICCC only
    },
    {
      email: 'Hoda_MasteriFarahani@rush.edu',
      firstName: 'Hoda',
      lastName: 'Masteri',
      name: 'Hoda Masteri',
      initials: 'HM',
      role: UserRole.DATA_ANALYST,
      expertise: ['EHR Data', 'Clinical Analytics', 'REDCap', 'Healthcare Data'],
      isAdmin: false,
      labs: ['RICCC'], // RICCC only
    },
    // Coordination Team (Regular Members)
    {
      email: 'Jada_J_Sherrod@rush.edu',
      firstName: 'Jada',
      lastName: 'Sherrod',
      name: 'Jada J. Sherrod',
      initials: 'JJS',
      role: UserRole.STAFF_COORDINATOR,
      expertise: ['Project Management', 'Team Coordination', 'Study Operations'],
      isAdmin: false,
      labs: ['RHEDAS'], // RHEDAS only
    },
    // Clinical Team (Regular Members)
    {
      email: 'Connor_P_Lafeber@rush.edu',
      firstName: 'Connor',
      lastName: 'Lafeber',
      name: 'Connor P. Lafeber',
      initials: 'CPL',
      role: UserRole.FELLOW,
      expertise: ['Critical Care', 'Clinical Trials', 'Medical Writing'],
      isAdmin: false,
      labs: ['RICCC'], // RICCC only
    },
    // Medical Students (Regular Members)
    {
      email: 'kianmokhlesi@gmail.com',
      firstName: 'Kian',
      lastName: 'Mokhlesi',
      name: 'Kian Mokhlesi',
      initials: 'KM',
      role: UserRole.MEDICAL_STUDENT,
      expertise: ['Clinical Research', 'Data Collection'],
      isAdmin: false,
      labs: ['RICCC'], // RICCC only
    },
    {
      email: 'dariushmokhlesi@gmail.com',
      firstName: 'Dariush',
      lastName: 'Mokhlesi',
      name: 'Dariush Mokhlesi',
      initials: 'DM',
      role: UserRole.MEDICAL_STUDENT,
      expertise: ['Clinical Research', 'Literature Review'],
      isAdmin: false,
      labs: ['RICCC'], // RICCC only
    },
  ];

  // Create users and lab memberships
  for (const userData of users) {
    const { labs: userLabs, ...userInfo } = userData;
    
    const user = await prisma.user.upsert({
      where: { email: userInfo.email.toLowerCase() },
      update: {},
      create: {
        email: userInfo.email.toLowerCase(),
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        name: userInfo.name,
        initials: userInfo.initials,
        role: userInfo.role,
        expertise: userInfo.expertise,
        password: hashedPassword,
        isActive: true,
      },
    });

    // Add user to their assigned REAL labs
    for (const labShortName of userLabs) {
      const lab = labShortName === 'RICCC' ? ricccLab : rhedasLab;
      
      await prisma.labMember.upsert({
        where: {
          userId_labId: {
            userId: user.id,
            labId: lab.id,
          },
        },
        update: {
          isAdmin: userInfo.isAdmin,
        },
        create: {
          userId: user.id,
          labId: lab.id,
          isAdmin: userInfo.isAdmin,
          joinedAt: new Date(),
          isActive: true,
        },
      });
    }

    console.log(`Created user: ${user.name} (${user.email}) - Admin: ${userInfo.isAdmin} - Labs: ${userLabs.join(', ')}`);
  }

  // Create sample buckets for RICCC
  const ricccBuckets = [
    {
      name: 'Abbott Foundation Studies',
      description: 'Abbott Foundation funded critical care research',
      color: '#00BCD4',
      icon: 'flask',
    },
    {
      name: 'NIH R01 Grant',
      description: 'NIH R01 funded critical care projects',
      color: '#4CAF50',
      icon: 'award',
    },
    {
      name: 'Industry Sponsored',
      description: 'Industry sponsored clinical trials',
      color: '#9C27B0',
      icon: 'building',
    },
  ];

  for (const bucketData of ricccBuckets) {
    const bucket = await prisma.bucket.upsert({
      where: { 
        labId_name: {
          labId: ricccLab.id,
          name: bucketData.name,
        }
      },
      update: {},
      create: {
        name: bucketData.name,
        description: bucketData.description,
        color: bucketData.color,
        icon: bucketData.icon,
        labId: ricccLab.id,
        position: 0,
        isActive: true,
      },
    });
    console.log(`Created RICCC bucket: ${bucket.name}`);
  }

  // Create sample buckets for RHEDAS
  const rhedasBuckets = [
    {
      name: 'Health Equity Analytics',
      description: 'Advanced analytics for health disparities research',
      color: '#2196F3',
      icon: 'chart-line',
    },
    {
      name: 'Community Health Initiative',
      description: 'Community-based participatory research',
      color: '#FF5722',
      icon: 'users',
    },
    {
      name: 'Quality Improvement',
      description: 'QI projects for health systems',
      color: '#607D8B',
      icon: 'trending-up',
    },
  ];

  for (const bucketData of rhedasBuckets) {
    const bucket = await prisma.bucket.upsert({
      where: { 
        labId_name: {
          labId: rhedasLab.id,
          name: bucketData.name,
        }
      },
      update: {},
      create: {
        name: bucketData.name,
        description: bucketData.description,
        color: bucketData.color,
        icon: bucketData.icon,
        labId: rhedasLab.id,
        position: 0,
        isActive: true,
      },
    });
    console.log(`Created RHEDAS bucket: ${bucket.name}`);
  }

  // Create sample projects for RICCC
  const ricccProjects = [
    {
      name: 'Critical Care COVID-19 Outcomes Study',
      oraNumber: 'ORA-2024-RICCC-001',
      status: ProjectStatus.DATA_COLLECTION,
      priority: Priority.HIGH,
      projectType: 'Clinical Research',
      studyType: 'Retrospective',
      fundingSource: FundingSource.NIH,
      externalCollaborators: 'Northwestern University',
      description: 'Multi-site study examining COVID-19 outcomes in ICU patients',
    },
    {
      name: 'Sepsis Early Detection Protocol',
      oraNumber: 'ORA-2024-RICCC-002',
      status: ProjectStatus.ANALYSIS,
      priority: Priority.CRITICAL,
      projectType: 'Quality Improvement',
      studyType: 'Prospective',
      fundingSource: FundingSource.INTERNAL,
      externalCollaborators: 'Rush Medical Center',
      description: 'QI project for early sepsis detection in critical care',
    },
  ];

  // Get J.C. Rojas as the creator of RICCC projects
  const jcUser = await prisma.user.findFirst({
    where: { email: 'juan_rojas@rush.edu' }
  });

  if (jcUser) {
    const ricccBucketList = await prisma.bucket.findMany({
      where: { labId: ricccLab.id }
    });

    for (let i = 0; i < ricccProjects.length; i++) {
      const bucket = ricccBucketList[i % ricccBucketList.length];
      try {
        const project = await prisma.project.create({
          data: {
            ...ricccProjects[i],
            labId: ricccLab.id,
            bucketId: bucket.id,
            createdById: jcUser.id,
            dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
        });
        console.log(`Created RICCC project: ${project.name}`);
      } catch (error) {
        console.log(`Project ${ricccProjects[i].oraNumber} already exists, skipping...`);
      }
    }
  }

  // Create sample projects for RHEDAS
  const rhedasProjects = [
    {
      name: 'Health Disparities in Diabetes Care',
      oraNumber: 'ORA-2024-RHEDAS-001',
      status: ProjectStatus.MANUSCRIPT,
      priority: Priority.MEDIUM,
      projectType: 'Health Equity Research',
      studyType: 'Cross-sectional',
      fundingSource: FundingSource.FOUNDATION,
      externalCollaborators: 'University of Chicago',
      description: 'Analysis of health disparities in diabetes management',
    },
  ];

  if (jcUser) {
    const rhedasBucketList = await prisma.bucket.findMany({
      where: { labId: rhedasLab.id }
    });

    for (let i = 0; i < rhedasProjects.length; i++) {
      const bucket = rhedasBucketList[i % rhedasBucketList.length];
      try {
        const project = await prisma.project.create({
          data: {
            ...rhedasProjects[i],
            labId: rhedasLab.id,
            bucketId: bucket.id,
            createdById: jcUser.id,
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
        });
        console.log(`Created RHEDAS project: ${project.name}`);
      } catch (error) {
        console.log(`Project ${rhedasProjects[i].oraNumber} already exists, skipping...`);
      }
    }
  }

  console.log('\n✅ Database seed completed with REAL data only!');
  console.log('\n📋 REAL Labs Created:');
  console.log('====================');
  console.log('1. RICCC - Rush Interdisciplinary Consortium for Critical Care Trials and Data Science');
  console.log('2. RHEDAS - Rush Health Equity Data Analytics & Science');
  console.log('\n🚫 NO FAKE LABS (like "Health Equity Labs") were created!');
  
  console.log('\n📝 Login Credentials for REAL Team Members:');
  console.log('============================================');
  console.log('\n🔑 Admin Users (Full Access):');
  console.log('  J.C. Rojas: Juan_rojas@rush.edu / LabSync2025! (RICCC & RHEDAS)');
  console.log('  Kevin Buell: Kevin_Buell@rush.edu / LabSync2025! (RICCC)');
  console.log('  Mia McClintic: Mia_R_McClintic@rush.edu / LabSync2025! (RICCC)');
  console.log('\n👥 Regular Team Members:');
  console.log('  Jason Stanghelle: Jason_Stanghelle@rush.edu / LabSync2025! (RHEDAS)');
  console.log('  Jada Sherrod: Jada_J_Sherrod@rush.edu / LabSync2025! (RHEDAS)');
  console.log('  And 6 others...');
  console.log('\n⚠️  All users share the same password: LabSync2025!');
  console.log('⚠️  Please change your password after first login.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
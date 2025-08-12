import { PrismaClient, UserRole, ProjectStatus, Priority, FundingSource } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed with real team members...');

  // Create default lab
  const healthEquityLab = await prisma.lab.upsert({
    where: { shortName: 'HEL' },
    update: {},
    create: {
      name: 'Health Equity Labs',
      shortName: 'HEL',
      description: 'Research laboratory focused on health equity and disparities',
      isActive: true,
    },
  });

  console.log('Created lab:', healthEquityLab.name);

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('LabSync2025!', 10);

  // Create real team members with proper admin roles
  const users = [
    {
      email: 'Juan_rojas@rush.edu',
      firstName: 'J.C.',
      lastName: 'Rojas',
      name: 'J.C. Rojas',
      initials: 'JCR',
      role: UserRole.PRINCIPAL_INVESTIGATOR,
      expertise: ['Critical Care', 'Clinical Research', 'Grant Writing', 'Health Equity'],
      isAdmin: true, // PI should be admin
    },
    {
      email: 'Kevin_Buell@rush.edu',
      firstName: 'Kevin',
      lastName: 'Buell',
      name: 'Kevin Buell',
      initials: 'KB',
      role: UserRole.PRINCIPAL_INVESTIGATOR,
      expertise: ['Critical Care', 'Medical Education', 'Clinical Research'],
      isAdmin: true, // PI should be admin
    },
    {
      email: 'Mia_R_McClintic@rush.edu',
      firstName: 'Mia',
      lastName: 'McClintic',
      name: 'Mia R. McClintic',
      initials: 'MRM',
      role: UserRole.REGULATORY_COORDINATOR,
      expertise: ['IRB Submissions', 'Regulatory Compliance', 'Documentation', 'FDA Regulations'],
      isAdmin: true, // Mia should be admin as requested
    },
    {
      email: 'Jason_Stanghelle@rush.edu',
      firstName: 'Jason',
      lastName: 'Stanghelle',
      name: 'Jason Stanghelle',
      initials: 'JS',
      role: UserRole.DATA_ANALYST,
      expertise: ['Statistical Analysis', 'Data Visualization', 'Health Equity Research'],
      isAdmin: false,
    },
    {
      email: 'Jada_J_Sherrod@rush.edu',
      firstName: 'Jada',
      lastName: 'Sherrod',
      name: 'Jada J. Sherrod',
      initials: 'JJS',
      role: UserRole.STAFF_COORDINATOR,
      expertise: ['Project Management', 'Team Coordination', 'Study Operations'],
      isAdmin: false,
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
    },
    {
      email: 'kianmokhlesi@gmail.com',
      firstName: 'Kian',
      lastName: 'Mokhlesi',
      name: 'Kian Mokhlesi',
      initials: 'KM',
      role: UserRole.MEDICAL_STUDENT,
      expertise: ['Clinical Research', 'Data Collection'],
      isAdmin: false,
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
    },
    {
      email: 'Connor_P_Lafeber@rush.edu',
      firstName: 'Connor',
      lastName: 'Lafeber',
      name: 'Connor P. Lafeber',
      initials: 'CPL',
      role: UserRole.FELLOW,
      expertise: ['Critical Care', 'Clinical Trials', 'Medical Writing'],
      isAdmin: false,
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
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email.toLowerCase() },
      update: {},
      create: {
        email: userData.email.toLowerCase(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        name: userData.name,
        initials: userData.initials,
        role: userData.role,
        expertise: userData.expertise,
        password: hashedPassword,
        isActive: true,
      },
    });

    // Add user to lab with proper admin permissions
    await prisma.labMember.upsert({
      where: {
        userId_labId: {
          userId: user.id,
          labId: healthEquityLab.id,
        },
      },
      update: {
        isAdmin: userData.isAdmin,
      },
      create: {
        userId: user.id,
        labId: healthEquityLab.id,
        isAdmin: userData.isAdmin,
        joinedAt: new Date(),
        isActive: true,
      },
    });

    console.log(`Created user: ${user.name} (${user.email}) - Admin: ${userData.isAdmin}`);
  }

  // Create sample buckets
  const buckets = [
    {
      name: 'Abbott Foundation Studies',
      description: 'Research funded by Abbott Foundation',
      color: '#00BCD4',
      icon: 'flask',
    },
    {
      name: 'Wisconsin R01',
      description: 'Wisconsin R01 grant-funded research',
      color: '#E91E63',
      icon: 'folder',
    },
    {
      name: 'Community Health Initiative',
      description: 'Community-based health intervention studies',
      color: '#4CAF50',
      icon: 'users',
    },
  ];

  for (const bucketData of buckets) {
    const bucket = await prisma.bucket.upsert({
      where: { 
        labId_name: {
          labId: healthEquityLab.id,
          name: bucketData.name,
        }
      },
      update: {},
      create: {
        name: bucketData.name,
        description: bucketData.description,
        color: bucketData.color,
        icon: bucketData.icon,
        labId: healthEquityLab.id,
        position: 0,
        isActive: true,
      },
    });
    console.log(`Created bucket: ${bucket.name}`);
  }

  // Create sample projects
  const projects = [
    {
      name: 'Diabetic Retinopathy Research Protocol',
      oraNumber: 'ORA-2024-001',
      status: ProjectStatus.DATA_COLLECTION,
      priority: Priority.HIGH,
      projectType: 'Clinical Research',
      studyType: 'Retrospective',
      fundingSource: FundingSource.NIH,
      externalCollaborators: 'Northwestern University, University of Chicago',
      description: 'Multi-site study examining diabetic retinopathy outcomes',
    },
    {
      name: 'Wisconsin Breast Cancer Study',
      oraNumber: 'ORA-2024-002',
      status: ProjectStatus.ANALYSIS,
      priority: Priority.MEDIUM,
      projectType: 'Clinical Research',
      studyType: 'Prospective',
      fundingSource: FundingSource.FOUNDATION,
      externalCollaborators: 'University of Wisconsin-Madison',
      description: 'Long-term follow-up study on breast cancer interventions',
    },
    {
      name: 'Central Line Associated Blood Stream Infection',
      oraNumber: 'ORA-2024-003',
      status: ProjectStatus.MANUSCRIPT,
      priority: Priority.MEDIUM,
      projectType: 'Quality Improvement',
      studyType: 'Quality Improvement',
      fundingSource: FundingSource.INTERNAL,
      externalCollaborators: 'Rush Medical Center',
      description: 'QI project to reduce CLABSI rates',
    },
  ];

  const bucketList = await prisma.bucket.findMany({
    where: { labId: healthEquityLab.id }
  });

  // Get J.C. Rojas as the creator of projects
  const piUser = await prisma.user.findFirst({
    where: { email: 'juan_rojas@rush.edu' }
  });

  if (!piUser) {
    throw new Error('PI user not found');
  }

  for (let i = 0; i < projects.length; i++) {
    const bucket = bucketList[i % bucketList.length];
    const project = await prisma.project.create({
      data: {
        ...projects[i],
        labId: healthEquityLab.id,
        bucketId: bucket.id,
        createdById: piUser.id,
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      },
    });
    console.log(`Created project: ${project.name}`);
  }

  console.log('\n✅ Database seed completed successfully!');
  console.log('\n📝 Login Credentials for Real Team Members:');
  console.log('=========================================');
  console.log('\n🔑 Admin Users (Full Access):');
  console.log('  J.C. Rojas: Juan_rojas@rush.edu / LabSync2025!');
  console.log('  Kevin Buell: Kevin_Buell@rush.edu / LabSync2025!');
  console.log('  Mia McClintic: Mia_R_McClintic@rush.edu / LabSync2025!');
  console.log('\n👥 Regular Team Members:');
  console.log('  Jason Stanghelle: Jason_Stanghelle@rush.edu / LabSync2025!');
  console.log('  Jada Sherrod: Jada_J_Sherrod@rush.edu / LabSync2025!');
  console.log('  And others...');
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
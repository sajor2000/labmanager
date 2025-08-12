import { PrismaClient, UserRole, ProjectStatus, Priority, FundingSource } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

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

  // Create users
  const users = [
    {
      email: 'juan_rojas@rush.edu',
      firstName: 'Juan',
      lastName: 'Rojas',
      name: 'Juan Rojas',
      initials: 'JR',
      role: UserRole.CLINICAL_RESEARCH_COORDINATOR,
      expertise: ['Community Health', 'Data Collection', 'Study Coordination'],
      isAdmin: false,
    },
    {
      email: 'mia.thompson@rush.edu',
      firstName: 'Mia',
      lastName: 'Thompson',
      name: 'Dr. Mia Thompson',
      initials: 'MT',
      role: UserRole.PRINCIPAL_INVESTIGATOR,
      expertise: ['Health Equity', 'Public Health', 'Research Design'],
      isAdmin: true,
    },
    {
      email: 'sarah.johnson@rush.edu',
      firstName: 'Sarah',
      lastName: 'Johnson',
      name: 'Sarah Johnson',
      initials: 'SJ',
      role: UserRole.DATA_ANALYST,
      expertise: ['Statistical Analysis', 'Data Visualization', 'R Programming'],
      isAdmin: false,
    },
    {
      email: 'david.chen@rush.edu',
      firstName: 'David',
      lastName: 'Chen',
      name: 'Dr. David Chen',
      initials: 'DC',
      role: UserRole.CO_PRINCIPAL_INVESTIGATOR,
      expertise: ['Biostatistics', 'Epidemiology', 'Clinical Trials'],
      isAdmin: true,
    },
    {
      email: 'admin@rush.edu',
      firstName: 'Lab',
      lastName: 'Administrator',
      name: 'Lab Administrator',
      initials: 'LA',
      role: UserRole.STAFF_COORDINATOR,
      expertise: ['Lab Management', 'Administration', 'Coordination'],
      isAdmin: true,
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
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

    // Add user to lab
    await prisma.labMember.upsert({
      where: {
        userId_labId: {
          userId: user.id,
          labId: healthEquityLab.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        labId: healthEquityLab.id,
        isAdmin: userData.isAdmin,
        joinedAt: new Date(),
        isActive: true,
      },
    });

    console.log(`Created user: ${user.name} (${user.email})`);
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

  // Get the PI user to be the creator of projects
  const piUser = await prisma.user.findFirst({
    where: { email: 'mia.thompson@rush.edu' }
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

  console.log('Database seed completed successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('====================');
  console.log('Admin User:');
  console.log('  Email: mia.thompson@rush.edu');
  console.log('  Password: LabSync2025!');
  console.log('\nRegular User:');
  console.log('  Email: juan_rojas@rush.edu');
  console.log('  Password: LabSync2025!');
  console.log('\nAll users share the same password: LabSync2025!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
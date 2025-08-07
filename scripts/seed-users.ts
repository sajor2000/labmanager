import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting user seeding...');

  try {
    // Create labs first
    const healthEquityLab = await prisma.lab.upsert({
      where: { id: 'health-equity-lab' },
      update: {},
      create: {
        id: 'health-equity-lab',
        name: 'Health Equity Research Lab',
        shortName: 'HERL',
        description: 'Focused on reducing health disparities and improving healthcare access for underserved populations',
      },
    });

    const digitalHealthLab = await prisma.lab.upsert({
      where: { id: 'digital-health-lab' },
      update: {},
      create: {
        id: 'digital-health-lab',
        name: 'Digital Health Innovation Lab',
        shortName: 'DHIL',
        description: 'Developing cutting-edge digital health solutions and AI-powered diagnostic tools',
      },
    });

    console.log('Created labs:', { healthEquityLab: healthEquityLab.name, digitalHealthLab: digitalHealthLab.name });

    // Create users
    const users = [
      {
        id: 'dr-sarah-chen',
        email: 'sarah.chen@research.lab',
        name: 'Dr. Sarah Chen',
        initials: 'SC',
        role: 'PRINCIPAL_INVESTIGATOR' as const,
        expertise: ['Health Equity', 'Public Health', 'Epidemiology'],
        capacity: 40,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      },
      {
        id: 'dr-michael-rodriguez',
        email: 'michael.rodriguez@research.lab',
        name: 'Dr. Michael Rodriguez',
        initials: 'MR',
        role: 'CO_PRINCIPAL_INVESTIGATOR' as const,
        expertise: ['Digital Health', 'AI/ML', 'Clinical Informatics'],
        capacity: 35,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      },
      {
        id: 'emily-johnson',
        email: 'emily.johnson@research.lab',
        name: 'Emily Johnson',
        initials: 'EJ',
        role: 'RESEARCH_MEMBER' as const,
        expertise: ['Data Analysis', 'Biostatistics', 'R Programming'],
        capacity: 45,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
      },
      {
        id: 'james-williams',
        email: 'james.williams@research.lab',
        name: 'James Williams',
        initials: 'JW',
        role: 'RESEARCH_MEMBER' as const,
        expertise: ['Clinical Research', 'Patient Recruitment', 'REDCap'],
        capacity: 40,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
      },
      {
        id: 'lisa-martinez',
        email: 'lisa.martinez@research.lab',
        name: 'Lisa Martinez',
        initials: 'LM',
        role: 'LAB_ADMINISTRATOR' as const,
        expertise: ['Project Management', 'Grant Writing', 'Compliance'],
        capacity: 50,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
      },
      {
        id: 'dr-robert-taylor',
        email: 'robert.taylor@research.lab',
        name: 'Dr. Robert Taylor',
        initials: 'RT',
        role: 'EXTERNAL_COLLABORATOR' as const,
        expertise: ['Genomics', 'Precision Medicine', 'Bioinformatics'],
        capacity: 20,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
      },
    ];

    for (const userData of users) {
      const user = await prisma.user.upsert({
        where: { id: userData.id },
        update: userData,
        create: userData,
      });
      console.log(`Created/Updated user: ${user.name} (${user.role})`);
    }

    // Create lab memberships (isAdmin determines if they have admin privileges)
    const labMemberships = [
      // Health Equity Lab members
      { userId: 'dr-sarah-chen', labId: 'health-equity-lab', isAdmin: true },
      { userId: 'emily-johnson', labId: 'health-equity-lab', isAdmin: false },
      { userId: 'james-williams', labId: 'health-equity-lab', isAdmin: false },
      { userId: 'lisa-martinez', labId: 'health-equity-lab', isAdmin: true },
      { userId: 'dr-robert-taylor', labId: 'health-equity-lab', isAdmin: false },
      
      // Digital Health Lab members
      { userId: 'dr-michael-rodriguez', labId: 'digital-health-lab', isAdmin: true },
      { userId: 'emily-johnson', labId: 'digital-health-lab', isAdmin: false },
      { userId: 'lisa-martinez', labId: 'digital-health-lab', isAdmin: true },
    ];

    for (const membership of labMemberships) {
      await prisma.labMember.upsert({
        where: {
          userId_labId: {
            userId: membership.userId,
            labId: membership.labId,
          },
        },
        update: {},
        create: membership,
      });
      console.log(`Created lab membership: ${membership.userId} -> ${membership.labId}`);
    }

    // Create some buckets for each lab
    const buckets = [
      {
        id: 'health-equity-active',
        name: 'Active Studies',
        description: 'Currently active health equity research studies',
        labId: 'health-equity-lab',
        color: '#10B981',
        icon: '🔬',
        position: 0,
      },
      {
        id: 'health-equity-planning',
        name: 'Planning',
        description: 'Studies in planning phase',
        labId: 'health-equity-lab',
        color: '#3B82F6',
        icon: '📋',
        position: 1,
      },
      {
        id: 'digital-health-active',
        name: 'Active Projects',
        description: 'Active digital health initiatives',
        labId: 'digital-health-lab',
        color: '#8B5CF6',
        icon: '💻',
        position: 0,
      },
      {
        id: 'digital-health-pilot',
        name: 'Pilot Studies',
        description: 'Pilot and proof-of-concept projects',
        labId: 'digital-health-lab',
        color: '#F59E0B',
        icon: '🚀',
        position: 1,
      },
    ];

    for (const bucket of buckets) {
      await prisma.bucket.upsert({
        where: { id: bucket.id },
        update: bucket,
        create: bucket,
      });
      console.log(`Created bucket: ${bucket.name} for lab ${bucket.labId}`);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('Users can now log in at /auth');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
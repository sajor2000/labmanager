import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Check if we're using Prisma Accelerate (URL starts with prisma://)
const isPrismaAccelerate = process.env.DATABASE_URL?.startsWith('prisma://') || 
                          process.env.DATABASE_URL?.startsWith('prisma+postgres://');

const prisma = isPrismaAccelerate 
  ? new PrismaClient().$extends(withAccelerate())
  : new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  
  // Create users
  const drJohnson = await prisma.user.upsert({
    where: { email: 'dr.johnson@rush.edu' },
    update: {},
    create: {
      email: 'dr.johnson@rush.edu',
      name: 'Dr. Johnson',
      firstName: 'Dr.',
      lastName: 'Johnson',
      role: 'PRINCIPAL_INVESTIGATOR',
      initials: 'DJ',
    },
  });
  
  const drChen = await prisma.user.upsert({
    where: { email: 'dr.chen@rush.edu' },
    update: {},
    create: {
      email: 'dr.chen@rush.edu',
      name: 'Dr. Sarah Chen',
      firstName: 'Sarah',
      lastName: 'Chen',
      role: 'CO_PRINCIPAL_INVESTIGATOR',
      initials: 'SC',
    },
  });
  
  const drRoss = await prisma.user.upsert({
    where: { email: 'dr.ross@rush.edu' },
    update: {},
    create: {
      email: 'dr.ross@rush.edu',
      name: 'Dr. Michael Ross',
      firstName: 'Michael',
      lastName: 'Ross',
      role: 'RESEARCH_MEMBER',
      initials: 'MR',
    },
  });
  
  const drZhang = await prisma.user.upsert({
    where: { email: 'dr.zhang@rush.edu' },
    update: {},
    create: {
      email: 'dr.zhang@rush.edu',
      name: 'Dr. Emily Zhang',
      firstName: 'Emily',
      lastName: 'Zhang',
      role: 'RESEARCH_MEMBER',
      initials: 'EZ',
    },
  });
  
  const drMartinez = await prisma.user.upsert({
    where: { email: 'dr.martinez@rush.edu' },
    update: {},
    create: {
      email: 'dr.martinez@rush.edu',
      name: 'Dr. Angela Martinez',
      firstName: 'Angela',
      lastName: 'Martinez',
      role: 'RESEARCH_MEMBER',
      initials: 'AM',
    },
  });
  
  console.log('✅ Users created');
  
  // Create labs
  const rhedas = await prisma.lab.upsert({
    where: { shortName: 'RHEDAS' },
    update: {},
    create: {
      name: 'Rush Health Equity Data Analytics Studio',
      shortName: 'RHEDAS',
      description: 'Advancing health equity through data-driven research and community engagement',
    },
  });
  
  const riccc = await prisma.lab.upsert({
    where: { shortName: 'RICCC' },
    update: {},
    create: {
      name: 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science',
      shortName: 'RICCC',
      description: 'Improving critical care outcomes through innovative trials and data science',
    },
  });
  
  console.log('✅ Labs created');
  
  // Add lab members
  await prisma.labMember.create({
    data: {
      userId: drJohnson.id,
      labId: rhedas.id,
      isAdmin: true,
    },
  }).catch(() => {}); // Ignore if already exists
  
  await prisma.labMember.create({
    data: {
      userId: drJohnson.id,
      labId: riccc.id,
      isAdmin: true,
    },
  }).catch(() => {});
  
  await prisma.labMember.create({
    data: {
      userId: drChen.id,
      labId: rhedas.id,
      isAdmin: false,
    },
  }).catch(() => {});
  
  await prisma.labMember.create({
    data: {
      userId: drRoss.id,
      labId: rhedas.id,
      isAdmin: false,
    },
  }).catch(() => {});
  
  await prisma.labMember.create({
    data: {
      userId: drMartinez.id,
      labId: riccc.id,
      isAdmin: false,
    },
  }).catch(() => {});
  
  console.log('✅ Lab members added');
  
  // Create buckets for RHEDAS
  const rhedasCore = await prisma.bucket.create({
    data: {
      name: 'RHEDAS - Core Research',
      description: 'Core health equity research projects',
      color: '#00BCD4',
      labId: rhedas.id,
      position: 0,
    },
  });
  
  const rhedasCommunity = await prisma.bucket.create({
    data: {
      name: 'RHEDAS - Community Projects',
      description: 'Community-based participatory research',
      color: '#4CAF50',
      labId: rhedas.id,
      position: 1,
    },
  });
  
  // Create buckets for RICCC
  const ricccTrials = await prisma.bucket.create({
    data: {
      name: 'RICCC - Critical Care Trials',
      description: 'Clinical trials in critical care settings',
      color: '#E91E63',
      labId: riccc.id,
      position: 0,
    },
  });
  
  const ricccData = await prisma.bucket.create({
    data: {
      name: 'RICCC - Data Science',
      description: 'Data science and machine learning projects',
      color: '#9C27B0',
      labId: riccc.id,
      position: 1,
    },
  });
  
  const nihGrant = await prisma.bucket.create({
    data: {
      name: 'NIH R01 Grant',
      description: 'NIH-funded research projects',
      color: '#FF9800',
      labId: rhedas.id,
      position: 2,
    },
  });
  
  console.log('✅ Buckets created');
  
  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: 'COVID-19 Health Disparities in Chicago South Side Communities',
      status: 'ANALYSIS',
      priority: 'HIGH',
      projectType: 'EHR Study',
      studyType: 'Retrospective cohort',
      fundingSource: 'NIH',
      externalCollaborators: 'University of Chicago Medicine',
      labId: rhedas.id,
      bucketId: rhedasCore.id,
      createdById: drJohnson.id,
      members: {
        create: [
          { userId: drChen.id, role: 'ACCOUNTABLE' },
          { userId: drRoss.id, role: 'RESPONSIBLE' },
        ],
      },
    },
  });
  
  const project2 = await prisma.project.create({
    data: {
      name: 'Healthcare Access Barriers in Underserved Populations',
      status: 'DATA_COLLECTION',
      priority: 'MEDIUM',
      projectType: 'Community Study',
      studyType: 'Mixed methods',
      fundingSource: 'FOUNDATION',
      fundingDetails: 'AHRQ Grant',
      externalCollaborators: 'Rush Community Health Center',
      labId: rhedas.id,
      bucketId: rhedasCore.id,
      createdById: drChen.id,
      members: {
        create: [
          { userId: drZhang.id, role: 'RESPONSIBLE' },
          { userId: drJohnson.id, role: 'CONSULTED' },
        ],
      },
    },
  });
  
  const project3 = await prisma.project.create({
    data: {
      name: 'Community Health Worker Intervention Program',
      status: 'IRB_APPROVED',
      priority: 'HIGH',
      projectType: 'Clinical Study',
      studyType: 'Prospective RCT',
      fundingSource: 'OTHER',
      fundingDetails: 'CDC Grant',
      externalCollaborators: 'Chicago Department of Public Health',
      labId: rhedas.id,
      bucketId: rhedasCommunity.id,
      createdById: drJohnson.id,
    },
  });
  
  const project4 = await prisma.project.create({
    data: {
      name: 'Sepsis Early Detection Using Machine Learning',
      status: 'PLANNING',
      priority: 'CRITICAL',
      projectType: 'AI/LLM',
      studyType: 'Prospective cohort',
      fundingSource: 'NIH',
      fundingDetails: 'NIH R21',
      externalCollaborators: 'Northwestern Medicine',
      labId: riccc.id,
      bucketId: ricccTrials.id,
      createdById: drJohnson.id,
      members: {
        create: [
          { userId: drMartinez.id, role: 'RESPONSIBLE' },
        ],
      },
    },
  });
  
  const project5 = await prisma.project.create({
    data: {
      name: 'ICU Delirium Prevention Protocol Study',
      status: 'MANUSCRIPT',
      priority: 'MEDIUM',
      projectType: 'Clinical Study',
      studyType: 'Multi-center RCT',
      fundingSource: 'FOUNDATION',
      fundingDetails: 'SCCM Grant',
      externalCollaborators: 'Mayo Clinic, Cleveland Clinic',
      labId: riccc.id,
      bucketId: ricccTrials.id,
      createdById: drMartinez.id,
    },
  });
  
  const project6 = await prisma.project.create({
    data: {
      name: 'Predictive Analytics for ICU Readmission',
      status: 'ANALYSIS',
      priority: 'HIGH',
      projectType: 'AI/LLM',
      studyType: 'Retrospective analysis',
      fundingSource: 'INTERNAL',
      fundingDetails: 'Rush Internal Grant',
      externalCollaborators: 'Rush Data Science Institute',
      labId: riccc.id,
      bucketId: ricccData.id,
      createdById: drJohnson.id,
    },
  });
  
  const project7 = await prisma.project.create({
    data: {
      name: 'Social Determinants of Post-ICU Recovery',
      status: 'IRB_SUBMISSION',
      priority: 'HIGH',
      projectType: 'Community Study',
      studyType: 'Longitudinal cohort',
      fundingSource: 'NIH',
      externalCollaborators: 'Harvard Medical School',
      labId: rhedas.id,
      bucketId: nihGrant.id,
      createdById: drJohnson.id,
      members: {
        create: [
          { userId: drChen.id, role: 'RESPONSIBLE' },
        ],
      },
    },
  });
  
  console.log('✅ Projects created');
  
  // Create sample tasks
  await prisma.task.create({
    data: {
      title: 'Complete data analysis for COVID-19 study',
      description: 'Run statistical analysis on collected data',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: project1.id,
      createdById: drChen.id,
      dueDate: new Date('2024-12-31'),
      assignees: {
        create: [
          { userId: drChen.id },
        ],
      },
    },
  });
  
  await prisma.task.create({
    data: {
      title: 'Submit IRB renewal',
      description: 'Annual IRB renewal for healthcare access study',
      status: 'TODO',
      priority: 'CRITICAL',
      projectId: project2.id,
      createdById: drJohnson.id,
      dueDate: new Date('2024-12-15'),
    },
  });
  
  await prisma.task.create({
    data: {
      title: 'Review manuscript draft',
      description: 'Review and provide feedback on ICU delirium manuscript',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: project5.id,
      createdById: drMartinez.id,
      assignees: {
        create: [
          { userId: drJohnson.id },
        ],
      },
    },
  });
  
  await prisma.task.create({
    data: {
      title: 'Train ML model for sepsis detection',
      description: 'Develop and validate machine learning model',
      status: 'TODO',
      priority: 'HIGH',
      projectId: project4.id,
      createdById: drMartinez.id,
    },
  });
  
  console.log('✅ Tasks created');
  
  // Create sample ideas
  await prisma.idea.create({
    data: {
      title: 'Mobile health app for community health tracking',
      description: 'Develop a mobile application to help community members track their health metrics and connect with local resources',
      status: 'UNDER_REVIEW',
      feasibilityScore: 8.5,
      impactScore: 9.0,
      labId: rhedas.id,
      createdById: drZhang.id,
      votes: {
        create: [
          { userId: drJohnson.id, voteType: 'UP' },
          { userId: drChen.id, voteType: 'UP' },
        ],
      },
    },
  });
  
  await prisma.idea.create({
    data: {
      title: 'AI-powered ICU patient monitoring system',
      description: 'Implement real-time AI monitoring to predict adverse events in ICU patients',
      status: 'APPROVED',
      feasibilityScore: 7.5,
      impactScore: 9.5,
      labId: riccc.id,
      createdById: drMartinez.id,
      votes: {
        create: [
          { userId: drJohnson.id, voteType: 'UP' },
        ],
      },
    },
  });
  
  console.log('✅ Ideas created');
  
  console.log('🎉 Database seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
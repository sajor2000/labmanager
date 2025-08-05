import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { UserRole, MemberRole, ProjectStatus, TaskStatus, Priority, FundingSource } from '@prisma/client'

// Initialize Prisma with Accelerate
const prisma = new PrismaClient().$extends(withAccelerate())

async function main() {
  console.log('🧹 Cleaning existing data...')
  
  // Delete all existing data in proper order (respecting foreign key constraints)
  await prisma.activityLog.deleteMany()
  await prisma.taskDependency.deleteMany()
  await prisma.taskAssignee.deleteMany()
  await prisma.task.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.bucket.deleteMany()
  await prisma.labMember.deleteMany()
  await prisma.user.deleteMany()
  await prisma.lab.deleteMany()

  console.log('✅ Existing data cleaned')

  console.log('👥 Creating real lab users...')

  // Create RICCC Lab
  const ricccLab = await prisma.lab.create({
    data: {
      name: 'RICCC',
      shortName: 'RICCC',
      description: 'Rush Institute for Clinical and Comparative Effectiveness',
      isActive: true,
    }
  })

  // Create RHEDAS Lab  
  const rhedasLab = await prisma.lab.create({
    data: {
      name: 'RHEDAS',
      shortName: 'RHEDAS',
      description: 'Rush Health Equity Data Analytics & Solutions',
      isActive: true,
    }
  })

  console.log('🏢 Created labs: RICCC and RHEDAS')

  // Create Users
  const users = [
    // RICCC Members
    {
      firstName: 'Kevin',
      lastName: 'Buell',
      email: 'Kevin_Buell@rush.edu',
      role: UserRole.PRINCIPAL_INVESTIGATOR,
      labs: ['RICCC']
    },
    {
      firstName: 'Juan',
      lastName: 'Rojas',
      email: 'juan_rojas@rush.edu',
      role: UserRole.PRINCIPAL_INVESTIGATOR,
      labs: ['RICCC', 'RHEDAS'] // Shared between both labs
    },
    {
      firstName: 'Hoda',
      lastName: 'Masteri Farahani',
      email: 'Hoda_MasteriFarahani@rush.edu',
      role: UserRole.RESEARCH_MEMBER,
      labs: ['RICCC']
    },
    {
      firstName: 'Vaishvik',
      lastName: 'Chaudhari',
      email: 'Vaishvik_Chaudhari@rush.edu',
      role: UserRole.RESEARCH_MEMBER,
      labs: ['RICCC']
    },
    {
      firstName: 'Jonathan',
      lastName: 'Tsai',
      email: 'Chuan-Ching_Tsai@rush.edu',
      role: UserRole.RESEARCH_MEMBER,
      labs: ['RICCC']
    },
    {
      firstName: 'Mia',
      lastName: 'McClintic',
      email: 'Mia_R_McClintic@rush.edu',
      role: UserRole.RESEARCH_MEMBER,
      labs: ['RICCC']
    },
    {
      firstName: 'Connor',
      lastName: 'Lafeber',
      email: 'Connor_P_Lafeber@rush.edu',
      role: UserRole.RESEARCH_MEMBER,
      labs: ['RICCC']
    },
    {
      firstName: 'Dariush',
      lastName: 'Mokhlesi',
      email: 'dariushmokhlesi@gmail.com',
      role: UserRole.RESEARCH_MEMBER,
      labs: ['RICCC']
    },
    {
      firstName: 'Kian',
      lastName: 'Mokhlesi',
      email: 'kianmokhlesi@gmail.com',
      role: UserRole.RESEARCH_MEMBER,
      labs: ['RICCC']
    },
    {
      firstName: 'Elijah',
      lastName: 'John',
      email: 'Elijah_John@rush.edu',
      role: UserRole.RESEARCH_MEMBER,
      labs: ['RICCC']
    },
    // RHEDAS Members (Juan Rojas already created above)
    {
      firstName: 'Jason',
      lastName: 'Stanghelle',
      email: 'Jason_Stanghelle@rush.edu',
      role: UserRole.RESEARCH_MEMBER,
      labs: ['RHEDAS']
    },
    {
      firstName: 'Meher Sapna',
      lastName: 'Masanpally',
      email: 'MeherSapna_Masanpally@rush.edu',
      role: UserRole.RESEARCH_MEMBER,
      labs: ['RHEDAS']
    },
    {
      firstName: 'Jada',
      lastName: 'Sherrod',
      email: 'Jada_J_Sherrod@rush.edu',
      role: UserRole.RESEARCH_MEMBER,
      labs: ['RHEDAS']
    }
  ]

  const createdUsers: any[] = []

  for (const userData of users) {
    // Check if user already exists (for Juan Rojas who appears twice)
    let user = createdUsers.find(u => u.email === userData.email)
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          name: `${userData.firstName} ${userData.lastName}`,
          initials: `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`,
          email: userData.email,
          role: userData.role,
          isActive: true,
        }
      })
      createdUsers.push(user)
      console.log(`✅ Created user: ${userData.firstName} ${userData.lastName}`)
    }

    // Create lab memberships
    for (const labName of userData.labs) {
      const lab = labName === 'RICCC' ? ricccLab : rhedasLab
      
      await prisma.labMember.create({
        data: {
          userId: user.id,
          labId: lab.id,
          isAdmin: userData.role === UserRole.PRINCIPAL_INVESTIGATOR,
          isActive: true,
        }
      })
      console.log(`✅ Added ${userData.firstName} ${userData.lastName} to ${labName}`)
    }
  }

  console.log('🗂️ Creating sample project buckets...')

  // Create buckets for RICCC
  const ricccBucket1 = await prisma.bucket.create({
    data: {
      name: 'NIH Grants',
      description: 'NIH-funded research projects',
      labId: ricccLab.id,
      position: 0,
      isActive: true,
    }
  })

  const ricccBucket2 = await prisma.bucket.create({
    data: {
      name: 'Clinical Studies',
      description: 'Clinical research and patient studies',
      labId: ricccLab.id,
      position: 1,
      isActive: true,
    }
  })

  // Create buckets for RHEDAS
  const rhedasBucket1 = await prisma.bucket.create({
    data: {
      name: 'Health Equity Research',
      description: 'Research focused on health equity and disparities',
      labId: rhedasLab.id,
      position: 0,
      isActive: true,
    }
  })

  const rhedasBucket2 = await prisma.bucket.create({
    data: {
      name: 'Data Analytics Projects',
      description: 'Advanced analytics and data science projects',
      labId: rhedasLab.id,
      position: 1,
      isActive: true,
    }
  })

  console.log('📊 Creating sample projects...')

  // Find Juan Rojas and Kevin Buell for project assignments
  const juanRojas = createdUsers.find(u => u.email === 'juan_rojas@rush.edu')
  const kevinBuell = createdUsers.find(u => u.email === 'Kevin_Buell@rush.edu')
  const hodaMasteri = createdUsers.find(u => u.email === 'Hoda_MasteriFarahani@rush.edu')
  const jasonStanghelle = createdUsers.find(u => u.email === 'Jason_Stanghelle@rush.edu')

  // Create sample project for RICCC
  const ricccProject1 = await prisma.project.create({
    data: {
      name: 'COVID-19 Health Disparities Analysis',
      oraNumber: 'ORA-2024-001',
      bucketId: ricccBucket1.id,
      labId: ricccLab.id,
      status: ProjectStatus.DATA_COLLECTION,
      projectType: 'EHR Study',
      fundingSource: FundingSource.NIH,
      position: 0,
      isActive: true,
      createdById: kevinBuell?.id || createdUsers[0].id,
    }
  })

  // Create sample project for RHEDAS
  const rhedasProject1 = await prisma.project.create({
    data: {
      name: 'Social Determinants of Health Predictive Model',
      oraNumber: 'ORA-2024-002',
      bucketId: rhedasBucket1.id,
      labId: rhedasLab.id,
      status: ProjectStatus.ANALYSIS,
      projectType: 'Machine Learning',
      fundingSource: FundingSource.INTERNAL,
      position: 0,
      isActive: true,
      createdById: juanRojas?.id || createdUsers[1].id,
    }
  })

  console.log('📋 Creating sample tasks...')

  // Create sample tasks for RICCC project
  const task1 = await prisma.task.create({
    data: {
      title: 'Literature Review - COVID-19 Health Disparities',
      description: 'Comprehensive review of existing literature on COVID-19 health disparities',
      projectId: ricccProject1.id,
      status: TaskStatus.COMPLETED,
      priority: Priority.MEDIUM,
      position: 0,
      isActive: true,
      createdById: kevinBuell?.id || createdUsers[0].id,
    }
  })

  // Create task assignment for the task
  if (hodaMasteri) {
    await prisma.taskAssignee.create({
      data: {
        taskId: task1.id,
        userId: hodaMasteri.id,
        isActive: true,
      }
    })
  }

  const task2 = await prisma.task.create({
    data: {
      title: 'Data Collection Protocol Development',
      description: 'Develop standardized protocol for collecting COVID-19 patient data',
      projectId: ricccProject1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      position: 1,
      isActive: true,
      createdById: kevinBuell?.id || createdUsers[0].id,
    }
  })

  // Create task assignments
  if (hodaMasteri) {
    await prisma.taskAssignee.create({
      data: {
        taskId: task2.id,
        userId: hodaMasteri.id,
        isActive: true,
      }
    })
  }
  if (kevinBuell) {
    await prisma.taskAssignee.create({
      data: {
        taskId: task2.id,
        userId: kevinBuell.id,
        isActive: true,
      }
    })
  }

  // Create sample tasks for RHEDAS project
  const task3 = await prisma.task.create({
    data: {
      title: 'Feature Engineering - Social Determinants',
      description: 'Engineer features from social determinants data for ML model',
      projectId: rhedasProject1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      position: 0,
      isActive: true,
      createdById: juanRojas?.id || createdUsers[1].id,
    }
  })

  if (jasonStanghelle) {
    await prisma.taskAssignee.create({
      data: {
        taskId: task3.id,
        userId: jasonStanghelle.id,
        isActive: true,
      }
    })
  }

  const task4 = await prisma.task.create({
    data: {
      title: 'Model Training and Validation',
      description: 'Train predictive models and perform cross-validation',
      projectId: rhedasProject1.id,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      position: 1,
      isActive: true,
      createdById: juanRojas?.id || createdUsers[1].id,
    }
  })

  if (jasonStanghelle) {
    await prisma.taskAssignee.create({
      data: {
        taskId: task4.id,
        userId: jasonStanghelle.id,
        isActive: true,
      }
    })
  }
  if (juanRojas) {
    await prisma.taskAssignee.create({
      data: {
        taskId: task4.id,
        userId: juanRojas.id,
        isActive: true,
      }
    })
  }

  console.log('📈 Database seeded successfully!')
  console.log(`✅ Created ${createdUsers.length} real lab users`)
  console.log(`✅ RICCC Lab: ${users.filter(u => u.labs.includes('RICCC')).length} members`)
  console.log(`✅ RHEDAS Lab: ${users.filter(u => u.labs.includes('RHEDAS')).length} members`)
  console.log(`✅ Juan Rojas is configured in both labs as requested`)
  console.log(`✅ Created 4 project buckets and 2 sample projects`)
  console.log(`✅ Created 4 sample tasks across both labs`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
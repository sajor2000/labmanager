import { PrismaClient, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Enhanced team roster with all professional information
const teamRoster = [
  {
    firstName: 'J.C.',
    lastName: 'Rojas',
    email: 'Juan_rojas@rush.edu',
    initials: 'JCR',
    role: UserRole.PRINCIPAL_INVESTIGATOR,
    title: 'Associate Professor of Medicine',
    department: 'Internal Medicine - Critical Care',
    capacity: new Decimal(40.00),
    expertise: ['Critical Care', 'Clinical Research', 'Grant Writing', 'Health Equity'],
    skills: ['REDCap', 'Grant Writing', 'Clinical Trials'],
    labs: ['RICCC', 'RHEDAS'],
    isExternal: false
  },
  {
    firstName: 'Kevin',
    lastName: 'Buell',
    email: 'Kevin_Buell@rush.edu',
    initials: 'KB',
    role: UserRole.PRINCIPAL_INVESTIGATOR,
    title: 'Assistant Professor of Medicine',
    department: 'Internal Medicine - Critical Care',
    capacity: new Decimal(40.00),
    expertise: ['Critical Care', 'Medical Education', 'Clinical Research'],
    skills: ['Clinical Trials', 'Medical Education'],
    labs: ['RICCC'],
    isExternal: false
  },
  {
    firstName: 'Mia',
    middleName: 'R',
    lastName: 'Mcclintic',
    email: 'Mia_R_McClintic@rush.edu',
    initials: 'MRM',
    role: UserRole.REGULATORY_COORDINATOR,
    title: 'Regulatory Affairs Coordinator',
    department: 'Internal Medicine',
    capacity: new Decimal(40.00),
    expertise: ['IRB Submissions', 'Regulatory Compliance', 'Documentation', 'FDA Regulations'],
    skills: ['IRB Systems', 'Regulatory Documentation', 'Compliance Monitoring'],
    labs: ['RICCC'],
    isExternal: false
  },
  {
    firstName: 'Jason',
    lastName: 'Stanghelle',
    email: 'Jason_Stanghelle@rush.edu',
    initials: 'JS',
    role: UserRole.DATA_ANALYST,
    title: 'Data Analyst II',
    department: 'Data Analytics',
    capacity: new Decimal(40.00),
    expertise: ['Statistical Analysis', 'Data Visualization', 'Health Equity Research'],
    skills: ['R', 'Python', 'SAS', 'REDCap', 'Tableau'],
    labs: ['RHEDAS'],
    isExternal: false
  },
  {
    firstName: 'Jada',
    middleName: 'J',
    lastName: 'Sherrod',
    email: 'Jada_J_Sherrod@rush.edu',
    initials: 'JJS',
    role: UserRole.STAFF_COORDINATOR,
    title: 'Research Coordinator',
    department: 'Internal Medicine',
    capacity: new Decimal(40.00),
    expertise: ['Project Management', 'Team Coordination', 'Study Operations'],
    skills: ['Project Management', 'REDCap', 'Microsoft Office'],
    labs: ['RHEDAS'],
    isExternal: false
  },
  {
    firstName: 'Meher Sapna',
    lastName: 'Masanpally',
    email: 'MeherSapna_Masanpally@rush.edu',
    initials: 'MSM',
    role: UserRole.DATA_ANALYST,
    title: 'Senior Data Analyst',
    department: 'Data Analytics',
    capacity: new Decimal(40.00),
    expertise: ['Data Analysis', 'Machine Learning', 'Predictive Modeling'],
    skills: ['Python', 'SQL', 'Tableau', 'Power BI', 'Machine Learning'],
    labs: ['RHEDAS'],
    isExternal: false
  },
  {
    firstName: 'Kian',
    lastName: 'Mokhlesi',
    email: 'kianmokhlesi@gmail.com',
    initials: 'KM',
    role: UserRole.MEDICAL_STUDENT,
    title: 'Medical Student',
    department: 'Rush Medical College',
    capacity: new Decimal(20.00), // Part-time
    expertise: ['Clinical Research', 'Data Collection'],
    skills: ['Data Collection', 'Literature Review'],
    labs: ['RICCC'],
    isExternal: true // Using personal email
  },
  {
    firstName: 'Dariush',
    lastName: 'Mokhlesi',
    email: 'dariushmokhlesi@gmail.com',
    initials: 'DM',
    role: UserRole.MEDICAL_STUDENT,
    title: 'Medical Student',
    department: 'Rush Medical College',
    capacity: new Decimal(20.00), // Part-time
    expertise: ['Clinical Research', 'Literature Review'],
    skills: ['Literature Review', 'Data Entry'],
    labs: ['RICCC'],
    isExternal: true
  },
  {
    firstName: 'Connor',
    middleName: 'P',
    lastName: 'Lafeber',
    email: 'Connor_P_Lafeber@rush.edu',
    initials: 'CPL',
    role: UserRole.FELLOW,
    title: 'Critical Care Fellow',
    department: 'Internal Medicine - Critical Care',
    capacity: new Decimal(50.00), // Fellows often work more
    expertise: ['Critical Care', 'Clinical Trials', 'Medical Writing'],
    skills: ['Clinical Research', 'Medical Writing', 'Statistical Analysis'],
    labs: ['RICCC'],
    isExternal: false
  },
  {
    firstName: 'Vaishvik',
    lastName: 'Chaudhari',
    email: 'Vaishvik_Chaudhari@rush.edu',
    initials: 'VC',
    role: UserRole.DATA_SCIENTIST,
    title: 'Data Scientist',
    department: 'Data Science',
    capacity: new Decimal(40.00),
    expertise: ['Machine Learning', 'AI/LLM', 'Predictive Modeling', 'Deep Learning'],
    skills: ['Python', 'TensorFlow', 'PyTorch', 'SQL', 'AWS', 'Docker'],
    labs: ['RICCC'],
    isExternal: false
  },
  {
    firstName: 'Hoda',
    lastName: 'Masteri',
    email: 'Hoda_MasteriFarahani@rush.edu',
    initials: 'HM',
    role: UserRole.DATA_ANALYST,
    title: 'Clinical Data Analyst',
    department: 'Clinical Analytics',
    capacity: new Decimal(40.00),
    expertise: ['EHR Data', 'Clinical Analytics', 'REDCap', 'Healthcare Data'],
    skills: ['SQL', 'R', 'REDCap', 'Epic Clarity', 'SAS'],
    labs: ['RICCC'],
    isExternal: false
  }
];

// Helper function to generate consistent avatar colors
function generateAvatarColor(initials: string): string {
  const colors = [
    '#8B5CF6', // Purple
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316'  // Orange
  ];
  
  // Generate consistent color based on initials
  const hash = initials.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return colors[hash % colors.length];
}

// Get role-based permissions
function getRolePermissions(role: UserRole) {
  const permissions = {
    [UserRole.PRINCIPAL_INVESTIGATOR]: {
      isAdmin: true,
      canCreateProjects: true,
      canAssignTasks: true,
      canViewAllProjects: true,
      canEditAllProjects: true,
      canManageMembers: true,
      canApproveIdeas: true,
      canAccessReports: true
    },
    [UserRole.CO_PRINCIPAL_INVESTIGATOR]: {
      isAdmin: true,
      canCreateProjects: true,
      canAssignTasks: true,
      canViewAllProjects: true,
      canEditAllProjects: true,
      canManageMembers: true,
      canApproveIdeas: true,
      canAccessReports: true
    },
    [UserRole.DATA_SCIENTIST]: {
      isAdmin: false,
      canCreateProjects: true,
      canAssignTasks: true,
      canViewAllProjects: true,
      canEditAllProjects: false,
      canManageMembers: false,
      canApproveIdeas: false,
      canAccessReports: true
    },
    [UserRole.DATA_ANALYST]: {
      isAdmin: false,
      canCreateProjects: false,
      canAssignTasks: true,
      canViewAllProjects: true,
      canEditAllProjects: false,
      canManageMembers: false,
      canApproveIdeas: false,
      canAccessReports: true
    },
    [UserRole.CLINICAL_RESEARCH_COORDINATOR]: {
      isAdmin: false,
      canCreateProjects: true,
      canAssignTasks: true,
      canViewAllProjects: true,
      canEditAllProjects: true,
      canManageMembers: false,
      canApproveIdeas: false,
      canAccessReports: true
    },
    [UserRole.REGULATORY_COORDINATOR]: {
      isAdmin: false,
      canCreateProjects: false,
      canAssignTasks: false,
      canViewAllProjects: true,
      canEditAllProjects: false,
      canManageMembers: false,
      canApproveIdeas: true,
      canAccessReports: true
    },
    [UserRole.STAFF_COORDINATOR]: {
      isAdmin: false,
      canCreateProjects: true,
      canAssignTasks: true,
      canViewAllProjects: true,
      canEditAllProjects: false,
      canManageMembers: true,
      canApproveIdeas: false,
      canAccessReports: false
    },
    [UserRole.LAB_ADMINISTRATOR]: {
      isAdmin: true,
      canCreateProjects: true,
      canAssignTasks: true,
      canViewAllProjects: true,
      canEditAllProjects: true,
      canManageMembers: true,
      canApproveIdeas: false,
      canAccessReports: true
    },
    [UserRole.FELLOW]: {
      isAdmin: false,
      canCreateProjects: true,
      canAssignTasks: true,
      canViewAllProjects: false,
      canEditAllProjects: false,
      canManageMembers: false,
      canApproveIdeas: false,
      canAccessReports: false
    },
    [UserRole.MEDICAL_STUDENT]: {
      isAdmin: false,
      canCreateProjects: false,
      canAssignTasks: false,
      canViewAllProjects: false,
      canEditAllProjects: false,
      canManageMembers: false,
      canApproveIdeas: false,
      canAccessReports: false
    },
    [UserRole.RESEARCH_ASSISTANT]: {
      isAdmin: false,
      canCreateProjects: false,
      canAssignTasks: false,
      canViewAllProjects: false,
      canEditAllProjects: false,
      canManageMembers: false,
      canApproveIdeas: false,
      canAccessReports: false
    },
    [UserRole.VOLUNTEER_RESEARCH_ASSISTANT]: {
      isAdmin: false,
      canCreateProjects: false,
      canAssignTasks: false,
      canViewAllProjects: false,
      canEditAllProjects: false,
      canManageMembers: false,
      canApproveIdeas: false,
      canAccessReports: false
    },
    [UserRole.EXTERNAL_COLLABORATOR]: {
      isAdmin: false,
      canCreateProjects: false,
      canAssignTasks: false,
      canViewAllProjects: false,
      canEditAllProjects: false,
      canManageMembers: false,
      canApproveIdeas: false,
      canAccessReports: false
    }
  };

  return permissions[role] || permissions[UserRole.VOLUNTEER_RESEARCH_ASSISTANT];
}

// Create role permissions
async function createRolePermissions() {
  const permissions = [
    // PI permissions
    { role: UserRole.PRINCIPAL_INVESTIGATOR, permission: 'manage_lab_settings' },
    { role: UserRole.PRINCIPAL_INVESTIGATOR, permission: 'approve_budget' },
    { role: UserRole.PRINCIPAL_INVESTIGATOR, permission: 'sign_contracts' },
    { role: UserRole.PRINCIPAL_INVESTIGATOR, permission: 'approve_publications' },
    
    // Co-PI permissions
    { role: UserRole.CO_PRINCIPAL_INVESTIGATOR, permission: 'manage_lab_settings' },
    { role: UserRole.CO_PRINCIPAL_INVESTIGATOR, permission: 'approve_budget' },
    { role: UserRole.CO_PRINCIPAL_INVESTIGATOR, permission: 'approve_publications' },
    
    // Data Scientist permissions
    { role: UserRole.DATA_SCIENTIST, permission: 'access_compute_resources' },
    { role: UserRole.DATA_SCIENTIST, permission: 'create_ml_models' },
    { role: UserRole.DATA_SCIENTIST, permission: 'access_raw_data' },
    
    // Data Analyst permissions
    { role: UserRole.DATA_ANALYST, permission: 'access_data' },
    { role: UserRole.DATA_ANALYST, permission: 'create_reports' },
    
    // Regulatory Coordinator permissions
    { role: UserRole.REGULATORY_COORDINATOR, permission: 'submit_irb' },
    { role: UserRole.REGULATORY_COORDINATOR, permission: 'manage_compliance' },
    { role: UserRole.REGULATORY_COORDINATOR, permission: 'approve_consent_forms' },
    
    // CRC permissions
    { role: UserRole.CLINICAL_RESEARCH_COORDINATOR, permission: 'manage_participants' },
    { role: UserRole.CLINICAL_RESEARCH_COORDINATOR, permission: 'collect_clinical_data' },
    { role: UserRole.CLINICAL_RESEARCH_COORDINATOR, permission: 'schedule_visits' },
    
    // Fellow permissions
    { role: UserRole.FELLOW, permission: 'lead_sub_studies' },
    { role: UserRole.FELLOW, permission: 'mentor_students' },
    { role: UserRole.FELLOW, permission: 'submit_abstracts' },
    
    // Lab Administrator permissions
    { role: UserRole.LAB_ADMINISTRATOR, permission: 'manage_all_settings' },
    { role: UserRole.LAB_ADMINISTRATOR, permission: 'manage_user_access' },
    { role: UserRole.LAB_ADMINISTRATOR, permission: 'view_audit_logs' }
  ];

  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_permission_labId: {
          role: perm.role,
          permission: perm.permission,
          labId: null
        }
      },
      update: {},
      create: perm
    });
  }
  
  console.log('✅ Role permissions created');
}

async function seedTeam() {
  console.log('🌱 Starting enhanced team roster seeding...');
  
  try {
    // First ensure labs exist with enhanced data
    const labs = await Promise.all([
      prisma.lab.upsert({
        where: { shortName: 'RICCC' },
        update: {},
        create: {
          name: 'RICCC',
          fullName: 'Rush Institute for Critical Care & Community Health Research',
          shortName: 'RICCC',
          description: 'Advancing critical care through innovative research and collaboration focused on health equity and community outcomes',
          department: 'Internal Medicine - Critical Care',
          building: 'Professional Building',
          room: 'Suite 1020',
          color: '#2C5234', // Rush green
          primaryColor: '#8B5CF6',
          icon: 'flask',
          features: ['projects', 'tasks', 'ideas', 'standups', 'analytics', 'reports'],
          settings: {
            defaultTaskDuration: 7,
            requireIRBApproval: true,
            autoArchiveAfterDays: 365
          },
          isActive: true
        }
      }),
      prisma.lab.upsert({
        where: { shortName: 'RHEDAS' },
        update: {},
        create: {
          name: 'RHEDAS',
          fullName: 'Rush Health Equity Data Analytics & Science Lab',
          shortName: 'RHEDAS',
          description: 'Data science and analytics for health equity research, focusing on disparities and social determinants of health',
          department: 'Internal Medicine',
          building: 'Professional Building',
          room: 'Suite 1025',
          color: '#1A5F7A', // Rush blue
          primaryColor: '#10B981',
          icon: 'chart-bar',
          features: ['projects', 'tasks', 'analytics', 'reports', 'data-pipeline'],
          settings: {
            defaultTaskDuration: 14,
            requireDataGovernance: true,
            autoArchiveAfterDays: 730
          },
          isActive: true
        }
      })
    ]);
    
    console.log('✅ Enhanced labs created/verified');
    
    // Create users with enhanced data and lab memberships
    for (const member of teamRoster) {
      const { labs: memberLabs, middleName, ...userData } = member;
      
      // Create or update user with enhanced fields
      const user = await prisma.user.upsert({
        where: { email: member.email.toLowerCase() },
        update: {
          ...userData,
          name: `${member.firstName}${middleName ? ' ' + middleName : ''} ${member.lastName}`,
          middleName,
          avatar: generateAvatarColor(member.initials)
        },
        create: {
          ...userData,
          email: member.email.toLowerCase(),
          name: `${member.firstName}${middleName ? ' ' + middleName : ''} ${member.lastName}`,
          middleName,
          avatar: generateAvatarColor(member.initials),
          isActive: true
        }
      });
      
      console.log(`✅ Enhanced user created/updated: ${user.name} (${member.role})`);
      
      // Create lab memberships with granular permissions
      for (const labShortName of memberLabs) {
        const lab = labs.find(l => l.shortName === labShortName);
        if (!lab) continue;
        
        const permissions = getRolePermissions(member.role);
        
        // Check if membership already exists
        const existingMembership = await prisma.labMember.findFirst({
          where: {
            userId: user.id,
            labId: lab.id
          }
        });
        
        if (existingMembership) {
          // Update existing membership with new permissions
          await prisma.labMember.update({
            where: { id: existingMembership.id },
            data: permissions
          });
          console.log(`  ↳ Updated permissions in ${labShortName}`);
        } else {
          // Create new membership with permissions
          await prisma.labMember.create({
            data: {
              userId: user.id,
              labId: lab.id,
              ...permissions,
              isActive: true,
              joinedAt: new Date()
            }
          });
          console.log(`  ↳ Added to ${labShortName} with role-based permissions`);
        }
      }
    }
    
    // Create role-based permissions
    await createRolePermissions();
    
    // Create sample buckets for organization
    const ricccLab = labs.find(l => l.shortName === 'RICCC');
    const rhedasLab = labs.find(l => l.shortName === 'RHEDAS');
    
    if (ricccLab) {
      const ricccBuckets = [
        { 
          name: 'Abbott Foundation', 
          color: '#00BCD4', 
          description: 'Abbott Foundation funded studies for critical care innovation',
          icon: 'briefcase'
        },
        { 
          name: 'NIH R01', 
          color: '#4CAF50', 
          description: 'NIH R01 grant funded projects for health equity research',
          icon: 'award'
        },
        { 
          name: 'Pilot Studies', 
          color: '#FF9800', 
          description: 'Pilot and feasibility studies for future grant applications',
          icon: 'rocket'
        },
        { 
          name: 'Industry Sponsored', 
          color: '#9C27B0', 
          description: 'Industry sponsored clinical trials and research',
          icon: 'building'
        }
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
            isActive: true
          }
        });
      }
      console.log('✅ RICCC buckets created with descriptions');
    }
    
    if (rhedasLab) {
      const rhedasBuckets = [
        { 
          name: 'Health Equity Analytics', 
          color: '#2196F3', 
          description: 'Advanced analytics for health disparities research',
          icon: 'chart-line'
        },
        { 
          name: 'Community Health', 
          color: '#FF5722', 
          description: 'Community-based participatory research projects',
          icon: 'users'
        },
        { 
          name: 'COVID-19 Research', 
          color: '#795548', 
          description: 'COVID-19 health equity and outcomes studies',
          icon: 'virus'
        },
        { 
          name: 'Quality Improvement', 
          color: '#607D8B', 
          description: 'QI and process improvement projects for health systems',
          icon: 'trending-up'
        }
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
            isActive: true
          }
        });
      }
      console.log('✅ RHEDAS buckets created with descriptions');
    }
    
    console.log('\n🎉 Enhanced team roster seeding completed successfully!');
    
    // Display summary
    const userCount = await prisma.user.count();
    const labMemberCount = await prisma.labMember.count();
    const bucketCount = await prisma.bucket.count();
    const rolePermissionCount = await prisma.rolePermission.count();
    
    console.log('\n📊 Database Summary:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Lab Memberships: ${labMemberCount}`);
    console.log(`   - Buckets: ${bucketCount}`);
    console.log(`   - Role Permissions: ${rolePermissionCount}`);
    
  } catch (error) {
    console.error('❌ Error seeding enhanced team roster:', error);
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
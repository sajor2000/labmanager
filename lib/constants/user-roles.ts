import { UserRole } from '@prisma/client';

export interface RoleDefinition {
  value: UserRole;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  permissions: {
    canCreateProjects: boolean;
    canEditProjects: boolean;
    canDeleteProjects: boolean;
    canManageTeam: boolean;
    canViewAnalytics: boolean;
    canAccessAllLabs: boolean;
    canApproveStudies: boolean;
  };
}

export const USER_ROLES: Record<UserRole, RoleDefinition> = {
  PRINCIPAL_INVESTIGATOR: {
    value: UserRole.PRINCIPAL_INVESTIGATOR,
    label: 'Principal Investigator',
    shortLabel: 'PI',
    description: 'Leads research projects and oversees the lab',
    color: '#10B981', // Green
    permissions: {
      canCreateProjects: true,
      canEditProjects: true,
      canDeleteProjects: true,
      canManageTeam: true,
      canViewAnalytics: true,
      canAccessAllLabs: true,
      canApproveStudies: true,
    },
  },
  CO_PRINCIPAL_INVESTIGATOR: {
    value: UserRole.CO_PRINCIPAL_INVESTIGATOR,
    label: 'Co-Principal Investigator',
    shortLabel: 'Co-PI',
    description: 'Co-leads research projects with the PI',
    color: '#059669', // Emerald
    permissions: {
      canCreateProjects: true,
      canEditProjects: true,
      canDeleteProjects: true,
      canManageTeam: true,
      canViewAnalytics: true,
      canAccessAllLabs: false,
      canApproveStudies: true,
    },
  },
  DATA_SCIENTIST: {
    value: UserRole.DATA_SCIENTIST,
    label: 'Data Scientist',
    shortLabel: 'DS',
    description: 'Analyzes complex data and develops models',
    color: '#6366F1', // Indigo
    permissions: {
      canCreateProjects: true,
      canEditProjects: true,
      canDeleteProjects: false,
      canManageTeam: false,
      canViewAnalytics: true,
      canAccessAllLabs: false,
      canApproveStudies: false,
    },
  },
  DATA_ANALYST: {
    value: UserRole.DATA_ANALYST,
    label: 'Data Analyst',
    shortLabel: 'DA',
    description: 'Processes and analyzes research data',
    color: '#3B82F6', // Blue
    permissions: {
      canCreateProjects: false,
      canEditProjects: true,
      canDeleteProjects: false,
      canManageTeam: false,
      canViewAnalytics: true,
      canAccessAllLabs: false,
      canApproveStudies: false,
    },
  },
  CLINICAL_RESEARCH_COORDINATOR: {
    value: UserRole.CLINICAL_RESEARCH_COORDINATOR,
    label: 'Clinical Research Coordinator',
    shortLabel: 'CRC',
    description: 'Coordinates clinical research activities',
    color: '#8B5CF6', // Purple
    permissions: {
      canCreateProjects: true,
      canEditProjects: true,
      canDeleteProjects: false,
      canManageTeam: false,
      canViewAnalytics: true,
      canAccessAllLabs: false,
      canApproveStudies: false,
    },
  },
  REGULATORY_COORDINATOR: {
    value: UserRole.REGULATORY_COORDINATOR,
    label: 'Regulatory Coordinator',
    shortLabel: 'RC',
    description: 'Manages regulatory compliance and IRB submissions',
    color: '#F59E0B', // Amber
    permissions: {
      canCreateProjects: false,
      canEditProjects: true,
      canDeleteProjects: false,
      canManageTeam: false,
      canViewAnalytics: false,
      canAccessAllLabs: false,
      canApproveStudies: false,
    },
  },
  STAFF_COORDINATOR: {
    value: UserRole.STAFF_COORDINATOR,
    label: 'Staff Coordinator',
    shortLabel: 'SC',
    description: 'Coordinates lab staff and operations',
    color: '#EC4899', // Pink
    permissions: {
      canCreateProjects: false,
      canEditProjects: true,
      canDeleteProjects: false,
      canManageTeam: true,
      canViewAnalytics: true,
      canAccessAllLabs: false,
      canApproveStudies: false,
    },
  },
  FELLOW: {
    value: UserRole.FELLOW,
    label: 'Fellow',
    shortLabel: 'Fellow',
    description: 'Post-doctoral research fellow',
    color: '#14B8A6', // Teal
    permissions: {
      canCreateProjects: true,
      canEditProjects: true,
      canDeleteProjects: false,
      canManageTeam: false,
      canViewAnalytics: true,
      canAccessAllLabs: false,
      canApproveStudies: false,
    },
  },
  MEDICAL_STUDENT: {
    value: UserRole.MEDICAL_STUDENT,
    label: 'Medical Student',
    shortLabel: 'MS',
    description: 'Medical student participating in research',
    color: '#06B6D4', // Cyan
    permissions: {
      canCreateProjects: false,
      canEditProjects: false,
      canDeleteProjects: false,
      canManageTeam: false,
      canViewAnalytics: false,
      canAccessAllLabs: false,
      canApproveStudies: false,
    },
  },
  VOLUNTEER_RESEARCH_ASSISTANT: {
    value: UserRole.VOLUNTEER_RESEARCH_ASSISTANT,
    label: 'Volunteer Research Assistant',
    shortLabel: 'VRA',
    description: 'Volunteer supporting research activities',
    color: '#78716C', // Stone
    permissions: {
      canCreateProjects: false,
      canEditProjects: false,
      canDeleteProjects: false,
      canManageTeam: false,
      canViewAnalytics: false,
      canAccessAllLabs: false,
      canApproveStudies: false,
    },
  },
  RESEARCH_ASSISTANT: {
    value: UserRole.RESEARCH_ASSISTANT,
    label: 'Research Assistant',
    shortLabel: 'RA',
    description: 'Assists with research activities and data collection',
    color: '#64748B', // Slate
    permissions: {
      canCreateProjects: false,
      canEditProjects: true,
      canDeleteProjects: false,
      canManageTeam: false,
      canViewAnalytics: false,
      canAccessAllLabs: false,
      canApproveStudies: false,
    },
  },
  LAB_ADMINISTRATOR: {
    value: UserRole.LAB_ADMINISTRATOR,
    label: 'Lab Administrator',
    shortLabel: 'Admin',
    description: 'Manages lab operations and administration',
    color: '#EF4444', // Red
    permissions: {
      canCreateProjects: true,
      canEditProjects: true,
      canDeleteProjects: true,
      canManageTeam: true,
      canViewAnalytics: true,
      canAccessAllLabs: true,
      canApproveStudies: false,
    },
  },
  EXTERNAL_COLLABORATOR: {
    value: UserRole.EXTERNAL_COLLABORATOR,
    label: 'External Collaborator',
    shortLabel: 'Ext',
    description: 'External partner or collaborator',
    color: '#9CA3AF', // Gray
    permissions: {
      canCreateProjects: false,
      canEditProjects: false,
      canDeleteProjects: false,
      canManageTeam: false,
      canViewAnalytics: false,
      canAccessAllLabs: false,
      canApproveStudies: false,
    },
  },
};

// Helper functions
export const getRoleLabel = (role: UserRole): string => {
  return USER_ROLES[role]?.label || role;
};

export const getRoleShortLabel = (role: UserRole): string => {
  return USER_ROLES[role]?.shortLabel || role.substring(0, 3);
};

export const getRoleColor = (role: UserRole): string => {
  return USER_ROLES[role]?.color || '#6B7280';
};

export const getRolePermissions = (role: UserRole) => {
  return USER_ROLES[role]?.permissions || {
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canManageTeam: false,
    canViewAnalytics: false,
    canAccessAllLabs: false,
    canApproveStudies: false,
  };
};

// Role groupings for UI organization
export const ROLE_GROUPS = {
  LEADERSHIP: [
    UserRole.PRINCIPAL_INVESTIGATOR,
    UserRole.CO_PRINCIPAL_INVESTIGATOR,
  ],
  DATA_TEAM: [
    UserRole.DATA_SCIENTIST,
    UserRole.DATA_ANALYST,
  ],
  COORDINATION: [
    UserRole.CLINICAL_RESEARCH_COORDINATOR,
    UserRole.REGULATORY_COORDINATOR,
    UserRole.STAFF_COORDINATOR,
  ],
  RESEARCHERS: [
    UserRole.FELLOW,
    UserRole.MEDICAL_STUDENT,
    UserRole.RESEARCH_ASSISTANT,
    UserRole.VOLUNTEER_RESEARCH_ASSISTANT,
  ],
  ADMINISTRATION: [
    UserRole.LAB_ADMINISTRATOR,
  ],
  EXTERNAL: [
    UserRole.EXTERNAL_COLLABORATOR,
  ],
};

// For dropdown menus
export const ROLE_OPTIONS = Object.values(USER_ROLES).map(role => ({
  value: role.value,
  label: role.label,
  description: role.description,
  color: role.color,
}));

// Sorted roles by hierarchy
export const ROLES_BY_HIERARCHY = [
  UserRole.PRINCIPAL_INVESTIGATOR,
  UserRole.CO_PRINCIPAL_INVESTIGATOR,
  UserRole.LAB_ADMINISTRATOR,
  UserRole.DATA_SCIENTIST,
  UserRole.CLINICAL_RESEARCH_COORDINATOR,
  UserRole.FELLOW,
  UserRole.DATA_ANALYST,
  UserRole.REGULATORY_COORDINATOR,
  UserRole.STAFF_COORDINATOR,
  UserRole.RESEARCH_ASSISTANT,
  UserRole.MEDICAL_STUDENT,
  UserRole.VOLUNTEER_RESEARCH_ASSISTANT,
  UserRole.EXTERNAL_COLLABORATOR,
];
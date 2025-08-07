export const ROLE_LABELS = {
  PRINCIPAL_INVESTIGATOR: 'Principal Investigator',
  CO_PRINCIPAL_INVESTIGATOR: 'Co-Principal Investigator',
  RESEARCH_MEMBER: 'Research Member',
  LAB_ADMINISTRATOR: 'Lab Administrator',
  EXTERNAL_COLLABORATOR: 'External Collaborator',
  GUEST: 'Guest',
} as const;

export const ROLE_COLORS = {
  PRINCIPAL_INVESTIGATOR: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  CO_PRINCIPAL_INVESTIGATOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  RESEARCH_MEMBER: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  LAB_ADMINISTRATOR: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  EXTERNAL_COLLABORATOR: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  GUEST: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
} as const;
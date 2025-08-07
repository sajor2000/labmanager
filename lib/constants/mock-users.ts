import type { SelectedUser } from '@/lib/contexts/user-context';

export const MOCK_USERS: SelectedUser[] = [
  {
    id: '1',
    name: 'Dr. Sarah Chen',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@healthequity.edu',
    role: 'PI',
    initials: 'SC',
    avatar: '#6366F1',
    avatarUrl: null,
    labs: [
      { id: '1', name: 'Health Equity Labs', shortName: 'HEL' }
    ]
  },
  {
    id: '2',
    name: 'Dr. Michael Rodriguez',
    firstName: 'Michael',
    lastName: 'Rodriguez',
    email: 'michael.rodriguez@healthequity.edu',
    role: 'CO_PI',
    initials: 'MR',
    avatar: '#10B981',
    avatarUrl: null,
    labs: [
      { id: '1', name: 'Health Equity Labs', shortName: 'HEL' },
      { id: '2', name: 'Clinical Research Unit', shortName: 'CRU' }
    ]
  },
  {
    id: '3',
    name: 'Emily Johnson',
    firstName: 'Emily',
    lastName: 'Johnson',
    email: 'emily.johnson@healthequity.edu',
    role: 'RESEARCH_MEMBER',
    initials: 'EJ',
    avatar: '#F59E0B',
    avatarUrl: null,
    labs: [
      { id: '1', name: 'Health Equity Labs', shortName: 'HEL' }
    ]
  },
  {
    id: '4',
    name: 'James Wilson',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james.wilson@healthequity.edu',
    role: 'ADMIN',
    initials: 'JW',
    avatar: '#EF4444',
    avatarUrl: null,
    labs: [
      { id: '1', name: 'Health Equity Labs', shortName: 'HEL' },
      { id: '2', name: 'Clinical Research Unit', shortName: 'CRU' },
      { id: '3', name: 'Biostatistics Core', shortName: 'BSC' }
    ]
  },
  {
    id: '5',
    name: 'Dr. Lisa Park',
    firstName: 'Lisa',
    lastName: 'Park',
    email: 'lisa.park@healthequity.edu',
    role: 'CO_PI',
    initials: 'LP',
    avatar: '#8B5CF6',
    avatarUrl: null,
    labs: [
      { id: '2', name: 'Clinical Research Unit', shortName: 'CRU' }
    ]
  },
  {
    id: '6',
    name: 'David Kim',
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.kim@healthequity.edu',
    role: 'RESEARCH_MEMBER',
    initials: 'DK',
    avatar: '#06B6D4',
    avatarUrl: null,
    labs: [
      { id: '1', name: 'Health Equity Labs', shortName: 'HEL' }
    ]
  },
  {
    id: '7',
    name: 'Dr. Robert Thompson',
    firstName: 'Robert',
    lastName: 'Thompson',
    email: 'robert.thompson@external.org',
    role: 'GUEST',
    initials: 'RT',
    avatar: '#6B7280',
    avatarUrl: null,
    labs: []
  }
];
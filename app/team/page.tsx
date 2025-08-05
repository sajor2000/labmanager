'use client';

import { useState, useEffect } from 'react';
import { TeamHeader } from '@/components/team/team-header';
import { TeamMemberCard } from '@/components/team/team-member-card';
import { TeamWorkloadView } from '@/components/team/team-workload-view';
import { showToast } from '@/components/ui/toast';
import type { User as PrismaUser } from '@prisma/client';

// Extended user type for team page
type TeamMember = PrismaUser & {
  labIds?: string[]; // Optional for compatibility with components
};

// Mock data - will be replaced with actual API calls
const mockMembers: Array<TeamMember & {
  taskCount: number;
  completedTasks: number;
  activeProjects: number;
  workload: number;
  upcomingDeadlines: number;
}> = [
  {
    id: '1',
    email: 'pi@lab.edu',
    name: 'Dr. Sarah Johnson',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'PRINCIPAL_INVESTIGATOR',
    avatar: 'bg-purple-500',
    avatarUrl: null,
    avatarImage: null,
    initials: 'SJ',
    capacity: 40,
    expertise: ['Clinical Research', 'Health Equity', 'Data Science', 'NIH Grants'],
    isActive: true,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskCount: 12,
    completedTasks: 45,
    activeProjects: 5,
    workload: 75,
    upcomingDeadlines: 3,
  },
  {
    id: '2',
    email: 'postdoc@lab.edu',
    name: 'Dr. Michael Chen',
    firstName: 'Michael',
    lastName: 'Chen',
    role: 'RESEARCH_MEMBER',
    avatar: 'bg-blue-500',
    avatarUrl: null,
    avatarImage: null,
    initials: 'MC',
    capacity: 40,
    expertise: ['Statistical Analysis', 'R Programming', 'Machine Learning'],
    isActive: true,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskCount: 8,
    completedTasks: 32,
    activeProjects: 3,
    workload: 60,
    upcomingDeadlines: 2,
  },
  {
    id: '3',
    email: 'gradstudent@lab.edu',
    name: 'Emily Rodriguez',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    role: 'RESEARCH_MEMBER',
    avatar: 'bg-green-500',
    avatarUrl: null,
    avatarImage: null,
    initials: 'ER',
    capacity: 20,
    expertise: ['Literature Review', 'Qualitative Research', 'SPSS'],
    isActive: true,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskCount: 15,
    completedTasks: 28,
    activeProjects: 4,
    workload: 85,
    upcomingDeadlines: 5,
  },
  {
    id: '4',
    email: 'admin@lab.edu',
    name: 'Jennifer Park',
    firstName: 'Jennifer',
    lastName: 'Park',
    role: 'LAB_ADMINISTRATOR',
    avatar: 'bg-orange-500',
    avatarUrl: null,
    avatarImage: null,
    initials: 'JP',
    capacity: 40,
    expertise: ['Project Management', 'Budget Management', 'IRB Coordination'],
    isActive: true,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskCount: 6,
    completedTasks: 52,
    activeProjects: 8,
    workload: 45,
    upcomingDeadlines: 1,
  },
  {
    id: '5',
    email: 'collaborator@external.edu',
    name: 'Dr. Robert Williams',
    firstName: 'Robert',
    lastName: 'Williams',
    role: 'EXTERNAL_COLLABORATOR',
    avatar: 'bg-gray-500',
    avatarUrl: null,
    avatarImage: null,
    initials: 'RW',
    capacity: 10,
    expertise: ['Epidemiology', 'Public Health', 'Grant Writing'],
    isActive: true,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskCount: 3,
    completedTasks: 12,
    activeProjects: 2,
    workload: 30,
    upcomingDeadlines: 0,
  },
  {
    id: '6',
    email: 'ra@lab.edu',
    name: 'Alex Thompson',
    firstName: 'Alex',
    lastName: 'Thompson',
    role: 'RESEARCH_MEMBER',
    avatar: 'bg-indigo-500',
    avatarUrl: null,
    avatarImage: null,
    initials: 'AT',
    capacity: 30,
    expertise: ['Data Collection', 'REDCap', 'Python'],
    isActive: true,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskCount: 10,
    completedTasks: 35,
    activeProjects: 3,
    workload: 55,
    upcomingDeadlines: 2,
  },
];

export default function TeamPage() {
  const [members, setMembers] = useState(mockMembers);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'workload'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter members based on search
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.expertise?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Fetch team members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch('/api/team');
        // const data = await response.json();
        // setMembers(data);
      } catch (error) {
        console.error('Failed to fetch team members:', error);
        showToast({
          type: 'error',
          title: 'Failed to load team members',
          message: 'Please try refreshing the page',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // fetchMembers();
  }, []);
  
  const handleAddMember = () => {
    // TODO: Open add member modal
    setShowAddMemberForm(true);
    showToast({
      type: 'info',
      title: 'Add Member',
      message: 'Member creation form coming soon',
    });
  };
  
  const handleEditMember = (memberId: string) => {
    showToast({
      type: 'info',
      title: 'Edit Member',
      message: `Editing member ${memberId}`,
    });
  };
  
  const handleViewDetails = (memberId: string) => {
    showToast({
      type: 'info',
      title: 'View Details',
      message: `Viewing details for member ${memberId}`,
    });
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="px-6 py-4 border-b dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Members</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage team roster and workload distribution
        </p>
      </div>
      
      {/* Team Header with Controls */}
      <TeamHeader
        onAddMember={handleAddMember}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
        {isLoading ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : viewMode === 'workload' ? (
          <TeamWorkloadView members={filteredMembers as any} />
        ) : viewMode === 'grid' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member as any}
                  onEdit={() => handleEditMember(member.id)}
                  onViewDetails={() => handleViewDetails(member.id)}
                />
              ))}
            </div>
            
            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No team members found matching your search.
                </p>
              </div>
            )}
          </div>
        ) : (
          // List view
          <div className="p-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
              <table className="w-full">
                <thead className="border-b dark:border-gray-700">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      Member
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      Role
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      Expertise
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      Workload
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      Projects
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      Tasks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                            {member.initials}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {member.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {member.role.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {member.expertise?.slice(0, 2).map((skill, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                              {skill}
                            </span>
                          ))}
                          {member.expertise && member.expertise.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{member.expertise.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                member.workload > 80 ? 'bg-red-500' : 
                                member.workload > 60 ? 'bg-yellow-500' : 
                                'bg-green-500'
                              }`}
                              style={{ width: `${member.workload}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {member.workload}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {member.activeProjects}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {member.taskCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
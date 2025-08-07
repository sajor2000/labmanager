'use client';

import { useState, useEffect } from 'react';
import { TeamHeader } from '@/components/team/team-header';
import { TeamMemberCard } from '@/components/team/team-member-card';
import { TeamWorkloadView } from '@/components/team/team-workload-view';
import { TeamMemberDialog } from '@/components/team/team-member-dialog';
import { showToast } from '@/components/ui/toast';
import { api } from '@/lib/utils/enhanced-api-client';
import { useLab } from '@/lib/contexts/lab-context';
import type { User as PrismaUser } from '@prisma/client';
import type { User } from '@/types';

// Enhanced team member interface with workload metrics
interface TeamMemberWithMetrics extends User {
  taskCount: number;
  completedTasks: number;
  activeProjects: number;
  workload: number;
  upcomingDeadlines: number;
  // For form compatibility
  firstName?: string;
  lastName?: string;
}

export default function TeamPage() {
  const { currentLab, isLoading: labLoading } = useLab();
  const [members, setMembers] = useState<TeamMemberWithMetrics[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'workload'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithMetrics | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filter members based on search
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.expertise?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Fetch team members when lab changes
  useEffect(() => {
    if (!currentLab || labLoading) return;
    fetchMembers();
  }, [currentLab, labLoading]);
  
  const handleAddMember = () => {
    setSelectedMember(null);
    setIsDialogOpen(true);
  };
  
  const handleEditMember = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      // Parse name into firstName and lastName for the form
      const nameParts = member.name.split(' ');
      const memberWithParsedName = {
        ...member,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || ''
      };
      setSelectedMember(memberWithParsedName);
      setIsDialogOpen(true);
    }
  };
  
  const handleDeleteMember = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const confirmDelete = window.confirm(`Are you sure you want to delete ${member.name}? This action cannot be undone.`);
    if (!confirmDelete) return;
    
    try {
      const result = await api.deleteUser(memberId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      showToast({
        type: 'success',
        title: 'Member Deleted',
        message: `${member.name} has been removed from the team.`,
      });
      
      // Refresh the members list
      fetchMembers();
    } catch (error) {
      console.error('Failed to delete member:', error);
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not delete the team member. Please try again.',
      });
    }
  };
  
  const handleDialogSuccess = () => {
    // Refresh the team members list
    fetchMembers();
  };
  
  const fetchMembers = async () => {
    if (!currentLab) return;
    
    try {
      setIsLoading(true);
      const result = await api.getTeamMembers(currentLab.id);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setMembers(result.data || []);
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
                  onDelete={() => handleDeleteMember(member.id)}
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
      
      {/* Team Member Dialog */}
      <TeamMemberDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        member={selectedMember}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
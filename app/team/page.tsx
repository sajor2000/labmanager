'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLab } from '@/lib/contexts/lab-context';
import { TeamPageSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertCircle, Plus, Search, Users, UserCheck, 
  Activity, Award, Grid3x3, List, BarChart3 
} from 'lucide-react';
import { 
  useTeamMembers, 
  useCreateTeamMember, 
  useUpdateTeamMember, 
  useDeleteTeamMember,
  useTeamMetrics 
} from '@/hooks/use-api';
import { debounce } from 'lodash';
import type { TeamMemberFilters, CreateTeamMemberPayload, UpdateTeamMemberPayload } from '@/types/team';
import { TeamMemberCard } from '@/components/team/team-member-card';
import { TeamMemberTable } from '@/components/team/team-member-table';
import { TeamWorkloadView } from '@/components/team/team-workload-view';
import { TeamMemberDialog } from '@/components/team/team-member-dialog';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type ViewMode = 'grid' | 'list' | 'workload';
type TabValue = 'all' | 'active' | 'inactive';

export default function TeamPage() {
  const { currentLab, isLoading: labLoading } = useLab();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<TeamMemberFilters>({
    searchTerm: '',
    role: undefined,
    department: undefined,
    status: 'active',
  });
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('active');

  // React Query hooks
  const { 
    data: members = [], 
    isLoading: membersLoading, 
    error: membersError,
    refetch: refetchMembers 
  } = useTeamMembers(currentLab?.id, filters);
  
  const { data: metrics } = useTeamMetrics(currentLab?.id);
  
  const createMutation = useCreateTeamMember();
  const updateMutation = useUpdateTeamMember();
  const deleteMutation = useDeleteTeamMember();

  // Computed values
  const membersByDepartment = useMemo(() => {
    const grouped = members.reduce((acc, member) => {
      const dept = member.department || 'Other';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(member);
      return acc;
    }, {} as Record<string, typeof members>);
    return grouped;
  }, [members]);

  const workloadStats = useMemo(() => {
    if (members.length === 0) return { overloaded: 0, optimal: 0, underutilized: 0, avgWorkload: 0 };
    
    const overloaded = members.filter(m => (m.workload || 0) > 80).length;
    const optimal = members.filter(m => (m.workload || 0) >= 40 && (m.workload || 0) <= 80).length;
    const underutilized = members.filter(m => (m.workload || 0) < 40).length;
    const avgWorkload = members.reduce((sum, m) => sum + (m.workload || 0), 0) / members.length;
    
    return { overloaded, optimal, underutilized, avgWorkload };
  }, [members]);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setFilters(prev => ({ ...prev, searchTerm: value }));
    }, 300),
    []
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setCreateDialogOpen(true);
      }
      if (e.key === 'Escape' && selectedMember) {
        setSelectedMember(null);
      }
      // View mode shortcuts
      if (e.key === '1' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setViewMode('grid');
      }
      if (e.key === '2' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setViewMode('list');
      }
      if (e.key === '3' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setViewMode('workload');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMember]);

  // Handlers
  const handleCreateMember = useCallback(async (data: CreateTeamMemberPayload) => {
    if (!currentLab?.id) {
      toast.error('No lab selected');
      return;
    }
    
    try {
      await createMutation.mutateAsync({
        ...data,
        labId: currentLab.id,
      });
      setCreateDialogOpen(false);
      toast.success('Team member added successfully');
    } catch (error) {
      console.error('Failed to add team member:', error);
    }
  }, [currentLab?.id, createMutation]);

  const handleUpdateMember = useCallback(async (id: string, data: UpdateTeamMemberPayload) => {
    try {
      await updateMutation.mutateAsync({ id, ...data });
      toast.success('Team member updated successfully');
    } catch (error) {
      console.error('Failed to update team member:', error);
    }
  }, [updateMutation]);

  const handleDeleteMember = useCallback(async (id: string) => {
    const member = members.find(m => m.id === id);
    if (!member || !confirm(`Remove ${member.name} from the team?`)) return;
    
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Team member removed successfully');
      setSelectedMember(null);
    } catch (error) {
      console.error('Failed to remove team member:', error);
    }
  }, [members, deleteMutation]);

  const handleAssignTask = useCallback((memberId: string) => {
    toast.info('Opening task assignment dialog...');
    // This would open a task assignment dialog
  }, []);

  const handleViewProfile = useCallback((memberId: string) => {
    setSelectedMember(memberId);
  }, []);

  // Loading state
  if (labLoading || membersLoading) {
    return <TeamPageSkeleton />;
  }

  // Error state
  if (membersError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load team members</span>
            <Button onClick={() => refetchMembers()} size="sm" variant="outline" className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No lab selected
  if (!currentLab) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">No lab selected</h2>
          <p className="mt-2 text-muted-foreground">
            Please select a lab from the top navigation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-8 w-8" />
                Team Members
              </h1>
              <p className="text-muted-foreground">
                Manage team roster and workload distribution
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{members.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {members.filter(m => m.status === 'active').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Avg Workload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workloadStats.avgWorkload.toFixed(0)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal">Overloaded</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {workloadStats.overloaded}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal">Optimal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {workloadStats.optimal}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and View Controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search by name, email, or skills... (Ctrl+/)"
                className="pl-9"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
            
            <Select
              value={filters.role}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                role: value === 'all' ? undefined : value 
              }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="principal-investigator">Principal Investigator</SelectItem>
                <SelectItem value="co-investigator">Co-Investigator</SelectItem>
                <SelectItem value="research-coordinator">Research Coordinator</SelectItem>
                <SelectItem value="research-assistant">Research Assistant</SelectItem>
                <SelectItem value="data-analyst">Data Analyst</SelectItem>
                <SelectItem value="lab-manager">Lab Manager</SelectItem>
                <SelectItem value="postdoc">Postdoc</SelectItem>
                <SelectItem value="graduate-student">Graduate Student</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.department}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                department: value === 'all' ? undefined : value 
              }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="clinical">Clinical</SelectItem>
                <SelectItem value="data-science">Data Science</SelectItem>
                <SelectItem value="administration">Administration</SelectItem>
                <SelectItem value="laboratory">Laboratory</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                title="Grid View (Ctrl+1)"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                title="List View (Ctrl+2)"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'workload' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('workload')}
                title="Workload View (Ctrl+3)"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Members</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No team members found</h3>
                <p className="text-muted-foreground mb-4">
                  {filters.searchTerm || filters.role || filters.department
                    ? 'Try adjusting your filters'
                    : 'Add your first team member'}
                </p>
                {!filters.searchTerm && !filters.role && !filters.department && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Member
                  </Button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {members.map(member => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    onEdit={() => handleUpdateMember(member.id, {})}
                    onDelete={() => handleDeleteMember(member.id)}
                    onViewDetails={() => handleViewProfile(member.id)}
                    onAssignTask={() => handleAssignTask(member.id)}
                  />
                ))}
              </div>
            ) : viewMode === 'list' ? (
              <TeamMemberTable
                members={members}
                onEdit={handleUpdateMember}
                onDelete={handleDeleteMember}
                onViewProfile={handleViewProfile}
                onAssignTask={handleAssignTask}
              />
            ) : (
              <TeamWorkloadView 
                members={members}
                onMemberClick={handleViewProfile}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Department Groups (shown in grid view) */}
        {viewMode === 'grid' && Object.keys(membersByDepartment).length > 1 && (
          <div className="mt-8 space-y-6">
            <h3 className="text-lg font-semibold">By Department</h3>
            {Object.entries(membersByDepartment).map(([dept, deptMembers]) => (
              <div key={dept}>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-medium">{dept}</h4>
                  <Badge variant="secondary">{deptMembers.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {deptMembers.map(member => (
                    <TeamMemberCard
                      key={member.id}
                      member={member}
                      onEdit={() => handleUpdateMember(member.id, {})}
                      onDelete={() => handleDeleteMember(member.id)}
                      onViewDetails={() => handleViewProfile(member.id)}
                      onAssignTask={() => handleAssignTask(member.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <TeamMemberDialog
        open={createDialogOpen || !!selectedMember}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setSelectedMember(null);
          }
        }}
        member={selectedMember ? members.find(m => m.id === selectedMember) : undefined}
        onSubmit={selectedMember ? 
          (data) => handleUpdateMember(selectedMember, data) : 
          handleCreateMember
        }
      />
    </div>
  );
}
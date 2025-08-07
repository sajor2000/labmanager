'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, BarChart3, Plus, Filter, AlertCircle } from 'lucide-react';
import { CalendarView } from '@/components/deadlines/calendar-view';
import { TimelineView } from '@/components/deadlines/timeline-view';
import { DeadlineCreationForm } from '@/components/deadlines/deadline-creation-form';
import { showToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Deadline {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  dueDate: Date;
  dueTime?: string;
  projectId?: string;
  projectName?: string;
  assignees?: { id: string; name: string; initials: string }[];
  recurring?: string;
  reminderDays?: number;
  tags?: string[];
  status?: string;
}

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; initials: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);
  const [activeView, setActiveView] = useState<'calendar' | 'timeline'>('calendar');
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    assignee: '',
    project: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch deadlines
      const deadlinesRes = await fetch('/api/deadlines');
      if (deadlinesRes.ok) {
        const deadlinesData = await deadlinesRes.json();
        setDeadlines(deadlinesData.map((d: any) => ({
          id: d.id,
          title: d.title,
          description: d.description,
          type: d.type,
          priority: d.priority,
          dueDate: new Date(d.dueDate),
          dueTime: d.dueTime,
          projectId: d.projectId,
          projectName: d.project?.name,
          assignees: d.assignees?.map((a: any) => ({
            id: a.user.id,
            name: a.user.name,
            initials: a.user.initials,
          })),
          recurring: d.isRecurring ? d.recurringPattern : 'NONE',
          reminderDays: d.reminderDays?.[0] || 7,
          tags: d.tags || [],
          status: d.currentStatus || d.status,
        })));
      }

      // Fetch projects for association
      const projectsRes = await fetch('/api/projects');
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.map((p: any) => ({
          id: p.id,
          name: p.name,
        })));
      }

      // Fetch users for assignment
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.map((u: any) => ({
          id: u.id,
          name: u.name,
          initials: u.initials,
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast({
        type: 'error',
        title: 'Failed to load deadlines',
        message: 'Please refresh the page to try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeadline = async (data: any) => {
    try {
      // Get current user for createdById
      const userResponse = await fetch('/api/users/current');
      const currentUser = await userResponse.json();
      
      if (!currentUser || !currentUser.id) {
        throw new Error('User not authenticated');
      }

      // Get first lab for labId if not provided
      const labId = currentUser.labs?.[0]?.labId || undefined;

      // Transform the form data to match API schema
      const requestData = {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        type: data.type || 'OTHER',
        priority: data.priority || 'MEDIUM',
        status: 'UPCOMING',
        projectId: data.projectId || undefined,
        assigneeIds: data.assigneeIds || [],
        reminderDays: data.reminderDays ? [data.reminderDays] : [7, 3, 1],
        isRecurring: data.recurring !== 'NONE',
        recurringPattern: data.recurring !== 'NONE' ? data.recurring : undefined,
        createdById: currentUser.id,
        labId: labId,
      };

      const response = await fetch('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create deadline');
      }

      const newDeadline = await response.json();
      setDeadlines(prev => [...prev, {
        ...newDeadline,
        dueDate: new Date(newDeadline.dueDate),
        projectName: newDeadline.project?.name,
        assignees: newDeadline.assignees?.map((a: any) => ({
          id: a.user.id,
          name: a.user.name,
          initials: a.user.initials,
        })),
      }]);

      showToast({
        type: 'success',
        title: 'Deadline created',
        message: 'Your deadline has been added successfully.',
      });
    } catch (error) {
      throw error;
    }
  };

  const handleDeadlineClick = (deadline: Deadline) => {
    setSelectedDeadline(deadline);
    // Open detail modal or navigate to detail page
  };

  const handleDateClick = (date: Date) => {
    // Pre-fill the date in the creation form
    setShowCreateForm(true);
  };

  // Apply filters
  const filteredDeadlines = deadlines.filter(deadline => {
    if (filters.type && deadline.type !== filters.type) return false;
    if (filters.priority && deadline.priority !== filters.priority) return false;
    if (filters.assignee && !deadline.assignees?.some(a => a.id === filters.assignee)) return false;
    if (filters.project && deadline.projectId !== filters.project) return false;
    return true;
  });

  // Get statistics
  const stats = {
    total: deadlines.length,
    overdue: deadlines.filter(d => d.dueDate < new Date()).length,
    thisWeek: deadlines.filter(d => {
      const now = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return d.dueDate >= now && d.dueDate <= weekFromNow;
    }).length,
    critical: deadlines.filter(d => d.priority === 'CRITICAL').length,
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading deadlines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-950 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deadlines</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Track all important dates and milestones
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Deadline</span>
          </button>
        </div>

        {/* Stats Bar */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <CalendarDays className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600 dark:text-red-400">Overdue</p>
                <p className="text-lg font-semibold text-red-700 dark:text-red-300">{stats.overdue}</p>
              </div>
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">This Week</p>
                <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">{stats.thisWeek}</p>
              </div>
              <CalendarDays className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600 dark:text-orange-400">Critical</p>
                <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">{stats.critical}</p>
              </div>
              <AlertCircle className="h-5 w-5 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle and Filters */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'calendar' | 'timeline')}>
            <TabsList>
              <TabsTrigger value="calendar">
                <CalendarDays className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Timeline
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800"
            >
              <option value="">All Types</option>
              <option value="IRB_RENEWAL">IRB Renewal</option>
              <option value="GRANT_SUBMISSION">Grant Submission</option>
              <option value="PAPER_DEADLINE">Paper Deadline</option>
              <option value="MILESTONE">Milestone</option>
              <option value="MEETING">Meeting</option>
              <option value="OTHER">Other</option>
            </select>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            {projects.length > 0 && (
              <select
                value={filters.project}
                onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800"
              >
                <option value="">All Studies</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => setFilters({ type: '', priority: '', assignee: '', project: '' })}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'calendar' ? (
          <CalendarView
            deadlines={filteredDeadlines}
            onDeadlineClick={handleDeadlineClick}
            onDateClick={handleDateClick}
            onCreateNew={() => setShowCreateForm(true)}
          />
        ) : (
          <TimelineView
            deadlines={filteredDeadlines}
            projects={projects}
            onDeadlineClick={handleDeadlineClick}
            onCreateNew={() => setShowCreateForm(true)}
          />
        )}
      </div>

      {/* Creation Form */}
      <DeadlineCreationForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateDeadline}
        projects={projects}
        users={users}
      />
    </div>
  );
}
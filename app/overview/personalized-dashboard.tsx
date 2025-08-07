'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Calendar, 
  CheckSquare, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  BookOpen,
  Users,
  Target,
  Activity
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/metric-card';
import type { SelectedUser } from '@/lib/contexts/user-context';

interface UserMetrics {
  assignedTasks: number;
  completedTasks: number;
  upcomingDeadlines: number;
  activeProjects: number;
  recentActivity: any[];
}

interface PersonalizedData {
  greeting: string;
  role: string;
  labs: Array<{
    id: string;
    name: string;
    shortName: string;
    isAdmin: boolean;
  }>;
  metrics: UserMetrics;
  quickActions: Array<{
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    color: string;
  }>;
  recentItems: Array<{
    type: string;
    title: string;
    description: string;
    href: string;
    timestamp: string;
  }>;
}

interface PersonalizedDashboardProps {
  selectedUser: SelectedUser | null;
}

export function PersonalizedDashboard({ selectedUser }: PersonalizedDashboardProps) {
  const [dashboardData, setDashboardData] = useState<PersonalizedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedUser) {
      loadPersonalizedData(selectedUser);
    } else {
      setLoading(false);
      setDashboardData(null);
    }
  }, [selectedUser]);

  const loadPersonalizedData = async (userData: SelectedUser) => {
    try {
      // Fetch personalized data based on user
      const [metricsRes, tasksRes, projectsRes, deadlinesRes] = await Promise.all([
        fetch(`/api/dashboard/metrics?userId=${userData.id}`),
        fetch(`/api/tasks?assigneeId=${userData.id}&status=pending`),
        fetch(`/api/projects?member=${userData.id}`),
        fetch(`/api/deadlines?upcoming=true&assigneeId=${userData.id}`),
      ]);

      const [metrics, tasks, projects, deadlines] = await Promise.all([
        metricsRes.json(),
        tasksRes.json(),
        projectsRes.json(),
        deadlinesRes.json(),
      ]);

      const personalizedData: PersonalizedData = {
        greeting: getPersonalizedGreeting(userData.name || 'User'),
        role: formatRole(userData.role || 'RESEARCH_MEMBER'),
        labs: userData.labs || [],
        metrics: {
          assignedTasks: tasks.length || 0,
          completedTasks: metrics.completedTasks || 0,
          upcomingDeadlines: deadlines.length || 0,
          activeProjects: projects.length || 0,
          recentActivity: [], // Will be populated
        },
        quickActions: getQuickActions(userData.role || 'RESEARCH_MEMBER'),
        recentItems: [], // Will be populated
      };

      setDashboardData(personalizedData);
    } catch (error) {
      console.error('Failed to load personalized data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPersonalizedGreeting = (name: string): string => {
    const hour = new Date().getHours();
    const firstName = name.split(' ')[0];
    
    if (hour < 12) {
      return `Good morning, ${firstName}!`;
    } else if (hour < 17) {
      return `Good afternoon, ${firstName}!`;
    } else {
      return `Good evening, ${firstName}!`;
    }
  };

  const formatRole = (role: string): string => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getQuickActions = (role: string) => {
    const baseActions = [
      {
        title: 'My Tasks',
        description: 'View and manage your assigned tasks',
        href: '/tasks',
        icon: <CheckSquare className="h-5 w-5" />,
        color: 'bg-blue-500',
      },
      {
        title: 'Calendar',
        description: 'Check upcoming events and deadlines',
        href: '/calendar',
        icon: <Calendar className="h-5 w-5" />,
        color: 'bg-green-500',
      },
      {
        title: 'Team',
        description: 'Collaborate with team members',
        href: '/team',
        icon: <Users className="h-5 w-5" />,
        color: 'bg-purple-500',
      },
    ];

    // Add role-specific actions
    if (role.includes('PRINCIPAL_INVESTIGATOR') || role.includes('LAB_ADMINISTRATOR')) {
      baseActions.push({
        title: 'Create Project',
        description: 'Start a new research project',
        href: '/studies?action=create',
        icon: <Target className="h-5 w-5" />,
        color: 'bg-orange-500',
      });
    }

    if (role.includes('INVESTIGATOR') || role.includes('ADMIN')) {
      baseActions.push({
        title: 'Analytics',
        description: 'View lab performance metrics',
        href: '/analytics',
        icon: <TrendingUp className="h-5 w-5" />,
        color: 'bg-indigo-500',
      });
    }

    return baseActions;
  };

  if (!selectedUser) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <User className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No User Selected</h3>
            <p className="text-gray-500 max-w-md">
              Select a user from the dropdown above to see their personalized dashboard with custom metrics, tasks, and lab information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-gray-500">Failed to load dashboard data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{dashboardData.greeting}</h1>
          <p className="text-lg text-gray-600 mt-1">
            {dashboardData.role} • {dashboardData.labs.map(lab => lab.shortName).join(', ')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span>{selectedUser?.name}</span>
          </Badge>
          <Badge variant="secondary">
            {dashboardData.labs.length} Lab{dashboardData.labs.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Assigned Tasks"
          value={dashboardData.metrics.assignedTasks}
          description="Tasks requiring your attention"
          icon={<CheckSquare className="h-5 w-5" />}
        />
        <MetricCard
          title="Completed Tasks"
          value={dashboardData.metrics.completedTasks}
          description="Tasks completed this month"
          icon={<Activity className="h-5 w-5" />}
        />
        <MetricCard
          title="Active Projects"
          value={dashboardData.metrics.activeProjects}
          description="Projects you're involved in"
          icon={<BookOpen className="h-5 w-5" />}
        />
        <MetricCard
          title="Upcoming Deadlines"
          value={dashboardData.metrics.upcomingDeadlines}
          description="Deadlines in the next 7 days"
          icon={<AlertCircle className="h-5 w-5" />}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>
            Common tasks based on your role and current activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2 hover:shadow-md transition-shadow"
                onClick={() => window.location.href = action.href}
              >
                <div className={`p-2 rounded-md ${action.color} text-white`}>
                  {action.icon}
                </div>
                <div className="text-left">
                  <h3 className="font-medium">{action.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lab Memberships */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Lab Memberships</span>
          </CardTitle>
          <CardDescription>
            Your access and role in each research lab
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.labs.map((lab, index) => (
              <div key={lab.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">{lab.name}</h3>
                  <p className="text-sm text-gray-600">Lab Code: {lab.shortName}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={lab.isAdmin ? "default" : "secondary"}>
                    {lab.isAdmin ? 'Admin' : 'Member'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/labs/${lab.id}`}
                  >
                    View Lab
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>
            Your latest actions and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Activity tracking will appear here as you use the platform</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
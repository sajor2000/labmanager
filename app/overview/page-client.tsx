'use client';

import { PersonalizedDashboard } from './personalized-dashboard';
import { UserSelector } from '@/components/user-selector';
import { DashboardOverviewClient } from '@/components/dashboard/overview-client';
import { useEffect, useState } from 'react';
import { useLab } from '@/lib/contexts/lab-context';
import { showToast } from '@/components/ui/toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  labs?: Array<{
    id: string;
    name: string;
    shortName: string;
    isAdmin: boolean;
  }>;
}

export default function OverviewPageClient() {
  const { currentLab, isLoading: labLoading } = useLab();
  const [metrics, setMetrics] = useState<any>(null);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Always show user selector and personalized dashboard - no auth required
  return (
    <div className="p-6 space-y-6">
      <UserSelector 
        selectedUser={selectedUser}
        onUserSelect={setSelectedUser}
      />
      <PersonalizedDashboard selectedUser={selectedUser} />
    </div>
  );
}
'use client';

import { PersonalizedDashboard } from './personalized-dashboard';
import { UserSelector } from '@/components/user-selector';
import { useState } from 'react';

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
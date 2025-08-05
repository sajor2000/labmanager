"use client";

import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  initials: string;
  avatar?: string;
  avatarUrl?: string | null;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/users/current');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, loading };
}

// For components that need a fallback user ID during loading
export function getCurrentUserId(): string {
  // This will be replaced by the actual user ID once loaded
  // Using a more descriptive fallback than "user1"
  return 'pending-auth';
}
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeLocalStorage } from '@/lib/utils/browser';

export interface SelectedUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  initials: string;
  avatar?: string;
  avatarUrl?: string;
  labs?: Array<{
    id: string;
    name: string;
    shortName: string;
  }>;
}

interface UserContextType {
  selectedUser: SelectedUser | null;
  setSelectedUser: (user: SelectedUser | null) => void;
  clearUser: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'labmanage_selected_user';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [selectedUser, setSelectedUserState] = useState<SelectedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount (SSR-safe)
  useEffect(() => {
    try {
      const storedUser = safeLocalStorage.getItem(STORAGE_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setSelectedUserState(user);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      safeLocalStorage.removeItem(STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  const setSelectedUser = (user: SelectedUser | null) => {
    setSelectedUserState(user);
    
    if (user) {
      try {
        safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch (error) {
        console.error('Error storing user:', error);
      }
    } else {
      safeLocalStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearUser = () => {
    setSelectedUser(null);
  };

  const value = {
    selectedUser,
    setSelectedUser,
    clearUser,
    isLoading,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Hook to get current user with easy access to common properties
export function useCurrentUser() {
  const { selectedUser } = useUser();
  
  return {
    user: selectedUser,
    isLoggedIn: !!selectedUser,
    userId: selectedUser?.id,
    userName: selectedUser?.name,
    userRole: selectedUser?.role,
    userInitials: selectedUser?.initials,
    userEmail: selectedUser?.email,
    firstName: selectedUser?.firstName,
    lastName: selectedUser?.lastName,
    labs: selectedUser?.labs || [],
    primaryLab: selectedUser?.labs?.[0],
  };
}
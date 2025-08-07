"use client";

// This hook is now a bridge to our new user context system
// It maintains compatibility with existing components

import { useCurrentUser as useCurrentUserContext } from '@/lib/contexts/user-context';

// Re-export the hook from the context for backward compatibility
export function useCurrentUser() {
  const { user, isLoggedIn } = useCurrentUserContext();
  
  return { 
    user, 
    loading: false // Context handles loading internally
  };
}

// For components that need a fallback user ID during loading
export function getCurrentUserId(): string {
  const { userId } = useCurrentUserContext();
  return userId || 'pending-auth';
}
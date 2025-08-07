'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/lib/contexts/user-context';

interface RouteGuardProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ['/auth'];

export function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedUser, isLoading } = useUser();

  useEffect(() => {
    // Don't redirect if still loading
    if (isLoading) return;

    // Allow access to public routes
    if (PUBLIC_ROUTES.includes(pathname)) {
      // If user is already selected and they're on auth page, redirect to home
      if (selectedUser) {
        router.replace('/');
      }
      return;
    }

    // Redirect to auth if no user selected
    if (!selectedUser) {
      router.replace('/auth');
    }
  }, [selectedUser, isLoading, pathname, router]);

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Don't render protected content if no user is selected (will redirect)
  if (!selectedUser && !PUBLIC_ROUTES.includes(pathname)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Redirecting to user selection...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
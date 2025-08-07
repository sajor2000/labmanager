'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TestTube, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { UserSelectionCard } from '@/components/auth/user-selection-card';
import { useUser, type SelectedUser } from '@/lib/contexts/user-context';

export default function AuthPage() {
  const router = useRouter();
  const { setSelectedUser, selectedUser } = useUser();
  const [users, setUsers] = useState<SelectedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(selectedUser?.id || null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Fetch users from API or use mock data as fallback
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/users');
      
      if (response.ok) {
        const userData = await response.json();
        
        // Transform API data to match SelectedUser interface
        const transformedUsers: SelectedUser[] = userData.map((user: any) => ({
          id: user.id,
          name: user.name,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email,
          role: user.role,
          initials: user.initials,
          avatar: user.avatar,
          avatarUrl: user.avatarUrl,
          labs: user.labs?.map((lab: any) => ({
            id: lab.id,
            name: lab.name,
            shortName: lab.shortName,
          })) || [],
        }));
        
        setUsers(transformedUsers);
      } else {
        throw new Error('Failed to fetch users from API');
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please check your database connection.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserSelect = async (user: SelectedUser) => {
    setIsSelecting(true);
    setSelectedUserId(user.id);
    
    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setSelectedUser(user);
    
    // Redirect to dashboard
    router.push('/');
  };

  const handleRetry = () => {
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Loading Users...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Fetching available lab members
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <TestTube className="h-12 w-12 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                LabManage
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Research Hub
              </p>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Select Your Profile
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose your user profile to access your personalized research dashboard. 
            This is a temporary selection system until authentication is fully implemented.
          </p>
          
          {error && (
            <div className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">{error}</span>
              <button
                onClick={handleRetry}
                className="ml-3 p-1 hover:bg-yellow-100 dark:hover:bg-yellow-800/30 rounded"
                title="Retry loading users"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* User Selection Grid */}
        {users.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <UserSelectionCard
                key={user.id}
                user={user}
                onSelect={handleUserSelect}
                isSelected={selectedUserId === user.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Users Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Unable to load user list. Please try again.
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {isSelecting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-900 dark:text-white font-medium">
                Setting up your workspace...
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            This is a temporary authentication system for development purposes.
          </p>
          <p className="mt-1">
            Your selection will be remembered until you clear your browser data.
          </p>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { User, Users, Building } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  labs?: Array<{
    id: string;
    name: string;
    shortName: string;
  }>;
}

interface UserSelectorProps {
  onUserSelect: (user: User | null) => void;
  selectedUser: User | null;
}

export function UserSelector({ onUserSelect, selectedUser }: UserSelectorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch('/api/users', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const userData = await response.json();
        // Validate data structure
        if (Array.isArray(userData)) {
          setUsers(userData);
          if (userData.length === 0) {
            setError('No users found in database. Please check database configuration.');
          }
        } else {
          console.error('Invalid user data format received');
          setError('Invalid data format received from server');
          setUsers([]);
        }
      } else {
        console.error(`Failed to load users: ${response.status} ${response.statusText}`);
        setError(`Unable to load users (Error ${response.status})`);
        setUsers([]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request timed out loading users');
        setError('Request timed out. Please check your connection.');
      } else {
        console.error('Error loading users:', error);
        setError('Failed to connect to server. Please check database configuration.');
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (userId: string) => {
    if (userId === 'none') {
      onUserSelect(null);
    } else {
      const user = users.find(u => u.id === userId);
      onUserSelect(user || null);
    }
  };

  const formatUserRole = (role: string): string => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <Users className="h-5 w-5" />
              <span>Select User Experience</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  Choose User
                </label>
                <div className="w-full h-10 bg-gray-200 rounded-md animate-pulse flex items-center px-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    <span className="text-sm text-gray-500">Loading users...</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  Current Selection
                </label>
                <div className="w-full h-10 bg-gray-100 rounded-md flex items-center px-3">
                  <span className="text-sm text-gray-400">Waiting for selection...</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  if (loading) {
    return renderContent();
  }

  // Show error state if there's an error and no users
  if (error && users.length === 0) {
    return (
      <Card className="mb-6 bg-red-50 border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-red-900">
            <Users className="h-5 w-5" />
            <span>Database Connection Required</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-100 border border-red-300 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-red-600 mt-0.5">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-red-800 font-medium">Unable to Load Users</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <div className="mt-3 text-sm text-red-700">
                  <p className="font-medium">To fix this issue:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Ensure DATABASE_URL is set in Vercel environment variables</li>
                    <li>Run database migrations: <code className="bg-red-200 px-1 rounded">npx prisma migrate deploy</code></li>
                    <li>Seed initial data: <code className="bg-red-200 px-1 rounded">npx prisma db seed</code></li>
                  </ol>
                </div>
                <Button 
                  onClick={loadUsers} 
                  className="mt-3" 
                  variant="outline"
                  size="sm"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-blue-900">
          <Users className="h-5 w-5" />
          <span>Select User Experience</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-2">
              Choose User
            </label>
            <Select
              value={selectedUser?.id || 'none'}
              onValueChange={handleUserChange}
              disabled={users.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={users.length === 0 ? "No users available" : "Select a user to customize experience..."} />
              </SelectTrigger>
              <SelectContent>
                {users.length === 0 ? (
                  <SelectItem value="none" disabled>
                    <span className="text-gray-500">No users available</span>
                  </SelectItem>
                ) : (
                  <>
                    <SelectItem value="none">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>No User Selected</span>
                      </div>
                    </SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && (
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{selectedUser.name}</div>
                  <div className="text-sm text-gray-600">{formatUserRole(selectedUser.role)}</div>
                  <div className="text-xs text-gray-500">{selectedUser.email}</div>
                  {selectedUser.labs && selectedUser.labs.length > 0 && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Building className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {selectedUser.labs.map(lab => lab.shortName).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {!selectedUser && users.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <div className="text-amber-600 mt-0.5">
                <Users className="h-4 w-4" />
              </div>
              <div className="text-sm">
                <p className="text-amber-800 font-medium">No User Selected</p>
                <p className="text-amber-700 mt-1">
                  Select a user from the dropdown above to see their personalized dashboard experience.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
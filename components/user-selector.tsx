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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      } else {
        console.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
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

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-sm text-gray-600">Loading users...</span>
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
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a user to customize experience..." />
              </SelectTrigger>
              <SelectContent>
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

        {!selectedUser && (
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
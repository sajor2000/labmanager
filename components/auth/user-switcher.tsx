'use client';

import { useState } from 'react';
import { User, ChevronDown, UserCheck, RefreshCw } from 'lucide-react';
import { useUser, type SelectedUser } from '@/lib/contexts/user-context';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants/roles';
import { MOCK_USERS } from '@/lib/constants/mock-users';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UserSwitcherProps {
  className?: string;
  showInDevelopmentOnly?: boolean;
}

export function UserSwitcher({ className, showInDevelopmentOnly = true }: UserSwitcherProps) {
  const { selectedUser, setSelectedUser, clearUser } = useUser();
  const [users, setUsers] = useState<SelectedUser[]>(MOCK_USERS);
  const [loading, setLoading] = useState(false);

  // Only show in development environment
  if (showInDevelopmentOnly && process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleUserSelect = (user: SelectedUser) => {
    setSelectedUser(user);
  };

  const handleClearUser = () => {
    clearUser();
  };

  const fetchUsersFromApi = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const userData = await response.json();
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
      }
    } catch (error) {
      console.warn('Failed to fetch users from API:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedUser) {
    return null; // Don't show if no user is selected
  }

  const roleKey = selectedUser.role as keyof typeof ROLE_LABELS;
  const roleLabel = ROLE_LABELS[roleKey] || selectedUser.role;
  const roleColorClass = ROLE_COLORS[roleKey] || ROLE_COLORS.GUEST;

  return (
    <div className={cn('inline-flex items-center', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <Avatar className="h-6 w-6">
              <AvatarImage src={selectedUser.avatarUrl || undefined} alt={selectedUser.name} />
              <AvatarFallback 
                className="text-xs font-medium text-white"
                style={{ backgroundColor: selectedUser.avatar || '#6B7280' }}
              >
                {selectedUser.initials}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium truncate max-w-32">
              {selectedUser.firstName || selectedUser.name.split(' ')[0]}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72">
          {/* Current User Header */}
          <DropdownMenuLabel>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedUser.avatarUrl || undefined} alt={selectedUser.name} />
                <AvatarFallback 
                  className="text-xs font-medium text-white"
                  style={{ backgroundColor: selectedUser.avatar || '#6B7280' }}
                >
                  {selectedUser.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedUser.name}</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${roleColorClass}`}>
                    {roleLabel}
                  </span>
                  <UserCheck className="h-3 w-3 text-green-500" />
                </div>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Development Tools Label */}
          <DropdownMenuLabel className="text-xs text-gray-500 dark:text-gray-400">
            🛠️ Developer Tools
          </DropdownMenuLabel>

          {/* Switch User Options */}
          <DropdownMenuLabel className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Switch to:
          </DropdownMenuLabel>

          {users
            .filter(user => user.id !== selectedUser.id)
            .slice(0, 5) // Show max 5 other users
            .map((user) => {
              const userRoleKey = user.role as keyof typeof ROLE_LABELS;
              const userRoleLabel = ROLE_LABELS[userRoleKey] || user.role;
              const userRoleColorClass = ROLE_COLORS[userRoleKey] || ROLE_COLORS.GUEST;

              return (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="py-2"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                      <AvatarFallback 
                        className="text-xs font-medium text-white"
                        style={{ backgroundColor: user.avatar || '#6B7280' }}
                      >
                        {user.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${userRoleColorClass}`}>
                        {userRoleLabel}
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}

          <DropdownMenuSeparator />

          {/* Utility Actions */}
          <DropdownMenuItem onClick={fetchUsersFromApi} disabled={loading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
            <span>Refresh Users from API</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleClearUser} className="text-red-600 dark:text-red-400">
            <User className="mr-2 h-4 w-4" />
            <span>Clear Selection</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  LogOut, 
  Moon, 
  Sun, 
  HelpCircle,
  Bell,
  KeyRound,
  ChevronDown 
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { showToast } from '@/components/ui/toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useUser } from '@/lib/contexts/user-context';
import { cn } from '@/lib/utils';

interface UserProfileDropdownProps {
  className?: string;
  showFullProfile?: boolean;
}

export function UserProfileDropdown({ className, showFullProfile = true }: UserProfileDropdownProps) {
  const { user } = useCurrentUser();
  const { clearUser } = useUser();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleProfileClick = () => {
    router.push('/profile');
  };
  
  const handleSettingsClick = () => {
    router.push('/settings');
  };
  
  const handleNotificationsClick = () => {
    router.push('/notifications');
  };
  
  const handleSignOut = async () => {
    try {
      // Clear the user selection
      clearUser();
      
      showToast({
        type: 'success',
        title: 'Signed out',
        message: 'You have been signed out successfully',
      });
      
      // Redirect to auth page
      router.push('/auth');
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Sign out failed',
        message: 'Please try again',
      });
    }
  };
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    showToast({
      type: 'success',
      title: 'Theme changed',
      message: `Switched to ${theme === 'dark' ? 'light' : 'dark'} mode`,
    });
  };
  
  if (!user) {
    return null; // Don't show dropdown if no user
  }
  
  const roleLabel = user.role
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
  
  if (!mounted) {
    return (
      <div className={cn('flex items-center space-x-3 rounded-lg p-2', className)}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 animate-pulse" />
        {showFullProfile && (
          <div className="flex-1">
            <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-1" />
            <div className="h-3 w-20 bg-gray-700 rounded animate-pulse" />
          </div>
        )}
      </div>
    );
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          'flex w-full items-center space-x-3 rounded-lg p-2 hover:bg-gray-800 transition-colors',
          className
        )}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
            <AvatarFallback className={cn('text-white font-medium', user.avatar || 'bg-gradient-to-br from-purple-500 to-pink-500')}>
              {user.initials}
            </AvatarFallback>
          </Avatar>
          {showFullProfile && (
            <>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">
                  {user.name.split(' ').slice(-1)[0]} {/* Show last name only in sidebar */}
                </p>
                <p className="text-xs text-gray-400">
                  {roleLabel.includes('Principal') ? 'PI' : 
                   roleLabel.includes('Administrator') ? 'Admin' :
                   roleLabel.includes('External') ? 'Collaborator' :
                   'Researcher'}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        {/* User Info Header */}
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
              <AvatarFallback className={cn('text-white font-medium', user.avatar || 'bg-gradient-to-br from-purple-500 to-pink-500')}>
                {user.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Profile & Settings */}
        <DropdownMenuItem onClick={handleProfileClick}>
          <User className="mr-2 h-4 w-4" />
          <span>My Profile</span>
          <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleNotificationsClick}>
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
          <Badge variant="outline" className="ml-auto text-xs">
            3
          </Badge>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleSettingsClick}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
          <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Theme Toggle */}
        <DropdownMenuItem onClick={toggleTheme}>
          {theme === 'dark' ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark Mode</span>
            </>
          )}
          <DropdownMenuShortcut>⌘T</DropdownMenuShortcut>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Help & Support */}
        <DropdownMenuItem>
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem>
          <KeyRound className="mr-2 h-4 w-4" />
          <span>Keyboard Shortcuts</span>
          <DropdownMenuShortcut>?</DropdownMenuShortcut>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Sign Out */}
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
          <DropdownMenuShortcut>⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
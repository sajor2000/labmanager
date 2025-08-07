'use client';

import { useState } from 'react';
import { User, Building2 } from 'lucide-react';
import type { SelectedUser } from '@/lib/contexts/user-context';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants/roles';

interface UserSelectionCardProps {
  user: SelectedUser;
  onSelect: (user: SelectedUser) => void;
  isSelected?: boolean;
}

export function UserSelectionCard({ user, onSelect, isSelected = false }: UserSelectionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleSelect = () => {
    onSelect(user);
  };

  const roleKey = user.role as keyof typeof ROLE_LABELS;
  const roleLabel = ROLE_LABELS[roleKey] || user.role;
  const roleColorClass = ROLE_COLORS[roleKey] || ROLE_COLORS.GUEST;

  return (
    <button
      onClick={handleSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        w-full p-6 rounded-xl border-2 transition-all duration-200 text-left
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-lg' 
          : isHovered 
            ? 'border-gray-300 bg-gray-50 dark:bg-gray-800 shadow-md'
            : 'border-gray-200 bg-white dark:bg-gray-900 hover:shadow-sm'
        }
      `}
    >
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div 
          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
          style={{ backgroundColor: user.avatar || '#6B7280' }}
        >
          {user.initials}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {user.name}
            </h3>
            {isSelected && (
              <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </div>

          {/* Role Badge */}
          <div className="mb-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColorClass}`}>
              {roleLabel}
            </span>
          </div>

          {/* Email */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 truncate">
            {user.email}
          </p>

          {/* Lab Affiliation */}
          {user.labs && user.labs.length > 0 && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Building2 className="w-4 h-4 mr-1.5 flex-shrink-0" />
              <span className="truncate">
                {user.labs.length === 1 
                  ? user.labs[0].name
                  : `${user.labs[0].name} (+${user.labs.length - 1} more)`
                }
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Selection Indicator */}
      {(isSelected || isHovered) && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {isSelected ? '✓ Selected' : 'Click to continue as this user'}
          </p>
        </div>
      )}
    </button>
  );
}
'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  userId?: string
  name?: string
  initials?: string
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  showTooltip?: boolean
  fallbackColor?: string
}

export function UserAvatar({
  userId,
  name,
  initials,
  avatarUrl,
  size = 'md',
  className,
  showTooltip = false,
  fallbackColor
}: UserAvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl'
  }

  const generateInitials = (fullName?: string): string => {
    if (initials) return initials
    if (!fullName) return '??'
    
    const names = fullName.trim().split(' ')
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase()
    }
    
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
  }

  const generateFallbackColor = (name?: string): string => {
    if (fallbackColor) return fallbackColor
    
    const colors = [
      'bg-red-500',
      'bg-orange-500', 
      'bg-amber-500',
      'bg-yellow-500',
      'bg-lime-500',
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-sky-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-purple-500',
      'bg-fuchsia-500',
      'bg-pink-500',
      'bg-rose-500'
    ]

    if (!name) return 'bg-gray-500'
    
    // Generate consistent color based on name
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    return colors[Math.abs(hash) % colors.length]
  }

  const displayInitials = generateInitials(name)
  const backgroundColorClass = generateFallbackColor(name)
  
  // Determine avatar source
  const avatarSrc = avatarUrl || (userId ? `/api/users/${userId}/avatar` : undefined)

  const avatarElement = (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage 
        src={avatarSrc}
        alt={name || 'User avatar'}
        className="object-cover"
      />
      <AvatarFallback 
        className={cn(
          'font-semibold text-white',
          backgroundColorClass
        )}
      >
        {displayInitials}
      </AvatarFallback>
    </Avatar>
  )

  if (showTooltip && name) {
    return (
      <div className="relative group">
        {avatarElement}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {name}
        </div>
      </div>
    )
  }

  return avatarElement
}

export default UserAvatar
'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { 
  Link2, Mail, Phone, MapPin, Paperclip, 
  Calendar, Clock, User, Check, X, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { FieldType } from './field-types';

interface FieldRendererProps {
  type: FieldType;
  value: any;
  options?: any;
  className?: string;
  editable?: boolean;
  onChange?: (value: any) => void;
}

export function FieldRenderer({
  type,
  value,
  options = {},
  className,
  editable = false,
  onChange,
}: FieldRendererProps) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400">—</span>;
  }

  switch (type) {
    case 'TEXT':
      return (
        <span className={cn("text-sm", className)}>
          {value}
        </span>
      );

    case 'LONG_TEXT':
      return (
        <div className={cn("text-sm line-clamp-2", className)}>
          {value}
        </div>
      );

    case 'NUMBER':
      return (
        <span className={cn("text-sm font-mono", className)}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      );

    case 'CURRENCY':
      const currency = options.currency || 'USD';
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      });
      return (
        <span className={cn("text-sm font-mono text-green-600 dark:text-green-400", className)}>
          {formatter.format(value)}
        </span>
      );

    case 'PERCENT':
      return (
        <div className="flex items-center gap-2">
          <Progress value={value} className="h-2 flex-1" />
          <span className={cn("text-sm font-mono", className)}>
            {value}%
          </span>
        </div>
      );

    case 'DATE':
      try {
        const date = typeof value === 'string' ? parseISO(value) : value;
        return (
          <span className={cn("text-sm flex items-center gap-1", className)}>
            <Calendar className="h-3 w-3" />
            {format(date, options.format || 'MMM d, yyyy')}
          </span>
        );
      } catch {
        return <span className="text-gray-400">Invalid date</span>;
      }

    case 'DATE_TIME':
      try {
        const dateTime = typeof value === 'string' ? parseISO(value) : value;
        return (
          <span className={cn("text-sm flex items-center gap-1", className)}>
            <Clock className="h-3 w-3" />
            {format(dateTime, options.format || 'MMM d, yyyy h:mm a')}
          </span>
        );
      } catch {
        return <span className="text-gray-400">Invalid date</span>;
      }

    case 'DURATION':
      const hours = Math.floor(value / 60);
      const minutes = value % 60;
      return (
        <span className={cn("text-sm font-mono", className)}>
          {hours}h {minutes}m
        </span>
      );

    case 'SINGLE_SELECT':
      const selectOption = options.choices?.find((c: any) => c.id === value);
      if (!selectOption) return <span className="text-gray-400">—</span>;
      return (
        <Badge
          variant="secondary"
          className={cn("text-xs", className)}
          style={{ 
            backgroundColor: selectOption.color + '20',
            color: selectOption.color,
            borderColor: selectOption.color 
          }}
        >
          {selectOption.name}
        </Badge>
      );

    case 'MULTI_SELECT':
      if (!Array.isArray(value) || value.length === 0) {
        return <span className="text-gray-400">—</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => {
            const option = options.choices?.find((c: any) => c.id === v);
            if (!option) return null;
            return (
              <Badge
                key={i}
                variant="secondary"
                className="text-xs"
                style={{ 
                  backgroundColor: option.color + '20',
                  color: option.color,
                  borderColor: option.color 
                }}
              >
                {option.name}
              </Badge>
            );
          })}
        </div>
      );

    case 'SINGLE_USER':
    case 'COLLABORATOR':
      if (!value) return <span className="text-gray-400">—</span>;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={value.avatar} />
            <AvatarFallback className="text-xs">
              {value.initials || value.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{value.name}</span>
        </div>
      );

    case 'MULTI_USER':
      if (!Array.isArray(value) || value.length === 0) {
        return <span className="text-gray-400">—</span>;
      }
      return (
        <div className="flex items-center gap-1">
          <div className="flex -space-x-2">
            {value.slice(0, 3).map((user, i) => (
              <TooltipProvider key={i}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-6 w-6 border-2 border-white dark:border-gray-800">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-xs">
                        {user.initials || user.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{user.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          {value.length > 3 && (
            <span className="text-xs text-gray-500">
              +{value.length - 3}
            </span>
          )}
        </div>
      );

    case 'CHECKBOX':
      return (
        <Checkbox
          checked={!!value}
          onCheckedChange={editable ? onChange : undefined}
          disabled={!editable}
          className={className}
        />
      );

    case 'RATING':
      const maxRating = options.max || 5;
      return (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: maxRating }).map((_, i) => (
            <button
              key={i}
              onClick={() => editable && onChange?.(i + 1)}
              disabled={!editable}
              className={cn(
                "transition-colors",
                editable && "hover:text-yellow-500 cursor-pointer"
              )}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  i < value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                )}
              />
            </button>
          ))}
        </div>
      );

    case 'URL':
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1",
            className
          )}
        >
          <Link2 className="h-3 w-3" />
          {new URL(value).hostname}
        </a>
      );

    case 'EMAIL':
      return (
        <a
          href={`mailto:${value}`}
          className={cn(
            "text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1",
            className
          )}
        >
          <Mail className="h-3 w-3" />
          {value}
        </a>
      );

    case 'PHONE':
      return (
        <a
          href={`tel:${value}`}
          className={cn(
            "text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1",
            className
          )}
        >
          <Phone className="h-3 w-3" />
          {value}
        </a>
      );

    case 'ATTACHMENT':
      if (!Array.isArray(value) || value.length === 0) {
        return <span className="text-gray-400">—</span>;
      }
      return (
        <div className="flex items-center gap-1">
          <Paperclip className="h-3 w-3" />
          <span className="text-sm">
            {value.length} file{value.length > 1 ? 's' : ''}
          </span>
        </div>
      );

    case 'LOCATION':
      return (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span className="text-sm">{value.address || value}</span>
        </div>
      );

    case 'FORMULA':
    case 'ROLLUP':
    case 'LOOKUP':
      return (
        <span className={cn("text-sm font-mono text-indigo-600 dark:text-indigo-400", className)}>
          {value}
        </span>
      );

    case 'BUTTON':
      return (
        <button
          onClick={() => onChange?.(true)}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-md",
            "bg-blue-500 text-white hover:bg-blue-600",
            "transition-colors",
            className
          )}
        >
          {options.label || 'Run'}
        </button>
      );

    case 'BARCODE':
      return (
        <span className={cn("text-sm font-mono", className)}>
          {value}
        </span>
      );

    case 'AUTO_NUMBER':
      return (
        <span className={cn("text-sm font-mono text-gray-500", className)}>
          #{value}
        </span>
      );

    case 'CREATED_TIME':
    case 'LAST_MODIFIED_TIME':
      try {
        const time = typeof value === 'string' ? parseISO(value) : value;
        return (
          <span className={cn("text-sm text-gray-500", className)}>
            {format(time, 'MMM d, yyyy h:mm a')}
          </span>
        );
      } catch {
        return <span className="text-gray-400">Invalid date</span>;
      }

    case 'CREATED_BY':
    case 'LAST_MODIFIED_BY':
      if (!value) return <span className="text-gray-400">—</span>;
      return (
        <span className={cn("text-sm text-gray-500", className)}>
          {value.name || value}
        </span>
      );

    default:
      return (
        <span className={cn("text-sm", className)}>
          {JSON.stringify(value)}
        </span>
      );
  }
}
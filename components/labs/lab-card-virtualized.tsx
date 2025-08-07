'use client';

import { forwardRef, KeyboardEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  FlaskConical,
  Microscope,
  Dna,
  Heart,
  Brain,
  Pill,
  Activity,
  TestTube,
  Edit,
  ArrowRight,
  Folder,
  Lightbulb,
  Trash2
} from 'lucide-react';
import type { Lab } from '@/types/lab';

const LAB_ICONS = [
  { icon: FlaskConical, color: 'bg-blue-500' },
  { icon: Microscope, color: 'bg-purple-500' },
  { icon: Dna, color: 'bg-green-500' },
  { icon: Heart, color: 'bg-red-500' },
  { icon: Brain, color: 'bg-pink-500' },
  { icon: Pill, color: 'bg-orange-500' },
  { icon: Activity, color: 'bg-teal-500' },
  { icon: TestTube, color: 'bg-indigo-500' },
];

interface LabCardProps {
  lab: Lab;
  index: number;
  onEdit: (lab: Lab) => void;
  onDelete?: (lab: Lab) => void;
  style?: React.CSSProperties;
  isSelected?: boolean;
  onKeyboardNavigate?: (labId: string, action: 'view' | 'edit') => void;
}

/**
 * Lab card component with keyboard navigation support
 */
export const LabCard = forwardRef<HTMLDivElement, LabCardProps>(
  ({ lab, index, onEdit, onDelete, style, isSelected, onKeyboardNavigate }, ref) => {
    const router = useRouter();
    const iconData = LAB_ICONS[index % LAB_ICONS.length];
    const Icon = iconData.icon;
    const color = iconData.color;

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          router.push(`/labs/${lab.id}`);
          break;
        case 'e':
        case 'E':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onEdit(lab);
          }
          break;
        case 'Delete':
          if (e.shiftKey && onKeyboardNavigate) {
            e.preventDefault();
            // Could trigger delete confirmation
          }
          break;
      }
    }, [lab, router, onEdit, onKeyboardNavigate]);

    return (
      <Card 
        ref={ref}
        className={`
          hover:shadow-lg transition-all duration-200 cursor-pointer relative group overflow-hidden
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${isSelected ? 'ring-2 ring-primary' : ''}
        `}
        style={style}
        onClick={() => router.push(`/labs/${lab.id}`)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="article"
        aria-label={`Lab: ${lab.name}`}
      >
        <div 
          className="absolute top-0 left-0 w-1 h-full"
          style={{ backgroundColor: lab.color || color.replace('bg-', '#').replace('500', '') }}
        />
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-lg ${lab.color ? '' : color} text-white`}
                 style={lab.color ? { backgroundColor: `${lab.color}20`, color: lab.color } : {}}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(lab);
                }}
                className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                aria-label={`Edit ${lab.name}`}
                tabIndex={-1}
              >
                <Edit className="h-4 w-4" />
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(lab);
                  }}
                  className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Delete ${lab.name}`}
                  tabIndex={-1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/labs/${lab.id}`);
                }}
                className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                aria-label={`View ${lab.name} details`}
                tabIndex={-1}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardTitle className="mt-4">{lab.name}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Badge variant="outline">{lab.shortName}</Badge>
            <Badge 
              variant={lab.isActive ? "default" : "secondary"} 
              className={lab.isActive ? "bg-green-500" : ""}
            >
              {lab.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lab.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {lab.description}
            </p>
          )}
          
          {/* Member Avatars */}
          {lab.members?.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Team Members</span>
                <span className="text-xs font-medium">{lab._count.members}</span>
              </div>
              <div className="flex -space-x-2">
                {lab.members.slice(0, 4).map((member) => (
                  <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={member.user.avatar || undefined} />
                    <AvatarFallback className="text-xs">
                      {member.user.initials || member.user.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {lab.members.length > 4 && (
                  <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs">+{lab.members.length - 4}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <FlaskConical className="h-3 w-3 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Studies</p>
                <p className="text-sm font-semibold">{lab._count.projects}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Folder className="h-3 w-3 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Buckets</p>
                <p className="text-sm font-semibold">{lab._count.buckets}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Lightbulb className="h-3 w-3 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Ideas</p>
                <p className="text-sm font-semibold">{lab._count.ideas}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Activity className="h-3 w-3 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Standups</p>
                <p className="text-sm font-semibold">{lab._count.standups}</p>
              </div>
            </div>
          </div>

          {/* Recent Projects */}
          {lab.projects?.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Recent Studies</p>
              <div className="space-y-1">
                {lab.projects.slice(0, 2).map((project) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <span className="text-xs truncate flex-1">{project.name}</span>
                    <Badge variant="outline" className="text-xs scale-90">
                      {project.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

LabCard.displayName = 'LabCard';
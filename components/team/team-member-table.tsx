'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MoreVertical, Mail, Phone, Edit, Trash2, 
  UserPlus, Eye, CheckSquare 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TeamMember } from '@/types/team';
import { cn } from '@/lib/utils';

interface TeamMemberTableProps {
  members: TeamMember[];
  onEdit: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onViewProfile: (id: string) => void;
  onAssignTask: (id: string) => void;
}

const roleColors = {
  'principal-investigator': 'bg-purple-100 text-purple-800',
  'co-investigator': 'bg-blue-100 text-blue-800',
  'research-coordinator': 'bg-green-100 text-green-800',
  'research-assistant': 'bg-yellow-100 text-yellow-800',
  'data-analyst': 'bg-orange-100 text-orange-800',
  'lab-manager': 'bg-pink-100 text-pink-800',
  'postdoc': 'bg-indigo-100 text-indigo-800',
  'graduate-student': 'bg-gray-100 text-gray-800',
};

export function TeamMemberTable({
  members,
  onEdit,
  onDelete,
  onViewProfile,
  onAssignTask,
}: TeamMemberTableProps) {
  const getWorkloadColor = (workload: number) => {
    if (workload > 80) return 'text-red-600';
    if (workload > 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatRole = (role: string) => {
    return role.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Expertise</TableHead>
            <TableHead>Workload</TableHead>
            <TableHead>Projects</TableHead>
            <TableHead>Tasks</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant="secondary" 
                  className={cn(roleColors[member.role as keyof typeof roleColors])}
                >
                  {formatRole(member.role || 'member')}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm">{member.department || '—'}</span>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {member.expertise?.slice(0, 3).map((skill, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {member.expertise && member.expertise.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{member.expertise.length - 3}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={member.workload || 0} 
                    className="w-20 h-2"
                  />
                  <span className={cn("text-sm font-medium", getWorkloadColor(member.workload || 0))}>
                    {member.workload || 0}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">{member.activeProjects || 0}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm">{member.taskCount || 0}</span>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={member.status === 'active' ? 'default' : 'secondary'}
                >
                  {member.status}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onViewProfile(member.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(member.id, {})}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Member
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAssignTask(member.id)}>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Assign Task
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(member.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
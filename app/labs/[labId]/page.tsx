'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Building, 
  Users, 
  FlaskConical,
  Clock,
  Edit,
  Plus,
  Loader2,
  ArrowLeft,
  Mail,
  Shield,
  UserPlus,
  UserMinus,
  Calendar,
  Activity,
  FolderOpen,
  Lightbulb,
  Mic,
  Settings,
  BarChart
} from 'lucide-react';

interface LabMember {
  id: string;
  isAdmin: boolean;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    initials: string;
    avatar?: string;
  };
}

interface LabProject {
  id: string;
  name: string;
  status: string;
  priority: string;
}

interface Lab {
  id: string;
  name: string;
  shortName: string;
  description: string | null;
  logo: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members: LabMember[];
  projects: LabProject[];
  _count: {
    projects: number;
    members: number;
    buckets: number;
    ideas: number;
    standups: number;
  };
}

export default function LabDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const labId = params.labId as string;
  
  const [lab, setLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingLab, setIsEditingLab] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'member' | 'admin'>('member');
  
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    description: '',
  });

  useEffect(() => {
    fetchLabDetails();
  }, [labId]);

  const fetchLabDetails = async () => {
    try {
      const response = await fetch(`/api/labs/${labId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Lab not found');
          router.push('/labs');
          return;
        }
        throw new Error('Failed to fetch lab details');
      }
      const data = await response.json();
      setLab(data);
      setFormData({
        name: data.name,
        shortName: data.shortName,
        description: data.description || '',
      });
    } catch (error) {
      console.error('Error fetching lab:', error);
      toast.error('Failed to load lab details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const users = await response.json();
      
      // Filter out users who are already members
      const currentMemberIds = lab?.members.map(m => m.user.id) || [];
      const available = users.filter((u: any) => !currentMemberIds.includes(u.id));
      setAvailableUsers(available);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load available users');
    }
  };

  const handleUpdateLab = async () => {
    if (!formData.name || !formData.shortName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/labs/${labId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update lab');
      }

      toast.success('Lab updated successfully');
      fetchLabDetails();
      setIsEditingLab(false);
    } catch (error) {
      console.error('Error updating lab:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update lab');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/labs/${labId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          isAdmin: selectedRole === 'admin',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add member');
      }

      toast.success('Member added successfully');
      fetchLabDetails();
      setIsAddingMember(false);
      setSelectedUserId('');
      setSelectedRole('member');
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`/api/labs/${labId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove member');
      }

      toast.success('Member removed successfully');
      fetchLabDetails();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    }
  };

  const handleToggleAdmin = async (memberId: string, currentIsAdmin: boolean) => {
    try {
      const response = await fetch(`/api/labs/${labId}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: !currentIsAdmin }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update member role');
      }

      toast.success('Member role updated successfully');
      fetchLabDetails();
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update member role');
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNING: 'bg-gray-500',
      IRB_SUBMISSION: 'bg-yellow-500',
      IRB_APPROVED: 'bg-green-500',
      DATA_COLLECTION: 'bg-blue-500',
      ANALYSIS: 'bg-purple-500',
      MANUSCRIPT: 'bg-indigo-500',
      UNDER_REVIEW: 'bg-orange-500',
      PUBLISHED: 'bg-emerald-500',
      ON_HOLD: 'bg-gray-400',
      CANCELLED: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Lab not found</h2>
          <Button onClick={() => router.push('/labs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Labs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/labs')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Labs
        </Button>
        
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-4 rounded-lg ${lab.color || 'bg-blue-500'} text-white`}>
              <Building className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {lab.name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-lg">{lab.shortName}</Badge>
                {lab.isActive ? (
                  <Badge variant="default" className="bg-green-500">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              {lab.description && (
                <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl">
                  {lab.description}
                </p>
              )}
            </div>
          </div>
          <Button onClick={() => setIsEditingLab(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Lab
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Members</p>
                <p className="text-2xl font-bold">{lab._count.members}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Projects</p>
                <p className="text-2xl font-bold">{lab._count.projects}</p>
              </div>
              <FlaskConical className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Buckets</p>
                <p className="text-2xl font-bold">{lab._count.buckets}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ideas</p>
                <p className="text-2xl font-bold">{lab._count.ideas}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Standups</p>
                <p className="text-2xl font-bold">{lab._count.standups}</p>
              </div>
              <Mic className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="projects">Recent Projects</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Lab Members ({lab.members.length})</h2>
            <Button 
              onClick={() => {
                fetchAvailableUsers();
                setIsAddingMember(true);
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lab.members.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.user.avatar || undefined} />
                        <AvatarFallback>{member.user.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{member.user.name}</p>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {formatRole(member.user.role)}
                          </Badge>
                          {member.isAdmin && (
                            <Badge variant="default" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAdmin(member.id, member.isAdmin)}
                      >
                        {member.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          {lab.projects.length > 0 ? (
            <div className="grid gap-4">
              {lab.projects.map((project) => (
                <Card key={project.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(project.status)}>
                            {project.status.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="outline">
                            {project.priority} Priority
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/studies/${project.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No projects yet. Create your first project to get started.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              Activity tracking coming soon
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <h2 className="text-xl font-semibold">Lab Settings</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label>Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(lab.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(lab.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => setIsEditingLab(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Lab Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Lab Dialog */}
      <Dialog open={isEditingLab} onOpenChange={setIsEditingLab}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Lab</DialogTitle>
            <DialogDescription>
              Update the laboratory information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Lab Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shortName">
                Short Name / Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="shortName"
                value={formData.shortName}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value.toUpperCase() })}
                disabled={isSubmitting}
                maxLength={10}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditingLab(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateLab}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Lab Member</DialogTitle>
            <DialogDescription>
              Add a new member to {lab.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user">Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <span>{user.name}</span>
                        <span className="text-muted-foreground">({user.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Member Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'member' | 'admin')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddingMember(false);
                setSelectedUserId('');
                setSelectedRole('member');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddMember}
              disabled={isSubmitting || !selectedUserId}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
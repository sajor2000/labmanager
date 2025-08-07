'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Folder, 
  FlaskConical,
  Edit,
  Plus,
  Loader2,
  Building2,
  Microscope,
  Dna,
  Heart,
  Brain,
  Pill,
  Activity,
  TestTube,
  ArrowRight,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types should be in a separate file for reusability
interface User {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  avatar: string | null;
  initials: string | null;
}

interface LabMember {
  id: string;
  isAdmin: boolean;
  joinedAt: string;
  user: User;
}

interface Project {
  id: string;
  name: string;
  status: string;
  priority: string;
}

interface LabCounts {
  projects: number;
  members: number;
  buckets: number;
  ideas: number;
  standups: number;
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
  projects: Project[];
  _count: LabCounts;
}

interface LabFormData {
  name: string;
  shortName: string;
  description: string;
}

// Constants should be extracted
const LAB_ICONS = [
  { icon: FlaskConical, color: 'bg-blue-500' },
  { icon: Microscope, color: 'bg-purple-500' },
  { icon: Dna, color: 'bg-green-500' },
  { icon: Heart, color: 'bg-red-500' },
  { icon: Brain, color: 'bg-pink-500' },
  { icon: Pill, color: 'bg-orange-500' },
  { icon: Activity, color: 'bg-teal-500' },
  { icon: TestTube, color: 'bg-indigo-500' },
] as const;

const INITIAL_FORM_DATA: LabFormData = {
  name: '',
  shortName: '',
  description: '',
};

// Custom hooks for data fetching
const useLabsData = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLabs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/labs');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch labs: ${response.statusText}`);
      }
      
      const data = await response.json();
      setLabs(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load labs';
      console.error('Error fetching labs:', error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabs();
  }, [fetchLabs]);

  return { labs, loading, error, refetch: fetchLabs };
};

// Memoized calculations
const useLabStatistics = (labs: Lab[]) => {
  return useMemo(() => ({
    totalLabs: labs.length,
    totalMembers: labs.reduce((acc, lab) => acc + lab._count.members, 0),
    totalProjects: labs.reduce((acc, lab) => acc + lab._count.projects, 0),
    totalIdeas: labs.reduce((acc, lab) => acc + lab._count.ideas, 0),
  }), [labs]);
};

// Separate component for statistics cards
const StatisticsCards = ({ statistics }: { statistics: ReturnType<typeof useLabStatistics> }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Total Labs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{statistics.totalLabs}</div>
        <p className="text-xs text-muted-foreground">Active research labs</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Total Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{statistics.totalMembers}</div>
        <p className="text-xs text-muted-foreground">Across all labs</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Active Studies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{statistics.totalProjects}</div>
        <p className="text-xs text-muted-foreground">Total projects</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Research Ideas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{statistics.totalIdeas}</div>
        <p className="text-xs text-muted-foreground">In ideation</p>
      </CardContent>
    </Card>
  </div>
);

// Separate component for lab card
const LabCard = ({ 
  lab, 
  index, 
  onEdit, 
  onNavigate 
}: { 
  lab: Lab; 
  index: number; 
  onEdit: (lab: Lab) => void;
  onNavigate: (labId: string) => void;
}) => {
  const iconData = LAB_ICONS[index % LAB_ICONS.length];
  const Icon = iconData.icon;
  const color = iconData.color;

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer relative group overflow-hidden"
      onClick={() => onNavigate(lab.id)}
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(lab);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Edit ${lab.name}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(lab.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`View ${lab.name} details`}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardTitle className="mt-4">{lab.name}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Badge variant="outline">{lab.shortName}</Badge>
          <Badge variant={lab.isActive ? "default" : "secondary"} 
                 className={lab.isActive ? "bg-green-500" : ""}>
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
};

export default function LabsPageImproved() {
  const router = useRouter();
  const { labs, loading, error, refetch } = useLabsData();
  const statistics = useLabStatistics(labs);
  
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [formData, setFormData] = useState<LabFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = useCallback((lab: Lab) => {
    setEditingLab(lab);
    setFormData({
      name: lab.name,
      shortName: lab.shortName,
      description: lab.description || '',
    });
    setIsCreateMode(false);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingLab(null);
    setFormData(INITIAL_FORM_DATA);
    setIsCreateMode(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    // Validation
    if (!formData.name.trim() || !formData.shortName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isCreateMode ? '/api/labs' : `/api/labs/${editingLab?.id}`;
      const method = isCreateMode ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save lab');
      }

      toast.success(isCreateMode ? 'Lab created successfully' : 'Lab updated successfully');
      await refetch();
      handleClose();
    } catch (error) {
      console.error('Error saving lab:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save lab');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isCreateMode, editingLab?.id, refetch]);

  const handleClose = useCallback(() => {
    setEditingLab(null);
    setIsCreateMode(false);
    setFormData(INITIAL_FORM_DATA);
  }, []);

  const handleNavigate = useCallback((labId: string) => {
    router.push(`/labs/${labId}`);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button onClick={refetch} variant="outline" size="sm" className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Research Labs</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your research laboratories and their settings
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Lab
        </Button>
      </div>

      <StatisticsCards statistics={statistics} />

      {labs.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No labs yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first research lab
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Lab
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {labs.map((lab, index) => (
            <LabCard 
              key={lab.id}
              lab={lab}
              index={index}
              onEdit={handleEdit}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={!!editingLab || isCreateMode} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? 'Create New Lab' : 'Edit Lab'}
            </DialogTitle>
            <DialogDescription>
              {isCreateMode 
                ? 'Add a new research laboratory to your organization'
                : 'Update the laboratory information and settings'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Lab Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Health Equity Research Lab"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shortName">
                Short Name / Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="shortName"
                placeholder="e.g., HERL, LAB001"
                value={formData.shortName}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value.toUpperCase() })}
                disabled={isSubmitting}
                maxLength={10}
                required
              />
              <p className="text-xs text-muted-foreground">
                A unique identifier for the lab (max 10 characters)
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the lab's research focus and goals..."
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
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isCreateMode ? 'Create Lab' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
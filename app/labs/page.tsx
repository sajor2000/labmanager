'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { showToast } from '@/components/ui/toast';
import { 
  Building, 
  Users, 
  Folder, 
  Flask,
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
  TestTube
} from 'lucide-react';

interface Lab {
  id: string;
  name: string;
  shortName: string;
  description: string | null;
  isActive: boolean;
  _count: {
    projects: number;
    members: number;
    buckets: number;
  };
}

interface LabFormData {
  name: string;
  shortName: string;
  description: string;
}

// Lab icon options
const labIcons = [
  { icon: Flask, color: 'bg-blue-500' },
  { icon: Microscope, color: 'bg-purple-500' },
  { icon: Dna, color: 'bg-green-500' },
  { icon: Heart, color: 'bg-red-500' },
  { icon: Brain, color: 'bg-pink-500' },
  { icon: Pill, color: 'bg-orange-500' },
  { icon: Activity, color: 'bg-teal-500' },
  { icon: TestTube, color: 'bg-indigo-500' },
];

export default function LabsPage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [formData, setFormData] = useState<LabFormData>({
    name: '',
    shortName: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const response = await fetch('/api/labs');
      if (!response.ok) throw new Error('Failed to fetch labs');
      const data = await response.json();
      setLabs(data);
    } catch (error) {
      console.error('Error fetching labs:', error);
      showToast.error('Failed to load labs');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lab: Lab) => {
    setEditingLab(lab);
    setFormData({
      name: lab.name,
      shortName: lab.shortName,
      description: lab.description || '',
    });
    setIsCreateMode(false);
  };

  const handleCreate = () => {
    setEditingLab(null);
    setFormData({
      name: '',
      shortName: '',
      description: '',
    });
    setIsCreateMode(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.shortName) {
      showToast.error('Please fill in all required fields');
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

      showToast.success(isCreateMode ? 'Lab created successfully' : 'Lab updated successfully');
      fetchLabs();
      handleClose();
    } catch (error) {
      console.error('Error saving lab:', error);
      showToast.error(error instanceof Error ? error.message : 'Failed to save lab');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEditingLab(null);
    setIsCreateMode(false);
    setFormData({ name: '', shortName: '', description: '' });
  };

  const getLabIcon = (index: number) => {
    const iconData = labIcons[index % labIcons.length];
    const Icon = iconData.icon;
    return { Icon, color: iconData.color };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
          {labs.map((lab, index) => {
            const { Icon, color } = getLabIcon(index);
            return (
              <Card 
                key={lab.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer relative group"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(lab)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="mt-4">{lab.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="outline">{lab.shortName}</Badge>
                    {lab.isActive ? (
                      <Badge variant="default" className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {lab.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {lab.description}
                    </p>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Members</span>
                      </div>
                      <span className="font-semibold">{lab._count.members}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Flask className="h-4 w-4" />
                        <span>Projects</span>
                      </div>
                      <span className="font-semibold">{lab._count.projects}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Folder className="h-4 w-4" />
                        <span>Buckets</span>
                      </div>
                      <span className="font-semibold">{lab._count.buckets}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={!!editingLab || isCreateMode} onOpenChange={() => handleClose()}>
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
'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Plus,
  Loader2,
  Building2,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { useLabs, useCreateLab, useUpdateLab, useDeleteLab } from '@/hooks/use-labs';
import type { Lab, LabFormData } from '@/types/lab';
import { LabCard } from '@/components/labs/lab-card-virtualized';
import { LabsPageSkeleton, StatisticsCardsSkeleton } from '@/components/labs/lab-skeleton';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// Constants
const INITIAL_FORM_DATA: LabFormData = {
  name: '',
  shortName: '',
  description: '',
};

// Statistics component
const StatisticsCards = ({ labs }: { labs: Lab[] }) => {
  const statistics = useMemo(() => ({
    totalLabs: labs.length,
    totalMembers: labs.reduce((acc, lab) => acc + lab._count.members, 0),
    totalProjects: labs.reduce((acc, lab) => acc + lab._count.projects, 0),
    totalIdeas: labs.reduce((acc, lab) => acc + lab._count.ideas, 0),
  }), [labs]);

  return (
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
};

export default function LabsPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLabIndex, setSelectedLabIndex] = useState<number>(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [formData, setFormData] = useState<LabFormData>(INITIAL_FORM_DATA);

  // React Query hooks
  const { data: labs = [], isLoading, error, refetch } = useLabs();
  const createLabMutation = useCreateLab();
  const updateLabMutation = useUpdateLab(editingLab?.id || '');
  const deleteLabMutation = useDeleteLab();

  // Filter labs based on search
  const filteredLabs = useMemo(() => {
    if (!searchQuery) return labs;
    const query = searchQuery.toLowerCase();
    return labs.filter(lab => 
      lab.name.toLowerCase().includes(query) ||
      lab.shortName.toLowerCase().includes(query) ||
      lab.description?.toLowerCase().includes(query)
    );
  }, [labs, searchQuery]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && e.ctrlKey) {
        e.preventDefault();
        document.getElementById('search-labs')?.focus();
      }
      if (e.key === 'n' && e.ctrlKey) {
        e.preventDefault();
        handleCreate();
      }
      if (e.key === 'Escape') {
        setSelectedLabIndex(-1);
      }
      if (e.key === 'ArrowDown' && selectedLabIndex < filteredLabs.length - 1) {
        setSelectedLabIndex(prev => prev + 1);
      }
      if (e.key === 'ArrowUp' && selectedLabIndex > 0) {
        setSelectedLabIndex(prev => prev - 1);
      }
      if (e.key === 'Enter' && selectedLabIndex >= 0 && filteredLabs[selectedLabIndex]) {
        router.push(`/labs/${filteredLabs[selectedLabIndex].id}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLabIndex, filteredLabs, router]);

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
    if (!formData.name.trim() || !formData.shortName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (isCreateMode) {
        await createLabMutation.mutateAsync(formData);
      } else if (editingLab) {
        await updateLabMutation.mutateAsync(formData);
      }
      handleClose();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  }, [formData, isCreateMode, editingLab, createLabMutation, updateLabMutation]);

  const handleDelete = useCallback(async (labId: string) => {
    if (!confirm('Are you sure you want to delete this lab? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteLabMutation.mutateAsync(labId);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  }, [deleteLabMutation]);

  const handleClose = useCallback(() => {
    setEditingLab(null);
    setIsCreateMode(false);
    setFormData(INITIAL_FORM_DATA);
  }, []);

  // Loading state with skeleton
  if (isLoading) {
    return <LabsPageSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load labs. Please try again.
            <Button onClick={() => refetch()} variant="outline" size="sm" className="ml-4">
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

      {/* Search and Filter Bar */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search-labs"
            type="search"
            placeholder="Search labs... (Ctrl+/)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Statistics Cards */}
      <StatisticsCards labs={filteredLabs} />

      {filteredLabs.length === 0 ? (
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
          {filteredLabs.map((lab, index) => (
            <LabCard
              key={lab.id}
              lab={lab}
              index={index}
              onEdit={handleEdit}
              isSelected={selectedLabIndex === index}
            />
          ))}
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
                disabled={createLabMutation.isPending || updateLabMutation.isPending}
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
                disabled={createLabMutation.isPending || updateLabMutation.isPending}
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
                disabled={createLabMutation.isPending || updateLabMutation.isPending}
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
              {(createLabMutation.isPending || updateLabMutation.isPending) && 
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isCreateMode ? 'Create Lab' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLab } from '@/lib/contexts/lab-context';
import { IdeasPageSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertCircle, Plus, Search, Filter, Lightbulb, 
  TrendingUp, MessageCircle, ThumbsUp, Award 
} from 'lucide-react';
import { 
  useIdeas, 
  useCreateIdea, 
  useUpdateIdea, 
  useDeleteIdea,
  useVoteIdea,
  useCommentIdea 
} from '@/hooks/use-api';
import { debounce } from 'lodash';
import type { IdeaFilters, CreateIdeaPayload, UpdateIdeaPayload } from '@/types/idea';
import { IdeaCard } from '@/components/ideas/idea-card';
import { IdeaCreationDialog } from '@/components/ideas/idea-creation-dialog';
import { IdeaDetailModal } from '@/components/ideas/idea-detail-modal';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type SortOption = 'created' | 'votes' | 'feasibility' | 'impact' | 'priority';
type ViewMode = 'grid' | 'list' | 'kanban';

export default function IdeasPage() {
  const { currentLab, isLoading: labLoading } = useLab();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<IdeaFilters>({
    searchTerm: '',
    category: undefined,
    status: 'active',
    priority: undefined,
    stage: undefined,
  });
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'converted'>('active');

  // React Query hooks
  const { 
    data: ideas = [], 
    isLoading: ideasLoading, 
    error: ideasError,
    refetch: refetchIdeas 
  } = useIdeas(currentLab?.id, filters);
  
  const createMutation = useCreateIdea();
  const updateMutation = useUpdateIdea();
  const deleteMutation = useDeleteIdea();
  const voteMutation = useVoteIdea();
  const commentMutation = useCommentIdea();

  // Computed values
  const sortedIdeas = useMemo(() => {
    const sorted = [...ideas];
    
    sorted.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'created':
          compareValue = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'votes':
          const aVotes = (a.upvotes || 0) - (a.downvotes || 0);
          const bVotes = (b.upvotes || 0) - (b.downvotes || 0);
          compareValue = bVotes - aVotes;
          break;
        case 'feasibility':
          compareValue = (b.feasibilityScore || 0) - (a.feasibilityScore || 0);
          break;
        case 'impact':
          compareValue = (b.impactScore || 0) - (a.impactScore || 0);
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          compareValue = priorityOrder[b.priority || 'medium'] - priorityOrder[a.priority || 'medium'];
          break;
      }

      return sortOrder === 'desc' ? compareValue : -compareValue;
    });

    return sorted;
  }, [ideas, sortBy, sortOrder]);

  // Metrics
  const metrics = useMemo(() => {
    const total = ideas.length;
    const highPriority = ideas.filter(i => i.priority === 'high' || i.priority === 'critical').length;
    const totalVotes = ideas.reduce((sum, idea) => sum + (idea.upvotes || 0), 0);
    const avgFeasibility = ideas.length > 0 
      ? ideas.reduce((sum, idea) => sum + (idea.feasibilityScore || 0), 0) / ideas.length 
      : 0;

    return { total, highPriority, totalVotes, avgFeasibility };
  }, [ideas]);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setFilters(prev => ({ ...prev, searchTerm: value }));
    }, 300),
    []
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setCreateDialogOpen(true);
      }
      if (e.key === 'Escape' && selectedIdea) {
        setSelectedIdea(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdea]);

  // Handlers
  const handleCreateIdea = useCallback(async (data: CreateIdeaPayload) => {
    if (!currentLab?.id) {
      toast.error('No lab selected');
      return;
    }
    
    try {
      await createMutation.mutateAsync({
        ...data,
        labId: currentLab.id,
      });
      setCreateDialogOpen(false);
      toast.success('Idea created successfully');
    } catch (error) {
      console.error('Failed to create idea:', error);
    }
  }, [currentLab?.id, createMutation]);

  const handleVote = useCallback(async (ideaId: string, voteType: 'up' | 'down') => {
    try {
      await voteMutation.mutateAsync({ ideaId, voteType });
      toast.success(`Vote ${voteType === 'up' ? 'added' : 'removed'}`);
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  }, [voteMutation]);

  const handleComment = useCallback(async (ideaId: string, content: string) => {
    try {
      await commentMutation.mutateAsync({ ideaId, content });
      toast.success('Comment added');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  }, [commentMutation]);

  const handleStatusChange = useCallback(async (ideaId: string, status: string) => {
    try {
      await updateMutation.mutateAsync({ id: ideaId, status });
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }, [updateMutation]);

  const handleConvertToStudy = useCallback(async (ideaId: string) => {
    if (!confirm('Convert this idea to a formal study?')) return;
    
    try {
      await updateMutation.mutateAsync({ 
        id: ideaId, 
        status: 'converted',
        stage: 'implemented' 
      });
      toast.success('Idea converted to study');
    } catch (error) {
      console.error('Failed to convert idea:', error);
    }
  }, [updateMutation]);

  const handleDelete = useCallback(async (ideaId: string) => {
    if (!confirm('Are you sure you want to delete this idea?')) return;
    
    try {
      await deleteMutation.mutateAsync(ideaId);
      toast.success('Idea deleted successfully');
      setSelectedIdea(null);
    } catch (error) {
      console.error('Failed to delete idea:', error);
    }
  }, [deleteMutation]);

  // Loading state
  if (labLoading || ideasLoading) {
    return <IdeasPageSkeleton />;
  }

  // Error state
  if (ideasError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load ideas</span>
            <Button onClick={() => refetchIdeas()} size="sm" variant="outline" className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No lab selected
  if (!currentLab) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">No lab selected</h2>
          <p className="mt-2 text-muted-foreground">
            Please select a lab from the top navigation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Lightbulb className="h-8 w-8" />
                Ideas Board
              </h1>
              <p className="text-muted-foreground">
                Collaborate on research ideas and innovations
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Idea
            </Button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Total Ideas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  High Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{metrics.highPriority}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Total Votes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{metrics.totalVotes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Avg Feasibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {metrics.avgFeasibility.toFixed(1)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Sorting */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search ideas... (Ctrl+/)"
                className="pl-9"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
            
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                category: value === 'all' ? undefined : value 
              }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="methodology">Methodology</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="collaboration">Collaboration</SelectItem>
                <SelectItem value="process">Process</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.priority}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                priority: value === 'all' ? undefined : value 
              }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.stage}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                stage: value === 'all' ? undefined : value 
              }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="concept">Concept</SelectItem>
                <SelectItem value="evaluation">Evaluation</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="implementation">Implementation</SelectItem>
                <SelectItem value="implemented">Implemented</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Newest First</SelectItem>
                <SelectItem value="votes">Most Voted</SelectItem>
                <SelectItem value="feasibility">Feasibility</SelectItem>
                <SelectItem value="impact">Impact</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Ideas</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
            <TabsTrigger value="converted">Converted to Studies</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {sortedIdeas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Lightbulb className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No ideas found</h3>
                <p className="text-muted-foreground mb-4">
                  {filters.searchTerm || filters.category || filters.priority || filters.stage
                    ? 'Try adjusting your filters'
                    : 'Be the first to share an idea!'}
                </p>
                {!filters.searchTerm && !filters.category && !filters.priority && !filters.stage && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Share Your First Idea
                  </Button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedIdeas.map(idea => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onVote={handleVote}
                    onClick={() => setSelectedIdea(idea.id)}
                    onConvert={() => handleConvertToStudy(idea.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedIdeas.map(idea => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onVote={handleVote}
                    onClick={() => setSelectedIdea(idea.id)}
                    onConvert={() => handleConvertToStudy(idea.id)}
                    variant="list"
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <IdeaCreationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateIdea}
      />
      
      {selectedIdea && (
        <IdeaDetailModal
          ideaId={selectedIdea}
          open={!!selectedIdea}
          onOpenChange={(open) => !open && setSelectedIdea(null)}
          onVote={handleVote}
          onComment={handleComment}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onConvert={handleConvertToStudy}
        />
      )}
    </div>
  );
}
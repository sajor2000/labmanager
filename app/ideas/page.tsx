'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IdeaCard } from '@/components/ideas/idea-card';
import { IdeaCreationForm } from '@/components/ideas/idea-creation-form';
import { IdeaFilters } from '@/components/ideas/idea-filters';
import { IdeaDetailModal } from '@/components/ideas/idea-detail-modal';
import { showToast } from '@/components/ui/toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { IdeaWithFullRelations } from '@/types/ideas';

export default function IdeasPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [ideas, setIdeas] = useState<IdeaWithFullRelations[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<IdeaWithFullRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<IdeaWithFullRelations | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'ACTIVE',
    priority: 'all',
    stage: 'all',
    sortBy: 'created',
    sortOrder: 'desc',
  });

  // Fetch ideas
  useEffect(() => {
    fetchIdeas();
  }, []);

  // Apply filters whenever ideas or filters change
  useEffect(() => {
    applyFilters();
  }, [ideas, filters]);

  const fetchIdeas = async () => {
    try {
      const response = await fetch('/api/ideas');
      if (!response.ok) throw new Error('Failed to fetch ideas');
      const data = await response.json();
      setIdeas(data);
    } catch (error) {
      console.error('Error fetching ideas:', error);
      showToast({
        type: 'error',
        title: 'Failed to load ideas',
        message: 'Please try refreshing the page',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...ideas];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (idea) =>
          idea.title.toLowerCase().includes(searchLower) ||
          idea.description.toLowerCase().includes(searchLower) ||
          idea.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter((idea) => idea.category === filters.category);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((idea) => idea.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter((idea) => idea.priority === filters.priority);
    }

    // Stage filter
    if (filters.stage !== 'all') {
      filtered = filtered.filter((idea) => idea.stage === filters.stage);
    }

    // Sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (filters.sortBy) {
        case 'created':
          compareValue = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'votes':
          const aVotes = a.votes.filter(v => v.voteType === 'UP').length - 
                         a.votes.filter(v => v.voteType === 'DOWN').length;
          const bVotes = b.votes.filter(v => v.voteType === 'UP').length - 
                         b.votes.filter(v => v.voteType === 'DOWN').length;
          compareValue = bVotes - aVotes;
          break;
        case 'feasibility':
          compareValue = (b.feasibilityScore || 0) - (a.feasibilityScore || 0);
          break;
        case 'impact':
          compareValue = (b.impactScore || 0) - (a.impactScore || 0);
          break;
        case 'priority':
          const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          compareValue = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
      }

      return filters.sortOrder === 'desc' ? compareValue : -compareValue;
    });

    setFilteredIdeas(filtered);
  };

  const handleCreateIdea = async (ideaData: any) => {
    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ideaData),
      });

      if (!response.ok) throw new Error('Failed to create idea');

      const newIdea = await response.json();
      setIdeas([newIdea, ...ideas]);
      showToast({
        type: 'success',
        title: 'Idea created',
        message: 'Your idea has been submitted successfully',
      });
    } catch (error) {
      console.error('Error creating idea:', error);
      showToast({
        type: 'error',
        title: 'Failed to create idea',
        message: 'Please try again',
      });
      throw error;
    }
  };

  const handleVote = async (ideaId: string, voteType: 'UP' | 'DOWN') => {
    if (!user?.id) {
      showToast({
        type: 'error',
        title: 'Authentication required',
        message: 'Please sign in to vote',
      });
      return;
    }

    try {
      const response = await fetch(`/api/ideas/${ideaId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType }),
      });

      if (!response.ok) throw new Error('Failed to vote');

      const updatedIdea = await response.json();
      setIdeas(ideas.map(idea => idea.id === ideaId ? updatedIdea : idea));
      
      // Update selected idea if it's open
      if (selectedIdea?.id === ideaId) {
        setSelectedIdea(updatedIdea);
      }
    } catch (error) {
      console.error('Error voting:', error);
      showToast({
        type: 'error',
        title: 'Failed to vote',
        message: 'Please try again',
      });
    }
  };

  const handleComment = async (ideaId: string, content: string) => {
    if (!user?.id) {
      showToast({
        type: 'error',
        title: 'Authentication required',
        message: 'Please sign in to comment',
      });
      return;
    }

    try {
      const response = await fetch(`/api/ideas/${ideaId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Failed to add comment');

      const updatedIdea = await response.json();
      setIdeas(ideas.map(idea => idea.id === ideaId ? updatedIdea : idea));
      
      // Update selected idea if it's open
      if (selectedIdea?.id === ideaId) {
        setSelectedIdea(updatedIdea);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  const handleStatusChange = async (ideaId: string, status: string) => {
    try {
      const response = await fetch(`/api/ideas/${ideaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      const updatedIdea = await response.json();
      setIdeas(ideas.map(idea => idea.id === ideaId ? updatedIdea : idea));
      
      // Update selected idea if it's open
      if (selectedIdea?.id === ideaId) {
        setSelectedIdea(updatedIdea);
      }

      showToast({
        type: 'success',
        title: 'Status updated',
        message: `Idea has been ${status.toLowerCase()}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      showToast({
        type: 'error',
        title: 'Failed to update status',
        message: 'Please try again',
      });
    }
  };

  const handleDelete = async (ideaId: string) => {
    if (!confirm('Are you sure you want to delete this idea?')) return;

    try {
      const response = await fetch(`/api/ideas/${ideaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete idea');

      setIdeas(ideas.filter(idea => idea.id !== ideaId));
      setSelectedIdea(null);
      
      showToast({
        type: 'success',
        title: 'Idea deleted',
        message: 'The idea has been deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting idea:', error);
      showToast({
        type: 'error',
        title: 'Failed to delete idea',
        message: 'Please try again',
      });
    }
  };

  if (isLoading || userLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Ideas Board</h1>
          <p className="text-muted-foreground mt-1">
            Collaborate on research ideas and innovations
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Idea
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <IdeaFilters filters={filters} onFilterChange={setFilters} />
        </div>

        <div className="lg:col-span-3">
          {filteredIdeas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.category !== 'all' || filters.priority !== 'all' || filters.stage !== 'all'
                  ? 'No ideas match your filters'
                  : 'No ideas yet. Be the first to share one!'}
              </p>
              {(filters.search || filters.category !== 'all' || filters.priority !== 'all' || filters.stage !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => setFilters({
                    search: '',
                    category: 'all',
                    status: 'ACTIVE',
                    priority: 'all',
                    stage: 'all',
                    sortBy: 'created',
                    sortOrder: 'desc',
                  })}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  currentUserId={user?.id}
                  onVote={handleVote}
                  onViewDetails={(idea) => {
                    // Find the full idea with comments from our state
                    const fullIdea = ideas.find(i => i.id === idea.id);
                    if (fullIdea) {
                      setSelectedIdea(fullIdea);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <IdeaCreationForm
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onSubmit={handleCreateIdea}
        labId={'default-lab'} // TODO: Get from user's selected lab
        userId={user?.id || ''}
      />

      <IdeaDetailModal
        idea={selectedIdea}
        isOpen={!!selectedIdea}
        onClose={() => setSelectedIdea(null)}
        currentUserId={user?.id}
        onVote={handleVote}
        onComment={handleComment}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  );
}
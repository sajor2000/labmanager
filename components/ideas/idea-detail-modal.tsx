'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowUp, 
  ArrowDown, 
  Calendar, 
  User, 
  Target,
  DollarSign,
  Clock,
  Users,
  MessageSquare,
  Edit,
  Rocket,
  Archive,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { showToast } from '@/components/ui/toast';
import type { IdeaWithFullRelations } from '@/types/ideas';

interface IdeaDetailModalProps {
  idea: IdeaWithFullRelations | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  onVote: (ideaId: string, voteType: 'UP' | 'DOWN') => void;
  onComment: (ideaId: string, content: string) => Promise<void>;
  onStatusChange?: (ideaId: string, status: string) => Promise<void>;
  onConvertToProject?: (idea: IdeaWithFullRelations) => void;
  onEdit?: (idea: IdeaWithFullRelations) => void;
  onDelete?: (ideaId: string) => Promise<void>;
}

const categoryColors = {
  RESEARCH_QUESTION: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  METHOD_IMPROVEMENT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  COLLABORATION: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  GRANT_OPPORTUNITY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  TECHNOLOGY: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export function IdeaDetailModal({ 
  idea, 
  isOpen, 
  onClose, 
  currentUserId,
  onVote,
  onComment,
  onStatusChange,
  onConvertToProject,
  onEdit,
  onDelete
}: IdeaDetailModalProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  if (!idea) return null;
  
  const userVote = idea.votes.find(v => v.userId === currentUserId);
  const upvotes = idea.votes.filter(v => v.voteType === 'UP').length;
  const downvotes = idea.votes.filter(v => v.voteType === 'DOWN').length;
  const netVotes = upvotes - downvotes;
  const isOwner = idea.createdById === currentUserId;
  
  const handleComment = async () => {
    if (!newComment.trim() || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    try {
      await onComment(idea.id, newComment);
      setNewComment('');
      showToast({
        type: 'success',
        title: 'Comment added',
        message: 'Your comment has been posted',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to add comment',
        message: 'Please try again',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl pr-4">{idea.title}</DialogTitle>
            <div className="flex items-center gap-2">
              {isOwner && onEdit && (
                <Button variant="ghost" size="sm" onClick={() => onEdit(idea)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {idea.status === 'APPROVED' && onConvertToProject && (
                <Button variant="default" size="sm" onClick={() => onConvertToProject(idea)}>
                  <Rocket className="h-4 w-4 mr-2" />
                  Convert to Project
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Meta information */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{idea.createdBy.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(idea.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
          
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={categoryColors[idea.category]}>
              {idea.category.replace(/_/g, ' ')}
            </Badge>
            <Badge variant="outline">
              {idea.stage.replace(/_/g, ' ')}
            </Badge>
            <Badge variant={
              idea.priority === 'CRITICAL' ? 'destructive' :
              idea.priority === 'HIGH' ? 'destructive' :
              idea.priority === 'LOW' ? 'secondary' :
              'default'
            }>
              {idea.priority} Priority
            </Badge>
            <Badge variant={
              idea.status === 'APPROVED' ? 'default' :
              idea.status === 'REJECTED' ? 'destructive' :
              idea.status === 'ACTIVE' ? 'secondary' :
              'outline'
            }>
              {idea.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          
          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{idea.description}</p>
          </div>
          
          {/* Scores and metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {idea.feasibilityScore && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Feasibility</span>
                </div>
                <p className="text-2xl font-semibold">{idea.feasibilityScore}/10</p>
              </div>
            )}
            
            {idea.impactScore && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Impact</span>
                </div>
                <p className="text-2xl font-semibold">{idea.impactScore}/10</p>
              </div>
            )}
            
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Resources</span>
              </div>
              <p className="text-lg font-semibold">{idea.resourceRequirement}</p>
            </div>
            
            {idea.estimatedDuration && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Duration</span>
                </div>
                <p className="text-lg font-semibold">{idea.estimatedDuration}</p>
              </div>
            )}
          </div>
          
          {/* Required skills */}
          {idea.requiredSkills.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {idea.requiredSkills.map((skill, i) => (
                  <Badge key={i} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Potential collaborators */}
          {idea.potentialCollaborators.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Potential Collaborators
              </h3>
              <div className="flex flex-wrap gap-2">
                {idea.potentialCollaborators.map((collaborator, i) => (
                  <Badge key={i} variant="outline">{collaborator}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Tags */}
          {idea.tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {idea.tags.map((tag, i) => (
                  <Badge key={i} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Voting section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={userVote?.voteType === 'UP' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onVote(idea.id, 'UP')}
                >
                  <ArrowUp className="h-4 w-4 mr-1" />
                  {upvotes}
                </Button>
                
                <Button
                  variant={userVote?.voteType === 'DOWN' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onVote(idea.id, 'DOWN')}
                >
                  <ArrowDown className="h-4 w-4 mr-1" />
                  {downvotes}
                </Button>
                
                <span className={`ml-2 font-medium ${
                  netVotes > 0 ? 'text-green-600 dark:text-green-400' : 
                  netVotes < 0 ? 'text-red-600 dark:text-red-400' : 
                  'text-muted-foreground'
                }`}>
                  {netVotes > 0 && '+'}{netVotes} votes
                </span>
              </div>
              
              {onStatusChange && (
                <div className="flex items-center gap-2">
                  {idea.status === 'ACTIVE' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onStatusChange(idea.id, 'ARCHIVED')}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </Button>
                      {isOwner && onDelete && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(idea.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Comments section */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({idea.comments?.length || 0})
            </h3>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={handleComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                >
                  Post
                </Button>
              </div>
              
              {idea.comments?.map((comment) => (
                <div key={comment.id} className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{comment.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowUp, 
  ArrowDown, 
  MessageSquare, 
  Calendar, 
  User, 
  Lightbulb,
  Target,
  DollarSign,
  Clock,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import type { IdeaWithBasicRelations } from '@/types/ideas';

interface IdeaCardProps {
  idea: IdeaWithBasicRelations;
  currentUserId?: string;
  onVote: (ideaId: string, voteType: 'UP' | 'DOWN') => void;
  onViewDetails: (idea: IdeaWithBasicRelations) => void;
  onEdit?: (idea: IdeaWithBasicRelations) => void;
}

const categoryColors = {
  RESEARCH_QUESTION: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  METHOD_IMPROVEMENT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  COLLABORATION: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  GRANT_OPPORTUNITY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  TECHNOLOGY: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

const stageIcons = {
  CONCEPT: Lightbulb,
  EVALUATION: Target,
  PLANNING: Clock,
  APPROVED: Target,
  IN_PROGRESS: Clock,
  COMPLETED: Target,
};

export function IdeaCard({ 
  idea, 
  currentUserId, 
  onVote, 
  onViewDetails,
  onEdit 
}: IdeaCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  
  const userVote = idea.votes?.find(v => v.userId === currentUserId);
  const upvotes = idea.votes?.filter(v => v.voteType === 'UP').length || 0;
  const downvotes = idea.votes?.filter(v => v.voteType === 'DOWN').length || 0;
  const netVotes = upvotes - downvotes;
  
  const StageIcon = stageIcons[idea.stage] || Lightbulb;
  
  const handleVote = async (voteType: 'UP' | 'DOWN') => {
    if (isVoting) return;
    setIsVoting(true);
    try {
      await onVote(idea.id, voteType);
    } finally {
      setIsVoting(false);
    }
  };
  
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onViewDetails(idea)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-2">{idea.title}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{idea.createdBy.name}</span>
              <span>•</span>
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(idea.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <StageIcon className="h-5 w-5 text-muted-foreground" />
            <Badge variant="outline" className="text-xs">
              {idea.stage.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {idea.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge className={categoryColors[idea.category]}>
            {idea.category.replace(/_/g, ' ')}
          </Badge>
          
          {idea.priority !== 'MEDIUM' && (
            <Badge variant={idea.priority === 'HIGH' || idea.priority === 'CRITICAL' ? 'destructive' : 'secondary'}>
              {idea.priority}
            </Badge>
          )}
          
          {idea.tags?.slice(0, 2).map((tag, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {idea.tags && idea.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{idea.tags.length - 2}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          {idea.feasibilityScore && (
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Feasibility:</span>
              <span className="font-medium">{idea.feasibilityScore}/10</span>
            </div>
          )}
          
          {idea.impactScore && (
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Impact:</span>
              <span className="font-medium">{idea.impactScore}/10</span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Resources:</span>
            <span className="font-medium">{idea.resourceRequirement}</span>
          </div>
          
          {idea.estimatedDuration && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{idea.estimatedDuration}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <Button
              variant={userVote?.voteType === 'UP' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleVote('UP')}
              disabled={isVoting}
              className="h-8"
            >
              <ArrowUp className="h-4 w-4 mr-1" />
              {upvotes}
            </Button>
            
            <Button
              variant={userVote?.voteType === 'DOWN' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleVote('DOWN')}
              disabled={isVoting}
              className="h-8"
            >
              <ArrowDown className="h-4 w-4 mr-1" />
              {downvotes}
            </Button>
            
            <span className={`ml-2 font-medium ${
              netVotes > 0 ? 'text-green-600 dark:text-green-400' : 
              netVotes < 0 ? 'text-red-600 dark:text-red-400' : 
              'text-muted-foreground'
            }`}>
              {netVotes > 0 && '+'}{netVotes}
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-muted-foreground">
            {idea._count?.comments !== undefined && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">{idea._count.comments}</span>
              </div>
            )}
            
            {idea.potentialCollaborators.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">{idea.potentialCollaborators.length}</span>
              </div>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
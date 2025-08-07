// Idea related types
export interface Idea {
  id: string;
  title: string;
  description: string;
  status: IdeaStatus;
  category: string | null;
  impact: ImpactLevel | null;
  effort: EffortLevel | null;
  votes: number;
  labId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  author?: {
    id: string;
    name: string | null;
    email: string;
    initials: string | null;
    avatar: string | null;
  };
  lab?: {
    id: string;
    name: string;
    shortName: string;
  };
  voters?: IdeaVote[];
  comments?: IdeaComment[];
  _count?: {
    voters: number;
    comments: number;
  };
}

export interface IdeaVote {
  id: string;
  ideaId: string;
  userId: string;
  votedAt: string;
  user: {
    id: string;
    name: string | null;
    initials: string | null;
    avatar: string | null;
  };
}

export interface IdeaComment {
  id: string;
  ideaId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    initials: string | null;
    avatar: string | null;
  };
}

export type IdeaStatus = 
  | 'New'
  | 'Under Review'
  | 'In Development'
  | 'Approved'
  | 'Rejected'
  | 'Archived';

export type ImpactLevel = 'Low' | 'Medium' | 'High';
export type EffortLevel = 'Low' | 'Medium' | 'High';

export interface CreateIdeaPayload {
  title: string;
  description: string;
  status?: IdeaStatus;
  category?: string;
  impact?: ImpactLevel;
  effort?: EffortLevel;
  labId: string;
}

export interface UpdateIdeaPayload extends Partial<CreateIdeaPayload> {
  isActive?: boolean;
}

export interface IdeaFilters {
  status?: IdeaStatus;
  category?: string;
  impact?: ImpactLevel;
  effort?: EffortLevel;
  labId?: string;
  authorId?: string;
  searchTerm?: string;
  sortBy?: 'votes' | 'recent' | 'comments';
}

export interface VotePayload {
  ideaId: string;
  action: 'upvote' | 'downvote';
}

export interface CommentPayload {
  ideaId: string;
  content: string;
}
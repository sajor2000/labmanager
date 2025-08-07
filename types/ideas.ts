import type { Idea, IdeaVote, IdeaComment, User as PrismaUser } from '@prisma/client';

// Base interface for ideas with minimal relations
export interface IdeaWithBasicRelations extends Idea {
  createdBy: PrismaUser;
  votes: IdeaVote[];
  _count?: {
    comments: number;
    relatedStudies: number;
  };
}

// Full interface for ideas with all relations
export interface IdeaWithFullRelations extends IdeaWithBasicRelations {
  comments: Array<IdeaComment & { user: PrismaUser }>;
}
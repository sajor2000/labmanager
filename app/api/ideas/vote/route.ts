import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for voting
const VoteSchema = z.object({
  ideaId: z.string().min(1),
  userId: z.string().min(1),
  voteType: z.enum(['UP', 'DOWN']),
});

// POST /api/ideas/vote - Vote on an idea
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = VoteSchema.parse(body);
    const { ideaId, userId, voteType } = validatedData;
    
    // Check if user already voted on this idea
    const existingVote = await prisma.ideaVote.findUnique({
      where: {
        ideaId_userId: {
          ideaId,
          userId,
        },
      },
    });
    
    let vote;
    let voteChange = 0;
    
    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote if clicking the same vote type
        await prisma.ideaVote.delete({
          where: { id: existingVote.id },
        });
        voteChange = voteType === 'UP' ? -1 : 1;
        vote = null;
      } else {
        // Update vote type
        vote = await prisma.ideaVote.update({
          where: { id: existingVote.id },
          data: { voteType },
        });
        voteChange = voteType === 'UP' ? 2 : -2; // From down to up or vice versa
      }
    } else {
      // Create new vote
      vote = await prisma.ideaVote.create({
        data: {
          ideaId,
          userId,
          voteType,
        },
      });
      voteChange = voteType === 'UP' ? 1 : -1;
    }
    
    // Update the idea's vote score
    await prisma.idea.update({
      where: { id: ideaId },
      data: {
        voteScore: {
          increment: voteChange,
        },
      },
    });
    
    // Get updated vote counts
    const voteCounts = await prisma.ideaVote.groupBy({
      by: ['voteType'],
      where: { ideaId },
      _count: {
        voteType: true,
      },
    });
    
    const upvotes = voteCounts.find(v => v.voteType === 'UP')?._count.voteType || 0;
    const downvotes = voteCounts.find(v => v.voteType === 'DOWN')?._count.voteType || 0;
    
    return NextResponse.json({
      vote,
      voteScore: upvotes - downvotes,
      upvotes,
      downvotes,
      userVote: vote?.voteType || null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error voting on idea:', error);
    return NextResponse.json(
      { error: 'Failed to vote on idea' },
      { status: 500 }
    );
  }
}

// GET /api/ideas/vote - Get user's vote for an idea
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ideaId = searchParams.get('ideaId');
    const userId = searchParams.get('userId');
    
    if (!ideaId || !userId) {
      return NextResponse.json(
        { error: 'Idea ID and User ID are required' },
        { status: 400 }
      );
    }
    
    const vote = await prisma.ideaVote.findUnique({
      where: {
        ideaId_userId: {
          ideaId,
          userId,
        },
      },
    });
    
    return NextResponse.json({
      userVote: vote?.voteType || null,
    });
  } catch (error) {
    console.error('Error getting user vote:', error);
    return NextResponse.json(
      { error: 'Failed to get user vote' },
      { status: 500 }
    );
  }
}
import { PrismaClient, Prisma } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import OpenAIService from './openai.service';
import AudioUploadService from './audio-upload.service';
import TranscriptArchiveService from './transcript-archive.service';

// Initialize Prisma with Accelerate
const prisma = new PrismaClient().$extends(withAccelerate());

export interface CreateStandupInput {
  labId: string;
  date?: Date;
  participantIds?: string[];
}

export interface UpdateStandupInput {
  id: string;
  transcript?: string;
  audioUrl?: string;
  isActive?: boolean;
}

export interface StandupWithRelations extends Prisma.StandupGetPayload<{
  include: {
    lab: true;
    participants: {
      include: {
        user: true;
      };
    };
    actionItems: {
      include: {
        assignee: true;
      };
    };
    blockers: true;
    decisions: true;
    transcriptArchive: true;
  };
}> {}

export class StandupService {
  /**
   * Create a new standup
   */
  static async createStandup(
    input: CreateStandupInput
  ): Promise<StandupWithRelations> {
    const { labId, date = new Date(), participantIds = [] } = input;

    return await prisma.standup.create({
      data: {
        labId,
        date,
        participants: {
          create: participantIds.map(userId => ({
            userId,
          })),
        },
      },
      include: {
        lab: true,
        participants: {
          include: {
            user: true,
          },
        },
        actionItems: {
          include: {
            assignee: true,
          },
        },
        blockers: true,
        decisions: true,
        transcriptArchive: true,
      },
    });
  }

  /**
   * Get standup by ID
   */
  static async getStandupById(
    standupId: string
  ): Promise<StandupWithRelations | null> {
    return await prisma.standup.findUnique({
      where: { id: standupId },
      include: {
        lab: true,
        participants: {
          include: {
            user: true,
          },
        },
        actionItems: {
          include: {
            assignee: true,
          },
        },
        blockers: true,
        decisions: true,
        transcriptArchive: true,
      },
    });
  }

  /**
   * Get all standups for a lab
   */
  static async getStandupsByLab(
    labId: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: 'date' | 'createdAt';
      order?: 'asc' | 'desc';
    }
  ): Promise<StandupWithRelations[]> {
    const {
      limit = 20,
      offset = 0,
      orderBy = 'date',
      order = 'desc',
    } = options || {};

    return await prisma.standup.findMany({
      where: { labId, isActive: true },
      include: {
        lab: true,
        participants: {
          include: {
            user: true,
          },
        },
        actionItems: {
          include: {
            assignee: true,
          },
        },
        blockers: true,
        decisions: true,
        transcriptArchive: true,
      },
      orderBy: { [orderBy]: order },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Update standup
   */
  static async updateStandup(
    input: UpdateStandupInput
  ): Promise<StandupWithRelations> {
    const { id, ...data } = input;

    return await prisma.standup.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        lab: true,
        participants: {
          include: {
            user: true,
          },
        },
        actionItems: {
          include: {
            assignee: true,
          },
        },
        blockers: true,
        decisions: true,
        transcriptArchive: true,
      },
    });
  }

  /**
   * Process audio and create full standup with analysis
   */
  static async processStandupAudio(
    standupId: string,
    audioBuffer: Buffer,
    mimeType: string
  ): Promise<{
    success: boolean;
    standup?: StandupWithRelations;
    error?: string;
  }> {
    try {
      // 1. Upload audio file
      const uploadResult = await AudioUploadService.uploadAudioFile(
        standupId,
        audioBuffer,
        { allowedTypes: [mimeType] }
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.message);
      }

      // 2. Transcribe audio
      const transcriptionResult = await OpenAIService.transcribeAudioBuffer(
        audioBuffer,
        `standup-${standupId}.webm`
      );

      if (!transcriptionResult.success || !transcriptionResult.transcript) {
        throw new Error(transcriptionResult.error || 'Transcription failed');
      }

      // 3. Save transcript to archive and update standup with audio URL
      await TranscriptArchiveService.createTranscriptArchive({
        standupId,
        transcript: transcriptionResult.transcript,
        audioUrl: uploadResult.audioUrl,
        // TODO: Add duration from audio file if available
      });

      await prisma.standup.update({
        where: { id: standupId },
        data: {
          audioUrl: uploadResult.audioUrl,
        },
      });

      // 4. Analyze transcript
      const analysisResult = await OpenAIService.analyzeTranscript(
        transcriptionResult.transcript
      );

      if (!analysisResult.success || !analysisResult.data) {
        throw new Error(analysisResult.error || 'Analysis failed');
      }

      // 5. Create related records in a transaction
      const standup = await prisma.$transaction(async tx => {
        // Create action items
        if (analysisResult.data!.actionItems.length > 0) {
          // Process action items with async operations
          const actionItemsData = await Promise.all(
            analysisResult.data!.actionItems.map(async item => ({
              standupId,
              description: item.description,
              assigneeId: item.assignee
                ? await this.findUserByName(item.assignee)
                : null,
              dueDate: item.dueDate ? new Date(item.dueDate) : null,
            }))
          );
          
          await tx.actionItem.createMany({
            data: actionItemsData,
          });
        }

        // Create blockers
        if (analysisResult.data!.blockers.length > 0) {
          await tx.blocker.createMany({
            data: analysisResult.data!.blockers.map(blocker => ({
              standupId,
              description: blocker.description,
              resolved: blocker.resolved,
            })),
          });
        }

        // Create decisions
        if (analysisResult.data!.decisions.length > 0) {
          await tx.decision.createMany({
            data: analysisResult.data!.decisions.map(decision => ({
              standupId,
              description: decision.description,
            })),
          });
        }

        // Update participants if found
        if (analysisResult.data!.participants.length > 0) {
          const participantIds = await Promise.all(
            analysisResult.data!.participants.map(name =>
              this.findUserByName(name)
            )
          );

          const validParticipantIds = participantIds.filter(
            id => id !== null
          ) as string[];

          if (validParticipantIds.length > 0) {
            // Delete existing participants
            await tx.standupParticipant.deleteMany({
              where: { standupId },
            });

            // Create new participants
            await tx.standupParticipant.createMany({
              data: validParticipantIds.map(userId => ({
                standupId,
                userId,
              })),
            });
          }
        }

        // Return updated standup
        return await tx.standup.findUnique({
          where: { id: standupId },
          include: {
            lab: true,
            participants: {
              include: {
                user: true,
              },
            },
            actionItems: {
              include: {
                assignee: true,
              },
            },
            blockers: true,
            decisions: true,
            transcriptArchive: true,
          },
        });
      });

      return { success: true, standup: standup! };
    } catch (error) {
      console.error('Process standup audio error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed',
      };
    }
  }

  /**
   * Delete standup (soft delete)
   */
  static async deleteStandup(standupId: string): Promise<boolean> {
    try {
      await prisma.standup.update({
        where: { id: standupId },
        data: { isActive: false },
      });

      // Delete audio file
      await AudioUploadService.deleteAudioFile(standupId);

      return true;
    } catch (error) {
      console.error('Delete standup error:', error);
      return false;
    }
  }

  /**
   * Get standup statistics for a lab
   */
  static async getStandupStats(labId: string): Promise<{
    totalStandups: number;
    totalActionItems: number;
    completedActionItems: number;
    totalBlockers: number;
    resolvedBlockers: number;
    averageActionItemsPerStandup: number;
  }> {
    const [
      totalStandups,
      actionItemStats,
      blockerStats,
    ] = await Promise.all([
      prisma.standup.count({
        where: { labId, isActive: true },
      }),
      prisma.actionItem.aggregate({
        where: {
          standup: { labId, isActive: true },
        },
        _count: { _all: true },
      }),
      prisma.blocker.aggregate({
        where: {
          standup: { labId, isActive: true },
        },
        _count: { _all: true },
      }),
    ]);

    const totalActionItems = actionItemStats._count._all || 0;
    
    // Count completed action items separately
    const completedActionItems = await prisma.actionItem.count({
      where: {
        standup: { labId, isActive: true },
        completed: true,
      },
    });
    
    const totalBlockers = blockerStats._count._all || 0;
    
    // Count resolved blockers separately
    const resolvedBlockers = await prisma.blocker.count({
      where: {
        standup: { labId, isActive: true },
        resolved: true,
      },
    });

    return {
      totalStandups,
      totalActionItems,
      completedActionItems,
      totalBlockers,
      resolvedBlockers,
      averageActionItemsPerStandup:
        totalStandups > 0 ? totalActionItems / totalStandups : 0,
    };
  }

  /**
   * Search standups by transcript content
   */
  static async searchStandups(
    labId: string,
    searchTerm: string
  ): Promise<StandupWithRelations[]> {
    // Search in transcript archives
    const archives = await TranscriptArchiveService.searchTranscripts(searchTerm, {
      labId,
      includeExpired: false,
    });
    
    const standupIds = archives.map(archive => archive.standupId);
    
    if (standupIds.length === 0) {
      return [];
    }

    return await prisma.standup.findMany({
      where: {
        id: { in: standupIds },
        labId,
        isActive: true,
      },
      include: {
        lab: true,
        participants: {
          include: {
            user: true,
          },
        },
        actionItems: {
          include: {
            assignee: true,
          },
        },
        blockers: true,
        decisions: true,
        transcriptArchive: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Helper: Find user by name (case-insensitive)
   */
  private static async findUserByName(name: string): Promise<string | null> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { firstName: { equals: name, mode: 'insensitive' } },
          {
            AND: [
              { firstName: { not: '' } },
              { lastName: { not: '' } },
              {
                name: {
                  equals: name,
                  mode: 'insensitive',
                },
              },
            ],
          },
        ],
      },
      select: { id: true },
    });

    return user?.id || null;
  }

  /**
   * Update action item status
   */
  static async updateActionItemStatus(
    actionItemId: string,
    completed: boolean
  ): Promise<boolean> {
    try {
      await prisma.actionItem.update({
        where: { id: actionItemId },
        data: { completed },
      });
      return true;
    } catch (error) {
      console.error('Update action item error:', error);
      return false;
    }
  }

  /**
   * Update blocker status
   */
  static async updateBlockerStatus(
    blockerId: string,
    resolved: boolean
  ): Promise<boolean> {
    try {
      await prisma.blocker.update({
        where: { id: blockerId },
        data: { resolved },
      });
      return true;
    } catch (error) {
      console.error('Update blocker error:', error);
      return false;
    }
  }
}

export default StandupService;
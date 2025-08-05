import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { addDays } from 'date-fns';

export interface CreateTranscriptArchiveInput {
  standupId: string;
  transcript: string;
  audioUrl?: string;
  duration?: number;
  language?: string;
}

export interface TranscriptArchiveWithStandup extends Prisma.TranscriptArchiveGetPayload<{
  include: {
    standup: {
      include: {
        lab: true;
      };
    };
  };
}> {}

export class TranscriptArchiveService {
  private static readonly RETENTION_DAYS = 30;

  /**
   * Create a new transcript archive
   */
  static async createTranscriptArchive(
    input: CreateTranscriptArchiveInput
  ): Promise<TranscriptArchiveWithStandup> {
    const { transcript, ...data } = input;

    // Calculate word count
    const wordCount = transcript.split(/\s+/).filter(Boolean).length;

    // Set expiry date to 30 days from now
    const expiresAt = addDays(new Date(), this.RETENTION_DAYS);

    return await prisma.transcriptArchive.create({
      data: {
        ...data,
        transcript,
        wordCount,
        expiresAt,
        language: data.language || 'en',
      },
      include: {
        standup: {
          include: {
            lab: true,
          },
        },
      },
    });
  }

  /**
   * Get transcript archive by standup ID
   */
  static async getByStandupId(
    standupId: string
  ): Promise<TranscriptArchiveWithStandup | null> {
    return await prisma.transcriptArchive.findUnique({
      where: { standupId },
      include: {
        standup: {
          include: {
            lab: true,
          },
        },
      },
    });
  }

  /**
   * Update transcript archive
   */
  static async updateTranscriptArchive(
    standupId: string,
    data: {
      transcript?: string;
      audioUrl?: string;
      duration?: number;
      language?: string;
    }
  ): Promise<TranscriptArchiveWithStandup> {
    const updateData: Prisma.TranscriptArchiveUpdateInput = {};

    if (data.transcript) {
      updateData.transcript = data.transcript;
      updateData.wordCount = data.transcript.split(/\s+/).filter(Boolean).length;
    }

    if (data.audioUrl !== undefined) updateData.audioUrl = data.audioUrl;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.language !== undefined) updateData.language = data.language;

    return await prisma.transcriptArchive.update({
      where: { standupId },
      data: updateData,
      include: {
        standup: {
          include: {
            lab: true,
          },
        },
      },
    });
  }

  /**
   * Delete transcript archive
   */
  static async deleteTranscriptArchive(standupId: string): Promise<boolean> {
    try {
      await prisma.transcriptArchive.delete({
        where: { standupId },
      });
      return true;
    } catch (error) {
      console.error('Delete transcript archive error:', error);
      return false;
    }
  }

  /**
   * Clean up expired transcripts
   */
  static async cleanupExpiredTranscripts(): Promise<{
    deletedCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let deletedCount = 0;

    try {
      // Find all expired transcripts
      const expiredTranscripts = await prisma.transcriptArchive.findMany({
        where: {
          expiresAt: {
            lte: new Date(),
          },
        },
        select: {
          id: true,
          standupId: true,
        },
      });

      // Delete expired transcripts
      for (const transcript of expiredTranscripts) {
        try {
          await prisma.transcriptArchive.delete({
            where: { id: transcript.id },
          });
          deletedCount++;
        } catch (error) {
          errors.push(
            `Failed to delete transcript ${transcript.id}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }

      return { deletedCount, errors };
    } catch (error) {
      console.error('Cleanup expired transcripts error:', error);
      errors.push(
        `Cleanup failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      return { deletedCount, errors };
    }
  }

  /**
   * Get transcripts expiring soon (within 7 days)
   */
  static async getExpiringSoonTranscripts(
    labId?: string,
    daysThreshold: number = 7
  ): Promise<TranscriptArchiveWithStandup[]> {
    const thresholdDate = addDays(new Date(), daysThreshold);

    const where: Prisma.TranscriptArchiveWhereInput = {
      expiresAt: {
        gte: new Date(),
        lte: thresholdDate,
      },
    };

    if (labId) {
      where.standup = {
        labId,
      };
    }

    return await prisma.transcriptArchive.findMany({
      where,
      include: {
        standup: {
          include: {
            lab: true,
          },
        },
      },
      orderBy: {
        expiresAt: 'asc',
      },
    });
  }

  /**
   * Get transcript archive statistics
   */
  static async getArchiveStats(labId?: string): Promise<{
    totalTranscripts: number;
    totalWords: number;
    averageWordCount: number;
    totalDuration: number;
    expiringWithin7Days: number;
    expiredCount: number;
    languageBreakdown: Record<string, number>;
  }> {
    const baseWhere: Prisma.TranscriptArchiveWhereInput = {};
    if (labId) {
      baseWhere.standup = { labId };
    }

    const [
      totalStats,
      expiringCount,
      expiredCount,
      languageStats,
    ] = await Promise.all([
      // Total stats
      prisma.transcriptArchive.aggregate({
        where: baseWhere,
        _count: { _all: true },
        _sum: {
          wordCount: true,
          duration: true,
        },
        _avg: {
          wordCount: true,
        },
      }),
      // Expiring within 7 days
      prisma.transcriptArchive.count({
        where: {
          ...baseWhere,
          expiresAt: {
            gte: new Date(),
            lte: addDays(new Date(), 7),
          },
        },
      }),
      // Already expired
      prisma.transcriptArchive.count({
        where: {
          ...baseWhere,
          expiresAt: {
            lt: new Date(),
          },
        },
      }),
      // Language breakdown
      prisma.transcriptArchive.groupBy({
        by: ['language'],
        where: baseWhere,
        _count: {
          _all: true,
        },
      }),
    ]);

    const languageBreakdown: Record<string, number> = {};
    languageStats.forEach((stat: any) => {
      if (stat.language) {
        languageBreakdown[stat.language] = stat._count._all;
      }
    });

    return {
      totalTranscripts: totalStats._count._all || 0,
      totalWords: totalStats._sum.wordCount || 0,
      averageWordCount: Math.round(totalStats._avg.wordCount || 0),
      totalDuration: totalStats._sum.duration || 0,
      expiringWithin7Days: expiringCount,
      expiredCount,
      languageBreakdown,
    };
  }

  /**
   * Search transcripts by content
   */
  static async searchTranscripts(
    searchTerm: string,
    options?: {
      labId?: string;
      limit?: number;
      offset?: number;
      includeExpired?: boolean;
    }
  ): Promise<TranscriptArchiveWithStandup[]> {
    const {
      labId,
      limit = 20,
      offset = 0,
      includeExpired = false,
    } = options || {};

    const where: Prisma.TranscriptArchiveWhereInput = {
      transcript: {
        contains: searchTerm,
        mode: 'insensitive',
      },
    };

    if (!includeExpired) {
      where.expiresAt = {
        gte: new Date(),
      };
    }

    if (labId) {
      where.standup = {
        labId,
      };
    }

    return await prisma.transcriptArchive.findMany({
      where,
      include: {
        standup: {
          include: {
            lab: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Export transcript as text
   */
  static async exportTranscript(standupId: string): Promise<{
    success: boolean;
    data?: {
      transcript: string;
      metadata: {
        standupDate: Date;
        labName: string;
        wordCount: number;
        createdAt: Date;
        expiresAt: Date;
      };
    };
    error?: string;
  }> {
    try {
      const archive = await this.getByStandupId(standupId);

      if (!archive) {
        return {
          success: false,
          error: 'Transcript not found',
        };
      }

      return {
        success: true,
        data: {
          transcript: archive.transcript,
          metadata: {
            standupDate: archive.standup.date,
            labName: archive.standup.lab.name,
            wordCount: archive.wordCount,
            createdAt: archive.createdAt,
            expiresAt: archive.expiresAt,
          },
        },
      };
    } catch (error) {
      console.error('Export transcript error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  /**
   * Extend transcript retention
   */
  static async extendRetention(
    standupId: string,
    additionalDays: number = 30
  ): Promise<{
    success: boolean;
    newExpiryDate?: Date;
    error?: string;
  }> {
    try {
      const archive = await prisma.transcriptArchive.findUnique({
        where: { standupId },
        select: { expiresAt: true },
      });

      if (!archive) {
        return {
          success: false,
          error: 'Transcript not found',
        };
      }

      // Calculate new expiry date from current expiry date
      const newExpiryDate = addDays(archive.expiresAt, additionalDays);

      await prisma.transcriptArchive.update({
        where: { standupId },
        data: { expiresAt: newExpiryDate },
      });

      return {
        success: true,
        newExpiryDate,
      };
    } catch (error) {
      console.error('Extend retention error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Extension failed',
      };
    }
  }
}

export default TranscriptArchiveService;
#!/usr/bin/env tsx
/**
 * One-time migration script to move existing transcripts from Standup table to TranscriptArchive table
 * Run with: npx tsx scripts/migrate-transcripts.ts
 */

import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { addDays } from 'date-fns';

const prisma = new PrismaClient().$extends(withAccelerate());

async function migrateTranscripts() {
  console.log('Starting transcript migration...');

  try {
    // Find all standups that don't have archive entries yet
    // Since transcript field no longer exists on Standup model, 
    // this migration may not be needed with current schema
    const standupsWithTranscripts = await prisma.standup.findMany({
      where: {
        transcriptArchive: null,
        // Since transcript field doesn't exist anymore, we'll check for standups without archives
      },
      select: {
        id: true,
        audioUrl: true,
        createdAt: true,
      },
    });

    console.log(`Found ${standupsWithTranscripts.length} standups without archive entries`);

    if (standupsWithTranscripts.length === 0) {
      console.log('No standups need transcript archives created!');
      return;
    }

    console.log('Note: This migration script is no longer needed with current schema.');
    console.log('Transcript data is now stored directly in TranscriptArchive model.');
    console.log('If you have old data to migrate, you may need to modify this script.');

    // Run cleanup for any already-expired transcripts
    const expiredCount = await prisma.transcriptArchive.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (expiredCount.count > 0) {
      console.log(`\nCleaned up ${expiredCount.count} expired transcripts`);
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateTranscripts().catch(console.error);
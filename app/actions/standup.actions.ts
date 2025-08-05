'use server';

import { revalidatePath } from 'next/cache';
import StandupService from '@/lib/services/standup.service';
import type { CreateStandupInput } from '@/lib/services/standup.service';

/**
 * Create a new standup
 */
export async function createStandupAction(input: CreateStandupInput) {
  try {
    const standup = await StandupService.createStandup(input);
    revalidatePath('/standups');
    return { success: true, data: standup };
  } catch (error) {
    console.error('Create standup action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create standup',
    };
  }
}

/**
 * Get standups for a lab
 */
export async function getStandupsByLabAction(
  labId: string,
  options?: {
    limit?: number;
    offset?: number;
    orderBy?: 'date' | 'createdAt';
    order?: 'asc' | 'desc';
  }
) {
  try {
    const standups = await StandupService.getStandupsByLab(labId, options);
    return { success: true, data: standups };
  } catch (error) {
    console.error('Get standups action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get standups',
    };
  }
}

/**
 * Get standup by ID
 */
export async function getStandupByIdAction(standupId: string) {
  try {
    const standup = await StandupService.getStandupById(standupId);
    if (!standup) {
      return { success: false, error: 'Standup not found' };
    }
    return { success: true, data: standup };
  } catch (error) {
    console.error('Get standup action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get standup',
    };
  }
}

/**
 * Delete standup
 */
export async function deleteStandupAction(standupId: string) {
  try {
    const success = await StandupService.deleteStandup(standupId);
    if (success) {
      revalidatePath('/standups');
    }
    return { success };
  } catch (error) {
    console.error('Delete standup action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete standup',
    };
  }
}

/**
 * Search standups
 */
export async function searchStandupsAction(labId: string, searchTerm: string) {
  try {
    const standups = await StandupService.searchStandups(labId, searchTerm);
    return { success: true, data: standups };
  } catch (error) {
    console.error('Search standups action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search standups',
    };
  }
}

/**
 * Get standup statistics
 */
export async function getStandupStatsAction(labId: string) {
  try {
    const stats = await StandupService.getStandupStats(labId);
    return { success: true, data: stats };
  } catch (error) {
    console.error('Get standup stats action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get standup stats',
    };
  }
}

/**
 * Update action item status
 */
export async function updateActionItemStatusAction(
  actionItemId: string,
  completed: boolean
) {
  try {
    const success = await StandupService.updateActionItemStatus(
      actionItemId,
      completed
    );
    if (success) {
      revalidatePath('/standups');
    }
    return { success };
  } catch (error) {
    console.error('Update action item action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update action item',
    };
  }
}

/**
 * Update blocker status
 */
export async function updateBlockerStatusAction(
  blockerId: string,
  resolved: boolean
) {
  try {
    const success = await StandupService.updateBlockerStatus(
      blockerId,
      resolved
    );
    if (success) {
      revalidatePath('/standups');
    }
    return { success };
  } catch (error) {
    console.error('Update blocker action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update blocker',
    };
  }
}

/**
 * Process standup audio (transcribe and analyze)
 */
export async function processStandupAudioAction(
  standupId: string,
  audioBuffer: Buffer,
  mimeType: string
) {
  try {
    const result = await StandupService.processStandupAudio(
      standupId,
      audioBuffer,
      mimeType
    );
    
    if (result.success) {
      revalidatePath('/standups');
    }
    
    return result;
  } catch (error) {
    console.error('Process standup audio action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process audio',
    };
  }
}
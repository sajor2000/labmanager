import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

export interface AudioUploadOptions {
  maxSize?: number; // Max file size in bytes
  allowedTypes?: string[]; // Allowed MIME types
  outputFormat?: 'webm' | 'mp3' | 'wav'; // Output format
}

export interface AudioUploadResult {
  success: boolean;
  audioUrl?: string;
  filePath?: string;
  message: string;
  fileSize?: number;
  duration?: number;
}

export class AudioUploadService {
  private static readonly UPLOAD_DIR = 'public/standups/audio';
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly ALLOWED_TYPES = [
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/x-m4a',
  ];

  /**
   * Initialize upload directory
   */
  static async initializeUploadDir(): Promise<void> {
    try {
      await mkdir(this.UPLOAD_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  /**
   * Validate audio file
   */
  static validateAudioFile(
    file: File | Buffer,
    mimeType?: string,
    options?: AudioUploadOptions
  ): { valid: boolean; error?: string } {
    const maxSize = options?.maxSize || this.MAX_FILE_SIZE;
    const allowedTypes = options?.allowedTypes || this.ALLOWED_TYPES;

    // Check file size
    const fileSize = file instanceof File ? file.size : file.length;
    if (fileSize > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
      };
    }

    // Check MIME type
    const type = file instanceof File ? file.type : mimeType;
    if (type && !allowedTypes.includes(type)) {
      return {
        valid: false,
        error: 'File type not supported. Please upload an audio file (WebM, MP3, WAV, etc.)',
      };
    }

    return { valid: true };
  }

  /**
   * Upload audio file for standup
   */
  static async uploadAudioFile(
    standupId: string,
    audioFile: File | Buffer,
    options?: AudioUploadOptions
  ): Promise<AudioUploadResult> {
    try {
      await this.initializeUploadDir();

      // Convert File to Buffer if needed
      const audioBuffer =
        audioFile instanceof File
          ? Buffer.from(await audioFile.arrayBuffer())
          : audioFile;

      const mimeType = audioFile instanceof File ? audioFile.type : undefined;

      // Validate file
      const validation = this.validateAudioFile(audioFile, mimeType, options);
      if (!validation.valid) {
        return { success: false, message: validation.error! };
      }

      // Generate filename
      const ext = this.getFileExtension(mimeType || 'audio/webm');
      const filename = `${standupId}-${Date.now()}.${ext}`;
      const filepath = path.join(this.UPLOAD_DIR, filename);
      const publicUrl = `/standups/audio/${filename}`;

      // Save file to disk
      await writeFile(filepath, audioBuffer);

      // Update standup in database
      await prisma.standup.update({
        where: { id: standupId },
        data: {
          audioUrl: publicUrl,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        audioUrl: publicUrl,
        filePath: filepath,
        message: 'Audio uploaded successfully',
        fileSize: audioBuffer.length,
      };
    } catch (error) {
      console.error('Audio upload error:', error);
      return {
        success: false,
        message: `Upload failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }

  /**
   * Upload audio from Base64 string
   */
  static async uploadAudioFromBase64(
    standupId: string,
    base64Data: string,
    mimeType: string,
    options?: AudioUploadOptions
  ): Promise<AudioUploadResult> {
    try {
      // Remove data URL prefix if present
      const base64Content = base64Data.replace(/^data:audio\/\w+;base64,/, '');
      const audioBuffer = Buffer.from(base64Content, 'base64');

      return this.uploadAudioFile(standupId, audioBuffer, options);
    } catch (error) {
      console.error('Base64 audio upload error:', error);
      return {
        success: false,
        message: `Upload failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }

  /**
   * Get audio file for standup
   */
  static async getAudioFile(
    standupId: string
  ): Promise<{ exists: boolean; path?: string; url?: string }> {
    try {
      const standup = await prisma.standup.findUnique({
        where: { id: standupId },
        select: { audioUrl: true },
      });

      if (!standup?.audioUrl) {
        return { exists: false };
      }

      const filename = path.basename(standup.audioUrl);
      const filepath = path.join(this.UPLOAD_DIR, filename);

      // Check if file exists
      const exists = fs.existsSync(filepath);

      return {
        exists,
        path: exists ? filepath : undefined,
        url: standup.audioUrl,
      };
    } catch (error) {
      console.error('Get audio file error:', error);
      return { exists: false };
    }
  }

  /**
   * Delete audio file
   */
  static async deleteAudioFile(standupId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const standup = await prisma.standup.findUnique({
        where: { id: standupId },
        select: { audioUrl: true },
      });

      if (standup?.audioUrl) {
        // Delete file from disk if it exists
        const filename = path.basename(standup.audioUrl);
        const filepath = path.join(this.UPLOAD_DIR, filename);

        try {
          await unlink(filepath);
        } catch (fileError) {
          // File might not exist, continue with database update
          console.warn('Could not delete audio file:', fileError);
        }
      }

      // Clear audio URL from database
      await prisma.standup.update({
        where: { id: standupId },
        data: {
          audioUrl: null,
          updatedAt: new Date(),
        },
      });

      return { success: true, message: 'Audio deleted successfully' };
    } catch (error) {
      console.error('Delete audio error:', error);
      return {
        success: false,
        message: `Delete failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }

  /**
   * Clean up orphaned audio files
   */
  static async cleanupOrphanedFiles(): Promise<{
    deletedCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let deletedCount = 0;

    try {
      // Get all standups with audio URLs
      const standups = await prisma.standup.findMany({
        where: { audioUrl: { not: null } },
        select: { audioUrl: true },
      });

      const validFilenames = new Set(
        standups
          .map(s => s.audioUrl)
          .filter(Boolean)
          .map(url => path.basename(url!))
      );

      // Read all files in upload directory
      const files = await fs.promises.readdir(this.UPLOAD_DIR);

      // Delete files not in database
      for (const file of files) {
        if (!validFilenames.has(file)) {
          try {
            await unlink(path.join(this.UPLOAD_DIR, file));
            deletedCount++;
          } catch (error) {
            errors.push(
              `Failed to delete ${file}: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`
            );
          }
        }
      }

      return { deletedCount, errors };
    } catch (error) {
      console.error('Cleanup error:', error);
      errors.push(
        `Cleanup failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      return { deletedCount, errors };
    }
  }

  /**
   * Get file extension from MIME type
   */
  private static getFileExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/x-m4a': 'm4a',
    };

    return mimeToExt[mimeType] || 'webm';
  }

  /**
   * Get audio upload stats
   */
  static async getAudioStats(): Promise<{
    totalStandups: number;
    standupsWithAudio: number;
    totalAudioSize: number;
    averageAudioSize: number;
  }> {
    try {
      const [totalStandups, standupsWithAudio] = await Promise.all([
        prisma.standup.count(),
        prisma.standup.count({ where: { audioUrl: { not: null } } }),
      ]);

      // Calculate total size of audio files
      let totalAudioSize = 0;
      const standups = await prisma.standup.findMany({
        where: { audioUrl: { not: null } },
        select: { audioUrl: true },
      });

      for (const standup of standups) {
        if (standup.audioUrl) {
          const filename = path.basename(standup.audioUrl);
          const filepath = path.join(this.UPLOAD_DIR, filename);
          try {
            const stats = await fs.promises.stat(filepath);
            totalAudioSize += stats.size;
          } catch {
            // File might not exist
          }
        }
      }

      const averageAudioSize =
        standupsWithAudio > 0 ? totalAudioSize / standupsWithAudio : 0;

      return {
        totalStandups,
        standupsWithAudio,
        totalAudioSize,
        averageAudioSize,
      };
    } catch (error) {
      console.error('Get audio stats error:', error);
      return {
        totalStandups: 0,
        standupsWithAudio: 0,
        totalAudioSize: 0,
        averageAudioSize: 0,
      };
    }
  }
}

export default AudioUploadService;
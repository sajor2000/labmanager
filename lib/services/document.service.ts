import { prisma } from '@/lib/prisma';
import { AttachableType } from '@prisma/client';
import { promisify } from 'util';
import zlib from 'zlib';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export interface DocumentUploadOptions {
  description?: string;
  tags?: string[];
  compress?: boolean;
}

export interface DocumentUploadResult {
  success: boolean;
  document?: any;
  message: string;
  fileSize?: number;
  compressed?: boolean;
}

export interface DocumentDownloadResult {
  data: Buffer;
  mimeType: string;
  filename: string;
  compressed: boolean;
}

export class DocumentService {
  // Constants
  static readonly MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB per file
  static readonly COMPRESS_THRESHOLD = 1 * 1024 * 1024; // Compress files > 1MB
  static readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ];

  /**
   * Validate file before upload
   */
  static validateFile(file: File | Buffer, mimeType: string): { valid: boolean; error?: string } {
    // Check file size
    const fileSize = file instanceof File ? file.size : file.length;
    if (fileSize > this.MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit` 
      };
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
      return { 
        valid: false, 
        error: 'File type not supported. Allowed types: PDF, Word, Excel, Text, CSV, PNG, JPEG' 
      };
    }

    return { valid: true };
  }

  /**
   * Check if lab has sufficient storage space
   */
  static async checkLabStorage(labId: string, fileSize: number): Promise<{ allowed: boolean; message?: string }> {
    const lab = await prisma.lab.findUnique({
      where: { id: labId },
      select: { 
        storageUsed: true, 
        storageLimit: true,
        name: true 
      }
    });

    if (!lab) {
      return { allowed: false, message: 'Lab not found' };
    }

    const newUsage = BigInt(fileSize) + lab.storageUsed;
    
    if (newUsage > lab.storageLimit) {
      const usedMB = Number(lab.storageUsed) / (1024 * 1024);
      const limitMB = Number(lab.storageLimit) / (1024 * 1024);
      return { 
        allowed: false, 
        message: `Lab storage limit exceeded. Used: ${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB` 
      };
    }

    // Warn if approaching limit (>80%)
    const usagePercent = (Number(newUsage) / Number(lab.storageLimit)) * 100;
    if (usagePercent > 80) {
      return { 
        allowed: true, 
        message: `Warning: Lab storage is ${usagePercent.toFixed(1)}% full` 
      };
    }

    return { allowed: true };
  }

  /**
   * Upload document with optional compression
   */
  static async uploadDocument(
    file: File,
    entityType: AttachableType,
    entityId: string,
    labId: string,
    userId: string,
    options: DocumentUploadOptions = {}
  ): Promise<DocumentUploadResult> {
    try {
      // Convert File to Buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Validate file
      const validation = this.validateFile(buffer, file.type);
      if (!validation.valid) {
        return { success: false, message: validation.error! };
      }

      // Check lab storage capacity
      const storageCheck = await this.checkLabStorage(labId, buffer.length);
      if (!storageCheck.allowed) {
        return { success: false, message: storageCheck.message! };
      }

      // Compress if file is large and compressible
      let data = buffer;
      let isCompressed = false;
      let originalSize: number | null = null;
      
      const shouldCompress = options.compress !== false && 
        buffer.length > this.COMPRESS_THRESHOLD &&
        this.isCompressibleType(file.type);
      
      if (shouldCompress) {
        try {
          const compressed = await gzip(buffer);
          // Only use compression if it reduces size by at least 10%
          if (compressed.length < buffer.length * 0.9) {
            data = Buffer.from(compressed);
            isCompressed = true;
            originalSize = buffer.length;
          }
        } catch (error) {
          console.warn('Compression failed, storing uncompressed:', error);
        }
      }

      // Store document in database
      const document = await prisma.document.create({
        data: {
          filename: file.name,
          mimeType: file.type,
          fileSize: data.length,
          data,
          isCompressed,
          originalSize,
          entityType,
          entityId,
          labId,
          uploadedById: userId,
          description: options.description,
          tags: options.tags || [],
        },
        select: {
          id: true,
          filename: true,
          fileSize: true,
          isCompressed: true,
          originalSize: true,
          uploadedAt: true,
        }
      });

      // Update lab storage usage
      await prisma.lab.update({
        where: { id: labId },
        data: { 
          storageUsed: {
            increment: data.length
          }
        }
      });

      return {
        success: true,
        document,
        message: storageCheck.message || 'Document uploaded successfully',
        fileSize: data.length,
        compressed: isCompressed
      };

    } catch (error) {
      console.error('Document upload error:', error);
      return { 
        success: false, 
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Download document with decompression if needed
   */
  static async downloadDocument(documentId: string, userId?: string): Promise<DocumentDownloadResult | null> {
    try {
      const document = await prisma.document.findUnique({
        where: { 
          id: documentId,
          isDeleted: false 
        }
      });

      if (!document) {
        return null;
      }

      // Decompress if needed
      let data = document.data;
      if (document.isCompressed) {
        try {
          data = await gunzip(document.data);
        } catch (error) {
          console.error('Decompression failed:', error);
          // Return compressed data if decompression fails
        }
      }

      // Update access statistics
      await prisma.document.update({
        where: { id: documentId },
        data: {
          lastAccessed: new Date(),
          accessCount: {
            increment: 1
          }
        }
      });

      return {
        data: Buffer.from(data),
        mimeType: document.mimeType,
        filename: document.filename,
        compressed: document.isCompressed
      };

    } catch (error) {
      console.error('Document download error:', error);
      return null;
    }
  }

  /**
   * Delete document (soft delete)
   */
  static async deleteDocument(documentId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: {
          fileSize: true,
          labId: true,
          uploadedById: true,
          isDeleted: true
        }
      });

      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      if (document.isDeleted) {
        return { success: false, message: 'Document already deleted' };
      }

      // Soft delete the document
      await prisma.document.update({
        where: { id: documentId },
        data: {
          isDeleted: true,
          deletedAt: new Date()
        }
      });

      // Update lab storage usage
      await prisma.lab.update({
        where: { id: document.labId },
        data: {
          storageUsed: {
            decrement: document.fileSize
          }
        }
      });

      return { success: true, message: 'Document deleted successfully' };

    } catch (error) {
      console.error('Document deletion error:', error);
      return { 
        success: false, 
        message: `Deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get documents for an entity
   */
  static async getDocuments(
    entityType: AttachableType,
    entityId: string,
    includeDeleted = false
  ) {
    return prisma.document.findMany({
      where: {
        entityType,
        entityId,
        isDeleted: includeDeleted ? undefined : false
      },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        fileSize: true,
        originalSize: true,
        isCompressed: true,
        description: true,
        tags: true,
        uploadedAt: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            initials: true
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });
  }

  /**
   * Get lab storage statistics
   */
  static async getLabStorageStats(labId: string) {
    const lab = await prisma.lab.findUnique({
      where: { id: labId },
      select: {
        storageUsed: true,
        storageLimit: true,
        _count: {
          select: {
            documents: {
              where: { isDeleted: false }
            }
          }
        },
        documents: {
          where: { isDeleted: false },
          select: {
            entityType: true,
            fileSize: true,
            mimeType: true,
            isCompressed: true
          }
        }
      }
    });

    if (!lab) {
      return null;
    }

    // Calculate breakdown by entity type
    const breakdown = {
      TASK: { count: 0, size: 0 },
      IDEA: { count: 0, size: 0 },
      DEADLINE: { count: 0, size: 0 },
      OTHER: { count: 0, size: 0 }
    };

    lab.documents.forEach(doc => {
      const type = doc.entityType as keyof typeof breakdown || 'OTHER';
      if (breakdown[type]) {
        breakdown[type].count++;
        breakdown[type].size += doc.fileSize;
      }
    });

    // Calculate compression savings
    const compressedDocs = lab.documents.filter(d => d.isCompressed);
    const compressionSavings = compressedDocs.reduce((total, doc) => {
      return total + (doc.fileSize * 0.3); // Estimate 30% savings
    }, 0);

    return {
      used: Number(lab.storageUsed),
      limit: Number(lab.storageLimit),
      percentage: (Number(lab.storageUsed) / Number(lab.storageLimit)) * 100,
      documentCount: lab._count.documents,
      breakdown,
      compressionSavings: Math.round(compressionSavings),
      averageFileSize: lab._count.documents > 0 
        ? Math.round(Number(lab.storageUsed) / lab._count.documents)
        : 0
    };
  }

  /**
   * Check if file type is compressible
   */
  private static isCompressibleType(mimeType: string): boolean {
    const compressibleTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
    ];
    return compressibleTypes.includes(mimeType);
  }

  /**
   * Clean up old soft-deleted documents
   */
  static async cleanupDeletedDocuments(daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.document.deleteMany({
      where: {
        isDeleted: true,
        deletedAt: {
          lt: cutoffDate
        }
      }
    });

    return result.count;
  }
}

export default DocumentService;
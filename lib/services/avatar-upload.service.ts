import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs'
import { promisify } from 'util'

const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)

export interface AvatarUploadOptions {
  quality?: number // JPEG quality (1-100)
  maxWidth?: number // Max width in pixels
  maxHeight?: number // Max height in pixels
  format?: 'jpeg' | 'png' | 'webp' // Output format
}

export interface AvatarUploadResult {
  success: boolean
  avatarUrl?: string
  message: string
  fileSize?: number
  dimensions?: { width: number; height: number }
}

export class AvatarUploadService {
  private static readonly UPLOAD_DIR = 'public/avatars'
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  
  private static readonly DEFAULT_OPTIONS: AvatarUploadOptions = {
    quality: 85,
    maxWidth: 400,
    maxHeight: 400,
    format: 'jpeg'
  }

  /**
   * Initialize upload directory
   */
  static async initializeUploadDir(): Promise<void> {
    try {
      await mkdir(this.UPLOAD_DIR, { recursive: true })
    } catch (error) {
      console.error('Failed to create upload directory:', error)
    }
  }

  /**
   * Validate image file
   */
  static validateImageFile(file: File | Buffer, mimeType?: string): { valid: boolean; error?: string } {
    // Check file size
    const fileSize = file instanceof File ? file.size : file.length
    if (fileSize > this.MAX_FILE_SIZE) {
      return { valid: false, error: `File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit` }
    }

    // Check MIME type
    const type = file instanceof File ? file.type : mimeType
    if (type && !this.ALLOWED_TYPES.includes(type)) {
      return { valid: false, error: 'File type not supported. Use PNG, JPG, or WebP' }
    }

    return { valid: true }
  }

  /**
   * Process and optimize image
   */
  static async processImage(
    imageBuffer: Buffer,
    options: AvatarUploadOptions = {}
  ): Promise<{ buffer: Buffer; info: any }> {
    // Dynamic import to avoid build-time issues on Vercel
    const sharp = (await import('sharp')).default
    
    const opts = { ...this.DEFAULT_OPTIONS, ...options }

    let pipeline = sharp(imageBuffer)
      .resize(opts.maxWidth, opts.maxHeight, {
        fit: 'cover',
        position: 'center'
      })

    // Apply format-specific processing
    switch (opts.format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: opts.quality })
        break
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 9 })
        break
      case 'webp':
        pipeline = pipeline.webp({ quality: opts.quality })
        break
    }

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })
    return { buffer: data, info }
  }

  /**
   * Upload avatar for user (File Storage approach)
   */
  static async uploadAvatarFile(
    userId: string,
    imageFile: File | Buffer,
    options: AvatarUploadOptions = {}
  ): Promise<AvatarUploadResult> {
    try {
      await this.initializeUploadDir()

      // Convert File to Buffer if needed
      const imageBuffer = imageFile instanceof File 
        ? Buffer.from(await imageFile.arrayBuffer())
        : imageFile

      const mimeType = imageFile instanceof File ? imageFile.type : undefined

      // Validate file
      const validation = this.validateImageFile(imageFile, mimeType)
      if (!validation.valid) {
        return { success: false, message: validation.error! }
      }

      // Process image
      const { buffer, info } = await this.processImage(imageBuffer, options)
      
      // Generate filename
      const ext = options.format || 'jpeg'
      const filename = `${userId}-${Date.now()}.${ext}`
      const filepath = path.join(this.UPLOAD_DIR, filename)
      const publicUrl = `/avatars/${filename}`

      // Save file to disk
      await writeFile(filepath, buffer)

      // Update user in database
      await prisma.user.update({
        where: { id: userId },
        data: { 
          avatarUrl: publicUrl,
          updatedAt: new Date()
        }
      })

      return {
        success: true,
        avatarUrl: publicUrl,
        message: 'Avatar uploaded successfully',
        fileSize: buffer.length,
        dimensions: { width: info.width, height: info.height }
      }

    } catch (error) {
      console.error('Avatar upload error:', error)
      return { 
        success: false, 
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  /**
   * Upload avatar for user (Database Storage approach)
   */
  static async uploadAvatarToDatabase(
    userId: string,
    imageFile: File | Buffer,
    options: AvatarUploadOptions = {}
  ): Promise<AvatarUploadResult> {
    try {
      // Convert File to Buffer if needed
      const imageBuffer = imageFile instanceof File 
        ? Buffer.from(await imageFile.arrayBuffer())
        : imageFile

      const mimeType = imageFile instanceof File ? imageFile.type : undefined

      // Validate file
      const validation = this.validateImageFile(imageFile, mimeType)
      if (!validation.valid) {
        return { success: false, message: validation.error! }
      }

      // Process image
      const { buffer, info } = await this.processImage(imageBuffer, options)

      // Store in database
      await prisma.user.update({
        where: { id: userId },
        data: { 
          avatarImage: buffer,
          updatedAt: new Date()
        }
      })

      return {
        success: true,
        message: 'Avatar stored in database successfully',
        fileSize: buffer.length,
        dimensions: { width: info.width, height: info.height }
      }

    } catch (error) {
      console.error('Avatar database storage error:', error)
      return { 
        success: false, 
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  /**
   * Get user avatar (prioritizes avatarUrl over avatarImage)
   */
  static async getUserAvatar(userId: string): Promise<{
    type: 'url' | 'buffer' | 'initials' | null
    data: string | Buffer | null
    initials?: string
    avatar?: string
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          avatarUrl: true,
          avatarImage: true,
          initials: true,
          avatar: true // color fallback
        }
      })

      if (!user) {
        return { type: null, data: null }
      }

      // Priority: avatarUrl > avatarImage > initials/color
      if (user.avatarUrl) {
        return { type: 'url', data: user.avatarUrl }
      }

      if (user.avatarImage) {
        return { type: 'buffer', data: Buffer.from(user.avatarImage) }
      }

      // Fallback to initials with color
      return {
        type: 'initials',
        data: null,
        initials: user.initials,
        avatar: user.avatar || undefined
      }

    } catch (error) {
      console.error('Get avatar error:', error)
      return { type: null, data: null }
    }
  }

  /**
   * Delete user avatar
   */
  static async deleteAvatar(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true }
      })

      if (user?.avatarUrl) {
        // Delete file from disk if it exists
        const filename = path.basename(user.avatarUrl)
        const filepath = path.join(this.UPLOAD_DIR, filename)
        
        try {
          await fs.promises.unlink(filepath)
        } catch (fileError) {
          // File might not exist, continue with database update
          console.warn('Could not delete avatar file:', fileError)
        }
      }

      // Clear avatar data from database
      await prisma.user.update({
        where: { id: userId },
        data: {
          avatarUrl: null,
          avatarImage: null,
          updatedAt: new Date()
        }
      })

      return { success: true, message: 'Avatar deleted successfully' }

    } catch (error) {
      console.error('Delete avatar error:', error)
      return { 
        success: false, 
        message: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  /**
   * Get avatar stats for admin/monitoring
   */
  static async getAvatarStats(): Promise<{
    totalUsers: number
    usersWithAvatarUrl: number
    usersWithAvatarImage: number
    usersWithInitialsOnly: number
  }> {
    try {
      const [
        totalUsers,
        usersWithAvatarUrl,
        usersWithAvatarImage
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { avatarUrl: { not: null } } }),
        prisma.user.count({ where: { avatarImage: { not: null } } })
      ])

      return {
        totalUsers,
        usersWithAvatarUrl,
        usersWithAvatarImage,
        usersWithInitialsOnly: totalUsers - usersWithAvatarUrl - usersWithAvatarImage
      }

    } catch (error) {
      console.error('Get avatar stats error:', error)
      return {
        totalUsers: 0,
        usersWithAvatarUrl: 0,
        usersWithAvatarImage: 0,
        usersWithInitialsOnly: 0
      }
    }
  }
}

export default AvatarUploadService
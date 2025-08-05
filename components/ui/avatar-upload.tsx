'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload, X, Camera, Trash2, Check, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl?: string | null
  userInitials?: string
  userName?: string
  onAvatarChange?: (avatarUrl: string | null) => void
  size?: 'sm' | 'md' | 'lg' | 'xl'
  allowDelete?: boolean
  storageType?: 'file' | 'database'
  maxFileSize?: number // in MB
}

interface UploadOptions {
  quality: number
  maxWidth: number
  maxHeight: number
  format: 'jpeg' | 'png' | 'webp'
  storage: 'file' | 'database'
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  userInitials,
  userName,
  onAvatarChange,
  size = 'md',
  allowDelete = true,
  storageType = 'file',
  maxFileSize = 5
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadOptions, setUploadOptions] = useState<UploadOptions>({
    quality: 85,
    maxWidth: 400,
    maxHeight: 400,
    format: 'jpeg',
    storage: storageType
  })

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  }

  const clearMessages = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a PNG, JPG, or WebP image'
    }

    return null
  }, [maxFileSize])

  const uploadAvatar = useCallback(async (file: File) => {
    clearMessages()
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('avatar', file)
      formData.append('quality', uploadOptions.quality.toString())
      formData.append('maxWidth', uploadOptions.maxWidth.toString())
      formData.append('maxHeight', uploadOptions.maxHeight.toString())
      formData.append('format', uploadOptions.format)
      formData.append('storage', uploadOptions.storage)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setSuccess(`Avatar uploaded successfully! ${result.fileSize ? `(${Math.round(result.fileSize / 1024)}KB)` : ''}`)
      setPreview(null)
      
      // Call callback with new avatar URL
      if (onAvatarChange) {
        onAvatarChange(result.avatarUrl || `/api/users/${userId}/avatar`)
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }, [userId, uploadOptions, onAvatarChange, clearMessages])

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload immediately or show preview based on preference
    uploadAvatar(file)
  }, [validateFile, uploadAvatar])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const deleteAvatar = useCallback(async () => {
    if (!confirm('Are you sure you want to delete your avatar?')) {
      return
    }

    setIsUploading(true)
    clearMessages()

    try {
      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Delete failed')
      }

      setSuccess('Avatar deleted successfully')
      if (onAvatarChange) {
        onAvatarChange(null)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setIsUploading(false)
    }
  }, [userId, onAvatarChange, clearMessages])

  const currentAvatar = preview || currentAvatarUrl || `/api/users/${userId}/avatar`

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Avatar Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Avatar Display */}
        <div className="flex items-center justify-center">
          <Avatar className={`${sizeClasses[size]} border-2 border-gray-200`}>
            <AvatarImage 
              src={currentAvatar}
              alt={userName || 'User avatar'} 
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {userInitials || '??'}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Upload Progress */}
        {uploadProgress > 0 && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-center text-gray-600">
              {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
            </p>
          </div>
        )}

        {/* Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Drag & drop an image here, or click to select
          </p>
          <p className="text-xs text-gray-500 mb-4">
            PNG, JPG, WebP up to {maxFileSize}MB
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading}
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="mb-2"
          >
            Select Image
          </Button>

          {allowDelete && currentAvatarUrl && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={deleteAvatar}
              disabled={isUploading}
              className="ml-2"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
        </div>

        {/* Upload Options */}
        <details className="border rounded-lg p-3">
          <summary className="cursor-pointer text-sm font-medium">Advanced Options</summary>
          <div className="mt-3 space-y-3">
            <div>
              <Label htmlFor="quality" className="text-xs">Quality ({uploadOptions.quality}%)</Label>
              <Input
                id="quality"
                type="range"
                min="10"
                max="100"
                step="5"
                value={uploadOptions.quality}
                onChange={(e) => setUploadOptions(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="maxWidth" className="text-xs">Max Width</Label>
                <Input
                  id="maxWidth"
                  type="number"
                  min="100"
                  max="1000"
                  step="50"
                  value={uploadOptions.maxWidth}
                  onChange={(e) => setUploadOptions(prev => ({ ...prev, maxWidth: parseInt(e.target.value) }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="maxHeight" className="text-xs">Max Height</Label>
                <Input
                  id="maxHeight"
                  type="number"
                  min="100"
                  max="1000"
                  step="50"
                  value={uploadOptions.maxHeight}
                  onChange={(e) => setUploadOptions(prev => ({ ...prev, maxHeight: parseInt(e.target.value) }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="format" className="text-xs">Format</Label>
              <select
                id="format"
                value={uploadOptions.format}
                onChange={(e) => setUploadOptions(prev => ({ ...prev, format: e.target.value as 'jpeg' | 'png' | 'webp' }))}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="jpeg">JPEG (smaller size)</option>
                <option value="png">PNG (lossless)</option>
                <option value="webp">WebP (modern)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="storage" className="text-xs">Storage</Label>
              <select
                id="storage"
                value={uploadOptions.storage}
                onChange={(e) => setUploadOptions(prev => ({ ...prev, storage: e.target.value as 'file' | 'database' }))}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="file">File System</option>
                <option value="database">Database</option>
              </select>
            </div>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}

export default AvatarUpload
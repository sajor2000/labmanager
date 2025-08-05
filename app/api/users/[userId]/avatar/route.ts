import { NextRequest, NextResponse } from 'next/server'
import AvatarUploadService from '@/lib/services/avatar-upload.service'

// POST: Upload avatar for user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)' },
        { status: 400 }
      )
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    // Get upload options from form data
    const storageType = formData.get('storage') as string || 'file' // 'file' or 'database'
    const quality = formData.get('quality') ? parseInt(formData.get('quality') as string) : 85
    const maxWidth = formData.get('maxWidth') ? parseInt(formData.get('maxWidth') as string) : 400
    const maxHeight = formData.get('maxHeight') ? parseInt(formData.get('maxHeight') as string) : 400
    const format = (formData.get('format') as 'jpeg' | 'png' | 'webp') || 'jpeg'

    const options = {
      quality,
      maxWidth,
      maxHeight,
      format
    }

    // Choose storage method
    const result = storageType === 'database'
      ? await AvatarUploadService.uploadAvatarToDatabase(userId, file, options)
      : await AvatarUploadService.uploadAvatarFile(userId, file, options)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      avatarUrl: result.avatarUrl,
      fileSize: result.fileSize,
      dimensions: result.dimensions
    })

  } catch (error) {
    console.error('Avatar upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Retrieve user avatar
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const avatar = await AvatarUploadService.getUserAvatar(userId)

    if (avatar.type === 'buffer' && avatar.data) {
      // Return image buffer directly
      return new NextResponse(avatar.data as Buffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        }
      })
    }

    if (avatar.type === 'url') {
      // Redirect to the image URL
      return NextResponse.redirect(new URL(avatar.data as string, request.url))
    }

    if (avatar.type === 'initials') {
      // Return initials data for frontend to generate avatar
      return NextResponse.json({
        type: 'initials',
        initials: avatar.initials,
        color: avatar.avatar
      })
    }

    // No avatar found
    return NextResponse.json(
      { error: 'No avatar found' },
      { status: 404 }
    )

  } catch (error) {
    console.error('Avatar retrieval API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete user avatar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const result = await AvatarUploadService.deleteAvatar(userId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message
    })

  } catch (error) {
    console.error('Avatar deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
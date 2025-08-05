# Avatar Upload Functionality

## Overview

Complete avatar upload and management system for lab team members supporting PNG, JPG, and WebP formats with automatic image optimization.

## Features

### ✅ Implemented Features

1. **Multiple Storage Options**
   - File system storage (`/public/avatars/`)
   - Database BLOB storage (PostgreSQL `bytea`)

2. **Image Processing**
   - Automatic resizing and optimization using Sharp
   - Format conversion (JPEG, PNG, WebP)
   - Quality adjustment (1-100%)
   - Configurable dimensions

3. **Database Schema**
   ```sql
   -- Added to User model:
   avatarUrl    String? -- URL to avatar image file
   avatarImage  Bytes?  -- Direct image storage in database
   avatar       String? -- Fallback color (existing)
   initials     String  -- Fallback initials (existing)
   ```

4. **API Endpoints**
   - `POST /api/users/[userId]/avatar` - Upload avatar
   - `GET /api/users/[userId]/avatar` - Retrieve avatar
   - `DELETE /api/users/[userId]/avatar` - Delete avatar

5. **React Components**
   - `<AvatarUpload />` - Full-featured upload component
   - `<UserAvatar />` - Display component with fallbacks

6. **Image Validation**
   - File size limits (configurable, default 5MB)
   - MIME type validation
   - Automatic format detection

## Usage Examples

### Basic Avatar Display
```tsx
import { UserAvatar } from '@/components/ui/user-avatar'

<UserAvatar
  userId="user-123"
  name="John Doe"
  initials="JD"
  size="md"
  showTooltip={true}
/>
```

### Avatar Upload Component
```tsx
import { AvatarUpload } from '@/components/ui/avatar-upload'

<AvatarUpload
  userId="user-123"
  userName="John Doe"
  userInitials="JD"
  onAvatarChange={(url) => console.log('New avatar:', url)}
  size="xl"
  allowDelete={true}
  storageType="file"
  maxFileSize={5}
/>
```

### Programmatic Upload
```typescript
import AvatarUploadService from '@/lib/services/avatar-upload.service'

// File storage
const result = await AvatarUploadService.uploadAvatarFile(
  userId,
  imageFile,
  {
    quality: 85,
    maxWidth: 400,
    maxHeight: 400,
    format: 'jpeg'
  }
)

// Database storage
const result = await AvatarUploadService.uploadAvatarToDatabase(
  userId,
  imageFile,
  options
)
```

## File Structure

```
lib/services/
  └── avatar-upload.service.ts    # Core upload service

components/ui/
  ├── avatar-upload.tsx          # Upload component
  ├── user-avatar.tsx           # Display component
  ├── progress.tsx              # Progress bar
  └── separator.tsx             # UI separator

app/api/users/[userId]/avatar/
  └── route.ts                  # API endpoints

public/avatars/                 # File storage directory

app/test-avatars/
  └── page.tsx                 # Test/demo page
```

## Configuration Options

### Upload Options
- `quality`: JPEG quality (1-100, default: 85)
- `maxWidth`: Maximum width in pixels (default: 400)
- `maxHeight`: Maximum height in pixels (default: 400)
- `format`: Output format ('jpeg' | 'png' | 'webp', default: 'jpeg')

### Component Props
- `size`: Avatar size ('xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl')
- `storageType`: Storage method ('file' | 'database')
- `maxFileSize`: File size limit in MB (default: 5)
- `allowDelete`: Enable delete functionality (default: true)

## Performance Considerations

### File Storage (Recommended)
- ✅ Better performance for serving images
- ✅ Reduced database load
- ✅ CDN-friendly
- ❌ Requires file system access
- ❌ Backup complexity

### Database Storage
- ✅ Simplified backup/restore
- ✅ ACID compliance
- ✅ No file system dependencies
- ❌ Slower image serving
- ❌ Increased database size

## Security Features

1. **File Validation**
   - MIME type checking
   - File size limits
   - Image format verification

2. **Image Processing**
   - Automatic sanitization through Sharp
   - Removes EXIF data
   - Prevents malicious image exploits

3. **Access Control**
   - User ID validation
   - Protected API endpoints

## Error Handling

The system handles various error scenarios:
- Invalid file formats
- File size exceeded
- Processing failures
- Storage errors
- Network issues

## Testing

Avatar functionality has been tested with:
- ✅ File upload validation
- ✅ Image processing and optimization
- ✅ Database storage operations
- ✅ File system operations
- ✅ API endpoint functionality
- ✅ Error scenarios

## Demo

Visit `/test-avatars` to see the avatar system in action with:
- Real lab member selection
- Live upload interface
- Various display sizes
- Team member grids
- avatar stacks

## Integration with Lab Management

The avatar system integrates seamlessly with:
- User profiles
- Team member displays
- Project assignment views
- Task boards
- Lab member directories

All 13 real lab members now have avatar support ready for use!
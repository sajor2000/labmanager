# Backend-Frontend Alignment Analysis

## Critical Mismatches Found

### 1. **Project vs Study Terminology**
- **Backend Schema**: Uses `Project` model
- **Frontend**: Still uses `Study` in many places
- **API Endpoints**: Both `/api/projects` and `/api/studies` exist

**Files affected:**
- All components in `/components/studies/`
- Types in `/types/study.ts`
- Stores in `/lib/store/study-store.ts`
- API client mixing both terms

### 2. **Member/Assignee Models**
- **Backend Schema**: 
  - `ProjectMember` with RACI roles (RESPONSIBLE, ACCOUNTABLE, CONSULTED, INFORMED, CONTRIBUTOR)
  - Has `allocation` field (percentage)
- **Frontend Types**: 
  - `StudyAssignee` with simpler structure
  - No RACI roles, no allocation percentage

### 3. **Task Assignment**
- **Backend Schema**: `TaskAssignee` model
- **Frontend**: May be expecting different structure

### 4. **Comments System**
- **Backend**: 
  - New unified `Comment` model (polymorphic)
  - Old `ProjectComment` and `TaskComment` still exist
- **Frontend**: Not yet using the new comment system

### 5. **Attachments**
- **Backend**: 
  - New `FileAttachment` model (enhanced)
  - Old `Attachment` model still exists
- **Frontend**: May be using old attachment structure

### 6. **Notifications**
- **Backend**: 
  - New `EnhancedNotification` model
  - Old `Notification` model still exists
- **Frontend**: Not using enhanced notifications

### 7. **Status Enums**
- **Backend**: `ProjectStatus` enum values in SCREAMING_SNAKE_CASE
  - PLANNING, IRB_SUBMISSION, IRB_APPROVED, etc.
- **Frontend**: Using PascalCase strings
  - 'Planning', 'IRB Submission', 'IRB Approved', etc.

### 8. **Priority Enums**
- **Backend**: SCREAMING_SNAKE_CASE (LOW, MEDIUM, HIGH, CRITICAL)
- **Frontend**: PascalCase strings ('Low', 'Medium', 'High', 'Critical')

### 9. **Field Name Mappings**
- **Backend `Project`**: 
  - `name` field
  - `projectType` field
  - `studyType` field (separate)
- **Frontend `Study`**: 
  - Expects `name` (not `title`)
  - Uses `studyType` 
  - Missing `projectType`

### 10. **New Fields Not in Frontend**
- `startDate` - Project start date
- `completedDate` - Project completion date
- `fundingDetails` - Additional funding info
- `protocolLink` - Link to protocol
- `dataLink` - Link to data
- `progress` - Progress percentage
- `position` - Kanban position
- `allocation` - Member allocation percentage

## Required Actions

### Immediate (Breaking Issues)
1. **Standardize Project/Study terminology**
   - Option A: Rename all frontend "Study" to "Project"
   - Option B: Keep "Study" as user-facing term, map to "Project" in API layer

2. **Fix Status/Priority enum mismatches**
   - Add transformation layer in API to convert between formats
   - Or update frontend to use SCREAMING_SNAKE_CASE

3. **Update Member/Assignee interfaces**
   - Update frontend types to match ProjectMember structure
   - Add RACI role support to UI

### Short-term
1. **Migrate to new Comment system**
   - Remove old ProjectComment/TaskComment usage
   - Integrate new CommentThread component

2. **Update to FileAttachment model**
   - Remove old Attachment references
   - Update upload components

3. **Implement EnhancedNotification**
   - Update notification components
   - Remove old notification system

### Long-term
1. **Add missing fields to UI**
   - Progress bars
   - Allocation percentages
   - Protocol/Data links
   - Start/Complete dates

2. **Clean up duplicate models**
   - Remove old models after migration
   - Consolidate API endpoints

## Recommended Approach

1. **Create a mapping layer** in `/lib/mappers/`:
   ```typescript
   // Map backend Project to frontend Study format
   export function projectToStudy(project: Project): Study {
     return {
       ...project,
       studyType: project.projectType,
       status: mapProjectStatus(project.status),
       priority: mapPriority(project.priority),
       assignees: project.members?.map(memberToAssignee)
     };
   }
   ```

2. **Update API client** to handle transformations automatically

3. **Gradually migrate** components to use Project terminology

4. **Add feature flags** for new features (Comments, Enhanced Notifications)

## Database Migration Safety
- All new models are additions, not replacements
- Old models still exist for backward compatibility
- Can run both systems in parallel during migration
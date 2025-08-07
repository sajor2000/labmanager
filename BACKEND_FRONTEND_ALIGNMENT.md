# Backend-Frontend Label Alignment Report

## Current State Analysis

### ✅ Properly Aligned Components
1. **Buckets** - Consistent naming throughout
2. **Ideas/Ideas Board** - Consistent naming
3. **Standups** - Consistent naming
4. **Team/Team Members** - Consistent naming
5. **Labs** - Consistent naming
6. **Deadlines** - Consistent naming
7. **Status Enums** - All status values match
8. **Priority Enums** - All priority values match

### ⚠️ Major Inconsistency: Project vs Study

#### Current Implementation:
- **Database Model**: `Project`
- **API Routes**: `/api/projects/*`
- **Backend Actions**: `project-actions-v2.ts`
- **Frontend Display**: "Studies"
- **Frontend Routes**: `/studies`
- **Workaround**: `export const getStudies = getProjects`

#### Issues This Creates:
1. Confusion for developers maintaining the codebase
2. API endpoints don't match UI terminology
3. Database queries reference "projects" while UI shows "studies"
4. Mixed terminology in codebase (some files use study, others use project)

## Recommended Solution

### Option 1: Align Everything to "Studies" (Research-Focused)
**Pros**: Matches scientific research domain language
**Changes Required**:
1. Rename database model from `Project` to `Study`
2. Update all API routes from `/api/projects` to `/api/studies`
3. Rename backend actions from `project-actions` to `study-actions`
4. Update all TypeScript types and interfaces
5. Run database migration to rename tables

### Option 2: Align Everything to "Projects" (Generic)
**Pros**: More flexible for non-research use cases
**Changes Required**:
1. Update frontend navigation from "Studies" to "Projects"
2. Change route from `/studies` to `/projects`
3. Update all UI text references
4. Remove the `getStudies` alias

### Option 3: Keep Dual Terminology (Current State)
**Pros**: No breaking changes needed
**Improvements**:
1. Document the terminology mapping clearly
2. Add comments explaining why "Project" in DB = "Study" in UI
3. Create a terminology glossary in the documentation

## Implementation Priority

### Immediate Actions (No Breaking Changes):
1. ✅ Add clear comments in code explaining the Project/Study mapping
2. ✅ Ensure all new code follows consistent patterns
3. ✅ Document the terminology in README

### Future Migration (Breaking Changes):
1. Choose Option 1 or 2 based on product direction
2. Plan migration during a major version update
3. Update all references in a single coordinated change

## Field Naming Conventions

### Current Good Practices:
- camelCase for all API fields ✅
- snake_case for database columns (via Prisma @map) ✅
- Consistent enum values (UPPER_SNAKE_CASE) ✅

### Areas for Improvement:
- Some fields use both `projectType` and `studyType` - consolidate
- `oraNumber` could be more generic like `referenceNumber`
- Consider standardizing date fields: `createdAt`, `updatedAt`, `dueDate`, `completedDate`

## Conclusion

The codebase has good overall consistency except for the Project/Study terminology mismatch. This should be addressed either through better documentation (short-term) or a complete alignment (long-term) to prevent confusion and improve maintainability.
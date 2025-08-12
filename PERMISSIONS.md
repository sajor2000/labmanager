# LabSync Research Platform - Permissions Structure

## User Roles Hierarchy

### 1. **Principal Investigator (PI)**
- **Full Access**: Complete control over all lab operations
- Can view audit logs for all labs
- Can delete/purge audit logs
- Can perform all CRUD operations
- Can manage lab members and settings

### 2. **Co-Principal Investigator (Co-PI)**  
- Similar permissions to PI
- Can view audit logs
- Full CRUD access

### 3. **Lab Administrator (LAB_ADMINISTRATOR)**
- Administrative privileges across the platform
- Can view and purge audit logs
- Can manage lab settings and members
- Full CRUD access

### 4. **Lab Admin (isAdmin flag in LabMember)**
- Administrative privileges within specific labs
- Can view audit logs for their labs only
- Can manage lab members
- Can delete resources within their lab

### 5. **Regular Lab Members**
- **Can CREATE**: Studies/Projects, Tasks, Ideas, Deadlines, Comments
- **Can EDIT**: Studies/Projects, Tasks, Ideas, Deadlines they have access to
- **Can DELETE**: Studies/Projects, Tasks, Ideas, Deadlines (any in their lab)
- **Cannot**: View audit logs (restricted to admins/PIs only)
- **Cannot**: Manage lab settings or members

## Permission Matrix

| Action | Regular Member | Lab Admin | PI/Co-PI | System Admin |
|--------|---------------|-----------|----------|--------------|
| **Tasks** |
| Create Tasks | ✅ | ✅ | ✅ | ✅ |
| Edit Tasks | ✅ | ✅ | ✅ | ✅ |
| Delete Tasks | ✅ | ✅ | ✅ | ✅ |
| **Ideas** |
| Create Ideas | ✅ | ✅ | ✅ | ✅ |
| Edit Ideas | ✅ | ✅ | ✅ | ✅ |
| Delete Ideas | ✅ | ✅ | ✅ | ✅ |
| **Deadlines** |
| Create Deadlines | ✅ | ✅ | ✅ | ✅ |
| Edit Deadlines | ✅ | ✅ | ✅ | ✅ |
| Delete Deadlines | ✅ | ✅ | ✅ | ✅ |
| **Studies/Projects** |
| Create Studies | ✅ | ✅ | ✅ | ✅ |
| Edit Studies | ✅ | ✅ | ✅ | ✅ |
| Delete Studies | ✅ | ✅ | ✅ | ✅ |
| **Audit Logs** |
| View Audit Logs | ❌ | Lab only | ✅ | ✅ |
| Purge Audit Logs | ❌ | ❌ | ✅ | ✅ |
| **Lab Management** |
| Add Members | ❌ | ✅ | ✅ | ✅ |
| Remove Members | ❌ | ✅ | ✅ | ✅ |
| Edit Lab Settings | ❌ | ✅ | ✅ | ✅ |
| Delete Lab | ❌ | ✅ | ✅ | ✅ |

## API Endpoint Permissions

### Open to All Lab Members (CREATE/UPDATE)
- `POST /api/studies` - Create studies (must be lab member)
- `PUT /api/studies/[id]` - Update studies
- `POST /api/projects` - Create projects (must be lab member)
- `PUT /api/projects/[id]` - Update projects
- `POST /api/tasks` - Create tasks (must be lab member)
- `PUT /api/tasks/[id]` - Update tasks
- `POST /api/ideas` - Create ideas (must be lab member if labId specified)
- `PUT /api/ideas/[id]` - Update ideas  
- `POST /api/deadlines` - Create deadlines
- `PUT /api/deadlines/[id]` - Update deadlines
- `POST /api/comments` - Add comments
- `PUT /api/comments/[id]` - Edit own comments

### Open to All Lab Members (DELETE)
- `DELETE /api/tasks/[id]` - Any lab member
- `DELETE /api/ideas/[id]` - Any lab member
- `DELETE /api/deadlines/[id]` - Any lab member
- `DELETE /api/studies/[id]` - Any lab member
- `DELETE /api/projects` - Any lab member
- `DELETE /api/comments/[id]` - Own comments only

### Restricted to Lab Admins/PIs Only
- `DELETE /api/buckets/[id]` - Lab Admin only
- `DELETE /api/labs/[id]` - Lab Admin only
- `DELETE /api/team` - Lab Admin only
- `DELETE /api/labs/[labId]/members` - Lab Admin only
- `DELETE /api/users/[id]` - Admin or self only

### Audit Logs (Special Permissions)
- `GET /api/audit-logs` - Lab Admins (own labs) and PIs (all labs)
- `DELETE /api/audit-logs` - PIs and System Admins only

### System Admin Only
- `DELETE /api/logs` - Clear system logs
- `DELETE /api/users/[id]` - Delete users (or self)

## Key Security Features

### For All Operations
1. **Authentication Required**: User must be logged in
2. **Lab Membership**: User must be member of relevant lab
3. **Rate Limiting**: 5 DELETE operations per minute
4. **Audit Logging**: All actions tracked with user attribution

### For Delete Operations
1. **Enhanced Authorization**: Admin or owner verification
2. **Cascade Protection**: Check for dependent data
3. **Soft Delete**: Recovery mechanism for critical data
4. **Confirmation Required**: UI shows warning dialogs

## Special Cases

### Mia (Lab Administrator Example)
As a Lab Administrator with `isAdmin: true`:
- ✅ Can create/edit all content (tasks, ideas, deadlines)
- ✅ Can delete content within managed labs
- ✅ Can view audit logs for managed labs
- ✅ Can manage lab members
- ❌ Cannot view audit logs for other labs
- ❌ Cannot purge system-wide audit logs (PI only)

### Regular Researchers
- ✅ Can create and collaborate on all content types
- ✅ Can edit shared tasks and deadlines
- ✅ Can delete any tasks, ideas, deadlines, studies in their lab
- ✅ Can delete own comments
- ✅ Can contribute ideas and comments
- ❌ Cannot access audit logs
- ❌ Cannot manage lab settings

## Implementation Notes

1. **Flexible Creation**: All authenticated users can create content to encourage collaboration
2. **Open Deletion**: All lab members can delete content within their lab for full CRUD access
3. **Audit Transparency**: Admins and PIs can track all changes for compliance
4. **Lab Isolation**: Members can only affect their own lab's data
5. **Recovery Options**: Soft delete allows restoration of accidentally removed items

## Testing User Scenarios

### Scenario 1: Regular Member
```javascript
// Can do:
POST /api/tasks - ✅ Create task
PUT /api/tasks/123 - ✅ Update task
DELETE /api/tasks/123 - ✅ Delete task (any in their lab)
POST /api/ideas - ✅ Create idea
DELETE /api/ideas/123 - ✅ Delete idea (any in their lab)
DELETE /api/deadlines?id=456 - ✅ Delete deadline
DELETE /api/studies/789 - ✅ Delete study

// Cannot do:
GET /api/audit-logs - ❌ 403 Forbidden
DELETE /api/labs/123 - ❌ 403 Forbidden (admin only)
```

### Scenario 2: Lab Admin (like Mia)
```javascript
// Can do:
POST /api/tasks - ✅ Create task
DELETE /api/tasks/123 - ✅ Delete task
GET /api/audit-logs?labId=lab1 - ✅ View lab audit logs
POST /api/labs/lab1/members - ✅ Add members

// Cannot do:
GET /api/audit-logs?labId=otherLab - ❌ 403 Forbidden
DELETE /api/audit-logs - ❌ 403 Forbidden (PI only)
```

### Scenario 3: Principal Investigator
```javascript
// Can do everything:
POST /api/tasks - ✅
DELETE /api/tasks/123 - ✅
GET /api/audit-logs - ✅ All labs
DELETE /api/audit-logs - ✅ Purge old logs
DELETE /api/labs/123 - ✅
```

---

*Last Updated: January 2025*
*Security Level: Production Ready*
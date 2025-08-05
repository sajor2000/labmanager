-- Enhanced Schema Migration: Streamlined CRUD with Position-Based Ordering
-- This migration updates the existing schema to the enhanced structure with soft deletes and position fields

-- ==========================================
-- 1. ADD POSITION FIELDS FOR DRAG-AND-DROP
-- ==========================================

-- Add position field to buckets (for kanban column ordering)
ALTER TABLE buckets ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Add position field to projects (for ordering within buckets)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Add position field to tasks (for ordering within projects/parent tasks)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- ==========================================
-- 2. ADD SOFT DELETE SUPPORT
-- ==========================================

-- Add isActive fields for soft delete functionality
ALTER TABLE buckets ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE lab_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE task_assignments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE standups ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE action_items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE blockers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ==========================================
-- 3. INITIALIZE POSITION VALUES
-- ==========================================

-- Initialize bucket positions within each lab
WITH bucket_positions AS (
  SELECT 
    id,
    lab_id,
    ROW_NUMBER() OVER (PARTITION BY lab_id ORDER BY created_at) - 1 as new_position
  FROM buckets 
  WHERE position = 0
)
UPDATE buckets 
SET position = bucket_positions.new_position
FROM bucket_positions
WHERE buckets.id = bucket_positions.id;

-- Initialize project positions within each bucket
WITH project_positions AS (
  SELECT 
    id,
    bucket_id,
    ROW_NUMBER() OVER (PARTITION BY bucket_id ORDER BY created_at) - 1 as new_position
  FROM projects 
  WHERE position = 0
)
UPDATE projects 
SET position = project_positions.new_position
FROM project_positions
WHERE projects.id = project_positions.id;

-- Initialize task positions within each project
WITH task_positions AS (
  SELECT 
    id,
    project_id,
    parent_task_id,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, COALESCE(parent_task_id, '') 
      ORDER BY created_at
    ) - 1 as new_position
  FROM tasks 
  WHERE position = 0
)
UPDATE tasks 
SET position = task_positions.new_position
FROM task_positions
WHERE tasks.id = task_positions.id;

-- ==========================================
-- 4. ADD ENHANCED USER FIELDS
-- ==========================================

-- Add enhanced user fields if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS initials VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 40;
ALTER TABLE users ADD COLUMN IF NOT EXISTS expertise TEXT[];

-- Split existing name field into first_name and last_name where possible
UPDATE users 
SET 
  first_name = COALESCE(split_part(name, ' ', 1), name),
  last_name = CASE 
    WHEN position(' ' in name) > 0 
    THEN substring(name from position(' ' in name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Generate initials from first_name and last_name
UPDATE users 
SET initials = COALESCE(
  left(first_name, 1) || left(last_name, 1),
  left(name, 2)
)
WHERE initials IS NULL OR initials = '';

-- ==========================================
-- 5. ADD ENHANCED PROJECT FIELDS
-- ==========================================

-- Add enhanced project fields if they don't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(255) DEFAULT 'Research Study';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS study_type VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS funding_details TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS external_collaborators TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS protocol_link VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS data_link VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- ==========================================
-- 6. ADD ENHANCED TASK FIELDS
-- ==========================================

-- Add enhanced task fields if they don't exist
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours REAL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours REAL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_by_id VARCHAR(255);

-- Add foreign key constraint for completed_by_id
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_completed_by 
  FOREIGN KEY (completed_by_id) REFERENCES users(id);

-- ==========================================
-- 7. CREATE NEW TABLES
-- ==========================================

-- Create task_dependencies table for enhanced project management
CREATE TABLE IF NOT EXISTS task_dependencies (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  dependent_task_id VARCHAR(255) NOT NULL,
  depends_on_task_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_task_dependencies_dependent 
    FOREIGN KEY (dependent_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_dependencies_depends_on 
    FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT unique_task_dependency 
    UNIQUE (dependent_task_id, depends_on_task_id)
);

-- Create activity_logs table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(255) NOT NULL,
  lab_id VARCHAR(255),
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_activity_logs_user 
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_activity_logs_lab 
    FOREIGN KEY (lab_id) REFERENCES labs(id)
);

-- ==========================================
-- 8. ADD INDEXES FOR PERFORMANCE
-- ==========================================

-- Kanban and ordering indexes
CREATE INDEX IF NOT EXISTS idx_buckets_lab_position ON buckets(lab_id, position);
CREATE INDEX IF NOT EXISTS idx_projects_bucket_position ON projects(bucket_id, position);
CREATE INDEX IF NOT EXISTS idx_tasks_project_position ON tasks(project_id, position);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_position ON tasks(parent_task_id, position);

-- Dashboard and filtering indexes
CREATE INDEX IF NOT EXISTS idx_projects_status_due ON projects(status, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status_due ON tasks(status, due_date);
CREATE INDEX IF NOT EXISTS idx_projects_ora_number ON projects(ora_number);

-- Activity logging indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_lab_created ON activity_logs(lab_id, created_at);

-- Task dependencies indexes
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

-- User role and capacity indexes
CREATE INDEX IF NOT EXISTS idx_project_members_user_role ON project_members(user_id, role);

-- ==========================================
-- 9. DATA INTEGRITY CHECKS
-- ==========================================

-- Ensure all projects have bucketId (strict hierarchy requirement)
UPDATE projects 
SET bucket_id = (
  SELECT id FROM buckets 
  WHERE buckets.lab_id = projects.lab_id 
  ORDER BY created_at 
  LIMIT 1
)
WHERE bucket_id IS NULL;

-- Ensure all tasks have projectId (strict hierarchy requirement)
-- Note: This should not happen in a well-maintained system, but adding for safety
DELETE FROM tasks WHERE project_id IS NULL;

-- ==========================================
-- 10. UPDATE CONSTRAINTS
-- ==========================================

-- Make bucketId NOT NULL for projects (enforce strict hierarchy)
ALTER TABLE projects ALTER COLUMN bucket_id SET NOT NULL;

-- Make projectId NOT NULL for tasks (enforce strict hierarchy)
ALTER TABLE tasks ALTER COLUMN project_id SET NOT NULL;

-- Add unique constraint for bucket names per lab
ALTER TABLE buckets ADD CONSTRAINT unique_bucket_name_per_lab 
  UNIQUE (lab_id, name);

-- ==========================================
-- 11. MIGRATION VALIDATION
-- ==========================================

-- Verify position fields are properly initialized
DO $$
DECLARE
  bucket_count INTEGER;
  project_count INTEGER;
  task_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bucket_count FROM buckets WHERE position IS NULL;
  SELECT COUNT(*) INTO project_count FROM projects WHERE position IS NULL;
  SELECT COUNT(*) INTO task_count FROM tasks WHERE position IS NULL;
  
  IF bucket_count > 0 OR project_count > 0 OR task_count > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: NULL position values found';
  END IF;
  
  RAISE NOTICE 'Migration validation passed: All position fields initialized';
END $$;

-- Verify soft delete fields are properly initialized
DO $$
DECLARE
  inactive_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inactive_count 
  FROM (
    SELECT COUNT(*) FROM buckets WHERE is_active IS NULL
    UNION ALL
    SELECT COUNT(*) FROM projects WHERE is_active IS NULL
    UNION ALL
    SELECT COUNT(*) FROM tasks WHERE is_active IS NULL
  ) counts;
  
  IF inactive_count > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: NULL is_active values found';
  END IF;
  
  RAISE NOTICE 'Migration validation passed: All is_active fields initialized';
END $$;

-- Log migration completion
INSERT INTO activity_logs (
  user_id, 
  entity_type, 
  entity_id, 
  action, 
  metadata
) VALUES (
  'system',
  'migration',
  '20240804000000_enhanced_schema_migration',
  'completed',
  jsonb_build_object(
    'migration_type', 'enhanced_schema_migration',
    'features_added', jsonb_build_array(
      'position-based ordering',
      'soft delete support',
      'enhanced user fields',
      'task dependencies',
      'activity logging',
      'performance indexes'
    ),
    'timestamp', CURRENT_TIMESTAMP
  )
);

COMMIT;
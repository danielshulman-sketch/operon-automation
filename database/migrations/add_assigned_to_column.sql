-- Add assigned_to column to detected_tasks table
-- This allows admins to assign tasks to specific users

ALTER TABLE detected_tasks 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_detected_tasks_assigned ON detected_tasks(assigned_to) WHERE assigned_to IS NOT NULL;

-- Update existing tasks to have NULL assigned_to
UPDATE detected_tasks SET assigned_to = NULL WHERE assigned_to IS NULL;

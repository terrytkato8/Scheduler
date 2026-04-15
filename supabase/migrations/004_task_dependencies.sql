-- Migration 004: Task dependencies
-- Allows a task to block/depend on other tasks within the same project.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS depends_on uuid[] DEFAULT '{}';

-- Migration: Make type and content columns nullable
-- Description: Allows lessons to use new format without requiring old format fields

-- Make type and content nullable (they were required before)
ALTER TABLE lessons 
  ALTER COLUMN type DROP NOT NULL,
  ALTER COLUMN content DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN lessons.type IS 'Legacy field - Type of lesson (optional, for backward compatibility)';
COMMENT ON COLUMN lessons.content IS 'Legacy field - Content of lesson (optional, for backward compatibility)';

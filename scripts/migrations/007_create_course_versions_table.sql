-- Migration: Create course_versions table
-- Description: Creates the course_versions table for course version history

-- Create course_versions table
CREATE TABLE IF NOT EXISTS course_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_versions_course_id ON course_versions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_versions_version ON course_versions(course_id, version);

-- Add constraint to ensure unique version per course
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_versions_unique ON course_versions(course_id, version);

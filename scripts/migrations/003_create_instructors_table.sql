-- Migration: Create instructors table
-- Description: Creates the instructors table for instructor-specific data

-- Create instructors table
CREATE TABLE IF NOT EXISTS instructors (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  expertise TEXT[],
  is_suspended BOOLEAN DEFAULT false,
  suspended_at TIMESTAMP,
  suspended_by UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_instructors_is_suspended ON instructors(is_suspended);
CREATE INDEX IF NOT EXISTS idx_instructors_suspended_by ON instructors(suspended_by);

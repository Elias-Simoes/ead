-- Migration: Create student_progress table
-- Description: Tracks student progress through courses including completed lessons and favorites

CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed_lessons UUID[] DEFAULT '{}',
  progress_percentage DECIMAL(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  is_favorite BOOLEAN DEFAULT false,
  last_accessed_at TIMESTAMP,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_student_course UNIQUE(student_id, course_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_student_progress_student ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_course ON student_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_favorite ON student_progress(is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_student_progress_completed ON student_progress(completed_at) WHERE completed_at IS NOT NULL;

-- Add comment to table
COMMENT ON TABLE student_progress IS 'Tracks student progress through courses';
COMMENT ON COLUMN student_progress.completed_lessons IS 'Array of lesson IDs that have been completed';
COMMENT ON COLUMN student_progress.progress_percentage IS 'Percentage of course completion (0-100)';
COMMENT ON COLUMN student_progress.is_favorite IS 'Whether the student has favorited this course';
COMMENT ON COLUMN student_progress.last_accessed_at IS 'Last time the student accessed this course';
COMMENT ON COLUMN student_progress.started_at IS 'When the student first started this course';
COMMENT ON COLUMN student_progress.completed_at IS 'When the student completed 100% of the course';

-- Migration: Create student_assessments table
-- Description: Creates the student_assessments table for tracking student assessment submissions

-- Create student_assessments table
CREATE TABLE IF NOT EXISTS student_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'graded')),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  graded_at TIMESTAMP,
  graded_by UUID REFERENCES users(id),
  feedback TEXT,
  UNIQUE(student_id, assessment_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_assessments_student_id ON student_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assessments_assessment_id ON student_assessments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_student_assessments_status ON student_assessments(status);
CREATE INDEX IF NOT EXISTS idx_student_assessments_graded_by ON student_assessments(graded_by);


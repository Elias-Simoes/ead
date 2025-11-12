-- Migration: Add final_score to student_progress table
-- Description: Adds final_score column to track the weighted average of all assessments

-- Add final_score column to student_progress
ALTER TABLE student_progress
ADD COLUMN IF NOT EXISTS final_score DECIMAL(5,2) CHECK (final_score >= 0 AND final_score <= 100);

-- Create index for final_score
CREATE INDEX IF NOT EXISTS idx_student_progress_final_score ON student_progress(final_score);


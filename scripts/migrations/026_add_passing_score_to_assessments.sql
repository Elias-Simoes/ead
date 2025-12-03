-- Migration: Add passing_score column to assessments table
-- Description: Adds passing_score column to store the minimum score required to pass an assessment
-- Date: 2025-12-01

-- Add passing_score column with default value of 70
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS passing_score INTEGER NOT NULL DEFAULT 70;

-- Add check constraint to ensure passing_score is between 0 and 100
ALTER TABLE assessments 
ADD CONSTRAINT passing_score_range CHECK (passing_score >= 0 AND passing_score <= 100);

-- Add comment to the column
COMMENT ON COLUMN assessments.passing_score IS 'Minimum score (percentage) required to pass the assessment';

-- Migration: Create students table
-- Description: Creates the students table for student-specific data

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  subscription_status VARCHAR(20) DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'suspended', 'cancelled', 'inactive')),
  subscription_expires_at TIMESTAMP,
  total_study_time INTEGER DEFAULT 0,
  gdpr_consent BOOLEAN NOT NULL,
  gdpr_consent_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_subscription_status ON students(subscription_status);
CREATE INDEX IF NOT EXISTS idx_students_subscription_expires_at ON students(subscription_expires_at);

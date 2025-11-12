-- Migration: Create lessons table
-- Description: Creates the lessons table for lesson management within modules

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('video', 'pdf', 'text', 'external_link')),
  content TEXT NOT NULL,
  duration INTEGER,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON lessons(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_type ON lessons(type);

-- Add constraint to ensure unique order_index per module
CREATE UNIQUE INDEX IF NOT EXISTS idx_lessons_module_order ON lessons(module_id, order_index);

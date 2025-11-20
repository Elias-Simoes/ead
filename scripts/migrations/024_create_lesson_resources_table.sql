-- Migration: Create lesson_resources table
-- Description: Creates a table to manage lesson resources (images, PDFs, videos, links)

-- Create lesson_resources table
CREATE TABLE IF NOT EXISTS lesson_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'pdf', 'video', 'link')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_key TEXT,
  url TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson_id ON lesson_resources(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_resources_type ON lesson_resources(type);
CREATE INDEX IF NOT EXISTS idx_lesson_resources_order ON lesson_resources(lesson_id, order_index);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_lesson_resources_updated_at ON lesson_resources;
CREATE TRIGGER update_lesson_resources_updated_at
  BEFORE UPDATE ON lesson_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE lesson_resources IS 'Stores additional resources for lessons (images, PDFs, videos, links)';
COMMENT ON COLUMN lesson_resources.type IS 'Type of resource: image, pdf, video, or link';
COMMENT ON COLUMN lesson_resources.title IS 'Display title for the resource';
COMMENT ON COLUMN lesson_resources.file_key IS 'R2 storage key for uploaded files';
COMMENT ON COLUMN lesson_resources.url IS 'URL for external resources or R2 public URL';
COMMENT ON COLUMN lesson_resources.file_size IS 'File size in bytes';
COMMENT ON COLUMN lesson_resources.mime_type IS 'MIME type of the file';
COMMENT ON COLUMN lesson_resources.order_index IS 'Display order of resources';

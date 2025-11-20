-- Migration: Add multiple content fields to lessons
-- Description: Allows lessons to have multiple types of content (video + text + pdf + link)

-- Add new columns for each content type
ALTER TABLE lessons 
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_file_key TEXT,
  ADD COLUMN IF NOT EXISTS text_content TEXT,
  ADD COLUMN IF NOT EXISTS pdf_file_key TEXT,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS external_link TEXT;

-- Migrate existing data from old structure to new structure
UPDATE lessons 
SET 
  video_url = CASE WHEN type = 'video' THEN content ELSE NULL END,
  text_content = CASE WHEN type = 'text' THEN content ELSE NULL END,
  pdf_url = CASE WHEN type = 'pdf' THEN content ELSE NULL END,
  external_link = CASE WHEN type = 'external_link' THEN content ELSE NULL END
WHERE content IS NOT NULL;

-- Keep old columns for backward compatibility (will be removed in future migration)
-- type and content columns remain but are now optional

-- Add comments
COMMENT ON COLUMN lessons.video_url IS 'URL for video content (YouTube, Vimeo, etc.)';
COMMENT ON COLUMN lessons.video_file_key IS 'R2 storage key for uploaded video file';
COMMENT ON COLUMN lessons.text_content IS 'Text/markdown content for the lesson';
COMMENT ON COLUMN lessons.pdf_file_key IS 'R2 storage key for uploaded PDF file';
COMMENT ON COLUMN lessons.pdf_url IS 'URL for PDF file (if hosted externally)';
COMMENT ON COLUMN lessons.external_link IS 'External link for additional resources';


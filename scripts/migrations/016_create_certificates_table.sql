-- Migration: Create certificates table
-- Description: Stores issued certificates for students who complete courses

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  verification_code VARCHAR(100) UNIQUE NOT NULL,
  pdf_url VARCHAR(500) NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_student_course_certificate UNIQUE(student_id, course_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification ON certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_certificates_issued ON certificates(issued_at);

-- Add comments to table
COMMENT ON TABLE certificates IS 'Stores issued certificates for completed courses';
COMMENT ON COLUMN certificates.student_id IS 'Reference to the student who earned the certificate';
COMMENT ON COLUMN certificates.course_id IS 'Reference to the completed course';
COMMENT ON COLUMN certificates.verification_code IS 'Unique code for public verification (UUID)';
COMMENT ON COLUMN certificates.pdf_url IS 'URL to the certificate PDF in cloud storage';
COMMENT ON COLUMN certificates.issued_at IS 'When the certificate was issued';

-- Migration: Create gdpr_deletion_requests table
-- Description: Table to store GDPR account deletion requests

CREATE TABLE IF NOT EXISTS gdpr_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  scheduled_for TIMESTAMP NOT NULL,
  processed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'))
);

-- Create indexes
CREATE INDEX idx_gdpr_deletion_user_id ON gdpr_deletion_requests(user_id);
CREATE INDEX idx_gdpr_deletion_status ON gdpr_deletion_requests(status);
CREATE INDEX idx_gdpr_deletion_scheduled ON gdpr_deletion_requests(scheduled_for);

-- Add comment
COMMENT ON TABLE gdpr_deletion_requests IS 'GDPR account deletion requests with 15-day processing period';

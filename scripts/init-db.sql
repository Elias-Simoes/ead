-- Initial database setup for Plataforma EAD
-- This script runs automatically when the PostgreSQL container starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial database (if not exists)
-- Note: The database is already created by POSTGRES_DB env var
-- This file is for additional setup if needed

-- Set timezone
SET timezone = 'UTC';

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'Database initialized successfully';
END $$;

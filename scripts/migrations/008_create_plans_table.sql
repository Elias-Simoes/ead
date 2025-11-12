-- Migration: Create plans table
-- Description: Creates the plans table for subscription plans management

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  interval VARCHAR(20) NOT NULL CHECK (interval IN ('monthly', 'yearly')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default plan
INSERT INTO plans (name, price, currency, interval, is_active)
VALUES ('Plano Mensal', 49.90, 'BRL', 'monthly', true)
ON CONFLICT DO NOTHING;

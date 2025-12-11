-- Migration: Add PIX and installments support
-- Description: Creates tables and columns to support PIX payments and credit card installments

-- Create payment_config table
CREATE TABLE IF NOT EXISTS payment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_installments INTEGER NOT NULL DEFAULT 12,
  pix_discount_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  installments_without_interest INTEGER NOT NULL DEFAULT 12,
  pix_expiration_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to automatically update updated_at for payment_config
DROP TRIGGER IF EXISTS update_payment_config_updated_at ON payment_config;
CREATE TRIGGER update_payment_config_updated_at
  BEFORE UPDATE ON payment_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default configuration
INSERT INTO payment_config (max_installments, pix_discount_percent, installments_without_interest, pix_expiration_minutes)
VALUES (12, 10.00, 12, 30);

-- Create pix_payments table
CREATE TABLE IF NOT EXISTS pix_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  qr_code TEXT NOT NULL,
  copy_paste_code TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  expires_at TIMESTAMP NOT NULL,
  paid_at TIMESTAMP,
  gateway_charge_id VARCHAR(255) NOT NULL,
  gateway_response JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for pix_payments
CREATE INDEX IF NOT EXISTS idx_pix_payments_student_id ON pix_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_plan_id ON pix_payments(plan_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_status ON pix_payments(status);
CREATE INDEX IF NOT EXISTS idx_pix_payments_gateway_charge_id ON pix_payments(gateway_charge_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_expires_at ON pix_payments(expires_at);
CREATE INDEX IF NOT EXISTS idx_pix_payments_created_at ON pix_payments(created_at);

-- Create trigger to automatically update updated_at for pix_payments
DROP TRIGGER IF EXISTS update_pix_payments_updated_at ON pix_payments;
CREATE TRIGGER update_pix_payments_updated_at
  BEFORE UPDATE ON pix_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add new columns to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(10) DEFAULT 'card' CHECK (payment_method IN ('card', 'pix')),
ADD COLUMN IF NOT EXISTS installments INTEGER,
ADD COLUMN IF NOT EXISTS pix_payment_id UUID REFERENCES pix_payments(id) ON DELETE SET NULL;

-- Create index for payment_method
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);

-- Create index for pix_payment_id
CREATE INDEX IF NOT EXISTS idx_payments_pix_payment_id ON payments(pix_payment_id);

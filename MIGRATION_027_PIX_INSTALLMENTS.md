# Migration 027: PIX and Installments Support

## Summary

Successfully created and executed database migration to support PIX payments and credit card installments.

## Created Tables

### 1. payment_config
Configuration table for payment options:
- `id` (UUID, primary key)
- `max_installments` (INTEGER, default: 12)
- `pix_discount_percent` (DECIMAL(5,2), default: 10.00)
- `installments_without_interest` (INTEGER, default: 12)
- `pix_expiration_minutes` (INTEGER, default: 30)
- `created_at`, `updated_at` (TIMESTAMP)

**Default Configuration Inserted:**
- Max installments: 12
- PIX discount: 10%
- Installments without interest: 12
- PIX expiration: 30 minutes

### 2. pix_payments
Table to track PIX payment transactions:
- `id` (UUID, primary key)
- `student_id` (UUID, references users)
- `plan_id` (UUID, references plans)
- `amount` (DECIMAL(10,2))
- `discount` (DECIMAL(10,2))
- `final_amount` (DECIMAL(10,2))
- `qr_code` (TEXT)
- `copy_paste_code` (TEXT)
- `status` (VARCHAR(20): 'pending', 'paid', 'expired', 'cancelled')
- `expires_at` (TIMESTAMP)
- `paid_at` (TIMESTAMP, nullable)
- `gateway_charge_id` (VARCHAR(255))
- `gateway_response` (JSONB)
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes Created:**
- `idx_pix_payments_student_id`
- `idx_pix_payments_plan_id`
- `idx_pix_payments_status`
- `idx_pix_payments_gateway_charge_id`
- `idx_pix_payments_expires_at`
- `idx_pix_payments_created_at`

## Updated Tables

### payments
Added three new columns:
- `payment_method` (VARCHAR(10), default: 'card', CHECK: 'card' or 'pix')
- `installments` (INTEGER, nullable)
- `pix_payment_id` (UUID, references pix_payments, nullable)

**Indexes Created:**
- `idx_payments_payment_method`
- `idx_payments_pix_payment_id`

## Files Created

1. **scripts/migrations/027_add_pix_and_installments_support.sql**
   - Main migration file with all DDL statements

2. **scripts/run-migration-027.js**
   - Script to execute the migration

3. **verify-migration-027.js**
   - Verification script to confirm migration success

## Validation

✅ All tables created successfully
✅ All columns added to payments table
✅ All indexes created for performance
✅ Default configuration inserted
✅ Triggers for updated_at columns working
✅ Foreign key constraints properly set

## Requirements Satisfied

- ✅ Requirement 5.1: PIX payment expiration tracking
- ✅ Requirement 7.1: Configurable max installments
- ✅ Requirement 7.2: Configurable installments without interest
- ✅ Requirement 7.3: Configurable PIX discount

## Next Steps

The database schema is now ready for:
1. PaymentConfigService implementation (Task 2)
2. StripeService expansion for installments (Task 3)
3. PixPaymentService implementation (Task 4)

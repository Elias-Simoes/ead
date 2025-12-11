const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  try {
    console.log('Running migration 027: Add PIX and installments support...');

    const migrationPath = path.join(__dirname, 'migrations', '027_add_pix_and_installments_support.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    await pool.query(sql);

    console.log('✅ Migration 027 completed successfully');
    console.log('Created tables:');
    console.log('  - payment_config (with default configuration)');
    console.log('  - pix_payments');
    console.log('Updated tables:');
    console.log('  - payments (added payment_method, installments, pix_payment_id columns)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

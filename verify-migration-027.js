const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function verifyMigration() {
  try {
    console.log('Verifying migration 027...\n');

    // Check payment_config table
    console.log('1. Checking payment_config table:');
    const configResult = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'payment_config' 
      ORDER BY ordinal_position
    `);
    console.log('   Columns:', configResult.rows.map(r => r.column_name).join(', '));
    
    const configData = await pool.query('SELECT * FROM payment_config LIMIT 1');
    console.log('   Default config:', configData.rows[0]);

    // Check pix_payments table
    console.log('\n2. Checking pix_payments table:');
    const pixResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pix_payments' 
      ORDER BY ordinal_position
    `);
    console.log('   Columns:', pixResult.rows.map(r => r.column_name).join(', '));

    // Check pix_payments indexes
    const pixIndexes = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'pix_payments'
    `);
    console.log('   Indexes:', pixIndexes.rows.map(r => r.indexname).join(', '));

    // Check payments table new columns
    console.log('\n3. Checking payments table new columns:');
    const paymentsResult = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND column_name IN ('payment_method', 'installments', 'pix_payment_id')
      ORDER BY ordinal_position
    `);
    console.log('   New columns:');
    paymentsResult.rows.forEach(row => {
      console.log(`     - ${row.column_name} (${row.data_type})`);
    });

    // Check payments indexes
    const paymentsIndexes = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'payments' 
      AND indexname IN ('idx_payments_payment_method', 'idx_payments_pix_payment_id')
    `);
    console.log('   New indexes:', paymentsIndexes.rows.map(r => r.indexname).join(', '));

    console.log('\n✅ Migration verification completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyMigration();

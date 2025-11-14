/**
 * Script to create test subscriptions directly in database
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://user:password@localhost:5432/plataforma_ead',
});

async function createSubscriptions(student1Id, student2Id) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get or create the monthly plan
    let planResult = await client.query(
      "SELECT id FROM plans WHERE name = 'Plano Mensal' LIMIT 1"
    );

    let planId;
    if (planResult.rows.length === 0) {
      // Create a default plan
      const createPlanResult = await client.query(
        `INSERT INTO plans (name, price, currency, interval, is_active)
         VALUES ('Plano Mensal', 49.90, 'BRL', 'monthly', true)
         RETURNING id`
      );
      planId = createPlanResult.rows[0].id;
      console.log('✅ Plan created');
    } else {
      planId = planResult.rows[0].id;
    }

    // Create subscription for student 1
    await client.query(
      `INSERT INTO subscriptions (student_id, plan_id, status, current_period_start, current_period_end)
       VALUES ($1, $2, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days')`,
      [student1Id, planId]
    );

    // Update student 1 subscription status
    await client.query(
      `UPDATE students 
       SET subscription_status = 'active', 
           subscription_expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days'
       WHERE id = $1`,
      [student1Id]
    );

    // Create subscription for student 2
    await client.query(
      `INSERT INTO subscriptions (student_id, plan_id, status, current_period_start, current_period_end)
       VALUES ($1, $2, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days')`,
      [student2Id, planId]
    );

    // Update student 2 subscription status
    await client.query(
      `UPDATE students 
       SET subscription_status = 'active', 
           subscription_expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days'
       WHERE id = $1`,
      [student2Id]
    );

    await client.query('COMMIT');

    console.log('✅ Subscriptions created and students updated');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

// Get student IDs from command line
const student1Id = process.argv[2];
const student2Id = process.argv[3];

if (!student1Id || !student2Id) {
  console.error('Usage: node create-test-subscriptions.js <student1Id> <student2Id>');
  process.exit(1);
}

createSubscriptions(student1Id, student2Id);

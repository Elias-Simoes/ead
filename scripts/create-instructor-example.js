const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'plataforma_ead',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function createInstructor() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const email = 'instructor@example.com';
    const password = 'Instructor123!';
    const name = 'Professor João Silva';
    const bio = 'Especialista em desenvolvimento web com mais de 10 anos de experiência.';
    const expertise = ['JavaScript', 'React', 'Node.js', 'TypeScript'];

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('❌ Instrutor já existe!');
      console.log('\n📧 Email:', email);
      console.log('🔑 Password:', password);
      await client.query('ROLLBACK');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, name, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, 'instructor', true, NOW(), NOW())
       RETURNING id`,
      [email, hashedPassword, name]
    );

    const userId = userResult.rows[0].id;

    // Create instructor profile
    await client.query(
      `INSERT INTO instructors (id, bio, expertise)
       VALUES ($1, $2, $3)`,
      [userId, bio, expertise]
    );

    await client.query('COMMIT');

    console.log('✅ Instrutor criado com sucesso!\n');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Nome:', name);
    console.log('📝 Bio:', bio);
    console.log('🎯 Expertise:', expertise.join(', '));
    console.log('\n🌐 Acesse: http://localhost:5173');
    console.log('📱 Faça login e explore o dashboard do instrutor!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao criar instrutor:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createInstructor();

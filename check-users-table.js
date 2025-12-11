require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkUsersTable() {
  const client = await pool.connect();
  
  try {
    console.log('Verificando estrutura da tabela users...\n');
    
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas da tabela users:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Verificar se existe usuário de teste
    console.log('\n\nVerificando usuário de teste...');
    const userCheck = await client.query(`
      SELECT id, email, name, role FROM users WHERE email = 'student.e2e@test.com'
    `);
    
    if (userCheck.rows.length > 0) {
      console.log('✅ Usuário de teste já existe:', userCheck.rows[0]);
    } else {
      console.log('⚠️  Usuário de teste não existe');
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsersTable();

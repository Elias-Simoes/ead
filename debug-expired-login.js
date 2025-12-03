const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function debugExpiredLogin() {
  console.log('🔍 Debugando login com conta vencida\n');

  try {
    // 1. Login
    console.log('1️⃣ Fazendo login com expired@example.com...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'expired@example.com',
      password: 'Expired123!'
    });

    console.log('✅ Login bem-sucedido\n');
    console.log('📦 Dados retornados no login:');
    console.log(JSON.stringify(loginResponse.data, null, 2));

    const { accessToken } = loginResponse.data.data.tokens;
    const userData = loginResponse.data.data.user;

    console.log('\n2️⃣ Verificando dados do usuário no login:');
    console.log('- subscriptionStatus:', userData.subscriptionStatus || '❌ NÃO PRESENTE');
    console.log('- subscriptionExpiresAt:', userData.subscriptionExpiresAt || '❌ NÃO PRESENTE');

    // 2. Buscar /auth/me
    console.log('\n3️⃣ Buscando /auth/me...');
    const meResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    console.log('✅ Dados do /auth/me:');
    console.log(JSON.stringify(meResponse.data, null, 2));

    console.log('\n4️⃣ Verificando campos de assinatura no /auth/me:');
    console.log('- subscriptionStatus:', meResponse.data.subscriptionStatus || '❌ NÃO PRESENTE');
    console.log('- subscriptionExpiresAt:', meResponse.data.subscriptionExpiresAt || '❌ NÃO PRESENTE');

    // 3. Verificar no banco
    console.log('\n5️⃣ Verificando no banco de dados...');
    const { Pool } = require('pg');
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'plataforma_ead',
      user: 'user',
      password: 'password',
    });

    const result = await pool.query(
      `SELECT u.email, s.subscription_status, s.subscription_expires_at
       FROM users u
       JOIN students s ON u.id = s.id
       WHERE u.email = $1`,
      ['expired@example.com']
    );

    if (result.rows.length > 0) {
      console.log('✅ Dados no banco:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('❌ Usuário não encontrado no banco');
    }

    await pool.end();

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugExpiredLogin();

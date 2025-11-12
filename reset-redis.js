/**
 * Script para resetar o Redis
 */
const { createClient } = require('redis');
require('dotenv').config();

async function resetRedis() {
  const redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  try {
    console.log('🔄 Conectando ao Redis...');
    await redis.connect();
    console.log('🔄 Resetando Redis...');
    await redis.flushAll();
    console.log('✅ Redis resetado com sucesso!');
    await redis.quit();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao resetar Redis:', error.message);
    process.exit(1);
  }
}

resetRedis();

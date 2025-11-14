/**
 * Script to clear Redis cache
 */

const { createClient } = require('redis');

async function clearRedis() {
  const redis = createClient({
    url: 'redis://localhost:6379',
  });

  redis.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
    process.exit(1);
  });

  try {
    console.log('Connecting to Redis...');
    await redis.connect();
    console.log('✅ Connected to Redis');

    console.log('Flushing all Redis data...');
    await redis.flushAll();
    console.log('✅ Redis cache cleared');

    await redis.quit();
    console.log('✅ Disconnected from Redis');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearRedis();

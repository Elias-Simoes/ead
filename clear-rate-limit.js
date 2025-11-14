const Redis = require('ioredis');

async function clearRateLimit() {
  const redis = new Redis({
    host: 'localhost',
    port: 6379,
  });

  try {
    console.log('Clearing rate limits...\n');
    
    // Get all keys matching rate limit patterns
    const keys = await redis.keys('*login*');
    
    if (keys.length === 0) {
      console.log('No rate limit keys found.');
    } else {
      console.log(`Found ${keys.length} rate limit keys:`);
      keys.forEach(key => console.log(`  - ${key}`));
      
      // Delete all rate limit keys
      await redis.del(...keys);
      console.log('\n✓ All rate limits cleared!');
    }
    
    // Also clear API rate limits
    const apiKeys = await redis.keys('*api*');
    if (apiKeys.length > 0) {
      await redis.del(...apiKeys);
      console.log(`✓ Cleared ${apiKeys.length} API rate limit keys`);
    }
    
    console.log('\nYou can now try to login again.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await redis.quit();
  }
}

clearRateLimit();

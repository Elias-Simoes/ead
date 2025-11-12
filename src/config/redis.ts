import { createClient } from 'redis';
import { config } from './env';
import { logger } from '../shared/utils/logger';

// Redis client
export const redisClient = createClient({
  url: config.redis.url,
});

redisClient.on('connect', () => {
  logger.info('Redis connection established');
});

redisClient.on('error', (err: Error) => {
  logger.error('Redis connection error', err);
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis', error);
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error('Error disconnecting Redis', error);
  }
};

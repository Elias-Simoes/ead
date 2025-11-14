import { Pool } from 'pg';
import { config } from './env';
import { logger } from '../shared/utils/logger';

// PostgreSQL connection pool with optimized settings
export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
  maxUses: 7500, // Close and replace a connection after it has been used 7500 times
  allowExitOnIdle: false, // Don't allow the pool to close when all clients are idle
  statement_timeout: 30000, // Cancel queries that take longer than 30 seconds
});

// Test database connection
pool.on('connect', () => {
  logger.info('Database connection established');
});

pool.on('error', (err: Error) => {
  logger.error('Unexpected database error', err);
  process.exit(-1);
});

export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection test successful');
    return true;
  } catch (error) {
    logger.error('Database connection test failed', error);
    return false;
  }
};

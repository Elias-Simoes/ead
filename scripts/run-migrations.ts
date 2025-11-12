import { pool } from '../src/config/database';
import { logger } from '../src/shared/utils/logger';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');

    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      logger.info(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      await pool.query(sql);
      logger.info(`Migration ${file} completed successfully`);
    }

    logger.info('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', error);
    process.exit(1);
  }
}

runMigrations();

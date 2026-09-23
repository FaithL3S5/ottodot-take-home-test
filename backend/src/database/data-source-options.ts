import './load-env.js';
import type { DataSourceOptions } from 'typeorm';

export function createDataSourceOptions(
  databaseUrl = process.env.DATABASE_URL,
): DataSourceOptions {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');
  }

  return {
    type: 'postgres',
    url: databaseUrl,
    entities: [],
    migrations: [],
    synchronize: false,
    parseInt8: true,
  };
}

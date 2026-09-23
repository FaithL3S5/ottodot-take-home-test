import './load-env.js';
import type { DataSourceOptions } from 'typeorm';
import { entities } from './entities/index.js';
import { InitialSchema1790141544779 } from './migrations/1790141544779-initial-schema.js';

export function createDataSourceOptions(
  databaseUrl = process.env.DATABASE_URL,
): DataSourceOptions {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');
  }

  return {
    type: 'postgres',
    url: databaseUrl,
    entities,
    migrations: [InitialSchema1790141544779],
    synchronize: false,
    parseInt8: true,
  };
}

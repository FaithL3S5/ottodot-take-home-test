import { DataSource } from 'typeorm';
import { createDataSourceOptions } from '../src/database/data-source-options.js';

export default async function migrateTestDatabase() {
  const dataSource = new DataSource(
    createDataSourceOptions(process.env.TEST_DATABASE_URL),
  );
  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
}

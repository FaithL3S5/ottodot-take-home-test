import { existsSync } from 'node:fs';

const envFilePath = '.env';

if (existsSync(envFilePath)) {
  process.loadEnvFile(envFilePath);
}

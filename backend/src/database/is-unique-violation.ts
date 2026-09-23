import { QueryFailedError } from 'typeorm';

const postgresUniqueViolationCode = '23505';

export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string }).code ===
      postgresUniqueViolationCode
  );
}

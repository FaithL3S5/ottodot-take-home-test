import type { EntityManager } from 'typeorm';
import { Booking } from '../database/entities/index.js';

export function countConfirmedBookings(
  entityManager: EntityManager,
  trialClassId: number,
): Promise<number> {
  return entityManager.count(Booking, {
    where: { trialClassId, status: 'confirmed' },
  });
}

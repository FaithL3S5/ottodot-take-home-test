import type { DataSource } from 'typeorm';
import {
  Booking,
  Child,
  Parent,
  PaymentAttempt,
  TrialClass,
} from '../../src/database/entities/index.js';

export async function resetDatabase(dataSource: DataSource) {
  await dataSource.query(
    'TRUNCATE payment_attempts, bookings, trial_classes, children, parents RESTART IDENTITY CASCADE',
  );
}

export async function createChildren(
  dataSource: DataSource,
  childCount: number,
): Promise<Child[]> {
  const parent = await dataSource.manager.save(Parent, {
    name: 'Test Parent',
    email: 'parent@example.com',
  });
  const children: Child[] = [];
  for (let index = 1; index <= childCount; index++) {
    children.push(
      await dataSource.manager.save(Child, {
        parentId: parent.id,
        name: `Child ${index}`,
      }),
    );
  }
  return children;
}

export function createTrialClass(dataSource: DataSource) {
  return dataSource.manager.save(TrialClass, {
    title: 'Test Class',
    startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
}

export async function createConfirmedBookings(
  dataSource: DataSource,
  children: Child[],
  trialClass: TrialClass,
) {
  for (const child of children) {
    await dataSource.manager.save(Booking, {
      childId: child.id,
      trialClassId: trialClass.id,
      status: 'confirmed',
      confirmedAt: new Date(),
    });
  }
}

export function countPaymentAttempts(dataSource: DataSource) {
  return dataSource.manager.count(PaymentAttempt);
}

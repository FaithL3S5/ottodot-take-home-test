import type { EntityManager } from 'typeorm';
import { TRIAL_PRICE_CENTS } from '../payments/trial-price.js';
import dataSource from './data-source.js';
import {
  Booking,
  Child,
  Parent,
  PaymentAttempt,
  TrialClass,
} from './entities/index.js';
import { seedBookings, seedParents, seedTrialClasses } from './seed-data.js';

async function clearAllTables(entityManager: EntityManager) {
  await entityManager.query(
    'TRUNCATE payment_attempts, bookings, trial_classes, children, parents RESTART IDENTITY CASCADE',
  );
}

async function insertParentsWithChildren(entityManager: EntityManager) {
  const childIdByName = new Map<string, number>();

  for (const seedParent of seedParents) {
    const parent = await entityManager.save(Parent, {
      name: seedParent.name,
      email: seedParent.email,
    });

    for (const childName of seedParent.children) {
      const child = await entityManager.save(Child, {
        parentId: parent.id,
        name: childName,
      });
      childIdByName.set(childName, child.id);
    }
  }

  return childIdByName;
}

async function insertTrialClasses(entityManager: EntityManager) {
  const trialClassIdByKey = new Map<string, number>();

  for (const seedTrialClass of seedTrialClasses) {
    const trialClass = await entityManager.save(TrialClass, {
      title: seedTrialClass.title,
      startsAt: seedTrialClass.startsAt,
    });
    trialClassIdByKey.set(seedTrialClass.key, trialClass.id);
  }

  return trialClassIdByKey;
}

async function insertBookingsWithPaymentAttempts(
  entityManager: EntityManager,
  childIdByName: Map<string, number>,
  trialClassIdByKey: Map<string, number>,
) {
  for (const [index, seedBooking] of seedBookings.entries()) {
    const isConfirmed = seedBooking.status === 'confirmed';
    const booking = await entityManager.save(Booking, {
      childId: childIdByName.get(seedBooking.childName),
      trialClassId: trialClassIdByKey.get(seedBooking.trialClassKey),
      status: seedBooking.status,
      confirmedAt: isConfirmed ? new Date() : null,
    });

    await entityManager.save(PaymentAttempt, {
      bookingId: booking.id,
      status: isConfirmed ? 'succeeded' : 'failed',
      amountCents: TRIAL_PRICE_CENTS,
      idempotencyKey: `seed-${index}`,
    });
  }
}

async function seed() {
  await dataSource.initialize();

  await dataSource.transaction(async (entityManager) => {
    await clearAllTables(entityManager);
    const childIdByName = await insertParentsWithChildren(entityManager);
    const trialClassIdByKey = await insertTrialClasses(entityManager);
    await insertBookingsWithPaymentAttempts(
      entityManager,
      childIdByName,
      trialClassIdByKey,
    );
  });

  await dataSource.destroy();
  console.log('Seed complete.');
}

await seed();

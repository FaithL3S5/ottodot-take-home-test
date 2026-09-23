import type { BookingStatus } from '../bookings/booking-status.js';

const dayInMilliseconds = 24 * 60 * 60 * 1000;

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * dayInMilliseconds);
}

export const seedParents = [
  {
    name: 'Alicia Tan',
    email: 'alicia@example.com',
    children: ['Ben', 'Chloe'],
  },
  {
    name: 'Budi Santoso',
    email: 'budi@example.com',
    children: ['Dewi', 'Eka'],
  },
  {
    name: 'Citra Lim',
    email: 'citra@example.com',
    children: ['Farah', 'Gilang'],
  },
];

export const seedTrialClasses = [
  { key: 'available', title: 'Kitchen Chemistry', startsAt: daysFromNow(3) },
  { key: 'lastSeat', title: 'Fractions with Pizza', startsAt: daysFromNow(4) },
  { key: 'full', title: 'Build a Paper Rocket', startsAt: daysFromNow(5) },
] as const;

type SeedTrialClassKey = (typeof seedTrialClasses)[number]['key'];

export const seedBookings: {
  childName: string;
  trialClassKey: SeedTrialClassKey;
  status: Extract<BookingStatus, 'confirmed' | 'payment_failed'>;
}[] = [
  // Ben is confirmed here so a second booking shows the duplicate rejection.
  { childName: 'Ben', trialClassKey: 'available', status: 'confirmed' },
  { childName: 'Farah', trialClassKey: 'available', status: 'payment_failed' },

  { childName: 'Ben', trialClassKey: 'lastSeat', status: 'confirmed' },
  { childName: 'Chloe', trialClassKey: 'lastSeat', status: 'confirmed' },
  { childName: 'Dewi', trialClassKey: 'lastSeat', status: 'confirmed' },

  { childName: 'Ben', trialClassKey: 'full', status: 'confirmed' },
  { childName: 'Chloe', trialClassKey: 'full', status: 'confirmed' },
  { childName: 'Dewi', trialClassKey: 'full', status: 'confirmed' },
  { childName: 'Eka', trialClassKey: 'full', status: 'confirmed' },
];

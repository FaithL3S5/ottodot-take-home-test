import type { EntityManager } from 'typeorm';
import {
  Booking,
  PaymentAttempt,
  TrialClass,
} from '../database/entities/index.js';
import { countConfirmedBookings } from '../trial-classes/count-confirmed-bookings.js';

export interface PaidBookingResult {
  booking: Booking;
  isSeatGranted: boolean;
}

// The class row lock serializes confirmations for the same class.
export async function confirmPaidBooking(
  entityManager: EntityManager,
  bookingId: number,
  paymentAttemptId: number,
): Promise<PaidBookingResult> {
  const { trialClassId } = await entityManager.findOneByOrFail(Booking, {
    id: bookingId,
  });

  const trialClass = await entityManager
    .createQueryBuilder(TrialClass, 'trialClass')
    .setLock('pessimistic_write')
    .where('trialClass.id = :trialClassId', { trialClassId })
    .getOneOrFail();

  const booking = await entityManager
    .createQueryBuilder(Booking, 'booking')
    .setLock('pessimistic_write')
    .where('booking.id = :bookingId', { bookingId })
    .getOneOrFail();

  await entityManager.update(PaymentAttempt, paymentAttemptId, {
    status: 'succeeded',
  });

  if (booking.status !== 'pending_payment') {
    return { booking, isSeatGranted: false };
  }

  const confirmedCount = await countConfirmedBookings(
    entityManager,
    trialClassId,
  );
  const hasFreeSeat = confirmedCount < trialClass.capacity;

  booking.status = hasFreeSeat ? 'confirmed' : 'seat_taken';
  booking.confirmedAt = hasFreeSeat ? new Date() : null;
  await entityManager.save(booking);

  return { booking, isSeatGranted: hasFreeSeat };
}

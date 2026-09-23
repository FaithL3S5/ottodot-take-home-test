import request from 'supertest';
import { Booking, PaymentAttempt } from '../src/database/entities/index.js';
import { BarrierPaymentGateway } from './utils/barrier-payment-gateway.js';
import { createTestApp } from './utils/create-test-app.js';
import type { TestApp } from './utils/create-test-app.js';
import {
  createChildren,
  createConfirmedBookings,
  createTrialClass,
  resetDatabase,
} from './utils/fixtures.js';

describe('Concurrent last-seat race (e2e)', () => {
  const concurrentPayerCount = 2;
  let testApp: TestApp;
  let barrierPaymentGateway: BarrierPaymentGateway;

  beforeAll(async () => {
    barrierPaymentGateway = new BarrierPaymentGateway(concurrentPayerCount);
    testApp = await createTestApp(barrierPaymentGateway);
  });

  beforeEach(async () => {
    await resetDatabase(testApp.dataSource);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('confirms exactly one payer and refunds the other', async () => {
    const children = await createChildren(testApp.dataSource, 5);
    const trialClass = await createTrialClass(testApp.dataSource);
    await createConfirmedBookings(
      testApp.dataSource,
      children.slice(0, 3),
      trialClass,
    );
    const httpServer = testApp.app.getHttpServer();

    const bookingIds: number[] = [];
    for (const child of children.slice(3)) {
      const response = await request(httpServer)
        .post('/bookings')
        .send({ childId: child.id, trialClassId: trialClass.id })
        .expect(201);
      bookingIds.push(response.body.id);
    }

    await Promise.all(
      bookingIds.map((bookingId) =>
        request(httpServer)
          .post(`/bookings/${bookingId}/payments`)
          .send({ outcome: 'succeeded', idempotencyKey: `race-${bookingId}` })
          .expect(200),
      ),
    );

    const racedBookings = await testApp.dataSource.manager.findBy(Booking, {
      trialClassId: trialClass.id,
    });
    const racedStatuses = racedBookings
      .filter((booking) => bookingIds.includes(booking.id))
      .map((booking) => booking.status)
      .sort();
    expect(racedStatuses).toEqual(['confirmed', 'seat_taken']);

    const confirmedCount = racedBookings.filter(
      (booking) => booking.status === 'confirmed',
    ).length;
    expect(confirmedCount).toBe(trialClass.capacity);

    const attemptStatuses = (
      await testApp.dataSource.manager.find(PaymentAttempt)
    )
      .map((attempt) => attempt.status)
      .sort();
    expect(attemptStatuses).toEqual(['refunded', 'succeeded']);
    expect(barrierPaymentGateway.refundedAttemptIds).toHaveLength(1);
  });
});

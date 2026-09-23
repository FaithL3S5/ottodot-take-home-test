import request from 'supertest';
import type { ChargeOutcome } from '../src/payments/payment-gateway.js';
import { createTestApp } from './utils/create-test-app.js';
import type { TestApp } from './utils/create-test-app.js';
import {
  countPaymentAttempts,
  createChildren,
  createConfirmedBookings,
  createTrialClass,
  resetDatabase,
} from './utils/fixtures.js';

describe('Booking payments (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(testApp.dataSource);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  async function submitBooking(childId: number, trialClassId: number) {
    const response = await request(testApp.app.getHttpServer())
      .post('/bookings')
      .send({ childId, trialClassId })
      .expect(201);
    return response.body.id as number;
  }

  async function payBooking(
    bookingId: number,
    outcome: ChargeOutcome,
    idempotencyKey: string = crypto.randomUUID(),
  ) {
    const response = await request(testApp.app.getHttpServer())
      .post(`/bookings/${bookingId}/payments`)
      .send({ outcome, idempotencyKey })
      .expect(200);
    return response.body;
  }

  async function getRosterChildIds(trialClassId: number) {
    const response = await request(testApp.app.getHttpServer())
      .get(`/trial-classes/${trialClassId}/roster`)
      .expect(200);
    return response.body.students.map(
      (student: { childId: number }) => student.childId,
    );
  }

  it('confirms a booking after a successful payment', async () => {
    const [child] = await createChildren(testApp.dataSource, 1);
    const trialClass = await createTrialClass(testApp.dataSource);
    const bookingId = await submitBooking(child.id, trialClass.id);

    const result = await payBooking(bookingId, 'succeeded');

    expect(result.booking.status).toBe('confirmed');
    expect(result.paymentAttempt.status).toBe('succeeded');
    expect(await getRosterChildIds(trialClass.id)).toEqual([child.id]);
  });

  it('keeps the child off the roster when payment fails, and allows a retry', async () => {
    const [child] = await createChildren(testApp.dataSource, 1);
    const trialClass = await createTrialClass(testApp.dataSource);
    const failedBookingId = await submitBooking(child.id, trialClass.id);

    const failed = await payBooking(failedBookingId, 'failed');

    expect(failed.booking.status).toBe('payment_failed');
    expect(failed.paymentAttempt.status).toBe('failed');
    expect(await getRosterChildIds(trialClass.id)).toEqual([]);

    const retryBookingId = await submitBooking(child.id, trialClass.id);
    const retried = await payBooking(retryBookingId, 'succeeded');

    expect(retryBookingId).not.toBe(failedBookingId);
    expect(retried.booking.status).toBe('confirmed');
  });

  it('charges once when the same idempotency key is sent twice', async () => {
    const [child] = await createChildren(testApp.dataSource, 1);
    const trialClass = await createTrialClass(testApp.dataSource);
    const bookingId = await submitBooking(child.id, trialClass.id);

    const first = await payBooking(bookingId, 'succeeded', 'same-key');
    const second = await payBooking(bookingId, 'succeeded', 'same-key');

    expect(second.paymentAttempt.id).toBe(first.paymentAttempt.id);
    expect(await countPaymentAttempts(testApp.dataSource)).toBe(1);
  });

  it('gives the last seat to the first payer (sequential last-seat scenario)', async () => {
    const children = await createChildren(testApp.dataSource, 5);
    const [parentAChild, parentBChild] = children.slice(3);
    const trialClass = await createTrialClass(testApp.dataSource);
    await createConfirmedBookings(
      testApp.dataSource,
      children.slice(0, 3),
      trialClass,
    );

    const bookingA = await submitBooking(parentAChild.id, trialClass.id);
    const bookingB = await submitBooking(parentBChild.id, trialClass.id);
    const resultB = await payBooking(bookingB, 'succeeded');
    const resultA = await payBooking(bookingA, 'succeeded');

    expect(resultB.booking.status).toBe('confirmed');
    expect(resultA.booking.status).toBe('seat_taken');
    expect(resultA.paymentAttempt).toBeNull();
    expect(await getRosterChildIds(trialClass.id)).toHaveLength(4);
    expect(await getRosterChildIds(trialClass.id)).not.toContain(
      parentAChild.id,
    );
  });
});

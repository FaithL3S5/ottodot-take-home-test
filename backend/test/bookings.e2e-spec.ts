import request from 'supertest';
import { createTestApp } from './utils/create-test-app.js';
import type { TestApp } from './utils/create-test-app.js';
import {
  createChildren,
  createConfirmedBookings,
  createTrialClass,
  resetDatabase,
} from './utils/fixtures.js';

describe('Booking submission (e2e)', () => {
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

  function submitBooking(childId: number, trialClassId: number) {
    return request(testApp.app.getHttpServer())
      .post('/api/v1/bookings')
      .send({ childId, trialClassId });
  }

  it('creates a pending_payment booking', async () => {
    const [child] = await createChildren(testApp.dataSource, 1);
    const trialClass = await createTrialClass(testApp.dataSource);

    const response = await submitBooking(child.id, trialClass.id).expect(201);

    expect(response.body.status).toBe('pending_payment');
  });

  it('rejects a duplicate when the child is already confirmed', async () => {
    const [child] = await createChildren(testApp.dataSource, 1);
    const trialClass = await createTrialClass(testApp.dataSource);
    await createConfirmedBookings(testApp.dataSource, [child], trialClass);

    await submitBooking(child.id, trialClass.id).expect(409);
  });

  it('returns the same pending booking when submitted twice', async () => {
    const [child] = await createChildren(testApp.dataSource, 1);
    const trialClass = await createTrialClass(testApp.dataSource);

    const first = await submitBooking(child.id, trialClass.id).expect(201);
    const second = await submitBooking(child.id, trialClass.id).expect(201);

    expect(second.body.id).toBe(first.body.id);
  });

  it('rejects a booking for a full class', async () => {
    const children = await createChildren(testApp.dataSource, 5);
    const trialClass = await createTrialClass(testApp.dataSource);
    await createConfirmedBookings(
      testApp.dataSource,
      children.slice(0, 4),
      trialClass,
    );

    await submitBooking(children[4].id, trialClass.id).expect(409);
  });

  it('rejects an invalid body', async () => {
    await request(testApp.app.getHttpServer())
      .post('/api/v1/bookings')
      .send({ childId: 'abc' })
      .expect(400);
  });
});

import request from 'supertest';
import { createTestApp } from './utils/create-test-app.js';
import type { TestApp } from './utils/create-test-app.js';
import {
  createChildren,
  createConfirmedBookings,
  createTrialClass,
  resetDatabase,
} from './utils/fixtures.js';

describe('Parent bookings (e2e)', () => {
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

  it("lists only the parent's own children's bookings", async () => {
    const [ownChild] = await createChildren(testApp.dataSource, 1);
    const [otherParentChild] = await createChildren(testApp.dataSource, 1);
    const trialClass = await createTrialClass(testApp.dataSource);
    await createConfirmedBookings(
      testApp.dataSource,
      [ownChild, otherParentChild],
      trialClass,
    );

    const response = await request(testApp.app.getHttpServer())
      .get(`/api/v1/parents/${ownChild.parentId}/bookings`)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      status: 'confirmed',
      child: { id: ownChild.id },
      trialClass: { id: trialClass.id, title: trialClass.title },
    });
  });

  it('returns 404 for an unknown parent', async () => {
    await request(testApp.app.getHttpServer())
      .get('/api/v1/parents/999/bookings')
      .expect(404);
  });
});

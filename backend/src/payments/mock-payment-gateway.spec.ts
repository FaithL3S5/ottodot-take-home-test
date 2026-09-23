import { MockPaymentGateway } from './mock-payment-gateway.js';

describe('MockPaymentGateway', () => {
  const mockPaymentGateway = new MockPaymentGateway();
  const chargeRequest = {
    bookingId: 1,
    amountCents: 2000,
    idempotencyKey: 'key-1',
  };

  it.each(['succeeded', 'failed'] as const)(
    'returns the simulated outcome %s',
    async (simulatedOutcome) => {
      const result = await mockPaymentGateway.charge({
        ...chargeRequest,
        simulatedOutcome,
      });

      expect(result.status).toBe(simulatedOutcome);
    },
  );

  it('refunds without error', async () => {
    await expect(mockPaymentGateway.refund()).resolves.toBeUndefined();
  });
});

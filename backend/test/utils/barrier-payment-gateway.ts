import type {
  ChargeOutcome,
  ChargeRequest,
  PaymentGateway,
} from '../../src/payments/payment-gateway.js';

// Holds every charge until the expected number arrive, so all payers pass the pre-check first.
export class BarrierPaymentGateway implements PaymentGateway {
  refundedAttemptIds: number[] = [];
  private waitingCharges: (() => void)[] = [];

  constructor(private readonly expectedChargeCount: number) {}

  charge(chargeRequest: ChargeRequest): Promise<{ status: ChargeOutcome }> {
    return new Promise((resolve) => {
      this.waitingCharges.push(() =>
        resolve({ status: chargeRequest.simulatedOutcome }),
      );
      if (this.waitingCharges.length === this.expectedChargeCount) {
        this.waitingCharges.forEach((releaseCharge) => releaseCharge());
      }
    });
  }

  refund(paymentAttemptId: number): Promise<void> {
    this.refundedAttemptIds.push(paymentAttemptId);
    return Promise.resolve();
  }
}

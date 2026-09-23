export type ChargeOutcome = 'succeeded' | 'failed';

export interface ChargeRequest {
  bookingId: number;
  amountCents: number;
  idempotencyKey: string;
  simulatedOutcome: ChargeOutcome;
}

export interface PaymentGateway {
  charge(chargeRequest: ChargeRequest): Promise<{ status: ChargeOutcome }>;
  refund(paymentAttemptId: number): Promise<void>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

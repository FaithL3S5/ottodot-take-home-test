import { Injectable } from '@nestjs/common';
import type {
  ChargeOutcome,
  ChargeRequest,
  PaymentGateway,
} from './payment-gateway.js';

@Injectable()
export class MockPaymentGateway implements PaymentGateway {
  charge(chargeRequest: ChargeRequest): Promise<{ status: ChargeOutcome }> {
    return Promise.resolve({ status: chargeRequest.simulatedOutcome });
  }

  refund(): Promise<void> {
    return Promise.resolve();
  }
}

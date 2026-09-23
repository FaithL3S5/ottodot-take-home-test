import { Module } from '@nestjs/common';
import { MockPaymentGateway } from './mock-payment-gateway.js';
import { PAYMENT_GATEWAY } from './payment-gateway.js';

@Module({
  providers: [{ provide: PAYMENT_GATEWAY, useClass: MockPaymentGateway }],
  exports: [PAYMENT_GATEWAY],
})
export class PaymentsModule {}

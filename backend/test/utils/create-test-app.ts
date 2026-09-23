import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/configure-app.js';
import { PAYMENT_GATEWAY } from '../../src/payments/payment-gateway.js';
import type { PaymentGateway } from '../../src/payments/payment-gateway.js';

export interface TestApp {
  app: INestApplication<App>;
  dataSource: DataSource;
}

export async function createTestApp(
  paymentGateway?: PaymentGateway,
): Promise<TestApp> {
  const testingModuleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });
  if (paymentGateway) {
    testingModuleBuilder
      .overrideProvider(PAYMENT_GATEWAY)
      .useValue(paymentGateway);
  }
  const testingModule = await testingModuleBuilder.compile();

  const app = testingModule.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();

  return { app, dataSource: app.get(DataSource) };
}

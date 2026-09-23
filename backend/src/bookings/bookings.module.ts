import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module.js';
import { BookingPaymentService } from './booking-payment.service.js';
import { BookingsController } from './bookings.controller.js';
import { BookingsService } from './bookings.service.js';

@Module({
  imports: [PaymentsModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingPaymentService],
})
export class BookingsModule {}

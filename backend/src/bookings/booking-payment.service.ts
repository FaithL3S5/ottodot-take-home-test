import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  Booking,
  PaymentAttempt,
  TrialClass,
} from '../database/entities/index.js';
import { isUniqueViolation } from '../database/is-unique-violation.js';
import { PAYMENT_GATEWAY } from '../payments/payment-gateway.js';
import type { PaymentGateway } from '../payments/payment-gateway.js';
import { TRIAL_PRICE_CENTS } from '../payments/trial-price.js';
import { countConfirmedBookings } from '../trial-classes/count-confirmed-bookings.js';
import { BookingsService } from './bookings.service.js';
import { confirmPaidBooking } from './confirm-paid-booking.js';
import { PayBookingDto } from './dto/pay-booking.dto.js';

export interface PaymentResult {
  booking: Booking;
  paymentAttempt: PaymentAttempt | null;
}

@Injectable()
export class BookingPaymentService {
  private readonly logger = new Logger(BookingPaymentService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(PAYMENT_GATEWAY) private readonly paymentGateway: PaymentGateway,
    private readonly bookingsService: BookingsService,
  ) {}

  async payBooking(
    bookingId: number,
    { outcome, idempotencyKey }: PayBookingDto,
  ): Promise<PaymentResult> {
    const previousAttempt = await this.findAttemptByKey(idempotencyKey);
    if (previousAttempt) {
      return this.replayPreviousAttempt(bookingId, previousAttempt);
    }

    const booking = await this.bookingsService.getBooking(bookingId);
    if (booking.status !== 'pending_payment') {
      return { booking, paymentAttempt: null };
    }

    if (await this.isTrialClassFull(booking.trialClassId)) {
      return {
        booking: await this.markSeatTakenBeforeCharge(booking),
        paymentAttempt: null,
      };
    }

    const paymentAttempt = await this.createPendingAttempt(
      bookingId,
      idempotencyKey,
    );
    if (!paymentAttempt) {
      return this.replayPreviousAttempt(
        bookingId,
        await this.findAttemptByKeyOrFail(idempotencyKey),
      );
    }

    const charge = await this.paymentGateway.charge({
      bookingId,
      amountCents: TRIAL_PRICE_CENTS,
      idempotencyKey,
      simulatedOutcome: outcome,
    });

    if (charge.status === 'failed') {
      return this.recordFailedCharge(bookingId, paymentAttempt.id);
    }
    return this.confirmOrRefund(bookingId, paymentAttempt.id);
  }

  private async confirmOrRefund(
    bookingId: number,
    paymentAttemptId: number,
  ): Promise<PaymentResult> {
    const { booking, isSeatGranted } = await this.dataSource.transaction(
      (entityManager) =>
        confirmPaidBooking(entityManager, bookingId, paymentAttemptId),
    );

    if (!isSeatGranted) {
      await this.refundAttempt(paymentAttemptId);
    }

    return {
      booking,
      paymentAttempt: await this.dataSource.manager.findOneByOrFail(
        PaymentAttempt,
        { id: paymentAttemptId },
      ),
    };
  }

  private async refundAttempt(paymentAttemptId: number) {
    try {
      await this.paymentGateway.refund(paymentAttemptId);
      await this.dataSource.manager.update(PaymentAttempt, paymentAttemptId, {
        status: 'refunded',
      });
    } catch (error) {
      // Attempt stays 'succeeded' so monitoring flags the owed refund.
      this.logger.error(
        `Refund failed for payment attempt ${paymentAttemptId}`,
        error,
      );
    }
  }

  private recordFailedCharge(
    bookingId: number,
    paymentAttemptId: number,
  ): Promise<PaymentResult> {
    return this.dataSource.transaction(async (entityManager) => {
      await entityManager.update(PaymentAttempt, paymentAttemptId, {
        status: 'failed',
      });
      await entityManager.update(
        Booking,
        { id: bookingId, status: 'pending_payment' },
        { status: 'payment_failed' },
      );
      return {
        booking: await entityManager.findOneByOrFail(Booking, {
          id: bookingId,
        }),
        paymentAttempt: await entityManager.findOneByOrFail(PaymentAttempt, {
          id: paymentAttemptId,
        }),
      };
    });
  }

  private async markSeatTakenBeforeCharge(booking: Booking) {
    await this.dataSource.manager.update(
      Booking,
      { id: booking.id, status: 'pending_payment' },
      { status: 'seat_taken' },
    );
    return this.bookingsService.getBooking(booking.id);
  }

  private async isTrialClassFull(trialClassId: number) {
    const trialClass = await this.dataSource.manager.findOneByOrFail(
      TrialClass,
      { id: trialClassId },
    );
    const confirmedCount = await countConfirmedBookings(
      this.dataSource.manager,
      trialClassId,
    );
    return confirmedCount >= trialClass.capacity;
  }

  private async createPendingAttempt(
    bookingId: number,
    idempotencyKey: string,
  ): Promise<PaymentAttempt | null> {
    try {
      return await this.dataSource.manager.save(PaymentAttempt, {
        bookingId,
        status: 'pending',
        amountCents: TRIAL_PRICE_CENTS,
        idempotencyKey,
      });
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }

  private async replayPreviousAttempt(
    bookingId: number,
    previousAttempt: PaymentAttempt,
  ): Promise<PaymentResult> {
    if (previousAttempt.bookingId !== bookingId) {
      throw new ConflictException(
        'This idempotency key was already used for another booking',
      );
    }
    return {
      booking: await this.bookingsService.getBooking(bookingId),
      paymentAttempt: previousAttempt,
    };
  }

  private findAttemptByKey(idempotencyKey: string) {
    return this.dataSource.manager.findOneBy(PaymentAttempt, {
      idempotencyKey,
    });
  }

  private findAttemptByKeyOrFail(idempotencyKey: string) {
    return this.dataSource.manager.findOneByOrFail(PaymentAttempt, {
      idempotencyKey,
    });
  }
}

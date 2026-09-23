import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { Booking, Child, TrialClass } from '../database/entities/index.js';
import { isUniqueViolation } from '../database/is-unique-violation.js';
import { countConfirmedBookings } from '../trial-classes/count-confirmed-bookings.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

@Injectable()
export class BookingsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getBooking(bookingId: number): Promise<Booking> {
    const booking = await this.dataSource.manager.findOneBy(Booking, {
      id: bookingId,
    });
    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }
    return booking;
  }

  async submitBooking({
    childId,
    trialClassId,
  }: CreateBookingDto): Promise<Booking> {
    const trialClass = await this.findTrialClassOrThrow(trialClassId);
    await this.findChildOrThrow(childId);

    const activeBooking = await this.findActiveBooking(childId, trialClassId);
    if (activeBooking) {
      return this.returnPendingOrRejectConfirmed(activeBooking);
    }

    const confirmedCount = await countConfirmedBookings(
      this.dataSource.manager,
      trialClassId,
    );
    if (confirmedCount >= trialClass.capacity) {
      throw new ConflictException('This trial class is full');
    }

    try {
      return await this.dataSource.manager.save(Booking, {
        childId,
        trialClassId,
        status: 'pending_payment',
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // A concurrent submit for the same child and class won the insert.
      const concurrentBooking = await this.findActiveBooking(
        childId,
        trialClassId,
      );
      if (!concurrentBooking) throw error;
      return this.returnPendingOrRejectConfirmed(concurrentBooking);
    }
  }

  private returnPendingOrRejectConfirmed(activeBooking: Booking): Booking {
    if (activeBooking.status === 'confirmed') {
      throw new ConflictException(
        'This child already has a confirmed booking for this trial class',
      );
    }
    return activeBooking;
  }

  private findActiveBooking(childId: number, trialClassId: number) {
    return this.dataSource.manager.findOneBy(Booking, {
      childId,
      trialClassId,
      status: In(['pending_payment', 'confirmed']),
    });
  }

  private async findTrialClassOrThrow(trialClassId: number) {
    const trialClass = await this.dataSource.manager.findOneBy(TrialClass, {
      id: trialClassId,
    });
    if (!trialClass) {
      throw new NotFoundException(`Trial class ${trialClassId} not found`);
    }
    return trialClass;
  }

  private async findChildOrThrow(childId: number) {
    const child = await this.dataSource.manager.findOneBy(Child, {
      id: childId,
    });
    if (!child) {
      throw new NotFoundException(`Child ${childId} not found`);
    }
    return child;
  }
}

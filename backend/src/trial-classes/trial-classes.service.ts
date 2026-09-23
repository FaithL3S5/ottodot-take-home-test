import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Booking, TrialClass } from '../database/entities/index.js';

export interface TrialClassWithSeatsLeft {
  id: number;
  title: string;
  startsAt: Date;
  capacity: number;
  seatsLeft: number;
}

export interface RosterEntry {
  bookingId: number;
  childId: number;
  childName: string;
  confirmedAt: Date;
}

@Injectable()
export class TrialClassesService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async listWithSeatsLeft(): Promise<TrialClassWithSeatsLeft[]> {
    const rows = await this.dataSource
      .createQueryBuilder(TrialClass, 'trialClass')
      .leftJoin(
        Booking,
        'booking',
        "booking.trial_class_id = trialClass.id AND booking.status = 'confirmed'",
      )
      .select([
        'trialClass.id AS id',
        'trialClass.title AS title',
        'trialClass.starts_at AS "startsAt"',
        'trialClass.capacity AS capacity',
        'trialClass.capacity - COUNT(booking.id)::int AS "seatsLeft"',
      ])
      .groupBy('trialClass.id')
      .orderBy('trialClass.starts_at', 'ASC')
      .getRawMany<TrialClassWithSeatsLeft>();

    return rows;
  }

  async getRoster(trialClassId: number) {
    const trialClass = await this.dataSource.manager.findOneBy(TrialClass, {
      id: trialClassId,
    });
    if (!trialClass) {
      throw new NotFoundException(`Trial class ${trialClassId} not found`);
    }

    const confirmedBookings = await this.dataSource.manager.find(Booking, {
      where: { trialClassId, status: 'confirmed' },
      relations: { child: true },
      order: { confirmedAt: 'ASC' },
    });

    const students: RosterEntry[] = confirmedBookings.map((booking) => ({
      bookingId: booking.id,
      childId: booking.childId,
      childName: booking.child.name,
      confirmedAt: booking.confirmedAt as Date,
    }));

    return { trialClass, students };
  }
}

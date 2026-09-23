import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import type { BookingStatus } from '../../bookings/booking-status.js';
import { Child } from './child.entity.js';
import { TrialClass } from './trial-class.entity.js';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: number;

  @Column({ name: 'child_id', type: 'bigint' })
  childId: number;

  @Column({ name: 'trial_class_id', type: 'bigint' })
  trialClassId: number;

  @Column({ type: 'text', default: 'pending_payment' })
  status: BookingStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @ManyToOne(() => Child)
  @JoinColumn({ name: 'child_id' })
  child: Relation<Child>;

  @ManyToOne(() => TrialClass)
  @JoinColumn({ name: 'trial_class_id' })
  trialClass: Relation<TrialClass>;
}

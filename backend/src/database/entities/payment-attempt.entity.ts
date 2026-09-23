import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { PaymentAttemptStatus } from '../../payments/payment-attempt-status.js';

@Entity('payment_attempts')
export class PaymentAttempt {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: number;

  @Column({ name: 'booking_id', type: 'bigint' })
  bookingId: number;

  @Column({ type: 'text', default: 'pending' })
  status: PaymentAttemptStatus;

  @Column({ name: 'amount_cents', type: 'integer' })
  amountCents: number;

  @Column({ name: 'idempotency_key', type: 'text' })
  idempotencyKey: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

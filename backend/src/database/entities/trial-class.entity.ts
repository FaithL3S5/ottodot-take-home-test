import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('trial_classes')
export class TrialClass {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: number;

  @Column({ type: 'text' })
  title: string;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'integer', default: 4 })
  capacity: number;
}

import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Child } from './child.entity.js';

@Entity('parents')
export class Parent {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  email: string;

  @OneToMany(() => Child, (child) => child.parent)
  children: Relation<Child[]>;
}

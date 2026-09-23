import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Parent } from './parent.entity.js';

@Entity('children')
export class Child {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: number;

  @Column({ name: 'parent_id', type: 'bigint' })
  parentId: number;

  @Column({ type: 'text' })
  name: string;

  @ManyToOne(() => Parent, (parent) => parent.children)
  @JoinColumn({ name: 'parent_id' })
  parent: Relation<Parent>;
}

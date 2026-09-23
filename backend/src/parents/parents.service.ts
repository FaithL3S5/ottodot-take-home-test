import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parent } from '../database/entities/index.js';

@Injectable()
export class ParentsService {
  constructor(
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
  ) {}

  listWithChildren(): Promise<Parent[]> {
    return this.parentRepository.find({
      relations: { children: true },
      order: { id: 'ASC', children: { id: 'ASC' } },
    });
  }
}

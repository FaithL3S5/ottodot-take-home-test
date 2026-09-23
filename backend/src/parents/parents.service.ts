import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, Parent } from '../database/entities/index.js';

@Injectable()
export class ParentsService {
  constructor(
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  listWithChildren(): Promise<Parent[]> {
    return this.parentRepository.find({
      relations: { children: true },
      order: { id: 'ASC', children: { id: 'ASC' } },
    });
  }

  async listBookings(parentId: number): Promise<Booking[]> {
    const parentExists = await this.parentRepository.existsBy({
      id: parentId,
    });
    if (!parentExists) {
      throw new NotFoundException(`Parent ${parentId} not found`);
    }

    return this.bookingRepository.find({
      where: { child: { parentId } },
      relations: { child: true, trialClass: true },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }
}

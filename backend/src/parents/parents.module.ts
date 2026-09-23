import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking, Parent } from '../database/entities/index.js';
import { ParentsController } from './parents.controller.js';
import { ParentsService } from './parents.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Parent, Booking])],
  controllers: [ParentsController],
  providers: [ParentsService],
})
export class ParentsModule {}

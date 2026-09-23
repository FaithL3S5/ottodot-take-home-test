import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ParentsService } from './parents.service.js';

@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get()
  listWithChildren() {
    return this.parentsService.listWithChildren();
  }

  @Get(':id/bookings')
  listBookings(@Param('id', ParseIntPipe) parentId: number) {
    return this.parentsService.listBookings(parentId);
  }
}

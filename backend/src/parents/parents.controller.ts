import { Controller, Get } from '@nestjs/common';
import { ParentsService } from './parents.service.js';

@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get()
  listWithChildren() {
    return this.parentsService.listWithChildren();
  }
}

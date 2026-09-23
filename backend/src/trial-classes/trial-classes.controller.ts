import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { TrialClassesService } from './trial-classes.service.js';

@Controller('trial-classes')
export class TrialClassesController {
  constructor(private readonly trialClassesService: TrialClassesService) {}

  @Get()
  listWithSeatsLeft() {
    return this.trialClassesService.listWithSeatsLeft();
  }

  @Get(':id/roster')
  getRoster(@Param('id', ParseIntPipe) trialClassId: number) {
    return this.trialClassesService.getRoster(trialClassId);
  }
}

import { Module } from '@nestjs/common';
import { TrialClassesController } from './trial-classes.controller.js';
import { TrialClassesService } from './trial-classes.service.js';

@Module({
  controllers: [TrialClassesController],
  providers: [TrialClassesService],
})
export class TrialClassesModule {}

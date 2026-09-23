import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { createDataSourceOptions } from './database/data-source-options.js';
import { ParentsModule } from './parents/parents.module.js';
import { TrialClassesModule } from './trial-classes/trial-classes.module.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: () => createDataSourceOptions() }),
    ParentsModule,
    TrialClassesModule,
    BookingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

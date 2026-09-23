import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { createDataSourceOptions } from './database/data-source-options.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: () => createDataSourceOptions() }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

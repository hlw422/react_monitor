import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Server } from '../../database/entities/server.entity';
import { Metric } from '../../database/entities/metric.entity';
import { Alert } from '../../database/entities/alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Server, Metric, Alert])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

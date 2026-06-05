import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricService } from './metric.service';
import { MetricController } from './metric.controller';
import { Metric } from '../../database/entities/metric.entity';
import { Server } from '../../database/entities/server.entity';
import { WsModule } from '../ws/ws.module';
import { AlertModule } from '../alert/alert.module';
import { MetricCollectorService } from './metric-collector.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Metric, Server]),
    forwardRef(() => WsModule),
    AlertModule,
  ],
  controllers: [MetricController],
  providers: [MetricService, MetricCollectorService],
  exports: [MetricService],
})
export class MetricModule {}

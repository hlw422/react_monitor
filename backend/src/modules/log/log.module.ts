import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogService } from './log.service';
import { LogController } from './log.controller';
import { LogCollectorService } from './log-collector.service';
import { Log } from '../../database/entities/log.entity';
import { Server } from '../../database/entities/server.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Log, Server])],
  controllers: [LogController],
  providers: [LogService, LogCollectorService],
  exports: [LogService],
})
export class LogModule {}

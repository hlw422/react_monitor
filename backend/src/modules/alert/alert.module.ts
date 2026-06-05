import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';
import { Alert } from '../../database/entities/alert.entity';
import { AlertRule } from '../../database/entities/alert-rule.entity';
import { Server } from '../../database/entities/server.entity';
import { WsModule } from '../ws/ws.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert, AlertRule, Server]),
    WsModule,
  ],
  controllers: [AlertController],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule implements OnModuleInit {
  constructor(private readonly alertService: AlertService) {}

  async onModuleInit() {
    // Seed default alert rules on startup
    await this.alertService.seedDefaultRules();
  }
}

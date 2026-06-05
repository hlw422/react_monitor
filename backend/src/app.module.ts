import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { WsModule } from './modules/ws/ws.module';
import { ServerModule } from './modules/server/server.module';
import { MetricModule } from './modules/metric/metric.module';
import { AlertModule } from './modules/alert/alert.module';
import { LogModule } from './modules/log/log.module';
import { NotificationModule } from './modules/notification/notification.module';
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { User } from './database/entities/user.entity';
import { Role } from './database/entities/role.entity';
import { Server } from './database/entities/server.entity';
import { Metric } from './database/entities/metric.entity';
import { Alert } from './database/entities/alert.entity';
import { AlertRule } from './database/entities/alert-rule.entity';
import { Log } from './database/entities/log.entity';
import { Notification } from './database/entities/notification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'monitor_db'),
        entities: [User, Role, Server, Metric, Alert, AlertRule, Log, Notification],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    WsModule,
    ServerModule,
    MetricModule,
    AlertModule,
    LogModule,
    NotificationModule,
    UserModule,
    RoleModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

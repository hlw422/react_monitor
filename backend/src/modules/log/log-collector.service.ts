import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as si from 'systeminformation';
import { Log } from '../../database/entities/log.entity';
import { Server } from '../../database/entities/server.entity';

@Injectable()
export class LogCollectorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LogCollectorService.name);
  private isCollecting = false;
  private serverId: string | null = null;

  constructor(
    @InjectRepository(Log)
    private logRepository: Repository<Log>,
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
  ) {}

  async onModuleInit() {
    this.logger.log('LogCollectorService initialized');
    this.isCollecting = true;
    
    // Find the local server (QHKF-121)
    const localServer = await this.serverRepository.findOne({
      where: { hostname: 'QHKF-121' },
    });
    
    if (localServer) {
      this.serverId = localServer.id;
      this.logger.log(`Found local server: ${localServer.hostname} (${localServer.id})`);
      
      // Generate initial logs
      await this.generateSystemLogs();
    } else {
      this.logger.warn('Local server not found, logs will not be collected');
    }
  }

  onModuleDestroy() {
    this.isCollecting = false;
    this.logger.log('LogCollectorService destroyed');
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async collectLogs() {
    if (!this.isCollecting || !this.serverId) return;

    try {
      await this.generateSystemLogs();
    } catch (error) {
      this.logger.error('Error collecting logs:', error);
    }
  }

  private async generateSystemLogs() {
    if (!this.serverId) return;

    const logs: Partial<Log>[] = [];
    const now = new Date();

    try {
      // Get system information
      const [cpuLoad, mem, fsSize, networkStats, cpuTemp] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.networkStats(),
        si.cpuTemperature().catch(() => ({ main: 0 })),
      ]);

      const cpuUsage = cpuLoad.currentLoad;
      const memoryUsage = (mem.used / mem.total) * 100;
      const diskUsage = fsSize.length > 0 ? (fsSize[0].used / fsSize[0].size) * 100 : 0;

      // Generate logs based on system state
      // CPU logs
      if (cpuUsage > 90) {
        logs.push({
          serverId: this.serverId,
          level: 'error',
          source: 'system',
          message: `Critical CPU usage detected: ${cpuUsage.toFixed(1)}%`,
          metadata: { cpuUsage, threshold: 90 },
        });
      } else if (cpuUsage > 80) {
        logs.push({
          serverId: this.serverId,
          level: 'warn',
          source: 'system',
          message: `High CPU usage detected: ${cpuUsage.toFixed(1)}%`,
          metadata: { cpuUsage, threshold: 80 },
        });
      } else {
        logs.push({
          serverId: this.serverId,
          level: 'info',
          source: 'system',
          message: `CPU usage normal: ${cpuUsage.toFixed(1)}%`,
          metadata: { cpuUsage },
        });
      }

      // Memory logs
      if (memoryUsage > 90) {
        logs.push({
          serverId: this.serverId,
          level: 'error',
          source: 'system',
          message: `Critical memory usage: ${memoryUsage.toFixed(1)}% (${(mem.used / 1024 / 1024 / 1024).toFixed(2)}GB / ${(mem.total / 1024 / 1024 / 1024).toFixed(2)}GB)`,
          metadata: { memoryUsage, usedGB: mem.used / 1024 / 1024 / 1024, totalGB: mem.total / 1024 / 1024 / 1024 },
        });
      } else if (memoryUsage > 80) {
        logs.push({
          serverId: this.serverId,
          level: 'warn',
          source: 'system',
          message: `High memory usage: ${memoryUsage.toFixed(1)}%`,
          metadata: { memoryUsage },
        });
      }

      // Disk logs
      if (diskUsage > 90) {
        logs.push({
          serverId: this.serverId,
          level: 'error',
          source: 'disk',
          message: `Critical disk usage on ${fsSize[0]?.mount || '/'}: ${diskUsage.toFixed(1)}%`,
          metadata: { diskUsage, mount: fsSize[0]?.mount },
        });
      } else if (diskUsage > 80) {
        logs.push({
          serverId: this.serverId,
          level: 'warn',
          source: 'disk',
          message: `High disk usage on ${fsSize[0]?.mount || '/'}: ${diskUsage.toFixed(1)}%`,
          metadata: { diskUsage, mount: fsSize[0]?.mount },
        });
      }

      // Network logs
      if (networkStats.length > 0) {
        const net = networkStats[0];
        if (net.rx_sec > 10 * 1024 * 1024) { // > 10MB/s
          logs.push({
            serverId: this.serverId,
            level: 'warn',
            source: 'network',
            message: `High network receive rate: ${(net.rx_sec / 1024 / 1024).toFixed(2)} MB/s on ${net.iface}`,
            metadata: { rxBytes: net.rx_sec, interface: net.iface },
          });
        }
      }

      // Temperature logs
      if (cpuTemp.main > 80) {
        logs.push({
          serverId: this.serverId,
          level: 'error',
          source: 'hardware',
          message: `Critical CPU temperature: ${cpuTemp.main}°C`,
          metadata: { temperature: cpuTemp.main },
        });
      } else if (cpuTemp.main > 70) {
        logs.push({
          serverId: this.serverId,
          level: 'warn',
          source: 'hardware',
          message: `High CPU temperature: ${cpuTemp.main}°C`,
          metadata: { temperature: cpuTemp.main },
        });
      }

      // Service status logs
      logs.push({
        serverId: this.serverId,
        level: 'info',
        source: 'service',
        message: `System health check completed - CPU: ${cpuUsage.toFixed(1)}%, Memory: ${memoryUsage.toFixed(1)}%, Disk: ${diskUsage.toFixed(1)}%`,
        metadata: { cpuUsage, memoryUsage, diskUsage },
      });

      // Save logs to database
      if (logs.length > 0) {
        const logEntities = logs.map(log => this.logRepository.create(log));
        await this.logRepository.save(logEntities);
        this.logger.debug(`Generated ${logs.length} system logs`);
      }
    } catch (error) {
      this.logger.error('Error generating system logs:', error);
      
      // Generate error log
      await this.logRepository.save(this.logRepository.create({
        serverId: this.serverId,
        level: 'error',
        source: 'log-collector',
        message: `Failed to collect system metrics: ${error.message}`,
        metadata: { error: error.message },
      }));
    }
  }

  // Manual log generation for testing
  async generateTestLogs(count: number = 10) {
    if (!this.serverId) {
      throw new Error('Server ID not set');
    }

    const levels: Array<Log['level']> = ['debug', 'info', 'warn', 'error'];
    const sources = ['system', 'network', 'disk', 'service', 'application'];
    const messages = [
      'User login successful',
      'Database connection established',
      'API request processed',
      'Cache cleared',
      'Backup completed',
      'Service restarted',
      'Configuration updated',
      'Health check passed',
    ];

    const logs: Partial<Log>[] = [];
    for (let i = 0; i < count; i++) {
      logs.push({
        serverId: this.serverId,
        level: levels[Math.floor(Math.random() * levels.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        metadata: { test: true, index: i },
      });
    }

    const logEntities = logs.map(log => this.logRepository.create(log));
    await this.logRepository.save(logEntities);
    return { generated: count };
  }
}

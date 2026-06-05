import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Server } from '../../database/entities/server.entity';
import { MetricService } from './metric.service';
import { AlertService } from '../alert/alert.service';

@Injectable()
export class MetricCollectorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricCollectorService.name);
  private isCollecting = false;

  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    private metricService: MetricService,
    private alertService: AlertService,
  ) {}

  onModuleInit() {
    this.logger.log('MetricCollectorService initialized');
    this.isCollecting = true;
  }

  onModuleDestroy() {
    this.isCollecting = false;
    this.logger.log('MetricCollectorService destroyed');
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async collectMetrics() {
    if (!this.isCollecting) return;

    try {
      const servers = await this.serverRepository.find({
        where: { status: 'online' },
      });

      if (servers.length === 0) {
        this.logger.debug('No online servers found for metric collection');
        return;
      }

      for (const server of servers) {
        await this.collectServerMetrics(server);
      }

      this.logger.debug(`Collected metrics for ${servers.length} servers`);
    } catch (error) {
      this.logger.error('Error collecting metrics:', error);
    }
  }

  private async collectServerMetrics(server: Server) {
    const metricTypes = ['cpu', 'memory', 'disk', 'network'] as const;

    for (const metricType of metricTypes) {
      let value: number;

      switch (metricType) {
        case 'cpu':
          value = this.simulateCpuUsage(server.cpuUsage);
          break;
        case 'memory':
          value = this.simulateMemoryUsage(server.memoryUsage);
          break;
        case 'disk':
          value = this.simulateDiskUsage(server.diskUsage);
          break;
        case 'network':
          value = this.simulateNetworkTraffic();
          break;
        default:
          value = 0;
      }

      await this.metricService.create({
        serverId: server.id,
        metricType,
        value,
        metadata: {
          source: 'collector',
          hostname: server.hostname,
        },
      });

      // Check alerts for this metric
      await this.alertService.checkMetricAgainstRules(server.id, metricType, value);
    }

    // Update server's latest metrics
    await this.serverRepository.update(server.id, {
      cpuUsage: await this.getLatestMetricValue(server.id, 'cpu'),
      memoryUsage: await this.getLatestMetricValue(server.id, 'memory'),
      diskUsage: await this.getLatestMetricValue(server.id, 'disk'),
      networkIn: await this.getLatestMetricValue(server.id, 'network'),
      lastHeartbeat: new Date(),
    });
  }

  private async getLatestMetricValue(serverId: string, metricType: string): Promise<number> {
    const metrics = await this.metricService.getLatestMetrics(serverId);
    const metric = metrics.find(m => m.metricType === metricType);
    return metric?.value || 0;
  }

  private simulateCpuUsage(current: number): number {
    // Simulate realistic CPU usage with some variance
    const variance = (Math.random() - 0.5) * 20;
    const newValue = current + variance;
    return Math.max(5, Math.min(95, newValue));
  }

  private simulateMemoryUsage(current: number): number {
    // Memory tends to be more stable with gradual changes
    const variance = (Math.random() - 0.5) * 10;
    const newValue = current + variance;
    return Math.max(30, Math.min(90, newValue));
  }

  private simulateDiskUsage(current: number): number {
    // Disk usage changes very slowly
    const variance = (Math.random() - 0.5) * 2;
    const newValue = current + variance;
    return Math.max(20, Math.min(95, newValue));
  }

  private simulateNetworkTraffic(): number {
    // Simulate network traffic in bytes/sec (0-10MB/s)
    return Math.random() * 10 * 1024 * 1024;
  }
}

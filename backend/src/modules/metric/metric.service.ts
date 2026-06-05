import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Metric } from '../../database/entities/metric.entity';
import { WsGateway } from '../ws/ws.gateway';

@Injectable()
export class MetricService {
  constructor(
    @InjectRepository(Metric)
    private metricRepository: Repository<Metric>,
    private wsGateway: WsGateway,
  ) {}

  async findAll(serverId?: string, metricType?: string, limit = 100) {
    const where: any = {};
    if (serverId) where.serverId = serverId;
    if (metricType) where.metricType = metricType;

    return this.metricRepository.find({
      where,
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async create(data: Partial<Metric>) {
    const metric = this.metricRepository.create(data);
    const saved = await this.metricRepository.save(metric);

    // Broadcast via WebSocket
    this.wsGateway.broadcastMetricsUpdate(saved.serverId, [saved]);

    return saved;
  }

  async getLatestMetrics(serverId: string) {
    const metricTypes = ['cpu', 'memory', 'disk', 'network'];
    const latestMetrics = await Promise.all(
      metricTypes.map(async (type) => {
        const metric = await this.metricRepository.findOne({
          where: { serverId, metricType: type as any },
          order: { timestamp: 'DESC' },
        });
        return metric || { metricType: type, value: 0, timestamp: new Date() };
      }),
    );
    return latestMetrics;
  }

  async getTimeSeriesData(serverId: string, metricType: string, minutes = 60) {
    const startTime = new Date(Date.now() - minutes * 60 * 1000);
    
    return this.metricRepository.find({
      where: {
        serverId,
        metricType: metricType as any,
        timestamp: { $gte: startTime } as any,
      },
      order: { timestamp: 'ASC' },
    });
  }

  // Simulate real-time data for demo
  async generateMockData(serverId: string) {
    const metricTypes = ['cpu', 'memory', 'disk', 'network'] as const;
    
    for (const type of metricTypes) {
      let value: number;
      switch (type) {
        case 'cpu':
          value = Math.random() * 60 + 20;
          break;
        case 'memory':
          value = Math.random() * 40 + 40;
          break;
        case 'disk':
          value = Math.random() * 30 + 50;
          break;
        case 'network':
          value = Math.random() * 1000000;
          break;
        default:
          value = 0;
      }

      await this.create({
        serverId,
        metricType: type,
        value,
        metadata: { source: 'mock' },
      });
    }
  }
}

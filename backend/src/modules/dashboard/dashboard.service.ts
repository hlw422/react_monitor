import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../../database/entities/server.entity';
import { Metric } from '../../database/entities/metric.entity';
import { Alert } from '../../database/entities/alert.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    @InjectRepository(Metric)
    private metricRepository: Repository<Metric>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
  ) {}

  async getStats() {
    // Get all servers
    const servers = await this.serverRepository.find();
    const totalServers = servers.length;
    const onlineServers = servers.filter(s => s.status === 'online').length;

    // Calculate average metrics from the server table directly (latest values)
    const onlineServerList = servers.filter(s => s.status === 'online');
    let avgCpuUsage = 0;
    let avgMemoryUsage = 0;
    let avgDiskUsage = 0;
    let totalNetworkIn = 0;
    let totalNetworkOut = 0;

    if (onlineServerList.length > 0) {
      avgCpuUsage = onlineServerList.reduce((sum, s) => sum + (s.cpuUsage || 0), 0) / onlineServerList.length;
      avgMemoryUsage = onlineServerList.reduce((sum, s) => sum + (s.memoryUsage || 0), 0) / onlineServerList.length;
      avgDiskUsage = onlineServerList.reduce((sum, s) => sum + (s.diskUsage || 0), 0) / onlineServerList.length;
      totalNetworkIn = onlineServerList.reduce((sum, s) => sum + (s.networkIn || 0), 0);
      totalNetworkOut = onlineServerList.reduce((sum, s) => sum + (s.networkOut || 0), 0);
    }

    // Get active (unresolved) alerts count
    const activeAlerts = await this.alertRepository.count({
      where: { status: 'active' as any },
    });

    return {
      totalServers,
      onlineServers,
      avgCpuUsage,
      avgMemoryUsage,
      avgDiskUsage,
      totalNetworkIn,
      totalNetworkOut,
      activeAlerts,
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { Log } from '../../database/entities/log.entity';

@Injectable()
export class LogService {
  private readonly logger = new Logger(LogService.name);

  constructor(
    @InjectRepository(Log)
    private logRepository: Repository<Log>,
  ) {}

  async findAll(
    serverId?: string,
    level?: string,
    source?: string,
    search?: string,
    startTime?: Date,
    endTime?: Date,
    limit = 100,
    offset = 0,
  ) {
    const queryBuilder = this.logRepository.createQueryBuilder('log');

    if (serverId) {
      queryBuilder.andWhere('log.serverId = :serverId', { serverId });
    }

    if (level) {
      if (level === 'all') {
        // No filter for 'all'
      } else {
        queryBuilder.andWhere('log.level = :level', { level });
      }
    }

    if (source) {
      queryBuilder.andWhere('log.source ILIKE :source', { source: `%${source}%` });
    }

    if (search) {
      queryBuilder.andWhere(
        '(log.message ILIKE :search OR log.source ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (startTime && endTime) {
      queryBuilder.andWhere('log.timestamp BETWEEN :startTime AND :endTime', {
        startTime,
        endTime,
      });
    } else if (startTime) {
      queryBuilder.andWhere('log.timestamp >= :startTime', { startTime });
    } else if (endTime) {
      queryBuilder.andWhere('log.timestamp <= :endTime', { endTime });
    }

    queryBuilder.orderBy('log.timestamp', 'DESC');
    queryBuilder.take(limit);
    queryBuilder.skip(offset);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      limit,
      offset,
    };
  }

  async findById(id: string) {
    return this.logRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Log>) {
    const log = this.logRepository.create(data);
    return this.logRepository.save(log);
  }

  async getLogStats() {
    const [total, debug, info, warn, error, fatal] = await Promise.all([
      this.logRepository.count(),
      this.logRepository.count({ where: { level: 'debug' } }),
      this.logRepository.count({ where: { level: 'info' } }),
      this.logRepository.count({ where: { level: 'warn' } }),
      this.logRepository.count({ where: { level: 'error' } }),
      this.logRepository.count({ where: { level: 'fatal' } }),
    ]);

    return {
      total,
      byLevel: { debug, info, warn, error, fatal },
    };
  }

  async getLogSources() {
    const sources = await this.logRepository
      .createQueryBuilder('log')
      .select('DISTINCT log.source', 'source')
      .getRawMany();

    return sources.map(s => s.source);
  }

  async getRecentLogs(limit = 50) {
    return this.logRepository.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  // Generate mock logs for demo
  async generateMockLogs(serverId: string, count = 100) {
    const levels: Array<Log['level']> = ['debug', 'info', 'warn', 'error', 'fatal'];
    const sources = [
      'system',
      'nginx',
      'postgresql',
      'redis',
      'nodejs',
      'docker',
      'kernel',
      'auth',
      'api',
      'scheduler',
    ];

    const messages = {
      debug: [
        'Cache hit for key: user_session_123',
        'Database query executed in 12ms',
        'WebSocket connection established',
        'Memory usage: 45% of 8GB',
      ],
      info: [
        'Server started on port 4000',
        'New user registered: john@example.com',
        'Scheduled job completed: cleanup_temp_files',
        'API request processed: GET /api/servers',
        'Database backup completed successfully',
      ],
      warn: [
        'High memory usage detected: 85%',
        'Slow query detected: 2.5s',
        'Rate limit approaching: 90/100 requests',
        'Disk usage warning: 75% full',
        'Connection pool near capacity: 45/50',
      ],
      error: [
        'Failed to connect to Redis: ECONNREFUSED',
        'Database query timeout after 30s',
        'Authentication failed: invalid token',
        'File not found: /var/log/app.log',
        'Out of memory: heap limit exceeded',
      ],
      fatal: [
        'Database connection lost',
        'Process crashed: segmentation fault',
        'SSL certificate expired',
        'Critical system failure: disk full',
      ],
    };

    const logs: Partial<Log>[] = [];

    for (let i = 0; i < count; i++) {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const levelMessages = messages[level];
      const message = levelMessages[Math.floor(Math.random() * levelMessages.length)];

      logs.push({
        serverId,
        level,
        source,
        message,
        metadata: {
          pid: Math.floor(Math.random() * 10000),
          hostname: `server-${Math.floor(Math.random() * 5) + 1}`,
          requestId: `req_${Math.random().toString(36).substr(2, 9)}`,
        },
      });
    }

    await this.logRepository.save(logs.map(log => this.logRepository.create(log)));
    this.logger.log(`Generated ${count} mock logs for server ${serverId}`);
  }

  // Export logs as CSV
  async exportToCSV(logs: Log[]): Promise<string> {
    const headers = ['ID', 'Server ID', 'Level', 'Source', 'Message', 'Timestamp'];
    const rows = logs.map(log => [
      log.id,
      log.serverId,
      log.level,
      log.source,
      `"${log.message.replace(/"/g, '""')}"`,
      log.timestamp.toISOString(),
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // Export logs as JSON
  async exportToJSON(logs: Log[]): Promise<string> {
    return JSON.stringify(logs, null, 2);
  }
}

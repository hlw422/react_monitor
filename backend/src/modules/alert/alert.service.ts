import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Alert } from '../../database/entities/alert.entity';
import { AlertRule } from '../../database/entities/alert-rule.entity';
import { WsGateway } from '../ws/ws.gateway';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @InjectRepository(AlertRule)
    private alertRuleRepository: Repository<AlertRule>,
    private wsGateway: WsGateway,
  ) {}

  // Alert Rule CRUD
  async findAllRules(serverId?: string) {
    const where: FindOptionsWhere<AlertRule> = {};
    if (serverId) where.serverId = serverId;
    return this.alertRuleRepository.find({
      where,
      relations: { server: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findRuleById(id: string) {
    const rule = await this.alertRuleRepository.findOne({ where: { id } });
    if (!rule) throw new NotFoundException(`Alert rule ${id} not found`);
    return rule;
  }

  async createRule(data: Partial<AlertRule>) {
    const rule = this.alertRuleRepository.create(data);
    return this.alertRuleRepository.save(rule);
  }

  async updateRule(id: string, data: Partial<AlertRule>) {
    const rule = await this.findRuleById(id);
    Object.assign(rule, data);
    return this.alertRuleRepository.save(rule);
  }

  async deleteRule(id: string) {
    const rule = await this.findRuleById(id);
    return this.alertRuleRepository.remove(rule);
  }

  async toggleRule(id: string) {
    const rule = await this.findRuleById(id);
    rule.enabled = !rule.enabled;
    return this.alertRuleRepository.save(rule);
  }

  // Alert CRUD
  async findAllAlerts(
    serverId?: string,
    level?: string,
    status?: string,
    limit = 100,
    offset = 0,
  ) {
    const where: FindOptionsWhere<Alert> = {};
    if (serverId) where.serverId = serverId;
    if (level) where.level = level as any;
    if (status) where.status = status as any;

    const [items, total] = await this.alertRepository.findAndCount({
      where,
      relations: { server: true, rule: true },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { items, total, limit, offset };
  }

  async findAlertById(id: string) {
    const alert = await this.alertRepository.findOne({ where: { id } });
    if (!alert) throw new NotFoundException(`Alert ${id} not found`);
    return alert;
  }

  async createAlert(data: Partial<Alert>) {
    const alert = this.alertRepository.create(data);
    const saved = await this.alertRepository.save(alert);

    // Broadcast new alert via WebSocket
    this.wsGateway.broadcastAlert(saved);
    this.logger.warn(`New alert created: ${saved.level} - ${saved.message}`);

    return saved;
  }

  async acknowledgeAlert(id: string, userId: string) {
    const alert = await this.findAlertById(id);
    alert.status = 'acknowledged';
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();
    return this.alertRepository.save(alert);
  }

  async resolveAlert(id: string) {
    const alert = await this.findAlertById(id);
    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    return this.alertRepository.save(alert);
  }

  async silenceAlert(id: string) {
    const alert = await this.findAlertById(id);
    alert.status = 'silenced';
    return this.alertRepository.save(alert);
  }

  // Alert Detection
  async checkMetricAgainstRules(serverId: string, metricType: string, value: number) {
    const rules = await this.alertRuleRepository.find({
      where: {
        metricType: metricType as any,
        enabled: true,
      },
    });

    for (const rule of rules) {
      // Skip if rule is server-specific and doesn't match
      if (rule.serverId && rule.serverId !== serverId) continue;

      const triggered = this.evaluateCondition(value, rule.condition, rule.threshold);
      if (triggered) {
        // Check if there's already a pending alert for this rule+server
        const existingAlert = await this.alertRepository.findOne({
          where: {
            ruleId: rule.id,
            serverId,
            status: 'pending',
          },
        });

        if (!existingAlert) {
          await this.createAlert({
            serverId,
            ruleId: rule.id,
            level: rule.level,
            message: `${rule.name}: ${metricType} value ${value.toFixed(2)} ${rule.condition} threshold ${rule.threshold}`,
            status: 'pending',
          });
        }
      }
    }
  }

  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '=': return Math.abs(value - threshold) < 0.01;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      default: return false;
    }
  }

  // Statistics
  async getAlertStats() {
    const [total, pending, acknowledged, resolved, silenced] = await Promise.all([
      this.alertRepository.count(),
      this.alertRepository.count({ where: { status: 'pending' } }),
      this.alertRepository.count({ where: { status: 'acknowledged' } }),
      this.alertRepository.count({ where: { status: 'resolved' } }),
      this.alertRepository.count({ where: { status: 'silenced' } }),
    ]);

    const [info, warning, error, critical] = await Promise.all([
      this.alertRepository.count({ where: { level: 'info' } }),
      this.alertRepository.count({ where: { level: 'warning' } }),
      this.alertRepository.count({ where: { level: 'error' } }),
      this.alertRepository.count({ where: { level: 'critical' } }),
    ]);

    return {
      total,
      byStatus: { pending, acknowledged, resolved, silenced },
      byLevel: { info, warning, error, critical },
    };
  }

  // Seed default rules
  async seedDefaultRules() {
    const existingCount = await this.alertRuleRepository.count();
    if (existingCount > 0) return;

    const defaultRules: Partial<AlertRule>[] = [
      { name: 'CPU High Usage', metricType: 'cpu', condition: '>', threshold: 80, level: 'warning', enabled: true },
      { name: 'CPU Critical', metricType: 'cpu', condition: '>', threshold: 95, level: 'critical', enabled: true },
      { name: 'Memory High Usage', metricType: 'memory', condition: '>', threshold: 85, level: 'warning', enabled: true },
      { name: 'Memory Critical', metricType: 'memory', condition: '>', threshold: 95, level: 'critical', enabled: true },
      { name: 'Disk High Usage', metricType: 'disk', condition: '>', threshold: 90, level: 'warning', enabled: true },
      { name: 'Disk Critical', metricType: 'disk', condition: '>', threshold: 98, level: 'critical', enabled: true },
      { name: 'Network High Traffic', metricType: 'network', condition: '>', threshold: 8000000, level: 'info', enabled: true },
    ];

    for (const rule of defaultRules) {
      await this.createRule(rule);
    }

    this.logger.log('Default alert rules seeded');
  }
}

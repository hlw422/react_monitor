import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { Alert } from '../../database/entities/alert.entity';

export interface NotificationChannelConfig {
  id: string;
  name: string;
  channel: 'email' | 'webhook' | 'wechat' | 'dingtalk';
  enabled: boolean;
  config: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private channels: Map<string, NotificationChannelConfig> = new Map();

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {
    this.initializeDefaultChannels();
  }

  private initializeDefaultChannels() {
    const defaultChannels: NotificationChannelConfig[] = [
      {
        id: 'email-default',
        name: 'Default Email',
        channel: 'email',
        enabled: true,
        config: {
          smtpHost: 'smtp.example.com',
          smtpPort: 587,
          username: 'alerts@example.com',
          password: '****',
          from: 'alerts@example.com',
          to: ['admin@example.com'],
        },
      },
      {
        id: 'webhook-default',
        name: 'Webhook',
        channel: 'webhook',
        enabled: true,
        config: {
          url: 'https://hooks.example.com/alerts',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      },
      {
        id: 'wechat-default',
        name: '企业微信',
        channel: 'wechat',
        enabled: false,
        config: {
          webhookUrl: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY',
        },
      },
      {
        id: 'dingtalk-default',
        name: '钉钉',
        channel: 'dingtalk',
        enabled: false,
        config: {
          webhookUrl: 'https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN',
          secret: '',
        },
      },
    ];

    defaultChannels.forEach(channel => {
      this.channels.set(channel.id, channel);
    });
  }

  // Channel management
  getChannels(): NotificationChannelConfig[] {
    return Array.from(this.channels.values());
  }

  getChannel(id: string): NotificationChannelConfig | undefined {
    return this.channels.get(id);
  }

  updateChannel(id: string, data: Partial<NotificationChannelConfig>): NotificationChannelConfig | undefined {
    const channel = this.channels.get(id);
    if (!channel) return undefined;

    Object.assign(channel, data);
    this.channels.set(id, channel);
    return channel;
  }

  toggleChannel(id: string): NotificationChannelConfig | undefined {
    const channel = this.channels.get(id);
    if (!channel) return undefined;

    channel.enabled = !channel.enabled;
    this.channels.set(id, channel);
    return channel;
  }

  // Send notification
  async sendNotification(alert: Alert, channelIds?: string[]): Promise<void> {
    const channels = channelIds
      ? channelIds.map(id => this.channels.get(id)).filter(Boolean)
      : Array.from(this.channels.values()).filter(c => c.enabled);

    for (const channel of channels) {
      if (!channel || !channel.enabled) continue;

      try {
        await this.sendToChannel(channel, alert);
        
        await this.notificationRepository.save(
          this.notificationRepository.create({
            alertId: alert.id,
            channel: channel.channel,
            status: 'sent',
            sentAt: new Date(),
          })
        );

        this.logger.log(`Notification sent via ${channel.channel} for alert ${alert.id}`);
      } catch (error) {
        this.logger.error(`Failed to send notification via ${channel.channel}:`, error);

        await this.notificationRepository.save(
          this.notificationRepository.create({
            alertId: alert.id,
            channel: channel.channel,
            status: 'failed',
            error: error.message,
          })
        );
      }
    }
  }

  private async sendToChannel(channel: NotificationChannelConfig, alert: Alert): Promise<void> {
    switch (channel.channel) {
      case 'email':
        await this.sendEmail(channel, alert);
        break;
      case 'webhook':
        await this.sendWebhook(channel, alert);
        break;
      case 'wechat':
        await this.sendWechat(channel, alert);
        break;
      case 'dingtalk':
        await this.sendDingtalk(channel, alert);
        break;
      default:
        this.logger.warn(`Unknown channel type: ${channel.channel}`);
    }
  }

  private async sendEmail(channel: NotificationChannelConfig, alert: Alert): Promise<void> {
    // Simulate email sending
    this.logger.log(`[EMAIL] Sending to ${channel.config.to}: ${alert.message}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendWebhook(channel: NotificationChannelConfig, alert: Alert): Promise<void> {
    // Simulate webhook call
    this.logger.log(`[WEBHOOK] Sending to ${channel.config.url}: ${alert.message}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendWechat(channel: NotificationChannelConfig, alert: Alert): Promise<void> {
    // Simulate WeChat webhook
    this.logger.log(`[WECHAT] Sending to ${channel.config.webhookUrl}: ${alert.message}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendDingtalk(channel: NotificationChannelConfig, alert: Alert): Promise<void> {
    // Simulate DingTalk webhook
    this.logger.log(`[DINGTALK] Sending to ${channel.config.webhookUrl}: ${alert.message}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Notification history
  async getNotificationHistory(
    alertId?: string,
    channel?: string,
    status?: string,
    limit = 100,
    offset = 0,
  ) {
    const where: any = {};
    if (alertId) where.alertId = alertId;
    if (channel) where.channel = channel;
    if (status) where.status = status;

    const [items, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { items, total, limit, offset };
  }

  async getNotificationStats() {
    const [total, sent, failed, pending] = await Promise.all([
      this.notificationRepository.count(),
      this.notificationRepository.count({ where: { status: 'sent' } }),
      this.notificationRepository.count({ where: { status: 'failed' } }),
      this.notificationRepository.count({ where: { status: 'pending' } }),
    ]);

    return { total, sent, failed, pending };
  }
}

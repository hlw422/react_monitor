import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  alertId: string;

  @Column({ type: 'varchar', length: 50 })
  channel: 'email' | 'webhook' | 'wechat' | 'dingtalk';

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: 'sent' | 'failed' | 'pending';

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'text', nullable: true })
  error: string;

  @CreateDateColumn()
  createdAt: Date;
}

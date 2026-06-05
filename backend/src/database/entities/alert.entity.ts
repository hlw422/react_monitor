import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Server } from './server.entity';
import { AlertRule } from './alert-rule.entity';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  serverId: string;

  @Column({ type: 'uuid' })
  ruleId: string;

  @Column({ type: 'varchar', length: 50 })
  level: 'info' | 'warning' | 'error' | 'critical';

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: 'pending' | 'acknowledged' | 'resolved' | 'silenced';

  @Column({ type: 'uuid', nullable: true })
  acknowledgedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @ManyToOne(() => Server, { nullable: true, eager: false })
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @ManyToOne(() => AlertRule, { nullable: true, eager: false })
  @JoinColumn({ name: 'ruleId' })
  rule: AlertRule;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

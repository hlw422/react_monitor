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

@Entity('alert_rules')
export class AlertRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  metricType: 'cpu' | 'memory' | 'disk' | 'network';

  @Column({ type: 'varchar', length: 10 })
  condition: '>' | '<' | '=' | '>=' | '<=';

  @Column({ type: 'float' })
  threshold: number;

  @Column({ type: 'varchar', length: 50, default: 'warning' })
  level: 'info' | 'warning' | 'error' | 'critical';

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'uuid', nullable: true })
  serverId: string;

  @ManyToOne(() => Server, { nullable: true, eager: false })
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

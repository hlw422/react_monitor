import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('servers')
export class Server {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  hostname: string;

  @Column({ type: 'varchar', length: 45 })
  ip: string;

  @Column({ type: 'varchar', length: 100 })
  os: string;

  @Column({ type: 'varchar', length: 50, default: 'offline' })
  status: 'online' | 'offline';

  @Column({ type: 'float', default: 0 })
  cpuUsage: number;

  @Column({ type: 'float', default: 0 })
  memoryUsage: number;

  @Column({ type: 'float', default: 0 })
  diskUsage: number;

  @Column({ type: 'float', default: 0 })
  networkIn: number;

  @Column({ type: 'float', default: 0 })
  networkOut: number;

  @Column({ type: 'jsonb', default: '[]' })
  tags: string[];

  @Column({ type: 'timestamp', nullable: true })
  lastHeartbeat: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

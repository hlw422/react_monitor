import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../../database/entities/server.entity';

@Injectable()
export class ServerService {
  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
  ) {}

  async findAll(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.serverRepository.find({ where, order: { hostname: 'ASC' } });
  }

  async create(data: { hostname: string; ip: string; os?: string; tags?: string[] }) {
    const server = this.serverRepository.create({
      hostname: data.hostname,
      ip: data.ip,
      os: data.os || 'Unknown',
      status: 'offline',
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkIn: 0,
      networkOut: 0,
      tags: data.tags || [],
    });
    return this.serverRepository.save(server);
  }

  async findById(id: string) {
    return this.serverRepository.findOne({ where: { id } });
  }

  async getStats() {
    const total = await this.serverRepository.count();
    const online = await this.serverRepository.count({ where: { status: 'online' } });
    return { total, online, offline: total - online };
  }

  async updateStatus(id: string, status: 'online' | 'offline') {
    await this.serverRepository.update(id, { status, lastHeartbeat: new Date() });
    return this.findById(id);
  }
}

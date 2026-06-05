import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../database/entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async findAll() {
    return this.roleRepository.find({ order: { name: 'ASC' } });
  }

  async findById(id: string) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async findByName(name: string) {
    return this.roleRepository.findOne({ where: { name } });
  }

  async create(data: { name: string; description?: string; permissions: string[] }) {
    const role = this.roleRepository.create({
      name: data.name,
      description: data.description,
      permissions: data.permissions,
    });
    return this.roleRepository.save(role);
  }

  async update(id: string, data: Partial<{ name: string; description: string; permissions: string[] }>) {
    const role = await this.findById(id);
    if (data.name) role.name = data.name;
    if (data.description) role.description = data.description;
    if (data.permissions) role.permissions = data.permissions;
    return this.roleRepository.save(role);
  }

  async delete(id: string) {
    const role = await this.findById(id);
    return this.roleRepository.remove(role);
  }

  async seedDefaultRoles() {
    const existingCount = await this.roleRepository.count();
    if (existingCount > 0) return;

    const defaultRoles = [
      {
        name: 'admin',
        description: '超级管理员 - 拥有所有权限',
        permissions: ['*'],
      },
      {
        name: 'operator',
        description: '运维人员 - 服务器和告警管理',
        permissions: ['dashboard:read', 'server:read', 'server:write', 'metric:read', 'alert:read', 'alert:write', 'log:read'],
      },
      {
        name: 'developer',
        description: '开发人员 - 查看仪表盘和日志',
        permissions: ['dashboard:read', 'server:read', 'metric:read', 'log:read'],
      },
      {
        name: 'guest',
        description: '访客 - 只读权限',
        permissions: ['dashboard:read'],
      },
    ];

    for (const role of defaultRoles) {
      await this.create(role);
    }
  }
}

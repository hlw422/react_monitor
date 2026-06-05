import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async findAll(limit = 100, offset = 0) {
    const [items, total] = await this.userRepository.findAndCount({
      relations: { role: true },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { items, total, limit, offset };
  }

  async findById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { role: true },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByUsername(username: string) {
    return this.userRepository.findOne({
      where: { username },
      relations: { role: true },
    });
  }

  async create(data: { username: string; password: string; email: string; roleId?: string; status?: string }) {
    // Check if username exists
    const existing = await this.findByUsername(data.username);
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Get default role if not specified
    let roleId = data.roleId;
    if (!roleId) {
      const defaultRole = await this.roleRepository.findOne({ where: { name: 'developer' } });
      roleId = defaultRole?.id;
    }

    const user = this.userRepository.create({
      username: data.username,
      passwordHash,
      email: data.email,
      roleId,
      status: (data.status as any) || 'active',
    });

    return this.userRepository.save(user);
  }

  async update(id: string, data: Partial<{ username: string; email: string; roleId: string; status: string; password: string }>) {
    const user = await this.findById(id);

    if (data.username && data.username !== user.username) {
      const existing = await this.findByUsername(data.username);
      if (existing) {
        throw new ConflictException('Username already exists');
      }
      user.username = data.username;
    }

    if (data.email) user.email = data.email;
    if (data.roleId) user.roleId = data.roleId;
    if (data.status) user.status = data.status as any;

    if (data.password) {
      user.passwordHash = await bcrypt.hash(data.password, 10);
    }

    return this.userRepository.save(user);
  }

  async delete(id: string) {
    const user = await this.findById(id);
    return this.userRepository.remove(user);
  }

  async getUserStats() {
    const [total, active, inactive] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { status: 'active' } }),
      this.userRepository.count({ where: { status: 'inactive' } }),
    ]);

    return { total, active, inactive };
  }
}

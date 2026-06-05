import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ServerService } from './server.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Servers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('servers')
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  @Get()
  @ApiOperation({ summary: 'Get all servers' })
  @ApiQuery({ name: 'status', required: false, enum: ['online', 'offline'] })
  async findAll(@Query('status') status?: string) {
    return this.serverService.findAll(status);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new server' })
  async create(@Body() data: { hostname: string; ip: string; os?: string; tags?: string[] }) {
    return this.serverService.create(data);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get server statistics' })
  async getStats() {
    return this.serverService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get server by ID' })
  async findById(@Param('id') id: string) {
    return this.serverService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a server' })
  async update(@Param('id') id: string, @Body() data: Partial<{ hostname: string; ip: string; os: string; status: 'online' | 'offline'; tags: string[] }>) {
    return this.serverService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a server' })
  async remove(@Param('id') id: string) {
    return this.serverService.remove(id);
  }
}

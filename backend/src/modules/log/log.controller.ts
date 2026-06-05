import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { LogService } from './log.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('logs')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get()
  @ApiOperation({ summary: 'Get logs with filters' })
  @ApiQuery({ name: 'serverId', required: false })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'source', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'startTime', required: false })
  @ApiQuery({ name: 'endTime', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async findAll(
    @Query('serverId') serverId?: string,
    @Query('level') level?: string,
    @Query('source') source?: string,
    @Query('search') search?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.logService.findAll(
      serverId,
      level,
      source,
      search,
      startTime ? new Date(startTime) : undefined,
      endTime ? new Date(endTime) : undefined,
      limit || 100,
      offset || 0,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get log statistics' })
  async getStats() {
    return this.logService.getLogStats();
  }

  @Get('sources')
  @ApiOperation({ summary: 'Get available log sources' })
  async getSources() {
    return this.logService.getLogSources();
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent logs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecent(@Query('limit') limit?: number) {
    return this.logService.getRecentLogs(limit || 50);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export logs as CSV' })
  async exportCSV(
    @Res() res: Response,
    @Query('serverId') serverId?: string,
    @Query('level') level?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    const { items } = await this.logService.findAll(
      serverId,
      level,
      undefined,
      undefined,
      startTime ? new Date(startTime) : undefined,
      endTime ? new Date(endTime) : undefined,
      10000,
      0,
    );

    const csv = await this.logService.exportToCSV(items);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
    res.send(csv);
  }

  @Get('export/json')
  @ApiOperation({ summary: 'Export logs as JSON' })
  async exportJSON(
    @Res() res: Response,
    @Query('serverId') serverId?: string,
    @Query('level') level?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    const { items } = await this.logService.findAll(
      serverId,
      level,
      undefined,
      undefined,
      startTime ? new Date(startTime) : undefined,
      endTime ? new Date(endTime) : undefined,
      10000,
      0,
    );

    const json = await this.logService.exportToJSON(items);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=logs.json');
    res.send(json);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get log by ID' })
  async findById(@Param('id') id: string) {
    return this.logService.findById(id);
  }

  @Post('generate/:serverId')
  @ApiOperation({ summary: 'Generate mock logs for demo' })
  async generateMockLogs(
    @Param('serverId') serverId: string,
    @Query('count') count?: number,
  ) {
    await this.logService.generateMockLogs(serverId, count || 100);
    return { message: 'Mock logs generated successfully' };
  }
}

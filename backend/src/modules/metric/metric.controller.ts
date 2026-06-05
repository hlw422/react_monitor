import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MetricService } from './metric.service';
import { MetricCollectorService } from './metric-collector.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('metrics')
export class MetricController {
  constructor(
    private readonly metricService: MetricService,
    private readonly metricCollectorService: MetricCollectorService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get metrics with optional filters' })
  @ApiQuery({ name: 'serverId', required: false })
  @ApiQuery({ name: 'metricType', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('serverId') serverId?: string,
    @Query('metricType') metricType?: string,
    @Query('limit') limit?: number,
  ) {
    return this.metricService.findAll(serverId, metricType, limit || 100);
  }

  @Get('latest/:serverId')
  @ApiOperation({ summary: 'Get latest metrics for a server' })
  async getLatestMetrics(@Param('serverId') serverId: string) {
    return this.metricService.getLatestMetrics(serverId);
  }

  @Get('timeseries/:serverId/:metricType')
  @ApiOperation({ summary: 'Get time series data for a metric type' })
  @ApiQuery({ name: 'minutes', required: false, type: Number })
  async getTimeSeriesData(
    @Param('serverId') serverId: string,
    @Param('metricType') metricType: string,
    @Query('minutes') minutes?: number,
  ) {
    return this.metricService.getTimeSeriesData(
      serverId,
      metricType,
      minutes || 60,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new metric record' })
  async create(@Body() data: { serverId: string; metricType: 'cpu' | 'memory' | 'disk' | 'network'; value: number; metadata?: any }) {
    return this.metricService.create(data);
  }

  @Post('generate/:serverId')
  @ApiOperation({ summary: 'Generate mock data for demo' })
  async generateMockData(@Param('serverId') serverId: string) {
    return this.metricService.generateMockData(serverId);
  }

  @Post('data-mode')
  @ApiOperation({ summary: 'Switch between real and simulated data mode' })
  async setDataMode(@Body() body: { useRealData: boolean }) {
    this.metricCollectorService.setUseRealData(body.useRealData);
    return {
      success: true,
      message: `Data mode switched to ${body.useRealData ? 'Real' : 'Simulated'}`,
      currentMode: body.useRealData ? 'real' : 'simulated',
    };
  }

  @Get('data-mode')
  @ApiOperation({ summary: 'Get current data collection mode' })
  async getDataMode() {
    const isReal = this.metricCollectorService.isUsingRealData();
    return {
      useRealData: isReal,
      mode: isReal ? 'real' : 'simulated',
    };
  }
}

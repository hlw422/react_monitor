import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AlertService } from './alert.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  // Alert Rules
  @Get('rules')
  @ApiOperation({ summary: 'Get all alert rules' })
  @Roles('admin', 'operator')
  async findAllRules(@Query('serverId') serverId?: string) {
    return this.alertService.findAllRules(serverId);
  }

  @Get('rules/:id')
  @ApiOperation({ summary: 'Get alert rule by ID' })
  @Roles('admin', 'operator')
  async findRuleById(@Param('id') id: string) {
    return this.alertService.findRuleById(id);
  }

  @Post('rules')
  @ApiOperation({ summary: 'Create alert rule' })
  @Roles('admin', 'operator')
  async createRule(@Body() data: { 
    name: string; 
    metricType: 'cpu' | 'memory' | 'disk' | 'network'; 
    condition: '>' | '<' | '=' | '>=' | '<='; 
    threshold: number; 
    level: 'info' | 'warning' | 'error' | 'critical'; 
    serverId?: string 
  }) {
    return this.alertService.createRule(data);
  }

  @Put('rules/:id')
  @ApiOperation({ summary: 'Update alert rule' })
  @Roles('admin', 'operator')
  async updateRule(@Param('id') id: string, @Body() data: any) {
    return this.alertService.updateRule(id, data);
  }

  @Delete('rules/:id')
  @ApiOperation({ summary: 'Delete alert rule' })
  @Roles('admin')
  async deleteRule(@Param('id') id: string) {
    return this.alertService.deleteRule(id);
  }

  @Patch('rules/:id/toggle')
  @ApiOperation({ summary: 'Toggle alert rule enabled/disabled' })
  @Roles('admin', 'operator')
  async toggleRule(@Param('id') id: string) {
    return this.alertService.toggleRule(id);
  }

  // Alert History
  @Get()
  @ApiOperation({ summary: 'Get alert history' })
  @ApiQuery({ name: 'serverId', required: false })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async findAllAlerts(
    @Query('serverId') serverId?: string,
    @Query('level') level?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.alertService.findAllAlerts(serverId, level, status, limit || 100, offset || 0);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get alert statistics' })
  async getAlertStats() {
    return this.alertService.getAlertStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert by ID' })
  async findAlertById(@Param('id') id: string) {
    return this.alertService.findAlertById(id);
  }

  @Patch(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  async acknowledgeAlert(@Param('id') id: string, @CurrentUser() user: any) {
    return this.alertService.acknowledgeAlert(id, user.id);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve an alert' })
  async resolveAlert(@Param('id') id: string) {
    return this.alertService.resolveAlert(id);
  }

  @Patch(':id/silence')
  @ApiOperation({ summary: 'Silence an alert' })
  @Roles('admin', 'operator')
  async silenceAlert(@Param('id') id: string) {
    return this.alertService.silenceAlert(id);
  }
}

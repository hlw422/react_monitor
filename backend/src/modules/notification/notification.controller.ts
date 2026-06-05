import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // Channel management
  @Get('channels')
  @ApiOperation({ summary: 'Get all notification channels' })
  @Roles('admin', 'operator')
  async getChannels() {
    return this.notificationService.getChannels();
  }

  @Get('channels/:id')
  @ApiOperation({ summary: 'Get notification channel by ID' })
  @Roles('admin', 'operator')
  async getChannel(@Param('id') id: string) {
    return this.notificationService.getChannel(id);
  }

  @Put('channels/:id')
  @ApiOperation({ summary: 'Update notification channel' })
  @Roles('admin')
  async updateChannel(@Param('id') id: string, @Body() data: any) {
    return this.notificationService.updateChannel(id, data);
  }

  @Patch('channels/:id/toggle')
  @ApiOperation({ summary: 'Toggle notification channel' })
  @Roles('admin', 'operator')
  async toggleChannel(@Param('id') id: string) {
    return this.notificationService.toggleChannel(id);
  }

  @Post('channels/:id/test')
  @ApiOperation({ summary: 'Test notification channel' })
  @Roles('admin', 'operator')
  async testChannel(@Param('id') id: string) {
    const channel = this.notificationService.getChannel(id);
    if (!channel) {
      return { success: false, message: 'Channel not found' };
    }
    // Simulate test notification
    return { success: true, message: `Test notification sent via ${channel.channel}` };
  }

  // Notification history
  @Get('history')
  @ApiOperation({ summary: 'Get notification history' })
  @ApiQuery({ name: 'alertId', required: false })
  @ApiQuery({ name: 'channel', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getHistory(
    @Query('alertId') alertId?: string,
    @Query('channel') channel?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.notificationService.getNotificationHistory(
      alertId,
      channel,
      status,
      limit || 100,
      offset || 0,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  async getStats() {
    return this.notificationService.getNotificationStats();
  }
}

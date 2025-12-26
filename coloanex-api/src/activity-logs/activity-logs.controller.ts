import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard)
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get('notifications')
  async getNotifications(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user.sub;
    const userRoles = req.user.roles || [];
    const tenantId = req.user.tenantId;

    return this.activityLogsService.getNotifications(
      userId,
      userRoles,
      tenantId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get('notifications/unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user.sub;
    const userRoles = req.user.roles || [];
    const tenantId = req.user.tenantId;

    const count = await this.activityLogsService.getUnreadCount(
      userId,
      userRoles,
      tenantId,
    );

    return { count };
  }

  @Post('notifications/:id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.activityLogsService.markAsRead(id, userId);
  }

  @Post('notifications/read-all')
  async markAllAsRead(@Request() req) {
    const userId = req.user.sub;
    const userRoles = req.user.roles || [];
    const tenantId = req.user.tenantId;

    return this.activityLogsService.markAllAsRead(userId, userRoles, tenantId);
  }
}

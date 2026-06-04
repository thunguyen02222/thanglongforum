import { Controller, Get, Put, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async findMyNotifications(
    @CurrentUser('_id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const result = await this.notificationService.findByUser(userId, Number(page) || 1, Number(limit) || 20);
    return DataResponse.ok(result);
  }

  @Get('unread-count')
  async countUnread(@CurrentUser('_id') userId: string) {
    const count = await this.notificationService.countUnread(userId);
    return DataResponse.ok({ count });
  }

  @Put(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string
  ) {
    const result = await this.notificationService.markAsRead(id, userId);
    return DataResponse.ok(result);
  }

  @Put('read-all')
  async markAllAsRead(@CurrentUser('_id') userId: string) {
    const result = await this.notificationService.markAllAsRead(userId);
    return DataResponse.ok(result);
  }
}

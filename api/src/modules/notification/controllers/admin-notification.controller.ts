import { Controller, Post, Get, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/modules/user/schemas/user.schema';
import { SystemBroadcast } from '../schemas/system-broadcast.schema';

@Controller('admin/notifications')
@UseGuards(AuthGuard, RoleGuard)
@Roles('admin')
export class AdminNotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(SystemBroadcast.name) private broadcastModel: Model<SystemBroadcast>
  ) {}

  @Post('send-system')
  async sendSystem(@Body() body: { message: string; targetRole?: string }) {
    const filter: any = {};
    if (body.targetRole) filter.role = body.targetRole;

    const users = await this.userModel.find(filter).select('_id').lean();
    const userIds = users.map((u: any) => u._id.toString());

    // Lưu lịch sử broadcast
    const broadcast = await this.broadcastModel.create({
      message: body.message,
      targetRole: body.targetRole || null,
      sentCount: userIds.length
    });

    await this.notificationService.sendSystem(userIds, body.message, broadcast._id.toString());

    return DataResponse.ok({ sent: userIds.length, message: 'Đã gửi thông báo hệ thống' });
  }

  @Delete('broadcasts/:id')
  async deleteBroadcast(@Param('id') id: string) {
    await this.notificationService.deleteByBroadcastId(id);
    await this.broadcastModel.findByIdAndDelete(id);
    return DataResponse.ok({ message: 'Đã thu hồi thông báo thành công' });
  }

  @Get('broadcasts')
  async getBroadcasts(
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const p = Number(page) || 1;
    const l = Number(limit) || 20;
    const skip = (p - 1) * l;

    const [data, total] = await Promise.all([
      this.broadcastModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l)
        .lean(),
      this.broadcastModel.countDocuments()
    ]);

    return DataResponse.ok({
      data,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l)
    });
  }
}

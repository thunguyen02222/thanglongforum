import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { FollowService } from '../services/follow.service';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';

@Controller('follows')
@UseGuards(AuthGuard)
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Get('my')
  async getMyFollowing(
    @CurrentUser('_id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const result = await this.followService.getMyFollowing(userId, Number(page) || 1, Number(limit) || 10);
    return DataResponse.ok(result);
  }

  @Post('questions/:questionId')
  async toggle(
    @CurrentUser('_id') userId: string,
    @Param('questionId') questionId: string
  ) {
    const result = await this.followService.toggle(userId, questionId);
    return DataResponse.ok(result);
  }

  @Get('questions/:questionId')
  async isFollowing(
    @CurrentUser('_id') userId: string,
    @Param('questionId') questionId: string
  ) {
    const result = await this.followService.isFollowing(userId, questionId);
    return DataResponse.ok(result);
  }
}

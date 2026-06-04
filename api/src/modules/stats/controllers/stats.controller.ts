import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatsService } from '../services/stats.service';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@Controller('stats')
export class PublicStatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  async getOverview() {
    const result = await this.statsService.getOverview();
    return DataResponse.ok(result);
  }

  @Get('leaderboard')
  async getLeaderboard(@Query('time') time?: string) {
    const result = await this.statsService.getLeaderboard(time);
    return DataResponse.ok(result);
  }
}

@Controller('admin/stats')
@UseGuards(AuthGuard, RoleGuard)
@Roles('admin')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  async getDashboard() {
    const result = await this.statsService.getDashboard();
    return DataResponse.ok(result);
  }

  @Get('questions')
  async getQuestionStats(@Query('days') days?: string) {
    const result = await this.statsService.getQuestionStats(Number(days) || 30);
    return DataResponse.ok(result);
  }

  @Get('questions-monthly')
  async getQuestionStatsMonthly() {
    const result = await this.statsService.getQuestionStatsMonthly();
    return DataResponse.ok(result);
  }

  @Get('hot-topics')
  async getHotTopics(@Query('days') days?: string) {
    const result = await this.statsService.getHotTopics(Number(days) || 7);
    return DataResponse.ok(result);
  }

  @Get('users')
  async getUserStats() {
    const result = await this.statsService.getUserStats();
    return DataResponse.ok(result);
  }
}

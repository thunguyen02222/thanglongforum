import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ReportService } from '../services/report.service';
import { CreateReportDto } from '../dtos/report.dto';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';

// User endpoint
@Controller('reports')
@UseGuards(AuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  async create(@CurrentUser('_id') userId: string, @Body() dto: CreateReportDto) {
    const result = await this.reportService.create(userId, dto);
    return DataResponse.ok(result);
  }
}

// Admin endpoints
@Controller('admin/reports')
@UseGuards(AuthGuard, RoleGuard)
@Roles('admin')
export class AdminReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string
  ) {
    const result = await this.reportService.findAll(Number(page) || 1, Number(limit) || 20, status);
    return DataResponse.ok(result);
  }

  @Get('pending-count')
  async countPending() {
    const count = await this.reportService.countPending();
    return DataResponse.ok({ count });
  }

  @Put(':id/resolve')
  async resolve(@Param('id') id: string, @Body('adminNote') adminNote?: string) {
    const result = await this.reportService.updateStatus(id, 'resolved', adminNote);
    return DataResponse.ok(result);
  }

  @Put(':id/reject')
  async reject(@Param('id') id: string, @Body('adminNote') adminNote?: string) {
    const result = await this.reportService.updateStatus(id, 'rejected', adminNote);
    return DataResponse.ok(result);
  }

  @Delete(':id/target')
  async deleteTarget(@Param('id') id: string) {
    const result = await this.reportService.deleteTarget(id);
    return DataResponse.ok(result);
  }
}

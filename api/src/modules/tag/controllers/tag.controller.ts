import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TagService } from '../services/tag.service';
import { CreateTagDto, UpdateTagDto, SearchTagDto } from '../dtos/tag.dto';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

// Public endpoints
@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  async search(@Query() query: SearchTagDto) {
    const result = await this.tagService.search(query);
    return DataResponse.ok(result);
  }

  @Get('popular')
  async popular(@Query('limit') limit?: string) {
    const result = await this.tagService.findPopular(Number(limit) || 20);
    return DataResponse.ok(result);
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const result = await this.tagService.findBySlug(slug);
    return DataResponse.ok(result);
  }
}

// Admin endpoints
@Controller('admin/tags')
@UseGuards(AuthGuard, RoleGuard)
@Roles('admin')
export class AdminTagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  async search(@Query() query: SearchTagDto) {
    const result = await this.tagService.search(query);
    return DataResponse.ok(result);
  }

  @Post()
  async create(@Body() dto: CreateTagDto) {
    const result = await this.tagService.create(dto);
    return DataResponse.ok(result);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    const result = await this.tagService.update(id, dto);
    return DataResponse.ok(result);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.tagService.delete(id);
    return DataResponse.ok({ message: 'Xóa tag thành công' });
  }
}

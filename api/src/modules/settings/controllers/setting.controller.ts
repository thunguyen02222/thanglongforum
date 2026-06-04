import { Controller, Get, Put, Body, Query, Param, UseGuards } from '@nestjs/common';
import { SettingService } from '../services/setting.service';
import { UpdateSettingDto, BulkUpdateSettingDto } from '../dtos/setting.dto';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';

@Controller('settings')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get('public/site')
  async getPublicSite() {
    const site = await this.settingService.getPublicSiteSettings();
    return DataResponse.ok(site);
  }

  @Get('public/auth')
  async getPublicAuth() {
    const auth = await this.settingService.getPublicAuthSettings();
    return DataResponse.ok(auth);
  }

  @Get()
  @UseGuards(AuthGuard)
  async findAll(@Query('group') group?: string) {
    const settings = group
      ? await this.settingService.findByGroup(group)
      : await this.settingService.findAll();
    return DataResponse.ok(settings);
  }

  @Get(':key')
  @UseGuards(AuthGuard)
  async findByKey(@Param('key') key: string) {
    const setting = await this.settingService.findByKey(key);
    return DataResponse.ok(setting);
  }
}

@Controller('admin/settings')
@UseGuards(AuthGuard, RoleGuard)
@Roles('admin')
export class AdminSettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  async findAll(@Query('group') group?: string) {
    const settings = group
      ? await this.settingService.findByGroupAll(group)
      : await this.settingService.findAll();
    return DataResponse.ok(settings);
  }

  @Put()
  async update(@Body() updateDto: UpdateSettingDto) {
    const setting = await this.settingService.update(updateDto);
    return DataResponse.ok(setting);
  }

  @Put('bulk')
  async bulkUpdate(@Body() bulkUpdateDto: BulkUpdateSettingDto) {
    const settings = await this.settingService.bulkUpdate(bulkUpdateDto.settings);
    return DataResponse.ok(settings);
  }
}


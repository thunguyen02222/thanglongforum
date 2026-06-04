import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminUserService } from '../services/admin-user.service';
import { CreateUserDto, UpdateUserDto, SearchUserDto } from '../dtos/user.dto';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';

@Controller('admin/users')
@UseGuards(AuthGuard, RoleGuard)
@Roles('admin')
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  async search(@Query() query: SearchUserDto) {
    const result = await this.adminUserService.search(query);
    return DataResponse.ok(result);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const user = await this.adminUserService.findById(id);
    return DataResponse.ok(user);
  }

  @Post()
  async create(@Body() createDto: CreateUserDto) {
    const user = await this.adminUserService.create(createDto);
    return DataResponse.ok(user);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    const user = await this.adminUserService.update(id, updateDto);
    return DataResponse.ok(user);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.adminUserService.delete(id);
    return DataResponse.ok({ message: 'User deleted successfully' });
  }
}


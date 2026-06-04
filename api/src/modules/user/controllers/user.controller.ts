import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { UpdateUserDto } from '../dtos/user.dto';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me/profile')
  @UseGuards(AuthGuard)
  async getMyProfile(@CurrentUser('_id') userId: string) {
    const result = await this.userService.getProfile(userId);
    return DataResponse.ok(result);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async findById(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return DataResponse.ok(user);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    const user = await this.userService.update(id, updateDto);
    return DataResponse.ok(user);
  }
}

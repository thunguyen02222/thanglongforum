import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dtos/auth.dto';
import { DataResponse } from 'src/kernel/models/data-response.model';

@Controller('auth/admin')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async adminLogin(@Body() loginDto: LoginDto) {
    const result = await this.authService.adminLogin(loginDto);
    return DataResponse.ok(result);
  }
}


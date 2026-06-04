import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dtos/auth.dto';
import { DataResponse } from 'src/kernel/models/data-response.model';

@Controller('login')
export class LoginController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return DataResponse.ok(result);
  }
}


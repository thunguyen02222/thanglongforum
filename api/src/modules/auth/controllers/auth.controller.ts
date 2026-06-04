import { Controller, Get, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { SettingService } from '../../settings/services/setting.service';
import { LoginDto, RegisterDto, GoogleLoginDto, RequestPasswordDto, ForgotPasswordDto, ChangePasswordDto } from '../dtos/auth.dto';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from '../guards/auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly settingService: SettingService
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return DataResponse.ok(result);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return DataResponse.ok(result);
  }

  @Post('request-password')
  async requestPassword(@Body() dto: RequestPasswordDto) {
    const result = await this.authService.requestPassword(dto.userCode);
    return DataResponse.ok(result);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto.identifier);
    return DataResponse.ok(result);
  }

  @Post('google')
  async loginWithGoogle(@Body() dto: GoogleLoginDto) {
    const config = await this.settingService.getGoogleOAuthConfig();
    if (!config.enabled || !config.clientId) {
      throw new BadRequestException('Đăng nhập bằng Google chưa được bật');
    }
    const result = await this.authService.loginWithGoogle(dto.idToken);
    return DataResponse.ok(result);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@CurrentUser('_id') userId: string) {
    const profile = await this.authService.getMe(userId);
    return DataResponse.ok(profile);
  }

  @UseGuards(AuthGuard)
  @Post('change-password')
  async changePassword(@CurrentUser('_id') userId: string, @Body() dto: ChangePasswordDto) {
    const result = await this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
    return DataResponse.ok(result);
  }

  @Post('logout')
  async logout() {
    return DataResponse.ok({ message: 'Logged out successfully' });
  }
}

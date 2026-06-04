import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController, AdminAuthController, LoginController } from './controllers';
import { AuthService } from './services/auth.service';
import { AuthGuard } from './guards/auth.guard';
import { OptionalAuthGuard } from './guards/optional-auth.guard';
import { RoleGuard } from './guards/role.guard';
import { Auth, AuthSchema } from './schemas/auth.schema';
import { AuthSession, AuthSessionSchema } from './schemas/auth-session.schema';
import { UserModule } from '../user/user.module';
import { SettingModule } from '../settings/setting.module';
import { EmailModule } from '../email/email.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auth.name, schema: AuthSchema },
      { name: AuthSession.name, schema: AuthSessionSchema }
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'base-code-jwt-secret',
      signOptions: { expiresIn: '7d' }
    }),
    forwardRef(() => UserModule),
    forwardRef(() => SettingModule),
    EmailModule,
    forwardRef(() => FileModule)
  ],
  controllers: [AuthController, AdminAuthController, LoginController],
  providers: [AuthService, AuthGuard, OptionalAuthGuard, RoleGuard],
  exports: [AuthService, JwtModule, UserModule, AuthGuard, OptionalAuthGuard, RoleGuard]
})
export class AuthModule {}

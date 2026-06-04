import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingController, AdminSettingController } from './controllers/setting.controller';
import { SettingService } from './services/setting.service';
import { Setting, SettingSchema } from './schemas/setting.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Setting.name, schema: SettingSchema }]),
    forwardRef(() => AuthModule)
  ],
  controllers: [SettingController, AdminSettingController],
  providers: [SettingService],
  exports: [SettingService]
})
export class SettingModule {}


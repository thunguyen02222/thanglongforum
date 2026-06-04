import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema, SystemBroadcast, SystemBroadcastSchema } from './schemas';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './controllers/notification.controller';
import { AdminNotificationController } from './controllers/admin-notification.controller';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../user/schemas/user.schema';
import { SocketModule } from '../websocket/socket.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: SystemBroadcast.name, schema: SystemBroadcastSchema },
      { name: User.name, schema: UserSchema }
    ]),
    forwardRef(() => AuthModule),
    SocketModule
  ],
  controllers: [NotificationController, AdminNotificationController],
  providers: [NotificationService],
  exports: [NotificationService]
})
export class NotificationModule {}

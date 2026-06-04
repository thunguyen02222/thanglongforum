import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Follow, FollowSchema } from './schemas';
import { FollowService } from './services/follow.service';
import { FollowController } from './controllers/follow.controller';
import { AuthModule } from '../auth/auth.module';
import { Question, QuestionSchema } from '../question/schemas/question.schema';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Follow.name, schema: FollowSchema },
      { name: Question.name, schema: QuestionSchema }
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => NotificationModule)
  ],
  controllers: [FollowController],
  providers: [FollowService],
  exports: [FollowService]
})
export class FollowModule {}

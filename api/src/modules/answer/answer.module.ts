import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Answer, AnswerSchema } from './schemas';
import { AnswerService } from './services/answer.service';
import { AnswerController } from './controllers/answer.controller';
import { AdminAnswerController } from './controllers/admin-answer.controller';
import { AuthModule } from '../auth/auth.module';
import { QuestionModule } from '../question/question.module';
import { NotificationModule } from '../notification/notification.module';
import { FollowModule } from '../follow/follow.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Answer.name, schema: AnswerSchema }
    ]),
    forwardRef(() => AuthModule),
    QuestionModule,
    forwardRef(() => NotificationModule),
    forwardRef(() => FollowModule),
    FileModule
  ],
  controllers: [AnswerController, AdminAnswerController],
  providers: [AnswerService],
  exports: [AnswerService, MongooseModule]
})
export class AnswerModule {}

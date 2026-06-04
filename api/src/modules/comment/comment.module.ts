import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from './schemas';
import { CommentService } from './services/comment.service';
import { CommentController } from './controllers/comment.controller';
import { AuthModule } from '../auth/auth.module';
import { AnswerModule } from '../answer/answer.module';
import { NotificationModule } from '../notification/notification.module';
import { QuestionModule } from '../question/question.module';
import { FollowModule } from '../follow/follow.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema }
    ]),
    forwardRef(() => AuthModule),
    AnswerModule,
    forwardRef(() => NotificationModule),
    QuestionModule,
    forwardRef(() => FollowModule),
    FileModule
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService, MongooseModule]
})
export class CommentModule {}

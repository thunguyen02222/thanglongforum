import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from './schemas';
import { QuestionService } from './services/question.service';
import { QuestionController } from './controllers/question.controller';
import { AdminQuestionController } from './controllers/admin-question.controller';
import { AuthModule } from '../auth/auth.module';
import { TagModule } from '../tag/tag.module';
import { PollModule } from '../poll/poll.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema }
    ]),
    forwardRef(() => AuthModule),
    TagModule,
    forwardRef(() => PollModule),
    FileModule
  ],
  controllers: [QuestionController, AdminQuestionController],
  providers: [QuestionService],
  exports: [QuestionService, MongooseModule]
})
export class QuestionModule {}

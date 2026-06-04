import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatsService } from './services/stats.service';
import { StatsController, PublicStatsController } from './controllers/stats.controller';
import { AuthModule } from '../auth/auth.module';
import { Question, QuestionSchema } from '../question/schemas/question.schema';
import { Answer, AnswerSchema } from '../answer/schemas/answer.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Report, ReportSchema } from '../report/schemas/report.schema';
import { Tag, TagSchema } from '../tag/schemas/tag.schema';
import { Vote, VoteSchema } from '../vote/schemas/vote.schema';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: Answer.name, schema: AnswerSchema },
      { name: User.name, schema: UserSchema },
      { name: Report.name, schema: ReportSchema },
      { name: Tag.name, schema: TagSchema },
      { name: Vote.name, schema: VoteSchema }
    ]),
    forwardRef(() => AuthModule),
    FileModule
  ],
  controllers: [StatsController, PublicStatsController],
  providers: [StatsService],
  exports: [StatsService]
})
export class StatsModule {}

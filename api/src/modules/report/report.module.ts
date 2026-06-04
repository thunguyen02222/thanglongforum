import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './schemas';
import { ReportService } from './services/report.service';
import { ReportController, AdminReportController } from './controllers/report.controller';
import { AuthModule } from '../auth/auth.module';
import { QuestionModule } from '../question/question.module';
import { AnswerModule } from '../answer/answer.module';
import { CommentModule } from '../comment/comment.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema }
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => QuestionModule),
    forwardRef(() => AnswerModule),
    forwardRef(() => CommentModule),
    forwardRef(() => NotificationModule)
  ],
  controllers: [ReportController, AdminReportController],
  providers: [ReportService],
  exports: [ReportService]
})
export class ReportModule {}

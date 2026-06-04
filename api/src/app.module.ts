import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { SettingModule } from './modules/settings/setting.module';
import {
  appRegisterAs,
  fileRegisterAs,
  imageRegisterAs,
  emailRegisterAs
} from './config';
import { FileModule } from './modules/file/file.module';
import { MongoDBModule } from './kernel';
import { SocketModule } from './modules/websocket/socket.module';
import { EmailModule } from './modules/email/email.module';
import { FacultyModule } from './modules/faculty/faculty.module';
import { TagModule } from './modules/tag/tag.module';
import { QuestionModule } from './modules/question/question.module';
import { AnswerModule } from './modules/answer/answer.module';
import { CommentModule } from './modules/comment/comment.module';
import { VoteModule } from './modules/vote/vote.module';
import { BookmarkModule } from './modules/bookmark/bookmark.module';
import { FollowModule } from './modules/follow/follow.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PollModule } from './modules/poll/poll.module';
import { ReportModule } from './modules/report/report.module';
import { StatsModule } from './modules/stats/stats.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appRegisterAs, fileRegisterAs, imageRegisterAs, emailRegisterAs]
    }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/base-code'),
    MongoDBModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
      serveStaticOptions: {
        fallthrough: false,
        index: false,
        setHeaders(res, path: string) {
          if (path.includes('avatars')) {
            res.setHeader('Cache-Control', 'public, max-age=259200');
          }
          if (path.includes('uploads')) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
          }
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET');

          const ext = path.split('.').pop()?.toLowerCase();
          if (ext === 'jpg' || ext === 'jpeg') {
            res.setHeader('Content-Type', 'image/jpeg');
          } else if (ext === 'png') {
            res.setHeader('Content-Type', 'image/png');
          } else if (ext === 'gif') {
            res.setHeader('Content-Type', 'image/gif');
          } else if (ext === 'webp') {
            res.setHeader('Content-Type', 'image/webp');
          }
        }
      }
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    SettingModule,
    FileModule,
    SocketModule,
    EmailModule,
    FacultyModule,
    TagModule,
    QuestionModule,
    AnswerModule,
    CommentModule,
    VoteModule,
    BookmarkModule,
    FollowModule,
    NotificationModule,
    PollModule,
    ReportModule,
    StatsModule,
    ChatbotModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}

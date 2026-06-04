import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vote, VoteSchema } from './schemas';
import { VoteService } from './services/vote.service';
import { VoteController } from './controllers/vote.controller';
import { AuthModule } from '../auth/auth.module';
import { AnswerModule } from '../answer/answer.module';
import { QuestionModule } from '../question/question.module';
import { User, UserSchema } from '../user/schemas/user.schema';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vote.name, schema: VoteSchema },
      { name: User.name, schema: UserSchema }
    ]),
    forwardRef(() => AuthModule),
    AnswerModule,
    QuestionModule,
    forwardRef(() => NotificationModule)
  ],
  controllers: [VoteController],
  providers: [VoteService],
  exports: [VoteService]
})
export class VoteModule {}

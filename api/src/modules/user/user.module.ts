import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController, AdminUserController } from './controllers';
import { UserService, AdminUserService } from './services';
import { User, UserSchema } from './schemas/user.schema';
import { Auth, AuthSchema } from '../auth/schemas/auth.schema';
import { Question, QuestionSchema } from '../question/schemas/question.schema';
import { Answer, AnswerSchema } from '../answer/schemas/answer.schema';
import { Vote, VoteSchema } from '../vote/schemas/vote.schema';
import { FileModule } from '../file/file.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Auth.name, schema: AuthSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: Answer.name, schema: AnswerSchema },
      { name: Vote.name, schema: VoteSchema }
    ]),
    forwardRef(() => FileModule),
    forwardRef(() => AuthModule)
  ],
  controllers: [UserController, AdminUserController],
  providers: [UserService, AdminUserService],
  exports: [UserService, AdminUserService]
})
export class UserModule {}

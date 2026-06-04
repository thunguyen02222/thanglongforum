import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PollOption, PollOptionSchema, PollVote, PollVoteSchema } from './schemas';
import { PollService } from './services/poll.service';
import { PollController } from './controllers/poll.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PollOption.name, schema: PollOptionSchema },
      { name: PollVote.name, schema: PollVoteSchema }
    ]),
    forwardRef(() => AuthModule)
  ],
  controllers: [PollController],
  providers: [PollService],
  exports: [PollService]
})
export class PollModule {}

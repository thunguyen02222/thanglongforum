import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatbotHistory, ChatbotHistorySchema } from './schemas';
import { ChatbotService } from './services/chatbot.service';
import { ChatbotController } from './controllers/chatbot.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatbotHistory.name, schema: ChatbotHistorySchema }
    ]),
    AuthModule
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService]
})
export class ChatbotModule {}

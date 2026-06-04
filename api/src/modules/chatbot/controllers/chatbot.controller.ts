import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ChatbotService } from '../services/chatbot.service';
import { SendMessageDto } from '../dtos/chatbot.dto';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('send')
  @UseGuards(AuthGuard)
  async sendMessage(@CurrentUser('_id') userId: string, @Body() dto: SendMessageDto) {
    const result = await this.chatbotService.sendMessage(userId, dto.message, dto.sessionId);
    return DataResponse.ok(result);
  }

  @Post('sessions')
  @UseGuards(AuthGuard)
  async createSession(@CurrentUser('_id') userId: string) {
    const result = await this.chatbotService.createSession(userId);
    return DataResponse.ok(result);
  }

  @Get('sessions')
  @UseGuards(AuthGuard)
  async getSessions(@CurrentUser('_id') userId: string) {
    const result = await this.chatbotService.getSessions(userId);
    return DataResponse.ok(result);
  }

  @Get('sessions/:id')
  @UseGuards(AuthGuard)
  async getSessionMessages(@CurrentUser('_id') userId: string, @Param('id') sessionId: string) {
    const result = await this.chatbotService.getSessionMessages(userId, sessionId);
    return DataResponse.ok(result);
  }

  @Delete('sessions/:id')
  @UseGuards(AuthGuard)
  async deleteSession(@CurrentUser('_id') userId: string, @Param('id') sessionId: string) {
    const result = await this.chatbotService.deleteSession(userId, sessionId);
    return DataResponse.ok(result);
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChatbotHistory } from '../schemas/chatbot-history.schema';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly apiKey: string;

  constructor(
    @InjectModel(ChatbotHistory.name) private chatbotHistoryModel: Model<ChatbotHistory>,
    private configService: ConfigService
  ) {
    this.apiKey = this.configService.get<string>('GROQ_API_KEY') || '';
  }

  private async callGroqApi(messages: { role: string; content: string }[]) {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 1024
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        timeout: 30000
      }
    );
    return response.data;
  }

  // Tạo tiêu đề tự động từ tin nhắn đầu tiên
  private generateTitle(message: string): string {
    const cleaned = message.replace(/<[^>]*>/g, '').trim();
    if (cleaned.length <= 40) return cleaned;
    return cleaned.substring(0, 40) + '...';
  }

  async createSession(userId: string) {
    const session = await this.chatbotHistoryModel.create({
      userId: new Types.ObjectId(userId),
      title: 'Cuộc trò chuyện mới',
      messages: []
    });
    return session;
  }

  async getSessions(userId: string) {
    return this.chatbotHistoryModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('_id title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
  }

  async getSessionMessages(userId: string, sessionId: string) {
    const session = await this.chatbotHistoryModel.findOne({
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId)
    }).lean();
    if (!session) throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    return session;
  }

  async deleteSession(userId: string, sessionId: string) {
    const result = await this.chatbotHistoryModel.findOneAndDelete({
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId)
    });
    if (!result) throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    return { message: 'Đã xóa cuộc trò chuyện' };
  }

  async sendMessage(userId: string, message: string, sessionId?: string) {
    let session: any;

    if (sessionId) {
      session = await this.chatbotHistoryModel.findOne({
        _id: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId)
      });
      if (!session) throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    } else {
      session = await this.chatbotHistoryModel.create({
        userId: new Types.ObjectId(userId),
        title: this.generateTitle(message),
        messages: []
      });
    }

    const recentMessages = (session.messages || []).slice(-20);

    const chatMessages: { role: string; content: string }[] = [
      {
        role: 'system',
        content: 'Bạn là trợ lý AI của diễn đàn Thăng Long University. Hãy trả lời bằng tiếng Việt, thân thiện và hữu ích. Bạn giúp sinh viên giải đáp thắc mắc về học tập, cuộc sống đại học và các vấn đề liên quan.'
      }
    ];

    for (const msg of recentMessages) {
      chatMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }

    chatMessages.push({ role: 'user', content: message });

    try {
      const data = await this.callGroqApi(chatMessages);

      const aiReply = data?.choices?.[0]?.message?.content
        || 'Xin lỗi, mình không thể trả lời lúc này.';

      const updateData: any = {
        $push: {
          messages: {
            $each: [
              { role: 'user', content: message, createdAt: new Date() },
              { role: 'model', content: aiReply, createdAt: new Date() }
            ]
          }
        },
        updatedAt: new Date()
      };

      // Cập nhật title nếu là tin nhắn đầu tiên
      if (session.messages.length === 0) {
        updateData.$set = { title: this.generateTitle(message) };
      }

      await this.chatbotHistoryModel.findByIdAndUpdate(session._id, updateData);

      return { reply: aiReply, sessionId: session._id };
    } catch (error: any) {
      this.logger.error(`Groq API error: ${error.response?.data?.error?.message || error.message}`);
      return { reply: 'Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau.', sessionId: session._id };
    }
  }
}

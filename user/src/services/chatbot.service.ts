import { apiRequest } from './api-request';

class ChatbotService {
  async sendMessage(message: string, sessionId?: string): Promise<{ data: { reply: string; sessionId: string } }> {
    return apiRequest.post('/chatbot/send', { message, sessionId });
  }

  async createSession(): Promise<{ data: any }> {
    return apiRequest.post('/chatbot/sessions');
  }

  async getSessions(): Promise<{ data: any[] }> {
    return apiRequest.get('/chatbot/sessions');
  }

  async getSessionMessages(sessionId: string): Promise<{ data: any }> {
    return apiRequest.get(`/chatbot/sessions/${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<any> {
    return apiRequest.delete(`/chatbot/sessions/${sessionId}`);
  }
}

export const chatbotService = new ChatbotService();

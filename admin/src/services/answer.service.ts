import { apiRequest } from './api-request';

class AnswerServiceAdmin {
  async findAll(params?: Record<string, any>): Promise<any> {
    return apiRequest.get('/admin/answers', { params });
  }

  async delete(id: string): Promise<any> {
    return apiRequest.delete(`/admin/answers/${id}`);
  }
}

export const answerService = new AnswerServiceAdmin();

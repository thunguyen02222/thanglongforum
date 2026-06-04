import { apiRequest } from './api-request';

class QuestionServiceAdmin {
  async findAll(params?: Record<string, any>): Promise<any> {
    return apiRequest.get('/admin/questions', { params });
  }

  async delete(id: string): Promise<any> {
    return apiRequest.delete(`/admin/questions/${id}`);
  }
}

export const questionService = new QuestionServiceAdmin();

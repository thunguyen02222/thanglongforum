import { apiRequest } from './api-request';
import {
  IQuestion,
  IAnswer,
  IComment,
  IVoteResult,
  ICreateQuestionPayload,
  IUpdateQuestionPayload
} from '@interfaces/question';

class QuestionService {
  // ─── Questions ───

  async search(params?: Record<string, any>): Promise<any> {
    return apiRequest.get('/questions', { params });
  }

  async findById(id: string): Promise<{ data: IQuestion }> {
    return apiRequest.get(`/questions/${id}`);
  }

  async create(payload: ICreateQuestionPayload): Promise<{ data: IQuestion }> {
    return apiRequest.post('/questions', payload);
  }

  async update(id: string, payload: IUpdateQuestionPayload): Promise<{ data: IQuestion }> {
    return apiRequest.put(`/questions/${id}`, payload);
  }

  async delete(id: string): Promise<any> {
    return apiRequest.delete(`/questions/${id}`);
  }

  async close(id: string): Promise<any> {
    return apiRequest.put(`/questions/${id}/close`);
  }

  async resolve(id: string): Promise<any> {
    return apiRequest.put(`/questions/${id}/resolve`);
  }

  // ─── Answers ───

  async getAnswers(questionId: string, sort?: string): Promise<{ data: IAnswer[] }> {
    return apiRequest.get(`/questions/${questionId}/answers`, { params: { sort } });
  }

  async createAnswer(questionId: string, content: string): Promise<{ data: IAnswer }> {
    return apiRequest.post(`/questions/${questionId}/answers`, { content });
  }

  async updateAnswer(id: string, content: string): Promise<{ data: IAnswer }> {
    return apiRequest.put(`/answers/${id}`, { content });
  }

  async deleteAnswer(id: string): Promise<any> {
    return apiRequest.delete(`/answers/${id}`);
  }

  async acceptAnswer(id: string): Promise<{ data: IAnswer }> {
    return apiRequest.put(`/answers/${id}/accept`);
  }

  // ─── Comments ───

  async getComments(answerId: string): Promise<{ data: IComment[] }> {
    return apiRequest.get(`/answers/${answerId}/comments`);
  }

  async createComment(answerId: string, content: string): Promise<{ data: IComment }> {
    return apiRequest.post(`/answers/${answerId}/comments`, { content });
  }

  async updateComment(id: string, content: string): Promise<{ data: IComment }> {
    return apiRequest.put(`/comments/${id}`, { content });
  }

  async deleteComment(id: string): Promise<any> {
    return apiRequest.delete(`/comments/${id}`);
  }

  // ─── Votes ───

  async vote(answerId: string, type: number): Promise<{ data: IVoteResult }> {
    return apiRequest.post(`/answers/${answerId}/vote`, { type });
  }

  async getMyVote(answerId: string): Promise<{ data: any }> {
    return apiRequest.get(`/answers/${answerId}/vote`);
  }

  // ─── Pin ───

  async pinAnswer(id: string): Promise<{ data: IAnswer }> {
    return apiRequest.put(`/answers/${id}/pin`);
  }
}

export const questionService = new QuestionService();

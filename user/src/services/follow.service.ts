import { apiRequest } from './api-request';

class FollowService {
  async toggle(questionId: string): Promise<{ data: { following: boolean } }> {
    return apiRequest.post(`/follows/questions/${questionId}`);
  }

  async isFollowing(questionId: string): Promise<{ data: { following: boolean } }> {
    return apiRequest.get(`/follows/questions/${questionId}`);
  }

  async getMyFollowing(params?: { page?: number; limit?: number }): Promise<any> {
    return apiRequest.get('/follows/my', { params });
  }
}

export const followService = new FollowService();

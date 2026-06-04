import { apiRequest } from './api-request';

class PollServiceFE {
  async getResults(questionId: string): Promise<any> {
    return apiRequest.get(`/questions/${questionId}/poll`);
  }

  async getMyVote(questionId: string): Promise<any> {
    return apiRequest.get(`/questions/${questionId}/poll/my-vote`);
  }

  async vote(questionId: string, optionId: string): Promise<any> {
    return apiRequest.post(`/questions/${questionId}/poll/vote`, { optionId });
  }
}

export const pollService = new PollServiceFE();

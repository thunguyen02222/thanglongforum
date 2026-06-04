import { apiRequest } from './api-request';

class StatsService {
  async getOverview(): Promise<{
    totalQuestions: number;
    totalAnswers: number;
    totalUsers: number;
    resolvedQuestions: number;
  }> {
    const res = await apiRequest.get('/stats/overview');
    return (res as any).data;
  }

  async getLeaderboard(timeFilter?: string): Promise<Array<{
    _id: string;
    name: string;
    userCode?: string;
    role: string;
    score: number;
    answerCount: number;
    avatarUrl?: string;
  }>> {
    const params = timeFilter ? { time: timeFilter } : {};
    const res = await apiRequest.get('/stats/leaderboard', { params });
    return (res as any).data;
  }
}

export const statsService = new StatsService();

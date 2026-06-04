import { apiRequest } from './api-request';

class StatsServiceAdmin {
  async getDashboard(): Promise<any> {
    return apiRequest.get('/admin/stats/dashboard');
  }

  async getQuestionStats(days = 30): Promise<any> {
    return apiRequest.get('/admin/stats/questions', { params: { days } });
  }

  async getQuestionStatsMonthly(): Promise<any> {
    return apiRequest.get('/admin/stats/questions-monthly');
  }

  async getHotTopics(days = 7): Promise<any> {
    return apiRequest.get('/admin/stats/hot-topics', { params: { days } });
  }

  async getUserStats(): Promise<any> {
    return apiRequest.get('/admin/stats/users');
  }
}

export const statsService = new StatsServiceAdmin();

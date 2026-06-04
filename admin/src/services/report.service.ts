import { apiRequest } from './api-request';

class ReportServiceAdmin {
  async findAll(params?: Record<string, any>): Promise<any> {
    return apiRequest.get('/admin/reports', { params });
  }

  async resolve(id: string, adminNote?: string): Promise<any> {
    return apiRequest.put(`/admin/reports/${id}/resolve`, { adminNote });
  }

  async reject(id: string, adminNote?: string): Promise<any> {
    return apiRequest.put(`/admin/reports/${id}/reject`, { adminNote });
  }

  async deleteTarget(id: string): Promise<any> {
    return apiRequest.delete(`/admin/reports/${id}/target`);
  }

  async countPending(): Promise<any> {
    return apiRequest.get('/admin/reports/pending-count');
  }
}

export const reportService = new ReportServiceAdmin();
